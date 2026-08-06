# PHR-WORKFLOW-016 Release Notes

Added the authenticated Scanner to Offer Vendor workflow with batch-folder intake, durable session counts, evidence display, operator identity/material confirmation, server-verified exact-condition price evidence, buying-preset binding, and local offer drafts. It performs no purchase, inventory, marketplace, or publication mutation.

Privately activated the workflow at tailnet-only port `9444` with persistent user-supervised app and recognition-worker services. Session stages now reconcile from durable job and resolution truth, preventing completed or idempotently reimported batches from remaining incorrectly marked as processing.

Changed the first operational product lane to English Pokémon. Resolve now exposes exact name, set, collector, variant, and language choices, binds finish to the selected SKU, and rejects mismatched submissions. Append-only replay preserves history while current counts show eight English faces in review and ten unsupported/back images abstained.

Resolve now shows acquisition-proven front and reverse evidence together before manual condition confirmation. A legacy unpaired frame renders an explicit unavailable state and is never paired by filename or sequence. Reverse evidence is not sent through recognition and does not produce an automatic grade.

Replaced per-card condition and finish entry with a homogeneous batch declaration. New sessions require one condition and one Pokémon finish; legacy imported sessions can be configured before resolution. Settings are append-only, become immutable after the first resolved card, drive exact-condition pricing server-side, and reject any recognition candidate whose catalogue variant differs from the declared batch finish. Scanner images are not presented as automatic grading or finish classification.

Offer drafts now consolidate exact duplicate commercial bindings into quantities without rewriting the underlying resolutions. The server returns grouped lines, contributing scan-region IDs, per-unit values, subtotals, and currency-separated lot totals. A difference in printing, condition, finish, price snapshot, buying preset, unit offer, or currency preserves a separate line.

Corrected authenticated remote scanner access by explicitly binding the isolated service to the canonical authorization database. Task-scoped temporary authorization also tolerates an absent optional purchase-event module, while every transactional/event scope continues to fail closed instead of causing an uncaught server-render error.

Completed and corrected the first physical reciprocal-duplex session. The original import of `phr-pokemon-duplex-20260806-001` mislabeled the profile's rear-sensor-first output as front-first. An audited, idempotent repair now retains every object, pair, region, job, and prior card-back decision while making the nine even observations the effective fronts and the nine odd Pokémon-back observations linked reverse evidence. Reprocessing the card faces produced eight review recommendations and one abstention; no result was auto-accepted and no offer line or downstream commercial mutation was created.

Added a confirmed Cancel action to the active Phronesis scan session. Cancellation is idempotent, retains immutable evidence and material history, cancels pending recognition work, rejects late imports, and does not claim to stop PaperStream's separately controlled native process. The empty `Poke Test #2` attempt was cancelled after PaperStream readiness was found incomplete, and replacement `Poke Test #3` was created as Lightly Played / Holofoil with the live Cancel control visible.

Scanner review now orders batches by creation time and provides an explicit batch selector, so background reconciliation of an older session cannot silently make it active. Refresh is now labelled `Refresh status`, preserves the current exception, and announces completion time plus unresolved count. Previous/Next controls and `Card N of M` expose the complete exception queue independently from status reload.

The 2026-08-06 material-correction increment fixes the misleading 1/9 review result. The engine had produced exact candidates for all eight supported English cards, but the UI hid seven because their Normal/Reverse Holofoil variants differed from the Holofoil batch declaration. Batch material now acts as a default; review shows every exact variant, lets the operator change condition per card, and persists the selected candidate finish as an auditable per-card binding. Barbaracle can therefore be changed from Holofoil to Reverse Holofoil without changing the other cards.

Review now loads TCGplayer listing low, TCGplayer market, and matched LigaPokemon/LigaMagic low evidence for the selected card/condition. The controlled `tcg-low-80` preset computes Suggested Offer server-side as 80% of TCG Low. Offer completion returns all four totals with coverage, keeping TCG/Suggested Offer in USD and Liga low in BRL. Regional condition/language remain labelled references rather than silent card-grade substitutions.

Retained reverse evidence is collapsed by default. It remains immutable and available for audit in existing duplex sessions, but it is not processed for identity, condition, finish, or pricing and is absent from future front-only sessions.
