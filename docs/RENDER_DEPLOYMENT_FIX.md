# Render Deployment Fix

The production container starts FastAPI from `backend/app.py`. The Docker runtime therefore uses `/app/backend` as its working directory and sets `PYTHONPATH=/app/backend`.

Render deploys the repository Dockerfile directly. The service health check is `/api/health`.

Required production environment variables are documented in `render.yaml`. Never commit real `.env` files or production secrets.
