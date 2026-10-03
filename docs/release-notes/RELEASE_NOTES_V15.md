# PulseOps V15 — Operations Command Center polish

This release consolidates the requested operational-control improvements into the deployable build.

## Operations visibility
- Live IST clock in the global shell.
- Interactive six-stage fulfillment pipeline that opens the corresponding order queue.
- Global order/sales map with country, state, city, order count and sales value detail.
- Compact Deadline Watchlist so KPI space remains the primary dashboard area.
- Team-today roster with worker presence, role and shift designation.

## Orders, Kanban and print
- Live countdown timers across table and Kanban views.
- Consistent six-stage Kanban progress slider on every order card.
- Stage-appropriate actions including Create Label and Worker Mode routing.
- Admin label-print API with browser print output and undo support.
- Order timestamps and tracking metadata.

## Worker accountability
- Admin Command Center shows each worker's saved activity, role, presence, shift and output metrics.
- Worker activity is persisted in the application state for future tracking.
- Individual worker/date Shift Reports with CSV export.
- Worker Mode keeps the four work-completed metrics at the top.

## Courier follow-up
- Staging-to-pickup workflow includes pickup timestamps.
- Post-pickup tracking URL can be added or edited for quick follow-up.
- Handover removes boxes from active staging-bay occupancy and records the event.

## Inventory and receiving
- Stock Ledger search icon and clear interaction are aligned with the shared UI.
- Inventory last-updated timestamps are visible.
- Inventory verification supports physical count, notes and photo evidence.
- Receiving updates stock and records the receiving event.

## Reliability
- Undo tokens are returned for state-changing operational actions.
- Local JSON persistence uses atomic replace semantics to reduce partial-write risk.
- Backend smoke tests cover login, 250-order bootstrap, worker logs, shift reports, print/undo and tracking.
