#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/frontend"
echo "Installing frontend dependencies with Yarn 1.22.22..."
npx --yes yarn@1.22.22 install
# Remove stale Vite/Rolldown pre-bundling output from older builds.
rm -rf node_modules/.vite
# Force a clean dependency scan on startup.
echo "Starting PulseOps frontend on http://localhost:3000 ..."
npx --yes yarn@1.22.22 dev --force
