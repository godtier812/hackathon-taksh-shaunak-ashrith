# Base44 Dev Environment

## Architecture
- `frontend/` — Next.js 16 website (landing page + caregiver dashboard). This is the web entry point served on port 3000.
- `backend/` — Electron desktop app that serves a local API on `http://127.0.0.1:4317/api`. Cannot run headless in a container. The frontend gracefully falls back to Margaret's demo data when the backend is unreachable (shows a "Demo data" badge instead of "Live").

## Running
- `docker compose -f docker-compose.base44.yml up -d` — starts the Next.js dev server (Turbopack, live reload) on port 3000.
- The compose service bind-mounts the repo, runs `npm install` then `next dev -p 3000 -H 0.0.0.0`.
- No secrets required — the app boots entirely on demo data.

## Next.js 16 notes
- This is Next.js 16.3.6 with Turbopack. APIs may differ from older Next.js versions — check `frontend/node_modules/next/dist/docs/` when writing code.
- `allowedDevOrigins` in `frontend/next.config.ts` is set from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can access dev assets/HMR. Do not remove it.
- `turbopack.root` is pinned to the frontend dir because an unrelated `package-lock.json` exists at the repo root.

## Verification
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard` → 200
