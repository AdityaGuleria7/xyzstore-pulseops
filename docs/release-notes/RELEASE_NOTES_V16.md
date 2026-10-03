# PulseOps V16 — Presentation & Navigation Polish

## UI changes
- Added consistent 14px breathing room below the shared page-title header across operational tabs.
- Kept title/help controls visually aligned with the Couriers & Staging reference treatment.
- Improved Stock Ledger & Warehouse Transfers header search with a dedicated responsive search container, clear affordance, and stable icon placement.

## Kanban changes
- Added a sticky vertical pipeline navigator with all six fulfillment stages.
- Each stage shows its live order count and is directly clickable.
- Clicking a stage smoothly scrolls the Kanban board to that pipeline column and clears a restrictive stage filter so the full flow remains visible.
- Preserved per-card countdowns, stage progress sliders, create-label/pick/stage actions, priority treatment, and tracking links.
- Added responsive horizontal stage navigation on small screens.

## Safety / usability
- No operational API behavior was changed by this presentation-only release.
- Existing state mutation, undo, camera scanning, inventory verification, logs, reports, courier tracking, and deployment configuration are retained.
