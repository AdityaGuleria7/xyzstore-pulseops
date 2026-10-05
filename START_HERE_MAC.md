<!-- Copyright © 2026 Aditya Guleria. All rights reserved. -->

# PulseOps — Mac local setup

## Prerequisites
- macOS with Homebrew recommended
- Node.js installed
- Python 3.12

Install Python 3.12 if needed:

```bash
brew install python@3.12
```

## Start backend
From the project root:

```bash
./run_backend.sh
```

Backend: http://localhost:8000
API docs: http://localhost:8000/docs

## Start frontend
Open a second Terminal window:

```bash
./run_frontend.sh
```

Frontend: http://localhost:3000

The frontend script uses `npx yarn@1.22.22`, so `corepack enable` and a global Yarn install are not required.

## Login
Admin: admin@example.com / admin123
Packer: packer@example.com / packer123

## Vite 8 / JSX note
The frontend source files that contain JSX use the `.jsx` extension. Vite 8/Rolldown parses `.jsx` natively. This avoids the Vite 8 dependency-scanner failure that occurs when JSX is kept in `.js` entry files.

## V9 UX and operational enhancements

- All major operational tabs use a shared PulseOps page/header/card/button typography system, following the Courier & Staging reference UI.
- State-changing API calls return a short-lived undo token. Successful actions show an Undo control in the toast; the server restores the previous state for that user's most recent action.
- Worker Mode and staging support live camera scanning on browsers that expose BarcodeDetector, with a manual barcode/box-ID fallback.
- Stock verification accepts an image upload (and camera capture on supported mobile browsers) and stores photo evidence with the verification record.
