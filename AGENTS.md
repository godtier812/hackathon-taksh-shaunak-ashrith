# MindTrace — Base44 dev environment

## What this is
A voice check-in app: a Next.js website (`frontend/`) plus an Electron desktop app (`backend/`). The Base44 preview runs **only the website**; the desktop app is not a web service and is not started here. When the desktop app isn't running the dashboard falls back to "Margaret's" demo record, so the site boots with no external dependencies.

## Running the site
- `docker compose -f docker-compose.base44.yml up -d` starts the Next.js 16 dev server (Turbopack) on host port 3000, bind-mounted from `frontend/`.
- `npm install` runs inside the container on first boot; `node_modules` lives in a named volume so host installs don't interfere.
- No secrets are required to boot. `NEXT_PUBLIC_MINDTRACE_API` (optional) would point the dashboard at the desktop app's local API; unset → demo data.

## Next.js specifics
- Next.js 16 with breaking changes — see `frontend/node_modules/next/dist/docs/` after install before touching framework APIs.
- `frontend/next.config.ts` sets `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can load dev assets/HMR. Do not remove it.
- File-watch polling (`CHOKIDAR_USEPOLLING`, `WATCHPACK_POLLING`) is enabled for bind-mount reliability.

## Verifying
- `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/` → 200, title "MindTrace: Communication, over time".
- `/dashboard` compiles on first request (demo data badge shows "Demo data").
