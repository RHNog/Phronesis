# PHR-TECH-014 Release Notes

Implemented the conservative local recognition foundation: content-addressed evidence, durable leases, versioned corpus activation/rollback, Apple Vision OCR/feature evidence, read-only catalogue retrieval, game gating, benchmark reporting, review, and abstention. Auto-accept and the licensed artwork index remain disabled pending a powered English Pokémon holdout.

The 2026-08-05 calibration increment adds deterministic content-addressed corpus construction, canonical manifests, immutable identity/object split enforcement, explicit recognition-use approval evidence, and sealed benchmark reports covering top-1/top-k recall, accepted precision, exception rates, latency, pairing accuracy, and failure strata. No real artwork was imported and qualification remains fail-closed.

The Pokémon-first revision makes `pokemon-en` the only default worker lane, adds English-language and collector evidence gates, preserves exact labelled catalogue variants, and supports idempotent append-only session replay. The live 18-frame batch now yields eight review candidates and ten safe abstentions; automatic acceptance remains disabled.

The 2026-08-06 runtime recovery binds Apple Vision's main OCR and feature-print stages to an available CPU after macOS 27 beta repeatedly stalled during Neural Engine compilation. It also adds bounded session recovery for failed or expired recognition jobs. The first physical `v2` batch completed all nine front jobs and retained nine evidence-only backs; all nine results safely abstained below the review threshold.

Pipeline `local-vision-ocr-pokemon-en-v2-observed-identity` now preserves probable name, collector number, game, and language before the English-market retrieval gate. The live nine-card replay reports nine observed identities, eight exact supported English-market candidate sets, and one Spanish Toxicroak market abstention. This is not an auto-accept qualification claim; the powered unseen holdout gate remains closed.
