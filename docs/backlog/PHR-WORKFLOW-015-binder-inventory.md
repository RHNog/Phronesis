# PHR-WORKFLOW-015 Binder Inventory

## Feature ID

`PHR-WORKFLOW-015`

## Title

Binder Inventory Lane

## Status

Backlog — Product Intent Recorded

## Priority

Medium

## Category

Backlog / Workflow / Inventory / Event Operations / UX

## Objective

Reserve a permanent product identity for managing cards physically organized in binders without forcing Display Case or General Inventory rules onto that lane.

## Background

The Product Owner distinguishes three operational inventory presentations: General Inventory, Display Case, and Binder Inventory. Display Case rules are implemented under `PHR-WORKFLOW-014`; Binder interaction, organization, and Sale workflow require later product design.

## Proposed Direction

Binder Inventory should be another reserved allocation over receipt-backed ownership, not a duplicate cost-basis database. Future design should define named binders, pages, pockets, ordering, pricing, partial quantities, sale selection, movement between Case/General/Binder, and physical verification.

## Current Boundaries

- No Binder route, table, mutation, or placeholder control is implemented in this increment.
- No card is automatically allocated to a Binder.
- Display Case schema must remain extensible to another allocation lane.
- General Inventory remains the ownership and acquisition-provenance authority.

## Dependencies

- `PHR-WORKFLOW-008` Receipt-Backed Inventory Intake.
- `PHR-WORKFLOW-014` Display Case Inventory allocation principles.

## Open Questions

- Are binders event-specific, persistent across events, or both?
- Is location tracked by binder/page/pocket or only binder and quantity?
- Does Binder Sale selection use page scanning, search, barcode, or all three?
- Can one card lot be split across General, Case, and multiple binders?

## Traceability

- Originating direction: Product Owner request on 2026-07-31.
- Last modified: 2026-07-31.
- Modification reason: permanent future Feature ID and product boundary recorded before implementation.
