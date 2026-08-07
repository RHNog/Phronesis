# PHR-API-017 — Provider Price History And Movement Conformance Review

Status: Conforming — Privately Live; Product Review Ready.

Review boundary: same-session architecture and implementation conformance; not independent Product Owner approval.

The implementation conforms to the provider-separation contract. TCGplayer history remains in `pricing_history`, regional history is append-only and reconciliation-owned, and PriceCharting history remains receipt-owned. One projection returns bounded series without merging USD/BRL, changing match quality, or fabricating observations.

The Vendor hierarchy conforms to `PHR-UX-013`: TCGplayer/Liga movement is inside raw-card evidence; PriceCharting movement is inside the separate lazy disclosure. Text summaries, selected state, 44-pixel controls, one-point/empty states, and phone-width geometry satisfy accessibility and responsiveness requirements.

Automated, database, deployment, and live browser evidence satisfies the work order. Product Owner visual acceptance remains the independent final gate.
