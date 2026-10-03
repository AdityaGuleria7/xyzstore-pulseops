# PulseOps V14 — Operations UX & Reliability

- Added a fixed IST operations clock with date in the top shell.
- Upgraded the dashboard global order/sales map to city/state clusters, country totals, state breakdowns, order counts and sales value.
- Kept the fulfillment pipeline fully clickable: stage cards open the matching order queue.
- Kept the Deadline Watchlist compact by default to preserve dashboard space for KPIs and insights.
- Added present-today worker visibility with role, shift and last activity in Dashboard and Command Center.
- Added persistent worker-wise activity logs for Admin, including per-worker metrics and timestamps.
- Added individual Shift Report selection by worker and report date, with CSV export for future tracking.
- Improved Kanban cards with live deadline timers, stage progress slider visuals, and stage-appropriate actions including Create label.
- Kept post-pickup tracking in Couriers & Staging, with add/edit tracking, tracking timestamps and quick-open links.
- Corrected print API undo ordering so Print → Undo reliably restores the pre-print state.
- Added staging-bay occupancy cleanup during courier handover.
- Added an Admin worker shift-report API endpoint for server-side per-worker reporting.
- Added atomic JSON state persistence for safer local-file recovery.
- Preserved server-side role restrictions and input validation for operational mutations.
