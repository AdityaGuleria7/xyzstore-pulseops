# PulseOps V17.1 JSX/Vite Fix

Fixes a development-time JSX parse failure reported in `src/components/Shell.jsx` under Vite 8/Rolldown.

Changes:
- Rebuilt `Shell.jsx` with explicit, conventional JSX structure and formatting.
- Kept all existing Shell functionality: role tabs, clock, store settings, dark mode, sign-out, server status, and navigation.
- Frontend entry remains `src/index.jsx`; JSX is no longer kept in `.js` entry files.
- Frontend startup clears Vite's stale dependency cache and starts with a forced dependency re-scan.
- No application feature logic was removed.

Local recovery for an already-extracted older copy:
1. Stop Vite with Ctrl+C.
2. Delete the extracted old project and use this V17.1 ZIP.
3. Run `./run_frontend.sh` from the project root.
