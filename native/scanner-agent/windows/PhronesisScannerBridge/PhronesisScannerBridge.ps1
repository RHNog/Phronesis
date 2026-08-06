[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Preflight", "Capture", "Seal", "CaptureAndSeal")]
  [string]$Command,

  [string]$SessionId,
  [string]$JobName = "Phronesis Card Duplex",
  [string]$CaptureRoot = "C:\PhronesisScannerBridge\capture",
  [Parameter(Mandatory = $true)]
  [string]$SharedRoot,
  [ValidateSet("Unknown", "AdjacentDuplexFrontFirst")]
  [string]$PairingMode = "Unknown",
  [string]$PaperStreamPath = "C:\Program Files (x86)\fiScanner\PaperStream Capture\PFU.PaperStream.Capture.exe",
  [ValidateRange(1, 64)]
  [int]$MaxFiles = 16,
  [ValidateRange(10, 1800)]
  [int]$CaptureTimeoutSeconds = 300,
  [switch]$AllowPhysicalScan
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$script:Sequence = 0
$script:EventSession = if ($SessionId) { $SessionId } else { "preflight" }
$script:AllowedExtensions = @(".jpg", ".jpeg", ".png", ".tif", ".tiff")

function Write-BridgeEvent {
  param(
    [Parameter(Mandatory = $true)][string]$Type,
    [hashtable]$Details = @{}
  )

  $script:Sequence += 1
  $event = [ordered]@{
    schemaVersion = "phronesis.windows-bridge-event/v1"
    sequence = $script:Sequence
    timestamp = [DateTime]::UtcNow.ToString("o")
    sessionId = $script:EventSession
    type = $Type
    details = $Details
  }
  [Console]::Out.WriteLine(($event | ConvertTo-Json -Compress -Depth 8))
}

function Assert-SafeSessionId {
  param([Parameter(Mandatory = $true)][string]$Value)
  if ($Value -notmatch '^phr-[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$') {
    throw "Session ID must start with phr- and contain only lowercase letters, digits, and internal hyphens (max 50 characters)."
  }
}

function Assert-SafeJobName {
  param([Parameter(Mandatory = $true)][string]$Value)
  if ($Value -notmatch '^[A-Za-z0-9][A-Za-z0-9 _-]{0,79}$') {
    throw "PaperStream job name contains unsupported characters."
  }
}

function Assert-NotReparsePoint {
  param([Parameter(Mandatory = $true)][System.IO.FileSystemInfo]$Item)
  if (($Item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0) {
    throw "Reparse points and symbolic links are not accepted."
  }
}

function Assert-NoAlternateDataStreams {
  param([Parameter(Mandatory = $true)][System.IO.FileInfo]$Item)
  $streams = @(Get-Item -LiteralPath $Item.FullName -Stream * -ErrorAction Stop)
  if (@($streams | Where-Object { $_.Stream -ne ':$DATA' }).Count -gt 0) {
    throw "Alternate data streams are not accepted."
  }
}

function Get-RelativeFramePath {
  param(
    [Parameter(Mandatory = $true)][string]$Root,
    [Parameter(Mandatory = $true)][string]$FullName
  )
  $rootPath = [System.IO.Path]::GetFullPath($Root).TrimEnd('\') + '\'
  $filePath = [System.IO.Path]::GetFullPath($FullName)
  if (-not $filePath.StartsWith($rootPath, [StringComparison]::OrdinalIgnoreCase)) {
    throw "Frame resolved outside the capture session."
  }
  $relative = $filePath.Substring($rootPath.Length).Replace('\', '/')
  if ($relative -notmatch '^[A-Za-z0-9][A-Za-z0-9._/-]{0,511}$' -or $relative.Contains('..')) {
    throw "Frame name is outside the safe bundle grammar."
  }
  return $relative
}

function Get-Sha256 {
  param([Parameter(Mandatory = $true)][string]$Path)
  return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Write-Utf8NoBom {
  param(
    [Parameter(Mandatory = $true)][string]$Path,
    [Parameter(Mandatory = $true)][string]$Content
  )
  $encoding = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $encoding)
}

function Get-FrameRecords {
  param([Parameter(Mandatory = $true)][string]$SourceDirectory)

  if (-not (Test-Path -LiteralPath $SourceDirectory -PathType Container)) {
    throw "Capture session folder was not produced."
  }
  Assert-NotReparsePoint (Get-Item -LiteralPath $SourceDirectory -Force)

  foreach ($directory in @(Get-ChildItem -LiteralPath $SourceDirectory -Directory -Recurse -Force)) {
    Assert-NotReparsePoint $directory
  }

  $allFiles = @(Get-ChildItem -LiteralPath $SourceDirectory -File -Recurse -Force | Sort-Object FullName)
  if ($allFiles.Count -eq 0) {
    throw "Capture session contains no files."
  }
  if ($allFiles.Count -gt $MaxFiles) {
    throw "Capture session exceeds the bounded frame limit."
  }

  $records = @()
  $caseKeys = @{}
  $sequence = 0
  foreach ($file in $allFiles) {
    Assert-NotReparsePoint $file
    Assert-NoAlternateDataStreams $file
    if ($script:AllowedExtensions -notcontains $file.Extension.ToLowerInvariant()) {
      throw "Capture session contains an unsupported file extension."
    }
    $relative = Get-RelativeFramePath -Root $SourceDirectory -FullName $file.FullName
    $caseKey = $relative.ToLowerInvariant()
    if ($caseKeys.ContainsKey($caseKey)) {
      throw "Capture session contains duplicate or case-colliding frame names."
    }
    $caseKeys[$caseKey] = $true

    $beforeLength = $file.Length
    $beforeWrite = $file.LastWriteTimeUtc
    Start-Sleep -Milliseconds 750
    $stable = Get-Item -LiteralPath $file.FullName -Force
    if ($stable.Length -ne $beforeLength -or $stable.LastWriteTimeUtc -ne $beforeWrite) {
      throw "Capture output is still changing."
    }

    $sequence += 1
    $records += [ordered]@{
      observedSequence = $sequence
      relativePath = $relative
      byteCount = [int64]$stable.Length
      sha256 = Get-Sha256 -Path $stable.FullName
      sourcePath = $stable.FullName
    }
  }
  return $records
}

function Test-ExistingBundle {
  param(
    [Parameter(Mandatory = $true)][string]$BundleDirectory,
    [Parameter(Mandatory = $true)][object[]]$SourceFrames
  )
  $manifestPath = Join-Path $BundleDirectory "manifest.json"
  $readyPath = Join-Path $BundleDirectory "READY"
  if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf) -or -not (Test-Path -LiteralPath $readyPath -PathType Leaf)) {
    return $false
  }
  $expectedManifestHash = (Get-Content -LiteralPath $readyPath -Raw).Trim().ToLowerInvariant()
  if ($expectedManifestHash -notmatch '^[a-f0-9]{64}$' -or (Get-Sha256 $manifestPath) -ne $expectedManifestHash) {
    return $false
  }
  $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
  $expectedSchema = if ($PairingMode -eq "AdjacentDuplexFrontFirst") { "phronesis.windows-scan-bundle/v2" } else { "phronesis.windows-scan-bundle/v1" }
  $expectedPairing = if ($PairingMode -eq "AdjacentDuplexFrontFirst") { "adjacent-duplex-front-first" } else { "unknown" }
  if ($manifest.schemaVersion -ne $expectedSchema -or $manifest.sessionId -ne $SessionId -or $manifest.pairingSemantics -ne $expectedPairing) {
    return $false
  }
  if (@($manifest.frames).Count -ne $SourceFrames.Count) {
    return $false
  }
  for ($index = 0; $index -lt $SourceFrames.Count; $index += 1) {
    $existing = @($manifest.frames)[$index]
    $source = $SourceFrames[$index]
    if ($existing.relativePath -ne $source.relativePath -or [int64]$existing.byteCount -ne $source.byteCount -or $existing.sha256 -ne $source.sha256) {
      return $false
    }
    if ($PairingMode -eq "AdjacentDuplexFrontFirst") {
      $expectedSide = if ($source.observedSequence % 2 -eq 1) { "FRONT" } else { "BACK" }
      $expectedPair = if ($expectedSide -eq "FRONT") { $source.observedSequence + 1 } else { $source.observedSequence - 1 }
      if ($existing.side -ne $expectedSide -or [int]$existing.pairedObservedSequence -ne $expectedPair) {
        return $false
      }
    }
    $bundleFramePath = Join-Path (Join-Path $BundleDirectory "frames") ($existing.relativePath.Replace('/', '\'))
    if (-not (Test-Path -LiteralPath $bundleFramePath -PathType Leaf)) {
      return $false
    }
    $bundleFrame = Get-Item -LiteralPath $bundleFramePath -Force
    if (($bundleFrame.Attributes -band [System.IO.FileAttributes]::ReparsePoint) -ne 0 -or $bundleFrame.Length -ne [int64]$existing.byteCount -or (Get-Sha256 $bundleFramePath) -ne $existing.sha256) {
      return $false
    }
  }
  return $true
}

function Invoke-Preflight {
  if (-not (Test-Path -LiteralPath $PaperStreamPath -PathType Leaf)) {
    throw "PaperStream Capture executable was not found."
  }
  if (-not (Test-Path -LiteralPath $SharedRoot -PathType Container)) {
    throw "Dedicated Parallels shared root is unavailable."
  }
  Write-BridgeEvent -Type "preflight.completed" -Details @{
    paperStreamAvailable = $true
    sharedRootAvailable = $true
  }
}

function Invoke-Capture {
  Assert-SafeSessionId $SessionId
  Assert-SafeJobName $JobName
  if (-not $AllowPhysicalScan) {
    throw "Physical scanning requires -AllowPhysicalScan and direct supervision with low-value flat unsleeved cards."
  }
  if (-not (Test-Path -LiteralPath $PaperStreamPath -PathType Leaf)) {
    throw "PaperStream Capture executable was not found."
  }
  $sessionDirectory = Join-Path $CaptureRoot $SessionId
  if (Test-Path -LiteralPath $sessionDirectory) {
    throw "Capture session folder already exists; use a new session ID or Seal the existing evidence."
  }

  Write-BridgeEvent -Type "capture.starting" -Details @{ jobName = $JobName }
  # Windows PowerShell 5.1 flattens ArgumentList arrays before invoking a native
  # process. Quote the complete DocType value so profile names containing spaces
  # remain a single PaperStream command-line argument.
  $paperStreamArguments = @("/DocType:`"$JobName`"", "/BatchFolder:$SessionId", "/Exit")
  $process = Start-Process -FilePath $PaperStreamPath -ArgumentList $paperStreamArguments -PassThru
  $deadline = [DateTime]::UtcNow.AddSeconds($CaptureTimeoutSeconds)
  while (-not $process.HasExited -and [DateTime]::UtcNow -lt $deadline) {
    Start-Sleep -Milliseconds 250
    $process.Refresh()
  }
  if (-not $process.HasExited) {
    throw "PaperStream Capture did not finish within the bounded timeout; it was left running for operator recovery."
  }
  $outputPresent = Test-Path -LiteralPath $sessionDirectory -PathType Container
  Write-BridgeEvent -Type "capture.process.completed" -Details @{
    exitCode = $process.ExitCode
    outputPresent = $outputPresent
  }
  if ($process.ExitCode -ne 0) {
    throw "PaperStream Capture reported a failed session."
  }
  if (-not $outputPresent) {
    throw "PaperStream completed without the configured session output folder."
  }
  Write-BridgeEvent -Type "capture.completed" -Details @{ outputPresent = $true }
}

function Invoke-Seal {
  Assert-SafeSessionId $SessionId
  Assert-SafeJobName $JobName
  $sourceDirectory = Join-Path $CaptureRoot $SessionId
  $frames = @(Get-FrameRecords -SourceDirectory $sourceDirectory)
  if ($PairingMode -eq "AdjacentDuplexFrontFirst" -and $frames.Count % 2 -ne 0) {
    throw "Adjacent duplex capture must contain a complete even number of front/back frames."
  }
  $readyRoot = Join-Path $SharedRoot "ready"
  $stagingRoot = Join-Path $SharedRoot ".staging"
  [System.IO.Directory]::CreateDirectory($readyRoot) | Out-Null
  [System.IO.Directory]::CreateDirectory($stagingRoot) | Out-Null
  $finalDirectory = Join-Path $readyRoot $SessionId

  if (Test-Path -LiteralPath $finalDirectory) {
    if (Test-ExistingBundle -BundleDirectory $finalDirectory -SourceFrames $frames) {
      Write-BridgeEvent -Type "bundle.already_ready" -Details @{ frameCount = $frames.Count }
      return
    }
    throw "A conflicting ready bundle already exists for this session."
  }

  $stageDirectory = Join-Path $stagingRoot ($SessionId + "." + [Guid]::NewGuid().ToString("N"))
  $stageFrames = Join-Path $stageDirectory "frames"
  [System.IO.Directory]::CreateDirectory($stageFrames) | Out-Null

  try {
    $manifestFrames = @()
    foreach ($frame in $frames) {
      $destination = Join-Path $stageFrames ($frame.relativePath.Replace('/', '\'))
      [System.IO.Directory]::CreateDirectory([System.IO.Path]::GetDirectoryName($destination)) | Out-Null
      [System.IO.File]::Copy($frame.sourcePath, $destination, $false)
      $destinationItem = Get-Item -LiteralPath $destination -Force
      Assert-NotReparsePoint $destinationItem
      $destinationHash = Get-Sha256 $destination
      if ($destinationItem.Length -ne $frame.byteCount -or $destinationHash -ne $frame.sha256) {
        throw "A copied frame failed byte or hash verification."
      }
      $manifestFrame = [ordered]@{
        observedSequence = $frame.observedSequence
        relativePath = $frame.relativePath
        byteCount = $frame.byteCount
        sha256 = $frame.sha256
      }
      if ($PairingMode -eq "AdjacentDuplexFrontFirst") {
        $manifestFrame["side"] = if ($frame.observedSequence % 2 -eq 1) { "FRONT" } else { "BACK" }
        $manifestFrame["pairedObservedSequence"] = if ($manifestFrame["side"] -eq "FRONT") { $frame.observedSequence + 1 } else { $frame.observedSequence - 1 }
      }
      $manifestFrames += $manifestFrame
      Write-BridgeEvent -Type "frame.copied" -Details @{
        observedSequence = $frame.observedSequence
        fileName = [System.IO.Path]::GetFileName($frame.relativePath)
        byteCount = $frame.byteCount
        sha256 = $frame.sha256
      }
    }

    $manifest = [ordered]@{
      schemaVersion = if ($PairingMode -eq "AdjacentDuplexFrontFirst") { "phronesis.windows-scan-bundle/v2" } else { "phronesis.windows-scan-bundle/v1" }
      sessionId = $SessionId
      adapter = "paperstream-capture"
      transport = "parallels-shared-folder"
      profileName = $JobName
      pairingSemantics = if ($PairingMode -eq "AdjacentDuplexFrontFirst") { "adjacent-duplex-front-first" } else { "unknown" }
      frameCount = $manifestFrames.Count
      frames = $manifestFrames
    }
    $manifestPath = Join-Path $stageDirectory "manifest.json"
    Write-Utf8NoBom -Path $manifestPath -Content ($manifest | ConvertTo-Json -Compress -Depth 8)
    $manifestHash = Get-Sha256 $manifestPath
    Write-Utf8NoBom -Path (Join-Path $stageDirectory "READY") -Content $manifestHash
    [System.IO.Directory]::Move($stageDirectory, $finalDirectory)
    Write-BridgeEvent -Type "bundle.ready" -Details @{
      frameCount = $manifestFrames.Count
      manifestSha256 = $manifestHash
    }
  } catch {
    if (Test-Path -LiteralPath $stageDirectory) {
      Write-BridgeEvent -Type "bundle.incomplete" -Details @{ stagingPreserved = $true }
    }
    throw
  }
}

try {
  Write-BridgeEvent -Type "program.started" -Details @{ command = $Command }
  switch ($Command) {
    "Preflight" { Invoke-Preflight }
    "Capture" { Invoke-Capture }
    "Seal" { Invoke-Seal }
    "CaptureAndSeal" {
      Invoke-Capture
      Invoke-Seal
    }
  }
  Write-BridgeEvent -Type "program.completed" -Details @{}
  exit 0
} catch {
  Write-BridgeEvent -Type "program.failed" -Details @{ message = "Bridge operation failed safely." }
  exit 1
}
