#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/backend"

PYTHON_BIN=""
if command -v python3.12 >/dev/null 2>&1; then
  PYTHON_BIN="$(command -v python3.12)"
elif command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; raise SystemExit(0 if sys.version_info[:2] == (3,12) else 1)'; then
  PYTHON_BIN="$(command -v python3)"
else
  echo "Python 3.12 is required for the PulseOps backend."
  echo "Install it with: brew install python@3.12"
  exit 1
fi

if [ ! -d .venv ]; then
  "$PYTHON_BIN" -m venv .venv
fi
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo "Starting PulseOps backend on http://localhost:8000 ..."
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
