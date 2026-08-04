# fi-8170 Capability Probe

This standalone macOS probe implements `PHR-TECH-013 / Slice A`. It is not the production scanner agent.

## Safety

`list` and `probe` never request a scan. `scan` requires both an explicit output directory and `--allow-physical-scan`. Use only owner-approved low-value, flat, unsleeved test cards under direct supervision.

The probe has no network listener, telemetry, recognition model, Phronesis database integration, or marketplace integration. It emits JSON Lines on stdout and never writes image output into the repository unless an operator explicitly supplies a repository path, which is prohibited by the work order.

## Commands

~~~sh
swift run fi8170-probe list
swift run fi8170-probe probe --device-query fi-8170
swift run fi8170-probe scan \
  --device-query fi-8170 \
  --output-directory /private/tmp/phronesis-fi8170-probe \
  --allow-physical-scan
~~~

Timeouts are configurable with `--discovery-timeout`, `--session-timeout`, and `--scan-timeout`.

## Exit codes

- `0` success
- `2` invalid command or options
- `3` requested scanner not found
- `4` session or capability failure
- `5` scan or evidence persistence failure
- `124` timeout
- `130` operator cancellation

## Current physical gate

Software-only validation is reproducible without hardware. Connected-device capability and duplex evidence must be recorded separately; a disconnected run is never physical acceptance.
