# PulseOps FastAPI backend

FastAPI + JWT authentication + optional MongoDB persistence. When MongoDB is unavailable, the server falls back to `backend/data/state.json` so the prototype remains runnable locally.

## Start

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Open API docs at `http://localhost:8000/docs`.
