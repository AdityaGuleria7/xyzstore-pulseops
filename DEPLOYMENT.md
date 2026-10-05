<!-- Copyright © 2026 Aditya Guleria. All rights reserved. -->

# PulseOps Deployment Guide

## Recommended portfolio deployment: GitHub + Render

This repository is designed to deploy as one Render Docker Web Service. Render builds the React frontend and runs FastAPI, giving you one public URL for the UI and API. Render can deploy directly from a connected GitHub repository and automatically rebuild when you push to the linked branch.

### Before publishing

1. Do not commit `.env` files, passwords, JWT secrets, or database connection strings.
2. Create a MongoDB Atlas database (or another managed MongoDB) and keep its connection string private.
3. Use unique production credentials for Admin and Packer.
4. Keep `PULSEOPS_ENV=production` in Render. Production refuses to start without a strong JWT secret, non-demo account emails and passwords, and a reachable MongoDB URL.
5. Inventory verification photos are stored on the server filesystem. On Render's default ephemeral filesystem they are not durable across restarts; use a Render persistent disk (paid web service) mounted to `/var/data` and set `PULSEOPS_DATA_DIR=/var/data`, or move photo storage to object storage for a production-scale system.

### GitHub

Create a repository, for example `xyzstore-pulseops`, then from the project root:

```bash
git init
git add .
git commit -m "Initial portfolio release"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/xyzstore-pulseops.git
git push -u origin main
```

The repository includes a GitHub Actions workflow that runs the backend tests and a clean frontend build on pushes and pull requests.

### Render

1. Open Render and choose **New → Web Service**.
2. Connect GitHub and select `xyzstore-pulseops`. Render supports Git-provider based deployments and redeploys from the linked branch.
3. Choose **Docker**. The root `Dockerfile` is already configured.
4. Add these secret environment variables in Render: `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `PACKER_EMAIL`, `PACKER_PASSWORD`, `MONGO_URL`.
5. `JWT_SECRET` can use the Blueprint's generated value. `PULSEOPS_ENV` is already set to `production`.
6. Keep the health check at `/api/health`.
7. Deploy and open the generated `onrender.com` URL.

Render Web Services expose an HTTPS `onrender.com` URL and can auto-deploy from a connected Git provider. HTTP requests are redirected to HTTPS at the platform edge.

## Vercel frontend + Render backend

Use this when you want the UI hosted separately.

### Vercel

1. Import the same GitHub repository into Vercel.
2. Set **Root Directory** to `frontend`.
3. Build command: `npm run build`.
4. Output directory: `build`.
5. Set `REACT_APP_BACKEND_URL` to the public Render API URL.

The included `frontend/vercel.json` handles client-side routing.

### Render backend

Deploy the backend as a separate Web Service. Set:

```text
PULSEOPS_ENV=production
MONGO_URL=<managed MongoDB connection string>
CORS_ORIGINS=https://YOUR-VERCEL-DOMAIN
JWT_SECRET=<strong secret>
ADMIN_EMAIL=<your admin email>
ADMIN_PASSWORD=<strong password>
PACKER_EMAIL=<your packer email>
PACKER_PASSWORD=<strong password>
```

Build/start settings:

```text
Runtime: Python 3.12
Build: pip install -r backend/requirements.txt
Start: python -m uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

For the portfolio, the single-service Render deployment is simpler because there is no cross-origin configuration and visitors get one URL.

## Local production-like run

Without Docker:

```bash
./run_backend.sh

# second terminal
./run_frontend.sh
```

With Docker:

```bash
docker compose up --build
```

## Operational persistence

PulseOps prefers MongoDB when `MONGO_URL` is configured. In development it can fall back to an atomic JSON state file. That fallback is disabled in production. Render's default filesystem is ephemeral, so database state should live in managed MongoDB and uploaded photos should use a persistent disk or object storage.
