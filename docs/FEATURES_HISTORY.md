# XYZStore · PulseOps — Full-Stack Fulfillment Control Tower

This final version combines the supplied PulseOps UI direction and feature guide with the near-version source ZIPs.
It keeps the compact, data-dense light workspace, dark Worker Mode surface, rounded operational cards, stage pills,
countdown badges, role-specific navigation and the 250-order fulfillment workflow shown in the supplied screenshots.

## Stack

- Frontend: React 19 + JavaScript/JSX + Vite 8 + Tailwind CSS 4 + Lucide
- Data/client: Axios + TanStack Query
- Backend: FastAPI + JWT + PyMongo when MongoDB is available
- Persistence: MongoDB when reachable; otherwise the API persists to `backend/data/state.json`
- CSV: server exports + client inventory import flow

## Included features

Dashboard, Orders & Priority, Worker Mode, Stock & Transfers, Couriers & Staging, Receiving, Problem Log, Shift Report,
CSV Sync, courier comparison at label creation, quantity-level barcode scanning, warehouse transfer, receiving/put-away,
staging bay assignment/scan-in, pickup handover, issue tracking, role permissions and a seeded 500-order dataset.

### V9 operational UX updates

- Shared PulseOps typography, page headers, cards, fields, buttons and status treatments across operational tabs, using the Courier & Staging surface as the visual reference.
- Every state-changing API returns an undo token; successful actions expose an Undo control in the global notification. Undo is server-side and restores the user's most recent mutation snapshot.
- Worker Mode and Courier & Staging include live camera scanning with a manual barcode/box-ID fallback. Camera access works on localhost; automatic decoding uses the browser's Barcode Detection API when available.
- Stock verification now supports physical-count evidence with an optional shelf photo upload/capture, stored with the verification record.

The supplied screenshots are reflected in the initial demo data: 165 open orders, 36 priority orders, 85 critical deadline
risks, 7 low-stock SKUs, a 70/30/24/15/26/85 six-stage pipeline, 25 staged boxes across six bays, four courier groups,
six inbound deliveries, three initial incidents and a shift report with a seeded mis-scan activity.


### V10: Command Center (decision support)

A new **Command Center** tab turns the data PulseOps already has into "what should we do next":

- **Next best actions**: one ranked queue (critical first) that merges cutoff risk, priority orders at risk and stock shortfalls. Each action jumps to the screen that fixes it.
- **Cutoff Radar**: for every courier, minutes left to cutoff versus the work still to pack, using your team size and minutes-per-order sliders. Flags *At risk / Will miss / Missed* and says how many packers are needed.
- **Smart pick wave**: merges the next orders (priority first, then earliest courier cutoff) into one aisle-ordered route with shared SKU stops, and shows the walking stops saved.
- **Stock shortfall forecast**: open demand versus shelf stock, warehouse-2 stock and inbound deliveries, with a recommended action (transfer, reorder).

API: `GET /api/insights?team=3&minutes_per_order=3&wave_size=12` (documented at `/docs`). Covered by `backend/tests/test_api.py`.

### Install notes

`npm install` and `yarn install` both work. Unused packages were removed and an invalid dependency version (`@radix-ui/react-toast@2.0.3`) that broke fresh installs was fixed.

## Demo credentials

Admin: `admin@example.com` / `admin123`

Packer: `packer@example.com` / `packer123`

## Run locally

### Docker (full stack)

```bash
docker compose up --build
```

Open `http://localhost:8000`.


### Terminal 1 — backend

```bash
./run_backend.sh
```

API docs: `http://localhost:8000/docs`

### Terminal 2 — frontend

```bash
./run_frontend.sh
```

Open: `http://localhost:3000`

The frontend script uses Yarn 1.22.22 via `npx`, so `corepack enable` and a global Yarn install are not required.

Vite 8/Rolldown requires JSX-bearing source files to use `.jsx` for reliable dependency scanning; the app's JSX files have been renamed accordingly.

## End-to-end demo

1. Sign in as Admin.
2. Dashboard → inspect KPIs, pipeline and deadline watchlist.
3. Orders → open a Received order → Create Label → compare couriers → create a label.
4. Switch to Packer → Worker Mode → scan each unit → Seal box.
5. Switch back to Admin → Couriers & Staging → review bay/courier counts → run Handover Sign-off.
6. Stock & Transfers → move a low-stock SKU from Warehouse 2 to Main or run a cycle audit.
7. Receiving → receive a partial or complete inbound delivery and watch inventory increase.
8. Orders → Flag Issue → Problem Log → change issue status.
9. Shift Report → inspect picks, mis-scans, seals and handled orders.
10. CSV Sync → export datasets or import the inventory CSV template.

## Backend authorization

JWT tokens are issued at login. Admin-only writes are enforced by the FastAPI dependency layer for labels, batch staging/print,
inventory transfers/audits/import, issue management, courier handover and demo reset. Packers can work the pick/pack flow and
receiving, but they cannot mutate stock counts or perform admin-only operations.

## Storage behaviour

Set MongoDB through `backend/.env` using the values shown in the supplied project scaffold. If MongoDB is running, PulseOps
stores the current state in a single application state document. If MongoDB is not running, the server transparently uses the
JSON file fallback, so the full project is still usable locally.

## Deployment

A production-ready Docker path is included. The root `Dockerfile` builds the frontend and serves it from FastAPI, so the app can be deployed as a single web service. `render.yaml` provides a Render Blueprint and `/api/health` is the health-check endpoint. `docker-compose.yml` provides a local full-stack deployment with MongoDB persistence. A Vercel SPA rewrite is also included under `frontend/vercel.json` for teams that prefer separate frontend/backend hosting.

See `DEPLOYMENT.md` for deployment steps and production environment variables.

## V14 operational updates

The latest build includes the shared operations UI, IST clock, interactive six-stage pipeline, global order/sales map with state/country drill-down, worker presence and persistent worker logs, date-filtered individual shift reports, live Kanban timers with stage sliders and Create Label actions, post-pickup tracking links, print API, and safer atomic local persistence.

## V15 operational updates
The Command Center and dashboard now emphasize practical live operations: an IST clock, interactive fulfillment pipeline, global order/sales map, workers present today with role/shift, compact deadline watchlist, and persisted worker-wise logs. Orders add live Kanban countdown/progress controls, print API output and timestamps. Staging supports post-pickup tracking links, while inventory includes verification evidence and aligned search/timestamp controls. Individual worker Shift Reports can be filtered by date and exported to CSV. See `RELEASE_NOTES_V15.md` for the complete change list.


## V18 receiving readability
Inbound delivery cards now use a dense operational layout with selectable product/variant chips, explicit open quantities, and line-level receiving. Use the item chips to select the SKU to receive, enter the quantity, then click Receive.

## V30 update
The V30 polish removes the global clock card from the application header, places last-sync time/date on the Dashboard sync card, simplifies the user avatar to a single initial, and standardizes Orders action-button spacing.
