# PHR-WORKFLOW-016 Release Notes

Added the authenticated Scanner to Offer Vendor workflow with batch-folder intake, durable session counts, evidence display, operator identity/material confirmation, server-verified exact-condition price evidence, buying-preset binding, and local offer drafts. It performs no purchase, inventory, marketplace, or publication mutation.

Privately activated the workflow at tailnet-only port `9444` with persistent user-supervised app and recognition-worker services. Session stages now reconcile from durable job and resolution truth, preventing completed or idempotently reimported batches from remaining incorrectly marked as processing.

Changed the first operational product lane to English Pokémon. Resolve now exposes exact name, set, collector, variant, and language choices, binds finish to the selected SKU, and rejects mismatched submissions. Append-only replay preserves history while current counts show eight English faces in review and ten unsupported/back images abstained.

Resolve now shows acquisition-proven front and reverse evidence together before manual condition confirmation. A legacy unpaired frame renders an explicit unavailable state and is never paired by filename or sequence. Reverse evidence is not sent through recognition and does not produce an automatic grade.

Replaced per-card condition and finish entry with a homogeneous batch declaration. New sessions require one condition and one Pokémon finish; legacy imported sessions can be configured before resolution. Settings are append-only, become immutable after the first resolved card, drive exact-condition pricing server-side, and reject any recognition candidate whose catalogue variant differs from the declared batch finish. Scanner images are not presented as automatic grading or finish classification.

Offer drafts now consolidate exact duplicate commercial bindings into quantities without rewriting the underlying resolutions. The server returns grouped lines, contributing scan-region IDs, per-unit values, subtotals, and currency-separated lot totals. A difference in printing, condition, finish, price snapshot, buying preset, unit offer, or currency preserves a separate line.

Corrected authenticated remote scanner access by explicitly binding the isolated service to the canonical authorization database. Task-scoped temporary authorization also tolerates an absent optional purchase-event module, while every transactional/event scope continues to fail closed instead of causing an uncaught server-render error.

Completed the first physical reciprocal-duplex session. `phr-pokemon-duplex-20260806-001` contains nine recognition fronts and nine linked evidence-only backs; the private workflow shows both labelled sides. All nine machine decisions safely abstained below the review threshold, so no offer line or downstream commercial mutation was created.

Added a confirmed Cancel action to the active Phronesis scan session. Cancellation is idempotent, retains immutable evidence and material history, cancels pending recognition work, rejects late imports, and does not claim to stop PaperStream's separately controlled native process. The empty `Poke Test #2` attempt was cancelled after PaperStream readiness was found incomplete, and replacement `Poke Test #3` was created as Lightly Played / Holofoil with the live Cancel control visible.
