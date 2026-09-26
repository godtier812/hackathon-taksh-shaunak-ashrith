# MindTrace — Base44 dev notes

## Stack
- `frontend/`: Next.js 16 (Turbopack) website — the web entry point on port 3000. Landing page + caregiver dashboard.
- `backend/`: Electron desktop app (electron-vite) that records/analyzes speech check-ins and serves a local API on `http://127.0.0.1:4317/api`. **Cannot run headless** (needs a GUI/display), so it is NOT started in the Base44 compose.

## Running here
- `docker compose -f docker-compose.base44.yml up -d` starts only the `web` (frontend) service.
- The dashboard polls the desktop app's API; when it's unreachable it falls back to **Margaret's demo record** and shows a "Demo data" badge. This is expected in the sandbox.
- No external secrets are required to boot.

## Dev loop
- Frontend edits hot-reload (Next.js dev + Turbopack). Source is bind-mounted from `./frontend`.
- `next.config.ts` has `allowedDevOrigins` driven by `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can load dev assets/HMR.

## Tests
- Frontend: `cd frontend && npm run lint && npm run build`
- Backend: `cd backend && npm test` (requires the Electron toolchain; not run in the sandbox)
