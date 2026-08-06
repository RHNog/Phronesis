# Phronesis Windows Scanner Bridge

Temporary `PHR-TECH-015` acquisition adapter for the local Windows 11 Parallels VM.

The bridge keeps scanner ownership and original capture files in Windows, transfers only a sealed hash-bound bundle through a dedicated Parallels shared folder, and independently verifies every byte before a macOS evidence import.

## Safety

- Use only owner-approved low-value, flat, unsleeved cards under direct supervision.
- Never use valuable, irreplaceable, damaged, curled, sleeved, or rigid cards.
- `Capture` and `CaptureAndSeal` require `-AllowPhysicalScan`.
- File order is observation only and does not prove duplex side pairing unless the operator explicitly selects a fail-closed adjacent-duplex mode whose first side has been physically verified.
- Windows originals and sealed bundles are preserved.

## Windows

~~~powershell
& "\\Mac\PhronesisBridgeTools\PhronesisScannerBridge.ps1" `
  -Command Preflight `
  -SharedRoot "\\Mac\PhronesisBridge"

& "\\Mac\PhronesisBridgeTools\PhronesisScannerBridge.ps1" `
  -Command CaptureAndSeal `
  -SessionId "phr-card-test-001" `
  -JobName "Phronesis Card Duplex" `
  -CaptureRoot "C:\PhronesisScannerBridge\capture" `
  -SharedRoot "\\Mac\PhronesisBridge" `
  -PairingMode AdjacentDuplexBackFirst `
  -AllowPhysicalScan
~~~

`AdjacentDuplexBackFirst` is the physically verified mode for the `Phronesis Card Duplex` profile: it labels odd sequences `BACK`, even sequences `FRONT`, and seals reciprocal pair references only when the released file count is even. `AdjacentDuplexFrontFirst` remains available for a separately verified front-first profile. Use the default `Unknown` mode whenever the profile's first side has not been physically verified; Phronesis will not infer pairing later.

Run the bridge from an interactive PowerShell session owned by the logged-in Windows operator. Parallels `prlctl exec` runs as `NT AUTHORITY\SYSTEM` in session 0 and must not launch PaperStream directly; automation must dispatch into the active Windows console session.

The registered PaperStream Capture job must enable batch-folder output, release single-page JPEG or TIFF images beneath `C:\PhronesisScannerBridge\capture\<session-id>`, and use 300 dpi, 24-bit color, duplex acquisition, and no blank-page removal. The bridge supplies PaperStream's documented `/Exit` switch so sealing begins only after the released batch closes.

## macOS

~~~sh
node bridge-import.mjs inspect \
  --bundle /Users/Shared/PhronesisScannerBridge/ready/phr-card-test-001

node bridge-import.mjs import \
  --bundle /Users/Shared/PhronesisScannerBridge/ready/phr-card-test-001 \
  --output-root /private/tmp/phronesis-windows-bridge-import
~~~

Both commands emit `phronesis.windows-bridge-event/v1` JSON Lines and never print absolute paths.

## Tests

~~~sh
node --test test/bridge-import.test.mjs
~~~

Run the PowerShell self-test inside Windows:

~~~powershell
& "\\Mac\PhronesisBridgeTools\test\PhronesisScannerBridge.SelfTest.ps1"
~~~
