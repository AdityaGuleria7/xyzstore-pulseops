# Release Notes — V31.3

## Production blank-page fix

Fixed the single-service Render deployment so the FastAPI application serves the compiled Vite bundle under `/assets/*`.

### Symptom

The production root route returned `frontend/build/index.html`, but the browser could not load the JavaScript bundle because `/assets/*` was not mounted and the SPA catch-all returned 404. The result was a blank white page even though Render reported the service as Live.

### Fix

- Mounted `frontend/build/assets` at `/assets` when the build exists.
- Removed `assets/` from the catch-all 404 guard so the mounted static route can serve Vite assets.
- Kept API and media routes protected from the SPA fallback.

## Deployment

After pushing this release to the connected `main` branch, Render should rebuild automatically. Confirm the browser loads the application and that requests to `/assets/*.js` return HTTP 200.
