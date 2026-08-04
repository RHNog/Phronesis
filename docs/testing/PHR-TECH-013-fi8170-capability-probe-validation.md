# PHR-TECH-013 — fi-8170 Capability Probe Validation

## Status

Software Checkpoint Verified — Physical Gate Pending

## Software Gate

- [x] `swift build`
- [x] `swift test` — 18/18.
- [x] Disconnected `list` emits valid start/enumeration-complete events and exits cleanly with zero devices.
- [x] Disconnected `probe` emits a typed not-found failure and never requests a scan.
- [x] CLI rejects `scan` without `--allow-physical-scan`.
- [x] CLI rejects `scan` without an explicit output directory.
- [x] Event order, schema, redaction, hashing, atomic promotion, collision, cancellation, and timeout tests pass.
- [x] SIGINT during discovery exits 130 with a typed cancellation event.
- [x] Explicitly consented scan with no device creates no output or staging directory.
- [x] `swift-format lint --recursive Sources Tests Package.swift`
- [x] `git diff --check`
- [x] Secret and private-identifier review

## Physical Gate

- [ ] Connected fi-8170 is discovered without exposing its serial.
- [ ] Exclusive session opens and closes.
- [ ] ADF capabilities and actual supported resolutions are recorded.
- [ ] 2–4 owner-approved low-value cards complete a duplex scan.
- [ ] Every delivered side is atomically persisted and hashed exactly once.
- [ ] Actual ordering/pairing evidence is reported without inference.
- [ ] Cancellation and clean restart are demonstrated.
- [ ] Operator records feed, edge, surface, jam, and multifeed observations.

## Current Evidence

Physical gate blocked: the fi-8170 was not connected during discovery. No card has been scanned by this implementation.

## Commands

~~~sh
env CLANG_MODULE_CACHE_PATH=/private/tmp/phronesis-swift-module-cache \
  swift build --disable-sandbox --scratch-path /private/tmp/phronesis-fi8170-build

env CLANG_MODULE_CACHE_PATH=/private/tmp/phronesis-swift-module-cache \
  swift test --disable-sandbox --scratch-path /private/tmp/phronesis-fi8170-build

xcrun swift-format lint --recursive Sources Tests Package.swift

/private/tmp/phronesis-fi8170-build/out/Products/Debug/fi8170-probe list \
  --discovery-timeout 2

/private/tmp/phronesis-fi8170-build/out/Products/Debug/fi8170-probe probe \
  --device-query fi-8170 --discovery-timeout 2

git diff --check
~~~
