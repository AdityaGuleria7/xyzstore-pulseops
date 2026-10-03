# frontend (fastapi-vite-shadcn)

React 19 + JavaScript on **Vite**, Tailwind CSS **v4** via `@tailwindcss/vite` (theme tokens live in
`src/index.css` under `@theme`; there is no `tailwind.config.js`/`postcss.config.js`), shadcn/ui conventions,
react-router-dom, axios and TanStack Query. Leaflet powers the global orders map with OpenStreetMap tiles; no map API key is required.

JSX lives in `.jsx` files (`src/index.jsx`, `src/App.js`) and the `@/*` alias maps to `src/*`. The frontend reads
`process.env.REACT_APP_BACKEND_URL` from `frontend/.env` (Vite defines the variable at build time).

## Scripts

- `yarn start` / `yarn dev` — Vite dev server on port 3000
- `yarn build` — production bundle into `build/`
- `yarn preview` — preview the production bundle

Hot reload is provided by Vite HMR. Restart after changing `.env` or `vite.config.mjs`.

## Local backend

The paired FastAPI service lives in `../backend` and runs on port `8000`. The frontend calls it for authentication,
orders, labels, scans, packing, staging, receiving, inventory transfers/audits, issues, reports and CSV operations.

## Environment

```dotenv
REACT_APP_BACKEND_URL="http://localhost:8000"
DISABLE_VISUAL_EDITS="true"
```
