# MindTrace

A voice check-in app that screens for early speech markers of Alzheimer's and dementia.

- `backend/`: Electron desktop app. It records, analyzes and stores check-ins, exports the doctor report, and serves a local API on http://127.0.0.1:4317/api.
- `frontend/`: Next.js website (landing page and caregiver dashboard). The dashboard shows live check-ins from the desktop app and can record a new one for the app to analyze. When the app isn't running, it shows Margaret's demo record.
- `docs/website-integration.md`: the API contract between the two.
- `docs/demo-script.md`: the pitch.

## Run everything
Start the desktop app first, then the website:

    cd backend
    npm install
    npm run dev

    cd frontend
    npm install
    npm run dev

Open http://localhost:3000/dashboard. The badge in the top bar says **Live** when the website is reading from the desktop app, and **Demo data** when it isn't.

## Test
    cd backend
    npm test

    cd frontend
    npm run lint
    npm run build
