# PHR-UX-026 — Multi-Card Region Correction Design Gate

## Decision

Approved for the region-contract and correction foundation. Automatic binder-page segmentation remains disabled until a labeled benchmark exists.

## Interaction Contract

- Show the immutable frame with ordered region overlays and a matching ordered list.
- Operators may add, move, resize, rotate, reject, or restore a region.
- Save creates a new revision; it never rewrites the source frame or prior regions.
- Invalid or out-of-bounds geometry is explained inline and cannot become active.
- Each region proceeds through the same recognition and offer workflow as a full-frame card.

## Accessibility And Responsive Behavior

- Region list controls are fully keyboard operable and identify region order in accessible names.
- A non-canvas numeric editor provides equivalent normalized coordinate and rotation edits.
- On narrow screens the frame and list stack; selecting a list item scrolls its controls into view.

## Product Review Evidence

- Full-frame fallback, two-region fixture, correction revision, rejection/restoration, invalid geometry, keyboard path, and narrow viewport.
