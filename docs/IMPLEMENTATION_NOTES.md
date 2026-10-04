# PulseOps Final Implementation Notes

This version is based on the supplied `PulseOps-User-Guide.pdf`.

## Source-to-feature mapping

- Dashboard: KPI cards, six-stage pipeline, deadline watchlist, priority lane and operational widgets.
- Orders: 500-order dataset, filters, table/Kanban, batch selection, label printing queue and Flag Issue.
- Labels: courier comparison by cost, ETA, cutoff and pickup time.
- Worker: priority-first queue, shelf location, variant chip, barcode-per-unit scanning, mismatch rejection and Seal box.
- Stock: Main/WH2 transfer workflow and existing inventory audit controls.
- Staging: six bays, courier grouping, scan-in and handover sign-off.
- Receiving: inbound deliveries, expected/received quantities and inventory update.
- Problem Log: preset Missing Stock, Damaged Item, Address Error and Courier Missed reasons.
- Shift Report: pick/mis-scan/seal/order metrics and activity timeline.
- CSV: dataset exports and inventory CSV import/template.

## UI direction

The visual language follows the supplied screenshots: compact light workspace, slate/navy surfaces, rounded white cards, small uppercase metadata labels, dense operational tables, deadline badges and large dark Worker Mode controls.

## Demo

Admin: `admin@example.com` / `admin123`

Packer: `packer@example.com` / `packer123`

## Validation

All TS/TSX source files passed a TypeScript parser syntax/bind diagnostic pass. A full dependency install/build was not completed in the isolated build environment because package installation timed out. Run `npm install`, then `npm run typecheck` and `npm run build` locally.


## V9 UX / API additions

- Shared `ops-*` visual tokens align Orders, Receiving, Stock, Worker Mode, Problem Log, Shift Report and CSV Sync with the Courier & Staging reference screen.
- All state-changing API responses carry `undo: { id, label, expiresInSeconds }` (except login and the undo endpoint itself).
- The global toast renders an `Undo` action and calls `POST /api/undo/{undo_id}`.
- Barcode scanning uses the browser camera plus `BarcodeDetector` when exposed by the browser; manual entry remains available.
- Inventory verification accepts multipart form data with an optional image file and stores evidence under `/media/inventory_verification/`.
