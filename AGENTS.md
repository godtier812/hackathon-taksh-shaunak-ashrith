# MindTrace — Base44 dev environment

## Architecture
- `frontend/` — Next.js 16 (Turbopack) website: landing page + caregiver dashboard. This is what the Base44 preview serves on port 3000.
- `backend/` — Electron desktop app (records/analyzes check-ins, serves a local API on `127.0.0.1:4317`). It **cannot run in the sandbox** (needs a GUI). The frontend falls back to demo data ("Demo data" badge) when the desktop app is absent, so the website loads fine without it.

## Running
- `docker compose -f docker-compose.base44.yml up -d` starts the Next.js dev server (`next dev -H 0.0.0.0 -p 3000`) with the source bind-mounted. Edits hot-reload.
- Dependencies install on container startup via `npm install` (node_modules kept in a named volume).

## Notes
- `frontend/next.config.ts` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can reach dev assets/HMR. Do not remove.
- The frontend's API base is `http://127.0.0.1:4317/api` by default; override with `NEXT_PUBLIC_MINDTRACE_API`.
- This is Next.js 16 — read `frontend/node_modules/next/dist/docs/` before changing Next APIs/conventions.
