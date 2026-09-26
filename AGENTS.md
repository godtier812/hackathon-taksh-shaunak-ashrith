# MindTrace — Base44 dev environment

## What this is
A voice check-in app: an **Electron desktop app** (`backend/`) that records/analyzes speech and serves a local API on `127.0.0.1:4317`, plus a **Next.js website** (`frontend/`) with a landing page and caregiver dashboard.

## What runs in the Base44 sandbox
Only the **Next.js frontend** runs in Docker compose (`docker-compose.base44.yml`), on host port 3000 with live reload (`next dev`).

The Electron backend is a desktop app that needs a display and audio hardware, so it cannot run headless in the sandbox. This is expected: the dashboard is designed to fall back to **Margaret Reynolds' demo record** when the desktop app's API is unreachable, and the top-bar badge shows **Demo data** instead of **Live**. No credentials are needed.

## Bringing it up
```
docker compose -f docker-compose.base44.yml up -d --build
```
The `web` service runs `npm install` then `next dev -H 0.0.0.0 -p 3000`. First boot takes ~60s for the npm install + initial Next compile.

## Notes
- `frontend/next.config.ts` adds `allowedDevOrigins` from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can load dev assets/HMR (Next.js gates these by origin).
- `frontend/AGENTS.md` is auto-managed by `next dev` and warns that this Next.js version may differ from what you know — read `node_modules/next/dist/docs/` before framework changes.
