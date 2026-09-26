# EchoMind website integration guide

The EchoMind desktop app is the **processing engine**. While it runs, it serves a local HTTP API. The website reads check-ins from it and can send new recordings for the app to analyze. The website never processes audio itself. Every session comes back **display-ready**: score text, factor explanations, baseline comparison and waveform are all included.

```
Website (browser) ──fetch──▶ http://127.0.0.1:4317/api ──▶ EchoMind app
                                                         ├─ main process: API + sessions.json
                                                         └─ renderer: decode audio, measure, score
```

## Run it
1. Start the app: `cd app` then `npm run dev`. The terminal prints `EchoMind API listening on http://127.0.0.1:4317/api`.
2. Serve the website from an allowed origin: `http://localhost:3000`, `:5173` or `:5174` (or the `127.0.0.1` equivalents). To allow another origin, start the app like this in PowerShell: `$env:ECHOMIND_ALLOWED_ORIGINS='http://localhost:8080'; npm run dev`. Use `*` to allow any origin (demo only).
3. Sanity check: open http://127.0.0.1:4317/api/health.

The API only listens on `127.0.0.1`, so the website must run on the same computer as the app. A cloud version would swap this for a shared database with the same JSON shapes.

## Typed client
Copy `app/src/shared/types.ts`, `api.ts` and `apiClient.ts` into the website, or import them by relative path. They have no dependencies.

```ts
import { createEchoMindClient } from './echomind/apiClient'
const echomind = createEchoMindClient() // defaults to http://127.0.0.1:4317/api

const sessions = await echomind.listSessions() // oldest first
const latest = await echomind.latestSession()
```

## Endpoints
| Method | Path | Returns |
|---|---|---|
| GET | `/api/health` | `{ ok: true, app: "EchoMind", version: 1 }` |
| GET | `/api/sessions` | `Session[]`, oldest first |
| GET | `/api/sessions/latest` | `Session` (404 if none) |
| GET | `/api/sessions/:id` | `Session` (404 if unknown) |
| POST | `/api/analyze?task=reading\|fluency\|story&source=live` | Body: raw audio bytes (webm/ogg/mp4/wav), up to 20 MB. Returns **201** with the saved `Session`. |

Errors always look like `{ "error": "message" }`: 400 bad parameters, 404 not found, 413 too large, 422 analysis failed (for example "We couldn't hear enough speech…"; show it to the user), 500 unexpected. If `fetch` itself throws a `TypeError`, the app isn't running, so show "Open the EchoMind app on this computer."

## The Session object (trimmed example)
```json
{
  "id": "5b1f…",
  "createdAt": "2026-09-26T15:04:05.000Z",
  "task": "reading",
  "taskTitle": "Read aloud",
  "source": "live",
  "score": {
    "score": 62, "band": "yellow",
    "label": "Worth watching",
    "message": "A few speech markers changed. Keep checking in.",
    "factors": [
      { "label": "Silence", "points": 9, "detail": "Pauses filled 36% of your speaking time",
        "explanation": "How much of your speaking time was spent in pauses." }
    ]
  },
  "baseline": {
    "status": "ready",
    "deltas": [
      { "key": "speechRate", "label": "Speech rate", "current": 3.1, "baseline": 4.2,
        "pctChange": -26.2, "worse": true, "text": "Speech rate is 26% lower than your baseline" }
    ]
  },
  "acoustics": {
    "durationSec": 31.2, "speakingTimeSec": 20.4, "pauseCount": 9, "meanPauseSec": 1.1,
    "longestPauseSec": 2.3, "silenceRatio": 0.36, "speechRate": 3.1, "pitchVariationSemitones": 2.2,
    "pauses": [ { "startSec": 2.14, "endSec": 3.9 } ]
  },
  "linguistic": {
    "transcript": [ { "text": "The", "kind": "word" }, { "text": "um", "kind": "filler" } ],
    "wordCount": 45, "fillerCount": 4, "repetitionCount": 2, "wordFindingEvents": 1,
    "typeTokenRatio": 0.62,
    "notes": ["4 filler words (like \"um\" or \"uh\")", "2 repeated words", "1 moment of searching for a word"]
  },
  "waveform": [0.02, 0.41, 0.87, 1, 0.33]
}
```
The full types are in `app/src/shared/types.ts`.

## How to render each part (matching the desktop app)
- **Score ring:** `score.score` out of 100, colored by `score.band` (green `#2e9e6a`, yellow `#d99a1e`, red `#d64545`). The pill text is `score.label`; the headline is `score.message`.
- **Metric cards:** one per `score.factors[]`, showing `label`, `detail` (the measured value) and `explanation`. Status is "Typical" when `points === 0`, "Slight change" when `points < 5`, and "Notable" otherwise.
- **Baseline:** if `baseline.status === "building"`, show "`remaining` more check-ins to set a personal baseline". Otherwise list `baseline.deltas[].text` and highlight the ones where `worse` is true.
- **Pause map:** draw `waveform` values (0..1) as bars across the full width. Shade each `acoustics.pauses[]` from `startSec / acoustics.durationSec` to `endSec / acoustics.durationSec` (amber, about 35% opacity). Seeded history has an empty `waveform`, so hide the map then.
- **Transcript:** render `linguistic.transcript[]` in order and style by `kind`: `filler` (amber background), `repetition` (wavy underline), `wordfinding` (red tint, italic), `pause` (grey "…" chip), `word` (plain). Show `linguistic.notes[]` below it.
- **Trend:** plot `score.score` against `createdAt` from `listSessions()`, with guide lines at 75 and 55.
- **Always show:** "EchoMind is a screening aid, not a diagnosis. If you notice ongoing changes, talk to a doctor."

## Recording on the website and letting the app process it
```ts
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const recorder = new MediaRecorder(stream)
const chunks: Blob[] = []
recorder.ondataavailable = (e) => chunks.push(e.data)
recorder.onstop = async () => {
  stream.getTracks().forEach((t) => t.stop())
  const audio = new Blob(chunks, { type: recorder.mimeType })
  const session = await echomind.analyze(audio, 'reading') // app analyzes, saves, returns it
  // render `session` using the guide above
}
recorder.start()
// ...later: recorder.stop()
```
Sessions created this way also appear in the desktop app's history.

## Live updates
Poll `latestSession()` every few seconds and re-render when the `id` changes. That way, a check-in done in the desktop app shows up on the website.
