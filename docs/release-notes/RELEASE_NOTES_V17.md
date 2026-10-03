# PulseOps V17 — Product Final

## Product polish
- Problem Log is now grouped and filtered by operational category with persistent category colour signals and severity/status badges.
- Dashboard uses a real Leaflet/OpenStreetMap world map with order markers aggregated by city and country/state drill-down.
- Fulfillment Pipeline uses a shared six-stage colour system across Dashboard and Orders/Kanban, including coloured stage headers, status pills, and per-card progress controls.
- Added Admin-only Store Settings for editable store name and tagline; settings persist through the backend state store and are reused for printed labels.
- Retained the consistent title/header spacing and contextual help pattern from V16.

## Reliability
- Added settings state normalization for older state files.
- Fixed the duplicate INB-504 demo seed entry in the backend seed source; the bundled state file already has six inbound records.
- Backend settings update is undoable and logged in the persistent activity stream.
- Existing undo, camera scanning, inventory verification photo evidence, tracking links, worker logs, shift reports, staging handover, receiving, CSV sync and print flows remain intact.
