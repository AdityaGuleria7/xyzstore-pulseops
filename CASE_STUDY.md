<!-- Copyright © 2026 Aditya Guleria. All rights reserved. -->

# Case study: PulseOps for XYZ Store

## The problem
XYZ ships 200-300 orders a day from spreadsheets and shared folders. The brief lists seven pains: status is hard to see, delays go unnoticed, priority orders get lost, stock cannot be found, wrong variants ship, boxes are misplaced or pickups missed, and problems are handled informally.

## What I built
A full-stack control tower (React + FastAPI, MongoDB or JSON-file persistence, JWT roles) with a dashboard, order workflow, scan-verified picking, warehouse transfers, receiving, staging bays and courier handover, a problem log and CSV sync. Every state-changing action can be undone.

## What makes it different: the Command Center
Most small-business tools show what happened. The Command Center says what to do next:

1. **Cutoff Radar** predicts, per courier, whether the team can finish packing before the cutoff.
2. **Smart pick wave** batches orders by carrier cutoff and priority, then orders the route by aisle.
3. **Stock shortfall forecast** compares open demand with shelf and warehouse-2 stock.
4. **Next best actions** merges all three into one ranked list.

## Research behind the design
- Batch and wave picking, aligned to carrier pickup times, reduce repeated travel; wave schedules should follow carrier departure windows (Argo Software, Descartes Finale and Synkrato guides).
- Priority-based waves order work by SLA and shipping tier (Synkrato).
- Useful metrics: on-time wave completion, carrier compliance, exception frequency (Argo Software).
- Batch picking is often cited as cutting travel by roughly 30-50% versus discrete picking (Productiv). PulseOps does not claim this figure for XYZ; it reports the stops saved in each generated wave.

## Reliability work
A review of the running API found and fixed real defects: the client could set the label price (including negative values), finished orders could be re-labelled or re-sealed (creating duplicate boxes), handovers accepted a blank signature, and incident reporters could be spoofed. Mutations are now serialised, inputs validated, and each fix has a regression test.

## Small touches that matter
A Ctrl/Cmd+K palette for instant navigation, and a plain-English shift briefing (with read-aloud) so a supervisor can start the day in ten seconds.

## Honest limits
- Demo data is simulated; no live courier or marketplace APIs.
- The radar uses a simple model (orders x minutes per order / packers). It is a decision aid, not a scheduler.
- Authentication is demo-grade; use real secrets and a managed database before production.

## Verification
Backend API tests (10) pass; the frontend builds with a clean `npm install`; the full stack was started and exercised through login and the insights endpoint.
