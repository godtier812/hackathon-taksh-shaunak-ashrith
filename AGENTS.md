<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Base44 Dev Environment

## Architecture
- Next.js 16 website (landing page + caregiver dashboard) served on port 3000.
- The dashboard shows Margaret's demo data. The original Electron desktop app (backend API on port 4317) has been removed; the frontend falls back to demo data when no backend is reachable.

## Running
- `docker compose -f docker-compose.base44.yml up -d` — starts the Next.js dev server (Turbopack, live reload) on port 3000.
- The compose service bind-mounts the repo root, runs `npm install` then `next dev -p 3000 -H 0.0.0.0`.
- No secrets required — the app boots entirely on demo data.

## Next.js 16 notes
- `allowedDevOrigins` in `next.config.ts` is set from `BASE44_PUBLIC_HOST_SUFFIX` so the preview origin can access dev assets/HMR. Do not remove it.

## Verification
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → 200
- `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard` → 200
