# XYZStore · PulseOps

**A fulfilment control tower for a small e-commerce warehouse (200–300 orders a day).**
It replaces spreadsheets and shared folders with one live workspace that shows every order, flags delays early, stops wrong-item shipments at the scanner, and tells the team what to do next.

![stack](https://img.shields.io/badge/React_19-Vite-blue) ![api](https://img.shields.io/badge/FastAPI-Python_3.12-green) ![tests](https://img.shields.io/badge/API_tests-16_passing-brightgreen) ![license](https://img.shields.io/badge/license-MIT-lightgrey)

## The problem it solves

| Pain in the brief | How PulseOps answers it |
|---|---|
| Order status is hard to see | Live dashboard with a six-stage pipeline and per-stage counts |
| Delays go unnoticed | Colour-coded countdown badges everywhere an order appears |
| Priority orders get lost | Priority lane, priority-first pick queue and wave planning |
| Stock can't be found | Stock ledger (shelf vs Warehouse 2), transfers, cycle counts with photo evidence, receiving |
| Wrong variant shipped | Quantity-level barcode scanning (keyboard or camera); wrong scans are blocked and logged |
| Boxes misplaced / pickups missed | Staging bays, box scan-in, courier cutoffs, signed handover |
| Problems handled informally | Problem log with category, severity, owner, status and one-click flagging |

## What makes it different

- **Command Center**: Cutoff Radar (minutes to cutoff vs work left, with the team size you set), a smart pick wave (priority first, then earliest cutoff, merged into one aisle-ordered route), a stock shortfall forecast, and a ranked *next best actions* list.
- **Shift briefing**: a plain-English start-of-shift summary generated from live data, with optional read-aloud. It is rule-based, not an external AI.
- **Command palette (Ctrl/⌘ + K)**: jump to any screen, order, SKU or incident.
- **Undo for every change**: each state-changing call returns an undo token.
- **Role-based access**: Admin (office) and Packer (warehouse) see different screens; the server enforces it.

## Quick start

Requires Python 3.12 and Node 20+.

```bash
# 1. build the frontend once
cd frontend && npm ci && npm run build && cd ..

# 2. start API + built UI on http://localhost:8000
./run_backend.sh
```

For live-reload development run `./run_frontend.sh` in a second terminal and open http://localhost:3000. Docker: `docker compose up --build`.

| Role | Email | Password |
|---|---|---|
| Admin | admin@example.com | admin123 |
| Packer | packer@example.com | packer123 |

These are **local-demo credentials only**. For any public deployment, configure your own `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PACKER_EMAIL`, `PACKER_PASSWORD`, `JWT_SECRET`, and `MONGO_URL` in the hosting provider. Production mode refuses to start with the demo security values.

## Architecture

```
React 19 + Vite + Tailwind 4  ──HTTP/JSON──▶  FastAPI (JWT, Pydantic validation)
   TanStack Query, Axios                           │
                                                   ├─ MongoDB when reachable
                                                   └─ backend/data/state.json otherwise (atomic writes)
```

- All mutations are serialised server-side so two packers cannot interleave a read-modify-write.
- Prices come from the courier catalogue on the server, never from the client.
- Order state machine is enforced: you cannot re-label, re-seal or pick a finished order.

## Testing

```bash
cd backend && pip install -r requirements-dev.txt && python -m pytest -n 0 tests
```

16 API tests cover auth and roles, the full pick → seal → stage → handover flow, state-machine guards, validation, trust boundaries and the insights endpoints. CI (`.github/workflows/ci.yml`) runs the backend tests and a clean frontend build on every push.

## API

Interactive docs at `/docs`. Notable endpoints: `/api/bootstrap`, `/api/orders/{id}/label|scan|seal`, `/api/inventory/transfer|audit`, `/api/staging/*`, `/api/insights`, `/api/briefing`, `/api/export/{dataset}`.

## Honest limits

- Demo data is simulated; there are no live courier or marketplace integrations.
- The cutoff radar is a simple capacity model (orders × minutes per order ÷ packers): a decision aid, not a scheduler.
- Authentication is intentionally lightweight for a portfolio prototype (two configured users). For a production business deployment, replace it with a managed identity provider, MFA, and a proper user store.
- Camera scanning needs `localhost` or HTTPS and a browser with the Barcode Detection API; manual entry is always available.

More: [CASE_STUDY.md](CASE_STUDY.md) · [DEPLOYMENT.md](DEPLOYMENT.md) · [feature history](docs/FEATURES_HISTORY.md) · [release notes](docs/release-notes/)

MIT licensed.
