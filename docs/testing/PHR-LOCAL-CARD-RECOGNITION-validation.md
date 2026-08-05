# PHR Local Card Recognition — Validation

## Automated Gates

- Focused card-recognition tests: pass, 11/11.
- Full Phronesis suite: pass, 404/404.
- Standalone TypeScript: pass.
- ESLint with zero warnings: pass.
- Next.js 16.2.12 production build: pass; scanner page and four card-recognition API routes emitted.
- macOS Vision Swift tests: pass, 2/2.
- Windows bridge tests remain pass: Node 10/10 and PowerShell 13/13 from S1W.

## Real Evidence Replay

- Bundle manifest SHA-256: `723ee7e9be1b91aae5d5e97f3fe55aa8cfe966532ba89b274d27a8647614ad2b`.
- Import: `already_imported`, 18/18 frame hashes retained.
- Repository: 18 frames, 18 active regions, 18 completed jobs, zero pending/failed.
- Final recognition: 18 abstained, zero review/accepted after game gate correction.
- Evidence image endpoint: HTTP 200, `image/jpeg`, 209,102 bytes, SHA-256 `2c50390fd9ab18afda0c0602846044ed82bdbd5776ed0d0d9945ec4dcf72eac8`.

## UI Evidence

- Desktop 1280×720: content width 957px inside the existing shell; no console warnings/errors.
- Phone 390×844: document width 375px, no horizontal overflow, all visible controls 44px high.
- Authenticated scan image loaded at 741×1058.
- Capture, Resolve, Offer, safe abstention, empty offer, and exact counts were visible and text-labelled.

## Calibration Result

`NOT_QUALIFIED`. The current physical scans lack immutable exact-printing ground truth and are not a powered unseen English Magic holdout. Auto-accept remains disabled even when a candidate score is high.

## 2026-08-05 Calibration Tooling Validation

- Focused corpus/calibration tests: pass, 7/7.
- Full Phronesis suite: pass, 409/409.
- macOS Vision Swift tests: pass, 2/2.
- Standalone TypeScript: pass.
- ESLint with zero warnings: pass.
- Next.js 16.2.12 production build: pass; 52 pages emitted.
- Diff whitespace validation: pass before documentation closeout.
- Synthetic evidence proves deterministic bundle/report hashes, idempotent bundle construction, no object writes for invalid manifests, canonical identity/object split-leakage rejection, immutable case binding, duplicate holdout-asset rejection, explicit usage approval, and fail-closed `NOT_QUALIFIED` output.

## 2026-08-05 Binder Segmentation Tooling Validation

- Focused region/binder tests: pass, 6/6.
- Full Phronesis suite: pass, 414/414.
- macOS Vision Swift tests: pass, 4/4.
- Standalone TypeScript, zero-warning ESLint, and Next.js 16.2.12 production build: pass; 52 pages emitted.
- Contract evidence covers top-left origin, contiguous reading order, duplicate rejection, bounded IoU, one-to-one label matching, synthetic exclusion, real-label approval, source reuse denial, threshold validation, and deterministic report sealing.
- Real single-card smoke: worker executed successfully but localized an internal rectangle rather than the edge-to-edge card. Result remains `NOT_QUALIFIED`; automatic region adoption is disabled.

## 2026-08-05 Private Operational Validation

- Full Phronesis suite: pass, 415/415, including durable session-state reconciliation.
- ESLint with zero warnings and Next.js 16.2.12 production build: pass; 52 pages emitted.
- Both user LaunchAgents report `running`; the scanner service binds loopback `127.0.0.1:3200` and the worker watches `/Users/Shared/PhronesisScannerBridge/ready`.
- Tailnet-only `:9444` scanner route: HTTP 200. Existing tailnet-only `:9443`: HTTP 200. Existing public `:10000` gateway remains configured unchanged and responds with its expected redirect.
- Live API: session state `REVIEW`; 18 frames, 18 regions, 18 abstained, zero pending, review-candidate, accepted, or failed results.
- Live evidence route: HTTP 200; 209,102 bytes; SHA-256 `2c50390fd9ab18afda0c0602846044ed82bdbd5776ed0d0d9945ec4dcf72eac8`.
- Worker idle-log line count remained 21 before and after a seven-second interval, proving the five-second poll does not emit idle heartbeat spam.
- Browser validation at 390×844: 375px document width inside a 390px viewport, no horizontal overflow, primary buttons at least 44px high, correct `REVIEW` state and exact counts, and zero console warnings/errors.
