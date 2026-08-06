[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$bridgeScript = Join-Path (Split-Path -Parent $PSScriptRoot) "PhronesisScannerBridge.ps1"
$testRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("phr-windows-bridge-test-" + [Guid]::NewGuid().ToString("N"))
$captureRoot = Join-Path $testRoot "capture"
$sharedRoot = Join-Path $testRoot "shared"
[System.IO.Directory]::CreateDirectory($captureRoot) | Out-Null
[System.IO.Directory]::CreateDirectory($sharedRoot) | Out-Null
$passed = 0

function Invoke-BridgeChild {
  param([string[]]$Arguments)
  $output = & powershell.exe -NoLogo -NoProfile -NonInteractive -ExecutionPolicy Bypass -File $bridgeScript @Arguments 2>&1
  return [ordered]@{ ExitCode = $LASTEXITCODE; Output = @($output) }
}

function Assert-Test {
  param([string]$Name, [bool]$Condition)
  if (-not $Condition) { throw "Self-test failed: $Name" }
  $script:passed += 1
  [Console]::Out.WriteLine("PASS $Name")
}

try {
  $invalid = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", "../bad", "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "unsafe session rejected" ($invalid.ExitCode -eq 1)

  $noConsent = Invoke-BridgeChild @("-Command", "Capture", "-SessionId", "phr-test-no-consent", "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "capture consent required" ($noConsent.ExitCode -eq 1)

  $argumentSession = "phr-test-capture-args"
  $argumentSessionRoot = Join-Path $captureRoot $argumentSession
  $argumentLog = Join-Path $testRoot "paperstream-arguments.txt"
  $fakePaperStream = Join-Path $testRoot "fake-paperstream.cmd"
  [System.IO.File]::WriteAllLines($fakePaperStream, @(
    "@echo off",
    "echo [%1]>`"$argumentLog`"",
    "echo [%2]>>`"$argumentLog`"",
    "echo [%3]>>`"$argumentLog`"",
    "echo [%4]>>`"$argumentLog`"",
    "mkdir `"$argumentSessionRoot`""
  ))
  $argumentCapture = Invoke-BridgeChild @(
    "-Command", "Capture",
    "-SessionId", $argumentSession,
    "-JobName", "Phronesis Card Duplex",
    "-CaptureRoot", $captureRoot,
    "-SharedRoot", $sharedRoot,
    "-PaperStreamPath", $fakePaperStream,
    "-AllowPhysicalScan"
  )
  $capturedArguments = @(Get-Content -LiteralPath $argumentLog)
  Assert-Test "capture preserves spaced job argument" ($argumentCapture.ExitCode -eq 0 -and $capturedArguments[0] -eq '[/DocType:"Phronesis Card Duplex"]')
  Assert-Test "capture supplies batch folder and exit" ($capturedArguments[1] -eq "[/BatchFolder:$argumentSession]" -and $capturedArguments[2] -eq "[/Exit]" -and $capturedArguments[3] -eq "[]")

  $session = "phr-test-valid"
  $sessionRoot = Join-Path $captureRoot $session
  [System.IO.Directory]::CreateDirectory($sessionRoot) | Out-Null
  [System.IO.File]::WriteAllBytes((Join-Path $sessionRoot "001.jpg"), [byte[]](1, 2, 3, 4))
  [System.IO.File]::WriteAllBytes((Join-Path $sessionRoot "002.jpg"), [byte[]](5, 6, 7, 8))
  $sealed = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $session, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "valid session seals" ($sealed.ExitCode -eq 0)
  $bundle = Join-Path (Join-Path $sharedRoot "ready") $session
  Assert-Test "manifest published" (Test-Path -LiteralPath (Join-Path $bundle "manifest.json") -PathType Leaf)
  Assert-Test "ready marker published" (Test-Path -LiteralPath (Join-Path $bundle "READY") -PathType Leaf)

  $duplexSession = "phr-test-duplex"
  $duplexRoot = Join-Path $captureRoot $duplexSession
  [System.IO.Directory]::CreateDirectory($duplexRoot) | Out-Null
  [System.IO.File]::WriteAllBytes((Join-Path $duplexRoot "001.jpg"), [byte[]](1, 1, 1, 1))
  [System.IO.File]::WriteAllBytes((Join-Path $duplexRoot "002.jpg"), [byte[]](2, 2, 2, 2))
  $duplexSeal = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $duplexSession, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot, "-PairingMode", "AdjacentDuplexFrontFirst")
  $duplexManifest = Get-Content -LiteralPath (Join-Path (Join-Path (Join-Path $sharedRoot "ready") $duplexSession) "manifest.json") -Raw | ConvertFrom-Json
  Assert-Test "declared duplex seals v2 reciprocal pairs" ($duplexSeal.ExitCode -eq 0 -and $duplexManifest.schemaVersion -eq "phronesis.windows-scan-bundle/v2" -and $duplexManifest.frames[0].side -eq "FRONT" -and $duplexManifest.frames[0].pairedObservedSequence -eq 2 -and $duplexManifest.frames[1].side -eq "BACK" -and $duplexManifest.frames[1].pairedObservedSequence -eq 1)

  $backFirstSession = "phr-test-duplex-back-first"
  $backFirstRoot = Join-Path $captureRoot $backFirstSession
  [System.IO.Directory]::CreateDirectory($backFirstRoot) | Out-Null
  [System.IO.File]::WriteAllBytes((Join-Path $backFirstRoot "001.jpg"), [byte[]](3, 3, 3, 3))
  [System.IO.File]::WriteAllBytes((Join-Path $backFirstRoot "002.jpg"), [byte[]](4, 4, 4, 4))
  $backFirstSeal = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $backFirstSession, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot, "-PairingMode", "AdjacentDuplexBackFirst")
  $backFirstManifest = Get-Content -LiteralPath (Join-Path (Join-Path (Join-Path $sharedRoot "ready") $backFirstSession) "manifest.json") -Raw | ConvertFrom-Json
  Assert-Test "declared back-first duplex seals reciprocal faces" ($backFirstSeal.ExitCode -eq 0 -and $backFirstManifest.pairingSemantics -eq "adjacent-duplex-back-first" -and $backFirstManifest.frames[0].side -eq "BACK" -and $backFirstManifest.frames[0].pairedObservedSequence -eq 2 -and $backFirstManifest.frames[1].side -eq "FRONT" -and $backFirstManifest.frames[1].pairedObservedSequence -eq 1)

  $oddSession = "phr-test-duplex-odd"
  $oddRoot = Join-Path $captureRoot $oddSession
  [System.IO.Directory]::CreateDirectory($oddRoot) | Out-Null
  [System.IO.File]::WriteAllBytes((Join-Path $oddRoot "001.jpg"), [byte[]](1, 2, 3, 4))
  $oddDuplex = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $oddSession, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot, "-PairingMode", "AdjacentDuplexFrontFirst")
  Assert-Test "incomplete duplex pair rejected" ($oddDuplex.ExitCode -eq 1)

  $repeat = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $session, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "repeat seal is idempotent" ($repeat.ExitCode -eq 0 -and (($repeat.Output -join "`n") -match "bundle.already_ready"))

  [System.IO.File]::WriteAllBytes((Join-Path (Join-Path $bundle "frames") "001.jpg"), [byte[]](0, 0, 0, 0))
  $corruptBundle = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $session, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "changed ready bundle conflicts" ($corruptBundle.ExitCode -eq 1)
  Remove-Item -LiteralPath $bundle -Recurse -Force
  $resealed = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $session, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "evidence can reseal after synthetic rollback" ($resealed.ExitCode -eq 0)

  [System.IO.File]::WriteAllBytes((Join-Path $sessionRoot "002.jpg"), [byte[]](9, 9, 9, 9))
  $conflict = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $session, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "changed source conflicts" ($conflict.ExitCode -eq 1)

  $badSession = "phr-test-extension"
  $badRoot = Join-Path $captureRoot $badSession
  [System.IO.Directory]::CreateDirectory($badRoot) | Out-Null
  [System.IO.File]::WriteAllText((Join-Path $badRoot "001.pdf"), "not-an-image")
  $badExtension = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $badSession, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "unsupported extension rejected" ($badExtension.ExitCode -eq 1)

  $emptySession = "phr-test-empty"
  [System.IO.Directory]::CreateDirectory((Join-Path $captureRoot $emptySession)) | Out-Null
  $empty = Invoke-BridgeChild @("-Command", "Seal", "-SessionId", $emptySession, "-CaptureRoot", $captureRoot, "-SharedRoot", $sharedRoot)
  Assert-Test "empty capture rejected" ($empty.ExitCode -eq 1)

  [Console]::Out.WriteLine("$passed PowerShell bridge self-tests passed.")
  exit 0
} finally {
  if (Test-Path -LiteralPath $testRoot) {
    Remove-Item -LiteralPath $testRoot -Recurse -Force
  }
}
