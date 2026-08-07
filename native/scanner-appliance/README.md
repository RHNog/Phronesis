# Phronesis Scanner Appliance

`PHR-TECH-017` turns a supported Mac or Windows computer connected to a scanner into an outbound-only Phronesis appliance.

## What the agent owns

- local vendor-driver readiness;
- one locally configured capture executable and argument template;
- starting and terminating that exact process;
- a bounded retained capture folder;
- front-image hashing and authenticated delivery.

Phronesis owns pairing, operator authorization, recognition-session identity, Start/Cancel commands, durable ingestion, recognition, review, and offers. A Phronesis command never contains a local executable or shell text.

## Build a host-native executable

Node 25.5 or newer can build the dependency-free agent as one executable:

~~~sh
npm run scanner:agent:build
./build/scanner-agent/phronesis-scanner-agent help
~~~

The build is native to the host OS and architecture. Build Windows artifacts on Windows and macOS artifacts on macOS. The repository workflow `.github/workflows/scanner-appliance-agent.yml` creates both unsigned test packages through an explicit manual run. General distribution still requires the configured Apple/Windows signing identity and physical-device qualification.

The unbundled source is also available at `/downloads/phronesis-scanner-agent.mjs` for development hosts that already have Node.js.

## Pair once

1. Install the scanner manufacturer's supported driver and configure a front-only capture profile.
2. Open Vendor Workspace → Scanner to offer → Scanner appliance.
3. As an administrator, choose **Pair a device** and copy the ten-minute code.
4. On the scanner computer, run the displayed command. Example:

~~~sh
phronesis-scanner-agent pair \
  --controller https://your-phronesis-host \
  --code PHR-XXXX-XXXX-XXXX-XXXX \
  --label "Booth scanner" \
  --adapter managed-capture \
  --capture-executable /absolute/path/to/qualified-capture-tool \
  --capture-arg scan \
  --capture-arg --output-directory \
  --capture-arg '{outputDir}' \
  --output-root /absolute/path/to/phronesis-capture
~~~

Argument values are passed directly to the executable with no shell. Supported placeholders are `{commandId}`, `{sessionId}`, and `{outputDir}`.

The shortest Phronesis pairing command intentionally contains no machine path. If the local executable was not auto-detected, configure it afterward without re-pairing:

~~~sh
phronesis-scanner-agent configure \
  --capture-executable /absolute/path/to/qualified-capture-tool \
  --capture-arg scan \
  --capture-arg --output-directory \
  --capture-arg '{outputDir}' \
  --output-root /absolute/path/to/phronesis-capture
~~~

## macOS ICA development adapter

The existing `Fi8170Probe` remains a capability-gated development adapter, not a signed production scanner driver. After its physical gate passes, a local pairing can wrap the compiled probe with arguments similar to:

~~~text
scan
--device-query
fi-8170
--output-directory
{outputDir}
--allow-physical-scan
~~~

Ricoh driver support for the exact macOS release remains a prerequisite.

## Windows PaperStream adapter

On Windows the agent detects the standard PaperStream Capture executable when present and defaults to the local `Phronesis Card Front` job. Configure that PaperStream job for front-only files and a capture root matching `--output-root`. Release after scan must remain enabled. If the installation or job differs, pass the exact local executable and repeated `--capture-arg` values during pairing.

## Operate

~~~sh
phronesis-scanner-agent doctor
phronesis-scanner-agent run
~~~

`doctor` never performs a scan. `run` opens no inbound port; it reports readiness and polls the paired Phronesis controller. Use a user login item or supervised service to keep `run` active. Automatic signed service installation remains a distribution gate.

The agent retains each command output directory for recovery and never uploads backs. If it restarts during a capture, it fails that command visibly and retains the spool rather than guessing whether the hardware completed.

## Revoke or move computers

Revoke the appliance from Scanner to offer before deleting its local configuration. Pair the replacement computer with a new one-time code. Never copy the configuration file or device token between computers.
