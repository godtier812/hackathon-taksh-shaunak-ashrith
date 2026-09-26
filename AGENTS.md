# MindTrace — Base44 dev environment

## Stack
- `frontend/`: Next.js 16 (Turbopack) website — landing page + caregiver dashboard. This is what runs in the preview on port 3000.
- `backend/`: Electron desktop app (electron-vite). It records/analyzes speech check-ins and serves a local API on `127.0.0.1:4317`. It **cannot run headless** (needs a display), so it is NOT started in the sandbox.

## How the app runs here
- `docker-compose.base44.yml` runs a single `web` service: `node:22` with the repo bind-mounted at `/app`, running `npm install && next dev -H 0.0.0.0 -p 3000` from `frontend/`.
- Dependencies install at container startup (no image rebuild needed for code edits; live reload is on).
- The frontend falls back to **Margaret's demo data** when the desktop app's API is unreachable — so the dashboard works standalone. The badge in the top bar reads "Demo data" in this mode.
- `NEXT_PUBLIC_MINDTRACE_API` can point the frontend at a live API if one becomes available.

## Next.js dev origin
- `frontend/next.config.ts` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can fetch dev assets/HMR. Do not remove it.

## Verify
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- `/dashboard` renders the caregiver view with demo data.
