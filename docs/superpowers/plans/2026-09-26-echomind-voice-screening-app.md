# EchoMind Voice Screening App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an Electron desktop app where a patient records a one-minute speech task. The app measures real acoustic markers of cognitive decline, adds scripted language analysis, and scores the session against the patient's own baseline. It exports a doctor report as a PDF and serves the same data through a local API, so a separate website can display the results and send recordings for the app to process. It must be buildable in one hackathon day.

**Architecture:** An electron-vite React/TypeScript app. The **renderer** is the analysis engine:
- `acoustics` is pure DSP on decoded PCM (pauses, speech rate, pitch variation).
- An `AnalysisProvider` interface returns the transcript and language markers. Today that is a `ScriptedProvider`; later it can be Whisper + Claude.
- `scoring` and `baseline` produce a 0–100 score and "compared with your baseline" statements.

The **main process** stores sessions as JSON, exports PDFs, and runs a **local HTTP API on `127.0.0.1:4317`**. The API serves sessions to the website, and it forwards recordings posted by the website to the renderer over IPC for analysis. Sessions are stored **display-ready**: band label and message, factor explanations, baseline comparison, and waveform peaks. The website therefore needs no analysis code.

**Tech Stack:** Electron + electron-vite, React, TypeScript, Vite, Vitest, Recharts, Web Audio API and MediaRecorder, `speechSynthesis`, `webContents.printToPDF`, and Node `http` (no server framework).

---

## Design summary (decisions from brainstorming)

| Decision | Choice |
|---|---|
| Users | A patient doing a self check-in at home. Family caregivers view the results on the website. |
| Analysis | **Hybrid.** Acoustic metrics are *really computed* from the recording. The transcript and language markers come from a scripted provider behind an interface. |
| Website | Built by another teammate; **this plan doesn't design it**. The app exposes a local HTTP API and a typed client (`app/src/shared/`). The contract is documented in `docs/website-integration.md`. The website can list and show sessions and `POST` recordings for the app to analyze. |
| Cloud | None. The API listens on `127.0.0.1` only, so the website runs on the same computer as the app during the demo. A cloud version would put a shared database behind the same JSON shapes. |
| APIs and keys | None. Works offline. |
| Demo insurance | Bundled sample clips ("typical" and "shows markers") for each task. |
| Tier-1 extras | (1) Pause map on the waveform, (2) personal baseline comparison, (3) doctor report PDF, (4) voice-guided instructions plus large-text and high-contrast modes. |
| Speech tasks | **Read a passage** ("The North Wind and the Sun", public domain), **name animals** (semantic fluency, a standard screening task), and **describe your morning**. Picture description was dropped because it needs a licensed image. |

**Out of scope:** designing or building the website UI, real transcription or LLM calls, cloud hosting or sync, API authentication (the API is localhost-only and protected by a CORS allowlist), accounts, installer packaging, reminders, caregiver alerts, streaks.

**Honesty line for judges:** "Acoustic markers are computed live from your voice. The language layer runs on a demo provider behind a swappable interface, and the next step is Whisper + Claude."

## Suggested one-day schedule (team of 3 on the app, plus the website teammate)

| Time | Person A (analysis core) | Person B (main process and recording) | Person C (results UI) |
|---|---|---|---|
| 0:00–0:45 | Tasks 1–2 together | same | same |
| 0:45–4:00 | Tasks 3, 6, 7 | Tasks 10, 11 | Tasks 4, 5, 8, 9 |
| 4:00–7:00 | Help B, then prepare Task 17 scripts | Tasks 12, 13 | Tasks 14, 15, 16 |
| 7:00–9:00 | Task 17 (after Task 18 lands) | Bug fixes, website integration support | Task 18 |
| 9:00–11:00 | Task 19 and rehearsal | Rehearsal | Polish |

**Website teammate:** can start right after Task 10 is merged (around hour 2) using `docs/website-integration.md` and the typed client. Until the app runs end to end, the JSON example in that guide is enough to build against.

All commands run in **PowerShell** from `C:\Coding\Hackathon\app` unless stated otherwise.

## File structure

```
C:\Coding\Hackathon\
  app\                                   # Electron app (this plan)
    vitest.config.ts
    tsconfig.node.json / tsconfig.web.json   # both include src/shared
    src\shared\                          # contract shared by main, renderer AND the website
      types.ts                           # domain types (Session, ...)
      api.ts                             # HTTP API constants + validators
      apiClient.ts                       # typed fetch client (website imports/copies this)
      bridge.ts                          # main <-> renderer IPC message types
    src\main\
      index.ts                           # window, IPC handlers, PDF export, API startup
      sessionStore.ts                    # sessions.json in userData
      apiServer.ts                       # local HTTP API (pure Node http, tested)
      apiServer.test.ts
      remoteAnalysis.ts                  # forwards website audio to the renderer, awaits result
    src\preload\index.ts / index.d.ts    # window.api bridge
    src\renderer\index.html              # CSP + root
    src\renderer\public\samples\         # demo clips: <task>-<healthy|markers>.webm
    src\renderer\src\
      main.tsx, App.tsx, assets\main.css
      lib\types.ts                       # re-exports ../../../shared/types
      lib\format.ts                      # formatting + UI copy
      lib\acoustics.ts                   # PCM -> AcousticMetrics
      lib\peaks.ts                       # waveform peaks for pause map
      lib\transcript.ts, lib\scripts.ts  # transcript markup, tasks, demo scripts
      lib\provider.ts                    # AnalysisProvider + ScriptedProvider
      lib\scoring.ts, lib\baseline.ts    # score + personal baseline
      lib\seed.ts                        # 4 weeks of demo history
      lib\pipeline.ts                    # decode -> analyze -> display-ready Session
      lib\speech.ts, lib\sync.ts         # voice guide, sharing badge delay
      hooks\useSettings.ts, useSessions.ts, useRecorder.ts, useRemoteAnalysis.ts
      components\*.tsx, screens\*.tsx
  docs\website-integration.md            # API contract + rendering guide for the website teammate
  docs\demo-script.md
```

---

### Task 1: Scaffold the Electron app

**Files:**
- Create: `app\` (generated by the template)

- [ ] **Step 1: Generate the project**

Run from `C:\Coding\Hackathon`:
```powershell
npm create @quick-start/electron@latest app -- --template react-ts
```
Answer **No** to "Add Electron updater plugin?" and **No** to "Enable Electron download mirror proxy?".

- [ ] **Step 2: Install dependencies**

```powershell
cd C:\Coding\Hackathon\app
npm install
npm install recharts
npm install -D vitest
```

- [ ] **Step 3: Verify it runs**

Run: `npm run dev`
Expected: an Electron window opens showing the electron-vite starter page. Close it.

- [ ] **Step 4: Remove starter UI files**

```powershell
Remove-Item src\renderer\src\components\Versions.tsx, src\renderer\src\assets\base.css, src\renderer\src\assets\electron.svg, src\renderer\src\assets\wavy-lines.svg
```

(`App.tsx` and `main.css` get replaced in Task 12. Until then the renderer won't compile, which is fine because the next tasks are unit-tested library code.)

- [ ] **Step 5: Commit (includes the root README and .gitignore that are already staged)**

```powershell
cd C:\Coding\Hackathon
git add .gitignore README.MD app
git commit -m "chore: scaffold electron-vite react-ts app"
```

---

### Task 2: Test runner, shared domain types, format helpers

**Files:**
- Create: `app\vitest.config.ts`
- Modify: `app\package.json` (scripts)
- Modify: `app\tsconfig.node.json`, `app\tsconfig.web.json` (include `src/shared`)
- Create: `app\src\shared\types.ts`
- Create: `app\src\renderer\src\lib\types.ts`
- Create: `app\src\renderer\src\lib\format.ts`
- Test: `app\src\renderer\src\lib\format.test.ts`

- [ ] **Step 1: Add vitest config and script**

`app\vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
```

In `app\package.json`, add this line inside `"scripts"`:
```json
"test": "vitest run",
```

- [ ] **Step 2: Let both TypeScript projects see `src/shared`**

In `app\tsconfig.node.json`, add `"src/shared/**/*"` to the `include` array.
In `app\tsconfig.web.json`, add `"src/shared/**/*"` to the `include` array.

- [ ] **Step 3: Write the shared domain types**

These are the JSON shapes the website receives, so they carry display-ready fields.

`app\src\shared\types.ts`:
```ts
export type TaskId = 'reading' | 'fluency' | 'story'

export type SessionSource = 'live' | 'sample-healthy' | 'sample-markers' | 'seed'

export interface Pause {
  startSec: number
  endSec: number
}

export interface AcousticMetrics {
  durationSec: number
  speakingTimeSec: number
  pauseCount: number
  meanPauseSec: number
  longestPauseSec: number
  /** Share of the active speaking span (first to last voiced frame) spent in pauses, 0..1 */
  silenceRatio: number
  /** Estimated syllables per second of voiced time */
  speechRate: number
  /** Standard deviation of pitch in semitones; low = monotone */
  pitchVariationSemitones: number
  pauses: Pause[]
}

export type TokenKind = 'word' | 'filler' | 'repetition' | 'wordfinding' | 'pause'

export interface TranscriptToken {
  text: string
  kind: TokenKind
}

export interface LinguisticResult {
  transcript: TranscriptToken[]
  wordCount: number
  fillerCount: number
  repetitionCount: number
  wordFindingEvents: number
  /** Unique words / total words, 0..1 */
  typeTokenRatio: number
  notes: string[]
}

export type Band = 'green' | 'yellow' | 'red'

export interface ScoreFactor {
  label: string
  /** Points subtracted from 100; 0 = typical */
  points: number
  /** Measured value as display text, e.g. "3.4 syllables per second" */
  detail: string
  /** Plain-English meaning of this marker */
  explanation: string
}

export interface ScoreResult {
  score: number
  band: Band
  /** Short band label, e.g. "Worth watching" */
  label: string
  /** One-sentence headline for this band */
  message: string
  factors: ScoreFactor[]
}

export type MetricKey = 'score' | 'speechRate' | 'meanPause' | 'silence' | 'fillers'

export interface MetricDelta {
  key: MetricKey
  label: string
  current: number
  baseline: number
  pctChange: number
  worse: boolean
  /** Display text, e.g. "Speech rate is 18% lower than your baseline" */
  text: string
}

export type BaselineResult =
  | { status: 'building'; remaining: number }
  | { status: 'ready'; deltas: MetricDelta[] }

export interface Session {
  id: string
  createdAt: string
  task: TaskId
  taskTitle: string
  source: SessionSource
  acoustics: AcousticMetrics
  linguistic: LinguisticResult
  score: ScoreResult
  /** Normalized 0..1 loudness peaks for drawing the pause map; empty for seeded history */
  waveform: number[]
  /** Comparison with this patient's baseline, computed when the session was analyzed */
  baseline: BaselineResult
}

/** A session before its baseline comparison has been attached. */
export type SessionCore = Omit<Session, 'baseline'>
```

`app\src\renderer\src\lib\types.ts`:
```ts
export * from '../../../shared/types'
```

- [ ] **Step 4: Write the failing format test**

`app\src\renderer\src\lib\format.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { formatDuration, pct, sourceLabel } from './format'

describe('format', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65.7)).toBe('1:05')
  })

  it('formats a ratio as a whole percent', () => {
    expect(pct(0.253)).toBe('25%')
  })

  it('labels session sources for display', () => {
    expect(sourceLabel('sample-markers')).toBe('Demo sample (markers)')
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm test`
Expected: FAIL with "Failed to resolve import './format'"

- [ ] **Step 6: Implement format helpers**

`app\src\renderer\src\lib\format.ts`:
```ts
import type { Band, SessionSource } from './types'

export function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDuration(sec: number): string {
  const whole = Math.floor(sec)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

export function sourceLabel(source: SessionSource): string {
  switch (source) {
    case 'live':
      return 'Live recording'
    case 'sample-healthy':
      return 'Demo sample (typical)'
    case 'sample-markers':
      return 'Demo sample (markers)'
    case 'seed':
      return 'Earlier check-in'
  }
}

export const BAND_LABEL: Record<Band, string> = {
  green: 'Typical for you',
  yellow: 'Worth watching',
  red: 'Consider a check-up'
}

export const BAND_MESSAGE: Record<Band, string> = {
  green: 'Your speech patterns look typical.',
  yellow: 'A few speech markers changed. Keep checking in.',
  red: 'Several speech markers changed. Consider sharing this report with a doctor.'
}

export const FACTOR_EXPLANATIONS: Record<string, string> = {
  Silence: 'How much of your speaking time was spent in pauses.',
  'Pause length': 'Long pauses mid-sentence often happen while searching for words.',
  'Speech rate': 'Slower, more effortful speech can be an early sign of changes in thinking.',
  'Pitch variation': 'Flatter, more monotone speech is linked with cognitive changes.',
  'Filler words': 'Frequent "um" and "uh" can signal trouble retrieving words.',
  Repetitions: 'Repeating words or phrases can reflect lapses in working memory.',
  'Word-finding': 'Vague substitutes like "the thing" suggest difficulty naming.',
  Vocabulary: 'A narrower range of words can reflect changes in language.'
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npm test`
Expected: PASS (3 tests)

- [ ] **Step 8: Commit**

```powershell
git add vitest.config.ts package.json tsconfig.node.json tsconfig.web.json src/shared/types.ts src/renderer/src/lib
git commit -m "feat: add shared domain types, format helpers, vitest"
```

---

### Task 3: Acoustic analysis (real signal processing)

How it works: split the audio into 20 ms frames and compute loudness (dB) per frame. Mark frames "voiced" with an adaptive threshold, and bridge gaps under 150 ms (stop consonants). Silent runs of at least 250 ms between speech count as pauses. Syllables are estimated as local loudness peaks. Pitch comes from autocorrelation on 40 ms windows every 100 ms, and pitch variation is the standard deviation in semitones.

**Files:**
- Create: `app\src\renderer\src\lib\acoustics.ts`
- Test: `app\src\renderer\src\lib\acoustics.test.ts`

- [ ] **Step 1: Write the failing tests**

`app\src\renderer\src\lib\acoustics.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { analyzeAcoustics, frameDb } from './acoustics'

const SR = 16000

function tone(sec: number, hz = 200, amp = 0.5): Float32Array {
  const out = new Float32Array(Math.round(sec * SR))
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * hz * i) / SR)
  return out
}

function silence(sec: number): Float32Array {
  return new Float32Array(Math.round(sec * SR))
}

/** 200 Hz carrier whose loudness rises and falls `rate` times per second, like syllables */
function syllables(sec: number, rate: number): Float32Array {
  const out = new Float32Array(Math.round(sec * SR))
  for (let i = 0; i < out.length; i++) {
    const t = i / SR
    const envelope = 0.55 + 0.45 * Math.sin(2 * Math.PI * rate * t)
    out[i] = envelope * 0.5 * Math.sin(2 * Math.PI * 200 * t)
  }
  return out
}

function concat(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

describe('frameDb', () => {
  it('returns -100 dB for silence and about -9 dB for a 0.5 amplitude sine', () => {
    const db = frameDb(concat(silence(0.1), tone(0.1)), SR)
    expect(db).toHaveLength(10)
    expect(db[0]).toBe(-100)
    expect(db[9]).toBeCloseTo(-9.03, 0)
  })
})

describe('analyzeAcoustics', () => {
  it('finds pauses between speech and ignores leading/trailing silence', () => {
    const signal = concat(
      silence(0.4),
      tone(0.5),
      silence(1.0),
      tone(0.5),
      silence(0.3),
      tone(0.5),
      silence(0.4)
    )
    const m = analyzeAcoustics(signal, SR)
    expect(m.durationSec).toBeCloseTo(3.6, 2)
    expect(m.pauseCount).toBe(2)
    expect(m.pauses[0].startSec).toBeCloseTo(0.9, 1)
    expect(m.longestPauseSec).toBeCloseTo(1.0, 1)
    expect(m.meanPauseSec).toBeCloseTo(0.65, 1)
    expect(m.speakingTimeSec).toBeCloseTo(1.5, 1)
    expect(m.silenceRatio).toBeCloseTo(1.3 / 2.8, 1)
  })

  it('treats gaps shorter than 150 ms as part of speech', () => {
    const m = analyzeAcoustics(concat(tone(0.5), silence(0.1), tone(0.5)), SR)
    expect(m.pauseCount).toBe(0)
    expect(m.speakingTimeSec).toBeCloseTo(1.1, 1)
  })

  it('returns zeros for pure silence', () => {
    const m = analyzeAcoustics(silence(2), SR)
    expect(m.speakingTimeSec).toBe(0)
    expect(m.pauseCount).toBe(0)
    expect(m.speechRate).toBe(0)
    expect(m.silenceRatio).toBe(0)
  })

  it('estimates about 4 syllables per second from a 4 Hz loudness envelope', () => {
    const m = analyzeAcoustics(syllables(3, 4), SR)
    expect(m.speechRate).toBeGreaterThan(3.3)
    expect(m.speechRate).toBeLessThan(4.7)
  })

  it('reports near-zero pitch variation for a steady tone', () => {
    expect(analyzeAcoustics(tone(2, 200), SR).pitchVariationSemitones).toBeLessThan(0.5)
  })

  it('reports about 6 semitones of variation for half 150 Hz, half 300 Hz', () => {
    const v = analyzeAcoustics(concat(tone(1, 150), tone(1, 300)), SR).pitchVariationSemitones
    expect(v).toBeGreaterThan(5)
    expect(v).toBeLessThan(7)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- acoustics`
Expected: FAIL with "Failed to resolve import './acoustics'"

- [ ] **Step 3: Implement acoustics**

`app\src\renderer\src\lib\acoustics.ts`:
```ts
import type { AcousticMetrics, Pause } from './types'

export const FRAME_SEC = 0.02
export const MIN_PAUSE_SEC = 0.25
const BRIDGE_GAP_SEC = 0.15
const PEAK_HALF_WINDOW = 5 // frames on each side (100 ms)
const PITCH_FRAME_STEP = 5 // estimate pitch every 5th frame (100 ms)
const PITCH_WINDOW_SEC = 0.04
const MIN_PITCH_HZ = 75
const MAX_PITCH_HZ = 400

/** Loudness in dB (clamped to -100) for consecutive 20 ms frames. */
export function frameDb(samples: Float32Array, sampleRate: number): number[] {
  const frameLen = Math.max(1, Math.round(sampleRate * FRAME_SEC))
  const out: number[] = []
  for (let start = 0; start + frameLen <= samples.length; start += frameLen) {
    let sum = 0
    for (let i = start; i < start + frameLen; i++) sum += samples[i] * samples[i]
    const rms = Math.sqrt(sum / frameLen)
    out.push(rms > 0 ? Math.max(-100, 20 * Math.log10(rms)) : -100)
  }
  return out
}

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))]
}

/** Fill silent runs shorter than maxGap frames that sit between voiced frames. */
function bridgeShortGaps(mask: boolean[], maxGap: number): void {
  let i = 0
  while (i < mask.length) {
    if (mask[i]) {
      i++
      continue
    }
    let j = i
    while (j < mask.length && !mask[j]) j++
    if (i > 0 && j < mask.length && j - i < maxGap) mask.fill(true, i, j)
    i = j
  }
}

/** True for frames that contain speech, using a threshold adapted to the recording. */
export function voicedMask(db: number[]): boolean[] {
  if (db.length === 0) return []
  const lo = percentile(db, 0.1)
  const hi = percentile(db, 0.95)
  if (hi < -60) return db.map(() => false)
  const threshold = hi - lo < 6 ? -60 : lo + 0.35 * (hi - lo)
  const mask = db.map((d) => d > threshold)
  bridgeShortGaps(mask, Math.round(BRIDGE_GAP_SEC / FRAME_SEC))
  return mask
}

/** Silent runs of at least MIN_PAUSE_SEC between the first and last voiced frames. */
export function findPauses(mask: boolean[]): Pause[] {
  const pauses: Pause[] = []
  const first = mask.indexOf(true)
  const last = mask.lastIndexOf(true)
  if (first === -1) return pauses
  let i = first
  while (i <= last) {
    if (mask[i]) {
      i++
      continue
    }
    let j = i
    while (j <= last && !mask[j]) j++
    if ((j - i) * FRAME_SEC >= MIN_PAUSE_SEC - 1e-9) {
      pauses.push({ startSec: i * FRAME_SEC, endSec: j * FRAME_SEC })
    }
    i = j
  }
  return pauses
}

/** Count loudness peaks in voiced frames; each peak approximates one syllable. */
export function countSyllablePeaks(db: number[], mask: boolean[]): number {
  const smooth = db.map((_, i) => {
    let sum = 0
    let n = 0
    for (let k = i - 2; k <= i + 2; k++) {
      if (k >= 0 && k < db.length) {
        sum += db[k]
        n++
      }
    }
    return sum / n
  })
  let peaks = 0
  for (let i = PEAK_HALF_WINDOW; i < smooth.length - PEAK_HALF_WINDOW; i++) {
    if (!mask[i]) continue
    let isPeak = true
    for (let k = i - PEAK_HALF_WINDOW; k <= i + PEAK_HALF_WINDOW; k++) {
      if (k === i) continue
      // Strictly greater than the left side and at least equal to the right side, so plateaus count once.
      if (k < i ? smooth[k] >= smooth[i] : smooth[k] > smooth[i]) {
        isPeak = false
        break
      }
    }
    if (isPeak) peaks++
  }
  return peaks
}

function decimate(samples: Float32Array, factor: number): Float32Array {
  const out = new Float32Array(Math.floor(samples.length / factor))
  for (let i = 0; i < out.length; i++) {
    let sum = 0
    for (let k = 0; k < factor; k++) sum += samples[i * factor + k]
    out[i] = sum / factor
  }
  return out
}

/** Autocorrelation pitch estimate for one window, or null if the window is not periodic. */
function estimatePitchHz(x: Float32Array, start: number, len: number, sr: number): number | null {
  const minLag = Math.floor(sr / MAX_PITCH_HZ)
  const maxLag = Math.ceil(sr / MIN_PITCH_HZ)
  if (start + len + maxLag + 1 > x.length) return null
  let energy = 0
  for (let i = 0; i < len; i++) energy += x[start + i] * x[start + i]
  if (energy === 0) return null
  const r: number[] = []
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let sum = 0
    for (let i = 0; i < len; i++) sum += x[start + i] * x[start + i + lag]
    r.push(sum / energy)
  }
  const best = Math.max(...r)
  if (best < 0.5) return null
  // Take the shortest lag close to the best one (avoids octave errors), then climb to its local peak.
  let k = r.findIndex((v) => v >= 0.9 * best)
  while (k + 1 < r.length && r[k + 1] > r[k]) k++
  return sr / (minLag + k)
}

export function pitchVariationSemitones(
  samples: Float32Array,
  sampleRate: number,
  mask: boolean[]
): number {
  const factor = Math.max(1, Math.floor(sampleRate / 16000))
  const x = factor > 1 ? decimate(samples, factor) : samples
  const sr = sampleRate / factor
  const frameLen = (sampleRate * FRAME_SEC) / factor
  const windowLen = Math.round(sr * PITCH_WINDOW_SEC)
  const semitones: number[] = []
  for (let i = 0; i < mask.length; i += PITCH_FRAME_STEP) {
    if (!mask[i]) continue
    const hz = estimatePitchHz(x, Math.round(i * frameLen), windowLen, sr)
    if (hz !== null) semitones.push(12 * Math.log2(hz / 100))
  }
  if (semitones.length < 5) return 0
  const mean = semitones.reduce((a, b) => a + b, 0) / semitones.length
  return Math.sqrt(semitones.reduce((a, b) => a + (b - mean) ** 2, 0) / semitones.length)
}

export function analyzeAcoustics(samples: Float32Array, sampleRate: number): AcousticMetrics {
  const db = frameDb(samples, sampleRate)
  const mask = voicedMask(db)
  const pauses = findPauses(mask)
  const speakingTimeSec = mask.filter(Boolean).length * FRAME_SEC
  const first = mask.indexOf(true)
  const last = mask.lastIndexOf(true)
  const activeSpanSec = first === -1 ? 0 : (last - first + 1) * FRAME_SEC
  const pauseDurations = pauses.map((p) => p.endSec - p.startSec)
  const totalPauseSec = pauseDurations.reduce((a, b) => a + b, 0)

  return {
    durationSec: samples.length / sampleRate,
    speakingTimeSec,
    pauseCount: pauses.length,
    meanPauseSec: pauses.length ? totalPauseSec / pauses.length : 0,
    longestPauseSec: pauses.length ? Math.max(...pauseDurations) : 0,
    silenceRatio: activeSpanSec > 0 ? totalPauseSec / activeSpanSec : 0,
    speechRate: speakingTimeSec > 0 ? countSyllablePeaks(db, mask) / speakingTimeSec : 0,
    pitchVariationSemitones: pitchVariationSemitones(samples, sampleRate, mask),
    pauses
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- acoustics`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/lib/acoustics.ts src/renderer/src/lib/acoustics.test.ts
git commit -m "feat: compute pauses, speech rate and pitch variation from PCM"
```

---

### Task 4: Transcript markup and task scripts

Demo transcripts are written in a small markup: `~um` is a filler, `^the` is a repeated word, `?thing` is a word-finding substitute (consecutive `?` tokens count as one event), and `...` is a long pause.

**Files:**
- Create: `app\src\renderer\src\lib\transcript.ts`
- Create: `app\src\renderer\src\lib\scripts.ts`
- Test: `app\src\renderer\src\lib\transcript.test.ts`

- [ ] **Step 1: Write the failing tests**

`app\src\renderer\src\lib\transcript.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { parseScript, summarizeTokens } from './transcript'
import { SCRIPTS } from './scripts'

describe('parseScript', () => {
  it('turns markup into typed tokens', () => {
    expect(parseScript('The ~um ^cat cat ... ?the ?thing')).toEqual([
      { text: 'The', kind: 'word' },
      { text: 'um', kind: 'filler' },
      { text: 'cat', kind: 'repetition' },
      { text: 'cat', kind: 'word' },
      { text: '…', kind: 'pause' },
      { text: 'the', kind: 'wordfinding' },
      { text: 'thing', kind: 'wordfinding' }
    ])
  })
})

describe('summarizeTokens', () => {
  it('counts markers; consecutive word-finding tokens are one event', () => {
    expect(summarizeTokens(parseScript('The ~um ^cat cat ... ?the ?thing sat ~uh'))).toEqual({
      wordCount: 6,
      fillerCount: 2,
      repetitionCount: 1,
      wordFindingEvents: 1,
      typeTokenRatio: 4 / 6
    })
  })
})

describe('SCRIPTS', () => {
  it('has marker-free healthy scripts and marker-rich marker scripts for every task', () => {
    for (const task of ['reading', 'fluency', 'story'] as const) {
      const healthy = summarizeTokens(parseScript(SCRIPTS[task].healthy))
      const markers = summarizeTokens(parseScript(SCRIPTS[task].markers))
      expect(healthy.fillerCount + healthy.repetitionCount + healthy.wordFindingEvents).toBe(0)
      expect(markers.fillerCount).toBeGreaterThan(0)
      expect(markers.repetitionCount).toBeGreaterThan(0)
      expect(markers.wordFindingEvents).toBeGreaterThan(0)
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- transcript`
Expected: FAIL with "Failed to resolve import './transcript'"

- [ ] **Step 3: Implement the parser**

`app\src\renderer\src\lib\transcript.ts`:
```ts
import type { LinguisticResult, TranscriptToken } from './types'

export type TokenSummary = Pick<
  LinguisticResult,
  'wordCount' | 'fillerCount' | 'repetitionCount' | 'wordFindingEvents' | 'typeTokenRatio'
>

export function parseScript(script: string): TranscriptToken[] {
  return script
    .trim()
    .split(/\s+/)
    .map((raw): TranscriptToken => {
      if (raw === '...') return { text: '…', kind: 'pause' }
      if (raw.startsWith('~')) return { text: raw.slice(1), kind: 'filler' }
      if (raw.startsWith('^')) return { text: raw.slice(1), kind: 'repetition' }
      if (raw.startsWith('?')) return { text: raw.slice(1), kind: 'wordfinding' }
      return { text: raw, kind: 'word' }
    })
}

export function summarizeTokens(tokens: TranscriptToken[]): TokenSummary {
  const lexical = tokens.filter((t) => t.kind !== 'filler' && t.kind !== 'pause')
  const normalized = lexical
    .map((t) => t.text.toLowerCase().replace(/[^a-z']/g, ''))
    .filter(Boolean)
  const wordFindingEvents = tokens.filter(
    (t, i) => t.kind === 'wordfinding' && (i === 0 || tokens[i - 1].kind !== 'wordfinding')
  ).length

  return {
    wordCount: normalized.length,
    fillerCount: tokens.filter((t) => t.kind === 'filler').length,
    repetitionCount: tokens.filter((t) => t.kind === 'repetition').length,
    wordFindingEvents,
    typeTokenRatio: normalized.length ? new Set(normalized).size / normalized.length : 0
  }
}
```

- [ ] **Step 4: Write the task definitions and demo scripts**

`app\src\renderer\src\lib\scripts.ts`:
```ts
import type { TaskId } from './types'

export type ScriptVariant = 'healthy' | 'markers'

export interface TaskDefinition {
  id: TaskId
  title: string
  icon: string
  summary: string
  instructions: string
  passage?: string
}

const NORTH_WIND =
  'The North Wind and the Sun were disputing which was the stronger, when a traveler came along wrapped in a warm cloak. They agreed that the one who first succeeded in making the traveler take his cloak off should be considered stronger than the other.'

export const TASKS: Record<TaskId, TaskDefinition> = {
  reading: {
    id: 'reading',
    title: 'Read aloud',
    icon: '📖',
    summary: 'Read a short passage · about 30 seconds',
    instructions:
      "Read the passage below out loud at your normal pace. Press Start when you're ready, and Stop when you finish.",
    passage: NORTH_WIND
  },
  fluency: {
    id: 'fluency',
    title: 'Name animals',
    icon: '🦊',
    summary: 'Name as many animals as you can · 1 minute',
    instructions:
      "Name as many different animals as you can think of. You have up to one minute. Press Start when you're ready."
  },
  story: {
    id: 'story',
    title: 'Your morning',
    icon: '☀️',
    summary: 'Describe your morning · about 1 minute',
    instructions:
      "Tell me about your morning today, from when you woke up. Speak for about a minute. Press Start when you're ready."
  }
}

export const TASK_LIST: TaskDefinition[] = [TASKS.reading, TASKS.fluency, TASKS.story]

/** Demo transcripts in markup: ~filler  ^repeated  ?word-finding  ... long pause */
export const SCRIPTS: Record<TaskId, Record<ScriptVariant, string>> = {
  reading: {
    healthy: NORTH_WIND,
    markers:
      'The North Wind and the ~um Sun were ... disputing which was the ^the the stronger, when a ~uh traveler came along ... wrapped in a warm ... ?the ?coat ?thing cloak. They agreed that the one who ~um first ... succeeded in making the ^the the traveler take his cloak off ... should be considered stronger than the ~uh other.'
  },
  fluency: {
    healthy:
      'Dog, cat, horse, cow, pig, sheep, goat, chicken, duck, lion, tiger, bear, elephant, giraffe, zebra, monkey, rabbit, mouse, deer, wolf, fox, eagle, owl, shark, whale, dolphin, snake, frog, turtle, kangaroo.',
    markers:
      'Dog, ~um cat ... ^dog dog ~uh ... horse ... ?the ?one ?with ?stripes ... cow ~um ... ^cat cat ... pig ... ~uh ... bird ... ?the ?big ?gray ?one ... elephant.'
  },
  story: {
    healthy:
      'This morning I woke up around seven, made a pot of coffee, and read the newspaper on the porch. Then I called my daughter to plan her visit this weekend, and after that I walked the dog around the park before breakfast.',
    markers:
      'This morning I ~um woke up ... and I made the ... ?the ?hot ?drink ... coffee. Then I ~uh called my ^my daughter ... about the ~um ... ^visit visit. And then I ~uh ... walked the ... ?the ?animal dog around the ... ^the the park.'
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- transcript`
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```powershell
git add src/renderer/src/lib/transcript.ts src/renderer/src/lib/transcript.test.ts src/renderer/src/lib/scripts.ts
git commit -m "feat: add transcript markup parser, tasks and demo scripts"
```

---

### Task 5: Analysis provider (scripted, swappable)

**Files:**
- Create: `app\src\renderer\src\lib\provider.ts`
- Test: `app\src\renderer\src\lib\provider.test.ts`

- [ ] **Step 1: Write the failing tests**

`app\src\renderer\src\lib\provider.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { ScriptedProvider, pickVariant } from './provider'
import type { AcousticMetrics } from './types'

const calm: AcousticMetrics = {
  durationSec: 30,
  speakingTimeSec: 25,
  pauseCount: 4,
  meanPauseSec: 0.4,
  longestPauseSec: 0.8,
  silenceRatio: 0.15,
  speechRate: 4,
  pitchVariationSemitones: 3,
  pauses: []
}

describe('pickVariant', () => {
  it('follows the sample type for bundled samples', () => {
    expect(pickVariant('sample-healthy', { ...calm, silenceRatio: 0.9 })).toBe('healthy')
    expect(pickVariant('sample-markers', calm)).toBe('markers')
  })

  it('uses the measured pauses for live recordings', () => {
    expect(pickVariant('live', calm)).toBe('healthy')
    expect(pickVariant('live', { ...calm, silenceRatio: 0.4 })).toBe('markers')
    expect(pickVariant('live', { ...calm, meanPauseSec: 1.2 })).toBe('markers')
  })
})

describe('ScriptedProvider', () => {
  const provider = new ScriptedProvider()

  it('returns a marker-free result for a typical sample', async () => {
    const r = await provider.analyze({ audio: new Blob(), task: 'reading', source: 'sample-healthy', acoustics: calm })
    expect(r.fillerCount).toBe(0)
    expect(r.transcript.length).toBeGreaterThan(20)
    expect(r.notes).toEqual(['Fluent speech with no hesitation markers'])
  })

  it('returns markers and readable notes for a markers sample', async () => {
    const r = await provider.analyze({ audio: new Blob(), task: 'story', source: 'sample-markers', acoustics: calm })
    expect(r.fillerCount).toBeGreaterThan(0)
    expect(r.wordFindingEvents).toBeGreaterThan(0)
    expect(r.notes[0]).toMatch(/filler word/)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- provider`
Expected: FAIL with "Failed to resolve import './provider'"

- [ ] **Step 3: Implement the provider**

`app\src\renderer\src\lib\provider.ts`:
```ts
import { SCRIPTS, type ScriptVariant } from './scripts'
import { parseScript, summarizeTokens, type TokenSummary } from './transcript'
import type { AcousticMetrics, LinguisticResult, SessionSource, TaskId } from './types'

export interface AnalysisRequest {
  audio: Blob
  task: TaskId
  source: SessionSource
  acoustics: AcousticMetrics
}

/** Swap ScriptedProvider for a Whisper + Claude implementation without touching the UI or the API. */
export interface AnalysisProvider {
  analyze(request: AnalysisRequest): Promise<LinguisticResult>
}

const LIVE_MARKERS_SILENCE_RATIO = 0.3
const LIVE_MARKERS_MEAN_PAUSE_SEC = 0.9

export function pickVariant(source: SessionSource, acoustics: AcousticMetrics): ScriptVariant {
  if (source === 'sample-healthy') return 'healthy'
  if (source === 'sample-markers') return 'markers'
  return acoustics.silenceRatio > LIVE_MARKERS_SILENCE_RATIO ||
    acoustics.meanPauseSec > LIVE_MARKERS_MEAN_PAUSE_SEC
    ? 'markers'
    : 'healthy'
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function buildNotes(summary: TokenSummary): string[] {
  const notes: string[] = []
  if (summary.fillerCount > 0) notes.push(`${plural(summary.fillerCount, 'filler word')} (like "um" or "uh")`)
  if (summary.repetitionCount > 0) notes.push(plural(summary.repetitionCount, 'repeated word'))
  if (summary.wordFindingEvents > 0) notes.push(`${plural(summary.wordFindingEvents, 'moment')} of searching for a word`)
  if (notes.length === 0) notes.push('Fluent speech with no hesitation markers')
  return notes
}

export class ScriptedProvider implements AnalysisProvider {
  async analyze({ task, source, acoustics }: AnalysisRequest): Promise<LinguisticResult> {
    const transcript = parseScript(SCRIPTS[task][pickVariant(source, acoustics)])
    const summary = summarizeTokens(transcript)
    return { transcript, ...summary, notes: buildNotes(summary) }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- provider`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/lib/provider.ts src/renderer/src/lib/provider.test.ts
git commit -m "feat: add swappable analysis provider with scripted implementation"
```

---

### Task 6: Scoring

Each factor loses points linearly between an "ok" value (0 points) and a "bad" value (the maximum points). The maximums add up to 100. Score = 100 − total penalty. Bands: 75 and above is green, 55–74 is yellow, below 55 is red. The result also carries the display text (band label and message, and an explanation per factor), so the website doesn't need its own copy. The tests read the thresholds from `THRESHOLDS`, so tuning them in Task 17 won't break the tests.

**Files:**
- Create: `app\src\renderer\src\lib\scoring.ts`
- Test: `app\src\renderer\src\lib\scoring.test.ts`

- [ ] **Step 1: Write the failing tests**

`app\src\renderer\src\lib\scoring.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { THRESHOLDS, bandFor, fillersPer100, scoreSession } from './scoring'
import type { AcousticMetrics, LinguisticResult } from './types'

function acoustics(level: 'ok' | 'bad'): AcousticMetrics {
  return {
    durationSec: 60,
    speakingTimeSec: 45,
    pauseCount: 8,
    meanPauseSec: THRESHOLDS.meanPauseSec[level],
    longestPauseSec: 1,
    silenceRatio: THRESHOLDS.silenceRatio[level],
    speechRate: THRESHOLDS.speechRate[level],
    pitchVariationSemitones: THRESHOLDS.pitchVariation[level],
    pauses: []
  }
}

function linguistic(level: 'ok' | 'bad'): LinguisticResult {
  return {
    transcript: [],
    wordCount: 100,
    fillerCount: THRESHOLDS.fillersPer100[level],
    repetitionCount: THRESHOLDS.repetitions[level],
    wordFindingEvents: THRESHOLDS.wordFinding[level],
    typeTokenRatio: THRESHOLDS.typeTokenRatio[level],
    notes: []
  }
}

describe('scoreSession', () => {
  it('has factor maximums that add up to 100', () => {
    expect(Object.values(THRESHOLDS).reduce((sum, r) => sum + r.max, 0)).toBe(100)
  })

  it('gives 100, green and display text when every metric is typical', () => {
    const r = scoreSession(acoustics('ok'), linguistic('ok'))
    expect(r.score).toBe(100)
    expect(r.band).toBe('green')
    expect(r.label).toBe('Typical for you')
    expect(r.message).toBe('Your speech patterns look typical.')
    expect(r.factors.every((f) => f.points === 0)).toBe(true)
    expect(r.factors.every((f) => f.explanation.length > 0)).toBe(true)
  })

  it('gives 0 and red when every metric is at its worst', () => {
    const r = scoreSession(acoustics('bad'), linguistic('bad'))
    expect(r.score).toBe(0)
    expect(r.band).toBe('red')
  })

  it('scales a penalty linearly between ok and bad', () => {
    const { ok, bad, max } = THRESHOLDS.silenceRatio
    const r = scoreSession({ ...acoustics('ok'), silenceRatio: (ok + bad) / 2 }, linguistic('ok'))
    expect(r.factors.find((f) => f.label === 'Silence')?.points).toBe(Math.round(max / 2))
    expect(r.score).toBe(100 - Math.round(max / 2))
  })
})

describe('bandFor', () => {
  it('uses 75 and 55 as band edges', () => {
    expect(bandFor(75)).toBe('green')
    expect(bandFor(74)).toBe('yellow')
    expect(bandFor(55)).toBe('yellow')
    expect(bandFor(54)).toBe('red')
  })
})

describe('fillersPer100', () => {
  it('normalizes fillers by word count', () => {
    expect(fillersPer100({ fillerCount: 3, wordCount: 60 })).toBe(5)
    expect(fillersPer100({ fillerCount: 3, wordCount: 0 })).toBe(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- scoring`
Expected: FAIL with "Failed to resolve import './scoring'"

- [ ] **Step 3: Implement scoring**

`app\src\renderer\src\lib\scoring.ts`:
```ts
import { BAND_LABEL, BAND_MESSAGE, FACTOR_EXPLANATIONS, pct } from './format'
import type { AcousticMetrics, Band, LinguisticResult, ScoreFactor, ScoreResult } from './types'

interface Rule {
  ok: number
  bad: number
  max: number
}

/** Tune ok/bad in Task 17 with real recordings. Keep the max values summing to 100. */
export const THRESHOLDS = {
  silenceRatio: { ok: 0.25, bad: 0.5, max: 20 },
  meanPauseSec: { ok: 0.6, bad: 1.5, max: 15 },
  speechRate: { ok: 3.5, bad: 2.0, max: 15 },
  pitchVariation: { ok: 2.5, bad: 1.0, max: 10 },
  fillersPer100: { ok: 3, bad: 12, max: 15 },
  repetitions: { ok: 0, bad: 4, max: 10 },
  wordFinding: { ok: 0, bad: 3, max: 10 },
  typeTokenRatio: { ok: 0.55, bad: 0.35, max: 5 }
} satisfies Record<string, Rule>

export const GREEN_MIN = 75
export const YELLOW_MIN = 55

/** Linear penalty from 0 at `ok` to `max` at `bad`; works whether higher or lower is worse. */
export function penalty(value: number, { ok, bad, max }: Rule): number {
  const t = (value - ok) / (bad - ok)
  return Math.round(Math.min(1, Math.max(0, t)) * max)
}

export function fillersPer100(l: Pick<LinguisticResult, 'fillerCount' | 'wordCount'>): number {
  return l.wordCount > 0 ? (l.fillerCount / l.wordCount) * 100 : 0
}

export function bandFor(score: number): Band {
  if (score >= GREEN_MIN) return 'green'
  if (score >= YELLOW_MIN) return 'yellow'
  return 'red'
}

function factor(label: string, points: number, detail: string): ScoreFactor {
  return { label, points, detail, explanation: FACTOR_EXPLANATIONS[label] ?? '' }
}

export function scoreSession(a: AcousticMetrics, l: LinguisticResult): ScoreResult {
  const T = THRESHOLDS
  const factors: ScoreFactor[] = [
    factor('Silence', penalty(a.silenceRatio, T.silenceRatio), `Pauses filled ${pct(a.silenceRatio)} of your speaking time`),
    factor('Pause length', penalty(a.meanPauseSec, T.meanPauseSec), `Average pause ${a.meanPauseSec.toFixed(1)} s`),
    factor('Speech rate', penalty(a.speechRate, T.speechRate), `${a.speechRate.toFixed(1)} syllables per second`),
    factor('Pitch variation', penalty(a.pitchVariationSemitones, T.pitchVariation), `${a.pitchVariationSemitones.toFixed(1)} semitones of pitch movement`),
    factor('Filler words', penalty(fillersPer100(l), T.fillersPer100), `${fillersPer100(l).toFixed(1)} per 100 words`),
    factor('Repetitions', penalty(l.repetitionCount, T.repetitions), `${l.repetitionCount} repeated words`),
    factor('Word-finding', penalty(l.wordFindingEvents, T.wordFinding), `${l.wordFindingEvents} word-finding moments`),
    factor('Vocabulary', penalty(l.typeTokenRatio, T.typeTokenRatio), `${pct(l.typeTokenRatio)} unique words`)
  ]
  const score = Math.max(0, 100 - factors.reduce((sum, f) => sum + f.points, 0))
  const band = bandFor(score)
  return { score, band, label: BAND_LABEL[band], message: BAND_MESSAGE[band], factors }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- scoring`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/lib/scoring.ts src/renderer/src/lib/scoring.test.ts
git commit -m "feat: score sessions with tunable penalties and display-ready text"
```

---

### Task 7: Personal baseline comparison

The baseline is the mean of the **first 3 earlier sessions of the same task**. The result is saved on each session when it's analyzed (Task 13), so the website shows the same comparison without recomputing it.

**Files:**
- Create: `app\src\renderer\src\lib\baseline.ts`
- Test: `app\src\renderer\src\lib\baseline.test.ts`

- [ ] **Step 1: Write the failing tests**

`app\src\renderer\src\lib\baseline.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { compareToBaseline } from './baseline'
import type { SessionCore, TaskId } from './types'

const NOW = Date.UTC(2026, 8, 26)
const DAY = 86_400_000

function makeSession(id: string, daysAgo: number, task: TaskId, score: number, speechRate: number): SessionCore {
  return {
    id,
    createdAt: new Date(NOW - daysAgo * DAY).toISOString(),
    task,
    taskTitle: 'Test task',
    source: 'seed',
    acoustics: {
      durationSec: 60,
      speakingTimeSec: 45,
      pauseCount: 8,
      meanPauseSec: 0.5,
      longestPauseSec: 1,
      silenceRatio: 0.2,
      speechRate,
      pitchVariationSemitones: 3,
      pauses: []
    },
    linguistic: {
      transcript: [],
      wordCount: 100,
      fillerCount: 2,
      repetitionCount: 0,
      wordFindingEvents: 0,
      typeTokenRatio: 0.7,
      notes: []
    },
    score: { score, band: 'green', label: '', message: '', factors: [] },
    waveform: []
  }
}

function readyDeltas(current: SessionCore, history: SessionCore[]) {
  const result = compareToBaseline(current, history)
  if (result.status !== 'ready') throw new Error(`expected ready, got ${result.status}`)
  return result.deltas
}

describe('compareToBaseline', () => {
  it('is still building with fewer than 3 earlier sessions of the same task', () => {
    const current = makeSession('c', 0, 'reading', 70, 3)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('f1', 15, 'fluency', 90, 4),
      current
    ]
    expect(compareToBaseline(current, history)).toEqual({ status: 'building', remaining: 1 })
  })

  it('ignores sessions recorded after the current one', () => {
    const current = makeSession('c', 10, 'reading', 70, 3)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('r3', 5, 'reading', 90, 4)
    ]
    expect(compareToBaseline(current, history)).toEqual({ status: 'building', remaining: 1 })
  })

  it('compares with the mean of the first 3 earlier sessions of the same task', () => {
    const current = makeSession('c', 0, 'reading', 70, 3)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('r3', 10, 'reading', 90, 4),
      makeSession('r4', 5, 'reading', 10, 1),
      current
    ]
    const rate = readyDeltas(current, history).find((d) => d.key === 'speechRate')
    expect(rate).toMatchObject({ baseline: 4, current: 3, pctChange: -25, worse: true })
    expect(rate?.text).toBe('Speech rate is 25% lower than your baseline')
    const score = readyDeltas(current, history).find((d) => d.key === 'score')
    expect(score?.baseline).toBe(90)
    expect(score?.worse).toBe(true)
  })

  it('describes small changes as about the same', () => {
    const current = makeSession('c', 0, 'reading', 90, 4.1)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('r3', 10, 'reading', 90, 4)
    ]
    const rate = readyDeltas(current, history).find((d) => d.key === 'speechRate')
    expect(rate?.text).toBe('Speech rate is about the same as your baseline')
    expect(rate?.worse).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- baseline`
Expected: FAIL with "Failed to resolve import './baseline'"

- [ ] **Step 3: Implement baseline**

`app\src\renderer\src\lib\baseline.ts`:
```ts
import { fillersPer100 } from './scoring'
import type { BaselineResult, MetricDelta, MetricKey, SessionCore } from './types'

export const BASELINE_SIZE = 3
const WORSE_PCT = 10
const SAME_PCT = 5

interface MetricDef {
  key: MetricKey
  label: string
  higherIsBetter: boolean
  get: (s: SessionCore) => number
}

const METRICS: MetricDef[] = [
  { key: 'score', label: 'Overall score', higherIsBetter: true, get: (s) => s.score.score },
  { key: 'speechRate', label: 'Speech rate', higherIsBetter: true, get: (s) => s.acoustics.speechRate },
  { key: 'meanPause', label: 'Average pause', higherIsBetter: false, get: (s) => s.acoustics.meanPauseSec },
  { key: 'silence', label: 'Time spent silent', higherIsBetter: false, get: (s) => s.acoustics.silenceRatio },
  { key: 'fillers', label: 'Filler words', higherIsBetter: false, get: (s) => fillersPer100(s.linguistic) }
]

export function compareToBaseline(current: SessionCore, history: SessionCore[]): BaselineResult {
  const base = history
    .filter((s) => s.id !== current.id && s.task === current.task && s.createdAt < current.createdAt)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, BASELINE_SIZE)
  if (base.length < BASELINE_SIZE) return { status: 'building', remaining: BASELINE_SIZE - base.length }

  const deltas = METRICS.map((m): MetricDelta => {
    const baseline = base.reduce((sum, s) => sum + m.get(s), 0) / base.length
    const value = m.get(current)
    const pctChange = baseline === 0 ? 0 : ((value - baseline) / baseline) * 100
    const worse = m.higherIsBetter ? pctChange < -WORSE_PCT : pctChange > WORSE_PCT
    const text =
      Math.abs(pctChange) < SAME_PCT
        ? `${m.label} is about the same as your baseline`
        : `${m.label} is ${Math.round(Math.abs(pctChange))}% ${pctChange < 0 ? 'lower' : 'higher'} than your baseline`
    return { key: m.key, label: m.label, current: value, baseline, pctChange, worse, text }
  })
  return { status: 'ready', deltas }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- baseline`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/lib/baseline.ts src/renderer/src/lib/baseline.test.ts
git commit -m "feat: compare sessions with the patient's personal baseline"
```

---

### Task 8: Seeded history (four weeks of fake check-ins)

This gives 12 sessions over 30 days, rotating tasks, with a gentle decline. It's deterministic, so every demo looks the same. Each seeded session gets its baseline comparison attached, just like a real one.

**Files:**
- Create: `app\src\renderer\src\lib\seed.ts`
- Test: `app\src\renderer\src\lib\seed.test.ts`

- [ ] **Step 1: Write the failing tests**

`app\src\renderer\src\lib\seed.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { generateSeedSessions } from './seed'

const now = new Date(Date.UTC(2026, 8, 26, 12))
const DAY = 86_400_000

describe('generateSeedSessions', () => {
  const sessions = generateSeedSessions(now)

  it('creates 12 uniquely identified sessions in date order within the last 31 days', () => {
    expect(sessions).toHaveLength(12)
    expect(new Set(sessions.map((s) => s.id)).size).toBe(12)
    const times = sessions.map((s) => Date.parse(s.createdAt))
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(times.every((t) => t < now.getTime() && t > now.getTime() - 31 * DAY)).toBe(true)
  })

  it('includes at least 3 sessions per task so every task has a baseline', () => {
    for (const task of ['reading', 'fluency', 'story']) {
      expect(sessions.filter((s) => s.task === task).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('attaches baselines: early sessions are building, the last one is ready', () => {
    expect(sessions[0].baseline.status).toBe('building')
    expect(sessions[11].baseline.status).toBe('ready')
  })

  it('shows a gentle decline', () => {
    expect(sessions[0].score.score).toBeGreaterThan(sessions[11].score.score)
  })

  it('is deterministic', () => {
    expect(generateSeedSessions(now)).toEqual(sessions)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- seed`
Expected: FAIL with "Failed to resolve import './seed'"

- [ ] **Step 3: Implement the seed**

`app\src\renderer\src\lib\seed.ts`:
```ts
import { compareToBaseline } from './baseline'
import { buildNotes } from './provider'
import { scoreSession } from './scoring'
import { TASKS } from './scripts'
import type { AcousticMetrics, LinguisticResult, Session, SessionCore, TaskId } from './types'

const COUNT = 12
const DAY = 86_400_000
const TASK_ORDER: TaskId[] = ['reading', 'fluency', 'story']
/** How far toward the "markers" profile the last seeded session drifts (0..1). */
const MAX_DRIFT = 0.45

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Deterministic pseudo-random value in [-1, 1]. */
function jitter(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

export function generateSeedSessions(now: Date): Session[] {
  const cores: SessionCore[] = Array.from({ length: COUNT }, (_, i) => {
    const t = Math.min(1, Math.max(0, (i / (COUNT - 1)) * MAX_DRIFT + jitter(i) * 0.04))
    const task = TASK_ORDER[i % TASK_ORDER.length]
    const acoustics: AcousticMetrics = {
      durationSec: 60,
      speakingTimeSec: lerp(48, 38, t),
      pauseCount: Math.round(lerp(7, 14, t)),
      meanPauseSec: lerp(0.5, 1.25, t),
      longestPauseSec: lerp(1.0, 2.6, t),
      silenceRatio: lerp(0.2, 0.42, t),
      speechRate: lerp(4.3, 2.8, t),
      pitchVariationSemitones: lerp(3.2, 1.7, t),
      pauses: []
    }
    const summary = {
      wordCount: 110,
      fillerCount: Math.round(lerp(1, 9, t)),
      repetitionCount: Math.round(lerp(0, 3, t)),
      wordFindingEvents: Math.round(lerp(0, 3, t)),
      typeTokenRatio: lerp(0.68, 0.5, t)
    }
    const linguistic: LinguisticResult = { transcript: [], ...summary, notes: buildNotes(summary) }
    return {
      id: `seed-${i}`,
      createdAt: new Date(now.getTime() - (30 - i * 2.5) * DAY).toISOString(),
      task,
      taskTitle: TASKS[task].title,
      source: 'seed',
      acoustics,
      linguistic,
      score: scoreSession(acoustics, linguistic),
      waveform: []
    }
  })
  return cores.map((core) => ({ ...core, baseline: compareToBaseline(core, cores) }))
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- seed`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/lib/seed.ts src/renderer/src/lib/seed.test.ts
git commit -m "feat: generate deterministic four-week demo history"
```

---

### Task 9: Waveform peaks for the pause map

Sessions store 240 normalized peaks instead of raw audio. That's enough for both the app and the website to draw the pause map.

**Files:**
- Create: `app\src\renderer\src\lib\peaks.ts`
- Test: `app\src\renderer\src\lib\peaks.test.ts`

- [ ] **Step 1: Write the failing tests**

`app\src\renderer\src\lib\peaks.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { computePeaks, toWaveform } from './peaks'

describe('computePeaks', () => {
  it('returns the max absolute sample per bucket', () => {
    expect(computePeaks(new Float32Array([0, 0.5, -1, 0.25]), 2)).toEqual([0.5, 1])
  })

  it('returns an empty array for empty input', () => {
    expect(computePeaks(new Float32Array(0), 10)).toEqual([])
  })
})

describe('toWaveform', () => {
  it('normalizes peaks so the loudest bucket is 1', () => {
    expect(toWaveform(new Float32Array([0, 0.25, -0.5, 0.125]), 2)).toEqual([0.5, 1])
  })

  it('returns zeros for silence', () => {
    expect(toWaveform(new Float32Array(4), 2)).toEqual([0, 0])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- peaks`
Expected: FAIL with "Failed to resolve import './peaks'"

- [ ] **Step 3: Implement**

`app\src\renderer\src\lib\peaks.ts`:
```ts
export const WAVEFORM_POINTS = 240

/** Downsample audio to `buckets` peak values. */
export function computePeaks(samples: Float32Array, buckets: number): number[] {
  if (buckets <= 0 || samples.length === 0) return []
  const size = samples.length / buckets
  const out: number[] = []
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * size)
    const end = Math.min(samples.length, Math.max(start + 1, Math.floor((b + 1) * size)))
    let max = 0
    for (let i = start; i < end; i++) max = Math.max(max, Math.abs(samples[i]))
    out.push(max)
  }
  return out
}

/** Peaks scaled to 0..1 and rounded to 3 decimals, compact enough to store and send as JSON. */
export function toWaveform(samples: Float32Array, points: number = WAVEFORM_POINTS): number[] {
  const peaks = computePeaks(samples, points)
  const max = Math.max(0, ...peaks)
  return peaks.map((v) => (max > 0 ? Math.round((v / max) * 1000) / 1000 : 0))
}
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS (all test files)

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/lib/peaks.ts src/renderer/src/lib/peaks.test.ts
git commit -m "feat: add normalized waveform peaks for the pause map"
```

---

### Task 10: Local HTTP API for the website (contract, server, typed client, guide)

The API is plain Node `http` with no Electron imports, so it can be tested in isolation. Analysis is injected as a dependency; Task 11 connects it to the renderer.

| Method | Path | Response |
|---|---|---|
| GET | `/api/health` | `{ ok: true, app: "EchoMind", version: 1 }` |
| GET | `/api/sessions` | `Session[]`, oldest first |
| GET | `/api/sessions/latest` | `Session`, or 404 |
| GET | `/api/sessions/:id` | `Session`, or 404 |
| POST | `/api/analyze?task=<reading\|fluency\|story>&source=<live\|sample-healthy\|sample-markers>` | body = raw audio bytes → **201** `Session` (saved). 400 bad params, 413 too large, 422 analysis failed |

**Files:**
- Create: `app\src\shared\api.ts`
- Create: `app\src\shared\apiClient.ts`
- Create: `app\src\main\apiServer.ts`
- Test: `app\src\main\apiServer.test.ts`
- Create: `C:\Coding\Hackathon\docs\website-integration.md`

- [ ] **Step 1: API contract**

`app\src\shared\api.ts`:
```ts
import type { SessionSource, TaskId } from './types'

export const API_PORT = 4317
export const API_VERSION = 1
export const API_BASE = `http://127.0.0.1:${API_PORT}/api`

export const TASK_IDS: readonly TaskId[] = ['reading', 'fluency', 'story']
/** Sources a website may send. 'seed' is reserved for demo history. */
export const REMOTE_SOURCES: readonly SessionSource[] = ['live', 'sample-healthy', 'sample-markers']

export interface HealthResponse {
  ok: true
  app: 'EchoMind'
  version: number
}

export interface ApiError {
  error: string
}

export function isTaskId(value: unknown): value is TaskId {
  return typeof value === 'string' && (TASK_IDS as readonly string[]).includes(value)
}

export function isRemoteSource(value: unknown): value is SessionSource {
  return typeof value === 'string' && (REMOTE_SOURCES as readonly string[]).includes(value)
}
```

- [ ] **Step 2: Typed client (the website imports or copies this)**

`app\src\shared\apiClient.ts`:
```ts
import { API_BASE, type ApiError, type HealthResponse } from './api'
import type { Session, SessionSource, TaskId } from './types'

/** Typed client for the EchoMind desktop app's local API. Used by the website. */
export function createEchoMindClient(baseUrl: string = API_BASE) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, init)
    const body = (await res.json().catch(() => ({}))) as T | Partial<ApiError>
    if (!res.ok) throw new Error((body as Partial<ApiError>).error ?? `EchoMind API error ${res.status}`)
    return body as T
  }

  return {
    health: () => request<HealthResponse>('/health'),
    listSessions: () => request<Session[]>('/sessions'),
    latestSession: () => request<Session>('/sessions/latest'),
    getSession: (id: string) => request<Session>(`/sessions/${encodeURIComponent(id)}`),
    analyze: (audio: Blob, task: TaskId, source: SessionSource = 'live') =>
      request<Session>(`/analyze?task=${task}&source=${source}`, {
        method: 'POST',
        headers: { 'Content-Type': audio.type || 'application/octet-stream' },
        body: audio
      })
  }
}

export type EchoMindClient = ReturnType<typeof createEchoMindClient>
```

- [ ] **Step 3: Write the failing server tests**

`app\src\main\apiServer.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import { corsHeaders, startApiServer, type ApiDeps } from './apiServer'
import { createEchoMindClient, type EchoMindClient } from '../shared/apiClient'
import type { Session, TaskId } from '../shared/types'

const s1 = { id: 's1', createdAt: '2026-09-01T00:00:00.000Z' } as unknown as Session
const s2 = { id: 's2', createdAt: '2026-09-02T00:00:00.000Z' } as unknown as Session

let server: Server
let deps: ApiDeps
let base: string
let client: EchoMindClient

beforeEach(async () => {
  deps = {
    listSessions: vi.fn(async () => [s1, s2]),
    analyze: vi.fn(async () => s2),
    allowedOrigins: ['http://localhost:3000'],
    maxAudioBytes: 16
  }
  server = startApiServer(deps, 0)
  await new Promise<void>((resolve) => server.once('listening', () => resolve()))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
  client = createEchoMindClient(base)
})

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

const audio = (bytes: number[]): Blob => new Blob([new Uint8Array(bytes)], { type: 'audio/webm' })

describe('EchoMind API', () => {
  it('reports health', async () => {
    expect(await client.health()).toEqual({ ok: true, app: 'EchoMind', version: 1 })
  })

  it('lists sessions and returns latest or by id', async () => {
    expect(await client.listSessions()).toEqual([s1, s2])
    expect(await client.latestSession()).toEqual(s2)
    expect(await client.getSession('s1')).toEqual(s1)
  })

  it('returns 404 for an unknown session', async () => {
    await expect(client.getSession('nope')).rejects.toThrow('Session not found')
  })

  it('passes posted audio to the analyzer and returns the new session', async () => {
    expect(await client.analyze(audio([1, 2, 3]), 'reading')).toEqual(s2)
    expect(deps.analyze).toHaveBeenCalledWith(Buffer.from([1, 2, 3]), 'audio/webm', 'reading', 'live')
  })

  it('rejects an unknown task', async () => {
    await expect(client.analyze(audio([1]), 'dancing' as TaskId)).rejects.toThrow(/task must be one of/)
  })

  it('rejects an empty body', async () => {
    await expect(client.analyze(audio([]), 'reading')).rejects.toThrow('Request body must contain audio')
  })

  it('rejects audio over the size limit', async () => {
    await expect(client.analyze(audio(new Array(32).fill(1)), 'reading')).rejects.toThrow(/limit/)
  })

  it('surfaces analysis failures as errors', async () => {
    deps.analyze = vi.fn(async () => {
      throw new Error("We couldn't hear enough speech.")
    })
    await expect(client.analyze(audio([1, 2]), 'story')).rejects.toThrow("We couldn't hear enough speech.")
  })

  it('returns 404 for unknown routes', async () => {
    expect((await fetch(`${base}/nope`)).status).toBe(404)
  })
})

describe('corsHeaders', () => {
  it('allows listed origins, including private-network preflight', () => {
    expect(corsHeaders('http://localhost:3000', ['http://localhost:3000'])).toMatchObject({
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Private-Network': 'true'
    })
  })

  it('omits CORS headers for other origins', () => {
    expect(corsHeaders('https://evil.example', ['http://localhost:3000'])).toEqual({})
  })

  it('allows any origin with *', () => {
    expect(corsHeaders('https://site.example', ['*'])['Access-Control-Allow-Origin']).toBe('https://site.example')
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- apiServer`
Expected: FAIL with "Failed to resolve import './apiServer'"

- [ ] **Step 5: Implement the server**

`app\src\main\apiServer.ts`:
```ts
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http'
import {
  API_PORT,
  API_VERSION,
  REMOTE_SOURCES,
  TASK_IDS,
  isRemoteSource,
  isTaskId,
  type ApiError,
  type HealthResponse
} from '../shared/api'
import type { Session, SessionSource, TaskId } from '../shared/types'

export const MAX_AUDIO_BYTES = 20 * 1024 * 1024
export const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]

export interface ApiDeps {
  listSessions: () => Promise<Session[]>
  analyze: (audio: Buffer, mimeType: string, task: TaskId, source: SessionSource) => Promise<Session>
  allowedOrigins: string[]
  maxAudioBytes?: number
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

/** Comma-separated ECHOMIND_ALLOWED_ORIGINS overrides the defaults; "*" allows any origin. */
export function allowedOriginsFromEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = env.ECHOMIND_ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean)
  return configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS
}

export function corsHeaders(origin: string | undefined, allowed: string[]): Record<string, string> {
  if (!origin || !(allowed.includes('*') || allowed.includes(origin))) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    // Lets pages served from a public origin call this localhost API in Chromium.
    'Access-Control-Allow-Private-Network': 'true',
    Vary: 'Origin'
  }
}

/** Read the whole body; if it exceeds the limit keep draining (so the 413 reaches the client) and reject. */
function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size <= limit) chunks.push(chunk)
    })
    req.on('end', () =>
      size > limit ? reject(new HttpError(413, `Audio exceeds the ${limit}-byte limit`)) : resolve(Buffer.concat(chunks))
    )
    req.on('error', reject)
  })
}

export function createApiHandler(deps: ApiDeps): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    const cors = corsHeaders(req.headers.origin, deps.allowedOrigins)
    const send = (status: number, body?: unknown): void => {
      res.writeHead(status, body === undefined ? cors : { ...cors, 'Content-Type': 'application/json' })
      res.end(body === undefined ? undefined : JSON.stringify(body))
    }

    try {
      if (req.method === 'OPTIONS') return send(204)
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const path = url.pathname.replace(/\/+$/, '')

      if (req.method === 'GET' && path === '/api/health') {
        return send(200, { ok: true, app: 'EchoMind', version: API_VERSION } satisfies HealthResponse)
      }
      if (req.method === 'GET' && path === '/api/sessions') return send(200, await deps.listSessions())
      if (req.method === 'GET' && path.startsWith('/api/sessions/')) {
        const id = decodeURIComponent(path.slice('/api/sessions/'.length))
        const sessions = await deps.listSessions()
        const session = id === 'latest' ? sessions[sessions.length - 1] : sessions.find((s) => s.id === id)
        if (!session) throw new HttpError(404, 'Session not found')
        return send(200, session)
      }
      if (req.method === 'POST' && path === '/api/analyze') {
        const task = url.searchParams.get('task')
        const source = url.searchParams.get('source') ?? 'live'
        if (!isTaskId(task)) throw new HttpError(400, `task must be one of: ${TASK_IDS.join(', ')}`)
        if (!isRemoteSource(source)) throw new HttpError(400, `source must be one of: ${REMOTE_SOURCES.join(', ')}`)
        const audio = await readBody(req, deps.maxAudioBytes ?? MAX_AUDIO_BYTES)
        if (audio.length === 0) throw new HttpError(400, 'Request body must contain audio')
        let session: Session
        try {
          session = await deps.analyze(audio, req.headers['content-type'] ?? 'audio/webm', task, source)
        } catch (e) {
          throw new HttpError(422, e instanceof Error ? e.message : 'Analysis failed')
        }
        return send(201, session)
      }
      throw new HttpError(404, 'Not found')
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500
      send(status, { error: e instanceof Error ? e.message : 'Internal error' } satisfies ApiError)
    }
  }
}

/** Listen on 127.0.0.1 only; the API is never exposed to the network. */
export function startApiServer(deps: ApiDeps, port: number = API_PORT): Server {
  const handler = createApiHandler(deps)
  const server = createServer((req, res) => void handler(req, res))
  server.on('error', (e) => console.error('EchoMind API server error:', e))
  server.listen(port, '127.0.0.1', () => {
    const address = server.address()
    const actualPort = typeof address === 'object' && address ? address.port : port
    console.log(`EchoMind API listening on http://127.0.0.1:${actualPort}/api`)
  })
  return server
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- apiServer`
Expected: PASS (12 tests)

- [ ] **Step 7: Write the website integration guide**

`C:\Coding\Hackathon\docs\website-integration.md`:
````markdown
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
````

- [ ] **Step 8: Commit**

```powershell
cd C:\Coding\Hackathon
git add app/src/shared app/src/main/apiServer.ts app/src/main/apiServer.test.ts docs/website-integration.md
git commit -m "feat: add local HTTP API, typed client and website integration guide"
cd app
```

---

### Task 11: Main process: storage, remote analysis bridge, PDF export, API startup, preload, CSP

When the website posts audio, the main process sends it to the renderer, which already has the Web Audio decoder and all the analysis code. The main process then waits for the finished session to come back.

**Files:**
- Create: `app\src\shared\bridge.ts`
- Create: `app\src\main\sessionStore.ts`
- Create: `app\src\main\remoteAnalysis.ts`
- Replace: `app\src\main\index.ts`
- Replace: `app\src\preload\index.ts`
- Replace: `app\src\preload\index.d.ts`
- Replace: `app\src\renderer\index.html`

- [ ] **Step 1: IPC message types**

`app\src\shared\bridge.ts`:
```ts
import type { Session, SessionSource, TaskId } from './types'

/** Main -> renderer: please analyze this audio that arrived through the HTTP API. */
export interface RemoteAnalyzeRequest {
  requestId: string
  task: TaskId
  source: SessionSource
  mimeType: string
  audio: Uint8Array
}

/** Renderer -> main: the saved session, or an error message to return as HTTP 422. */
export interface RemoteAnalyzeResult {
  requestId: string
  session?: Session
  error?: string
}
```

- [ ] **Step 2: Session storage**

`app\src\main\sessionStore.ts`:
```ts
import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { Session } from '../shared/types'

export function sessionsFile(): string {
  return join(app.getPath('userData'), 'sessions.json')
}

export async function listSessions(): Promise<Session[]> {
  try {
    return JSON.parse(await fs.readFile(sessionsFile(), 'utf8')) as Session[]
  } catch {
    return []
  }
}

export async function saveSession(session: Session): Promise<void> {
  const all = await listSessions()
  const next = [...all.filter((s) => s.id !== session.id), session].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )
  await fs.writeFile(sessionsFile(), JSON.stringify(next, null, 2))
}
```

- [ ] **Step 3: Remote analysis bridge**

`app\src\main\remoteAnalysis.ts`:
```ts
import { ipcMain, type BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import type { RemoteAnalyzeRequest, RemoteAnalyzeResult } from '../shared/bridge'
import type { Session, SessionSource, TaskId } from '../shared/types'

const TIMEOUT_MS = 30_000

interface Pending {
  resolve: (session: Session) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

const pending = new Map<string, Pending>()

export function registerRemoteAnalysisResults(): void {
  ipcMain.on('remote:analyzeResult', (_event, result: RemoteAnalyzeResult) => {
    const entry = pending.get(result.requestId)
    if (!entry) return
    clearTimeout(entry.timer)
    pending.delete(result.requestId)
    if (result.session) entry.resolve(result.session)
    else entry.reject(new Error(result.error ?? 'Analysis failed'))
  })
}

export function analyzeInRenderer(
  win: BrowserWindow | null,
  audio: Buffer,
  mimeType: string,
  task: TaskId,
  source: SessionSource
): Promise<Session> {
  if (!win || win.isDestroyed()) return Promise.reject(new Error('The EchoMind app window is not open'))
  const requestId = randomUUID()
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId)
      reject(new Error('Analysis timed out'))
    }, TIMEOUT_MS)
    pending.set(requestId, { resolve, reject, timer })
    const request: RemoteAnalyzeRequest = { requestId, task, source, mimeType, audio: new Uint8Array(audio) }
    win.webContents.send('remote:analyzeRequest', request)
  })
}
```

- [ ] **Step 4: Main process**

Replace `app\src\main\index.ts`:
```ts
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import type { Session } from '../shared/types'
import { allowedOriginsFromEnv, startApiServer } from './apiServer'
import { analyzeInRenderer, registerRemoteAnalysisResults } from './remoteAnalysis'
import { listSessions, saveSession, sessionsFile } from './sessionStore'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 860,
    minWidth: 900,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  mainWindow = win
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null
  })
  win.on('ready-to-show', () => win.show())
  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.echomind.app')
  app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
  console.log('EchoMind sessions file:', sessionsFile())

  ipcMain.handle('sessions:list', () => listSessions())
  ipcMain.handle('sessions:save', (_event, session: Session) => saveSession(session))
  ipcMain.handle('report:exportPdf', async (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { saved: false }
    const pdf = await win.webContents.printToPDF({ pageSize: 'A4', printBackground: true })
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: `EchoMind-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    })
    if (canceled || !filePath) return { saved: false }
    await writeFile(filePath, pdf)
    void shell.openPath(filePath)
    return { saved: true, filePath }
  })

  registerRemoteAnalysisResults()
  startApiServer({
    listSessions,
    analyze: (audio, mimeType, task, source) => analyzeInRenderer(mainWindow, audio, mimeType, task, source),
    allowedOrigins: allowedOriginsFromEnv()
  })

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
```

- [ ] **Step 5: Preload bridge and types**

Replace `app\src\preload\index.ts`:
```ts
import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import type { RemoteAnalyzeRequest, RemoteAnalyzeResult } from '../shared/bridge'

contextBridge.exposeInMainWorld('api', {
  listSessions: () => ipcRenderer.invoke('sessions:list'),
  saveSession: (session: unknown) => ipcRenderer.invoke('sessions:save', session),
  exportReportPdf: () => ipcRenderer.invoke('report:exportPdf'),
  onRemoteAnalyzeRequest: (handler: (request: RemoteAnalyzeRequest) => void) => {
    const listener = (_event: IpcRendererEvent, request: RemoteAnalyzeRequest): void => handler(request)
    ipcRenderer.on('remote:analyzeRequest', listener)
    return () => ipcRenderer.removeListener('remote:analyzeRequest', listener)
  },
  sendRemoteAnalyzeResult: (result: RemoteAnalyzeResult) => ipcRenderer.send('remote:analyzeResult', result)
})
```

Replace `app\src\preload\index.d.ts`:
```ts
import type { RemoteAnalyzeRequest, RemoteAnalyzeResult } from '../shared/bridge'
import type { Session } from '../shared/types'

declare global {
  interface Window {
    api: {
      listSessions: () => Promise<Session[]>
      saveSession: (session: Session) => Promise<void>
      exportReportPdf: () => Promise<{ saved: boolean; filePath?: string }>
      /** Returns an unsubscribe function. */
      onRemoteAnalyzeRequest: (handler: (request: RemoteAnalyzeRequest) => void) => () => void
      sendRemoteAnalyzeResult: (result: RemoteAnalyzeResult) => void
    }
  }
}

export {}
```

- [ ] **Step 6: CSP that allows blob audio playback and sample fetches**

Replace `app\src\renderer\index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>EchoMind</title>
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self' blob:"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Typecheck the main/preload side**

Run: `npm run typecheck:node`
Expected: no errors.

- [ ] **Step 8: Commit**

```powershell
git add src/shared/bridge.ts src/main src/preload src/renderer/index.html
git commit -m "feat: add storage, PDF export, API startup and remote analysis bridge"
```

---

### Task 12: App shell: styles, settings, voice guide, sessions hook, Home screen

**Files:**
- Replace: `app\src\renderer\src\assets\main.css`
- Replace: `app\src\renderer\src\main.tsx`
- Replace: `app\src\renderer\src\App.tsx`
- Create: `app\src\renderer\src\lib\speech.ts`
- Create: `app\src\renderer\src\hooks\useSettings.ts`
- Create: `app\src\renderer\src\hooks\useSessions.ts`
- Create: `app\src\renderer\src\components\SettingsBar.tsx`
- Create: `app\src\renderer\src\components\ScoreGauge.tsx`
- Create: `app\src\renderer\src\components\Disclaimer.tsx`
- Create: `app\src\renderer\src\screens\HomeScreen.tsx`

- [ ] **Step 1: Styles (including large-text, high-contrast and print modes)**

Replace `app\src\renderer\src\assets\main.css`:
```css
:root {
  --bg: #f5f7fb;
  --surface: #ffffff;
  --text: #1d2433;
  --muted: #5d6679;
  --border: #dde3ee;
  --accent: #3b6fd8;
  --accent-soft: #e6eefc;
  --green: #2e9e6a;
  --yellow: #d99a1e;
  --red: #d64545;
  --pause: rgba(240, 160, 40, 0.35);
  --radius: 16px;
  --font-scale: 1;
  color-scheme: light;
}
:root.large-text { --font-scale: 1.25; }
:root.high-contrast {
  --bg: #000; --surface: #000; --text: #fff; --muted: #e6e6e6; --border: #fff;
  --accent: #ffd400; --accent-soft: #222; --pause: rgba(255, 120, 0, 0.55);
  color-scheme: dark;
}

* { box-sizing: border-box; }
html { font-size: calc(17px * var(--font-scale)); }
body {
  margin: 0;
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.5;
}
h1 { font-size: 1.8rem; margin: 0 0 0.4rem; }
h2 { font-size: 1.3rem; margin: 0 0 0.75rem; }
h3 { font-size: 1.1rem; margin: 0 0 0.5rem; }

.app-header {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;
  padding: 0.75rem 1.5rem; background: var(--surface); border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 1;
}
.brand { font: inherit; font-size: 1.3rem; font-weight: 700; color: var(--accent); background: none; border: none; cursor: pointer; }
.settings-bar { display: flex; gap: 1rem; flex-wrap: wrap; }
.toggle { display: flex; gap: 0.4rem; align-items: center; font-size: 0.9rem; cursor: pointer; }
.toggle input { width: 1.1rem; height: 1.1rem; }
.app-main { max-width: 1000px; margin: 0 auto; padding: 1.5rem; }

.stack > * + * { margin-top: 1.25rem; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
.center { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; text-align: center; }
.hero { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; }
.hero-score { text-align: center; }
.lead { font-size: 1.15rem; color: var(--muted); margin: 0.25rem 0 1rem; }
.muted { color: var(--muted); }
.small { font-size: 0.85rem; }
.row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }

.btn {
  display: inline-block; font: inherit; font-weight: 600; padding: 0.75rem 1.4rem; border-radius: 999px;
  border: 2px solid var(--accent); background: var(--accent); color: #fff; cursor: pointer; text-decoration: none;
}
:root.high-contrast .btn { color: #000; }
.btn.secondary { background: var(--surface); color: var(--accent); }
.btn.ghost { background: transparent; color: var(--accent); border-color: transparent; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
button:focus-visible, a:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
.link { background: none; border: none; color: var(--accent); font: inherit; cursor: pointer; padding: 0; }

.task-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; }
.task-card {
  display: flex; flex-direction: column; gap: 0.4rem; text-align: left; font: inherit; color: var(--text);
  cursor: pointer; transition: transform 0.15s, border-color 0.15s;
}
.task-card:hover { transform: translateY(-2px); border-color: var(--accent); }
.task-icon { font-size: 2rem; }

.passage { font-size: 1.3rem; line-height: 1.7; background: var(--accent-soft); border-radius: 12px; padding: 1rem 1.25rem; margin: 0 0 1rem; }
.live-wave { width: 100%; max-width: 800px; height: 140px; background: var(--accent-soft); border-radius: 12px; }
.timer { font-size: 1.4rem; font-variant-numeric: tabular-nums; margin: 0; }
.btn.record { font-size: 1.2rem; padding: 1rem 2.5rem; background: var(--red); border-color: var(--red); color: #fff; }
.btn.record.recording { animation: pulse 1.2s infinite; }
@keyframes pulse { 50% { box-shadow: 0 0 0 12px rgba(214, 69, 69, 0.2); } }
.error { color: var(--red); font-weight: 600; }

.spinner { width: 48px; height: 48px; border: 5px solid var(--accent-soft); border-top-color: var(--accent); border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.steps { list-style: none; padding: 0; text-align: left; }
.steps li { color: var(--muted); padding: 0.2rem 0; }
.steps li.active { color: var(--text); font-weight: 600; }
.steps li.done { color: var(--green); }

.gauge-track { fill: none; stroke: var(--border); stroke-width: 8; }
.gauge-value { fill: none; stroke-width: 8; stroke-linecap: round; transition: stroke-dasharray 0.8s ease; }
.band-green .gauge-value { stroke: var(--green); }
.band-yellow .gauge-value { stroke: var(--yellow); }
.band-red .gauge-value { stroke: var(--red); }
.gauge-text { font-size: 26px; font-weight: 700; fill: var(--text); }
.gauge-sub { font-size: 9px; fill: var(--muted); }
.band-pill { display: inline-block; padding: 0.2rem 0.8rem; border-radius: 999px; font-weight: 700; color: #fff; margin: 0 0 0.5rem; }
.band-pill.band-green { background: var(--green); }
.band-pill.band-yellow { background: var(--yellow); }
.band-pill.band-red { background: var(--red); }
.sync-badge { display: inline-block; margin-top: 0.5rem; font-size: 0.9rem; color: var(--muted); }
.sync-badge.synced { color: var(--green); font-weight: 600; }

.pause-map { margin: 0 0 1rem; }
.pause-map canvas { width: 100%; height: 160px; background: var(--accent-soft); border-radius: 12px; }
.pause-map figcaption { margin-top: 0.4rem; color: var(--muted); font-size: 0.9rem; }
.swatch { display: inline-block; width: 0.9rem; height: 0.9rem; border-radius: 3px; vertical-align: middle; margin-right: 0.3rem; }
.pause-swatch { background: var(--pause); }
audio { width: 100%; margin-bottom: 0.5rem; }

.metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 1rem; }
.metric-card { background: var(--surface); border: 1px solid var(--border); border-left: 6px solid var(--green); border-radius: 12px; padding: 1rem; }
.metric-card.status-watch { border-left-color: var(--yellow); }
.metric-card.status-flag { border-left-color: var(--red); }
.metric-top { display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--muted); }
.metric-value { font-size: 1.1rem; font-weight: 700; margin: 0.35rem 0; }

.transcript { font-size: 1.15rem; line-height: 2; }
.tok { margin-right: 0.3em; border-radius: 4px; }
.tok-filler { background: rgba(217, 154, 30, 0.25); padding: 0 0.25em; }
.tok-repetition { text-decoration: underline wavy #8a5cd6; text-underline-offset: 4px; }
.tok-wordfinding { background: rgba(214, 69, 69, 0.18); padding: 0 0.25em; font-style: italic; }
.tok-pause { color: var(--muted); background: var(--accent-soft); padding: 0 0.4em; }
.legend { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; color: var(--muted); }

.deltas { list-style: none; padding: 0; margin: 0; }
.deltas li { padding: 0.3rem 0; }
.deltas li.worse { color: var(--red); font-weight: 600; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { text-align: left; padding: 0.55rem 0.5rem; border-bottom: 1px solid var(--border); }
.table th { color: var(--muted); font-weight: 600; font-size: 0.85rem; }
.disclaimer { color: var(--muted); border-top: 1px solid var(--border); padding-top: 1rem; }

.report { background: var(--surface); padding: 2rem; border-radius: var(--radius); }
.report section { margin-top: 1.5rem; }
.report-summary { display: flex; gap: 1.5rem; align-items: center; }

@media print {
  :root, :root.high-contrast {
    --bg: #fff; --surface: #fff; --text: #1d2433; --muted: #5d6679; --border: #dde3ee;
    --accent: #3b6fd8; --accent-soft: #e6eefc; --font-scale: 1;
  }
  .no-print { display: none !important; }
  .app-main { max-width: none; padding: 0; }
  .report { padding: 0; border-radius: 0; }
  section { break-inside: avoid; }
}
```

- [ ] **Step 2: React entry**

Replace `app\src\renderer\src\main.tsx`:
```tsx
import './assets/main.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 3: Speech helper**

`app\src\renderer\src\lib\speech.ts`:
```ts
export function speak(text: string): void {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel()
}
```

- [ ] **Step 4: Settings hook and bar**

`app\src\renderer\src\hooks\useSettings.ts`:
```ts
import { useEffect, useState } from 'react'

export interface Settings {
  largeText: boolean
  highContrast: boolean
  voiceGuide: boolean
}

const KEY = 'echomind-settings'
const DEFAULTS: Settings = { largeText: false, highContrast: false, voiceGuide: true }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function useSettings(): { settings: Settings; toggle: (key: keyof Settings) => void } {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('large-text', settings.largeText)
    root.classList.toggle('high-contrast', settings.highContrast)
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      // Storage unavailable: settings still apply for this session.
    }
  }, [settings])

  const toggle = (key: keyof Settings): void => setSettings((s) => ({ ...s, [key]: !s[key] }))
  return { settings, toggle }
}
```

`app\src\renderer\src\components\SettingsBar.tsx`:
```tsx
import type { Settings } from '../hooks/useSettings'

const ITEMS: { key: keyof Settings; label: string }[] = [
  { key: 'largeText', label: 'Large text' },
  { key: 'highContrast', label: 'High contrast' },
  { key: 'voiceGuide', label: 'Read instructions aloud' }
]

interface Props {
  settings: Settings
  onToggle: (key: keyof Settings) => void
}

export function SettingsBar({ settings, onToggle }: Props): JSX.Element {
  return (
    <div className="settings-bar">
      {ITEMS.map((item) => (
        <label key={item.key} className="toggle">
          <input type="checkbox" checked={settings[item.key]} onChange={() => onToggle(item.key)} />
          {item.label}
        </label>
      ))}
    </div>
  )
}
```

> If TypeScript reports `Cannot find namespace 'JSX'` (React 19 types), replace `JSX.Element` with `React.JSX.Element` and add `import type React from 'react'`, or drop the return type annotations. Apply the same fix in every component in this plan.

- [ ] **Step 5: Sessions hook (loads and seeds on first run)**

`app\src\renderer\src\hooks\useSessions.ts`:
```ts
import { useCallback, useEffect, useState } from 'react'
import { generateSeedSessions } from '../lib/seed'
import type { Session } from '../lib/types'

let seeding: Promise<void> | null = null

async function ensureSeeded(): Promise<void> {
  const existing = await window.api.listSessions()
  if (existing.length > 0) return
  for (const session of generateSeedSessions(new Date())) await window.api.saveSession(session)
}

export function useSessions(): {
  sessions: Session[]
  loading: boolean
  error: string | null
  add: (session: Session) => Promise<void>
} {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setSessions(await window.api.listSessions())
  }, [])

  useEffect(() => {
    seeding ??= ensureSeeded()
    seeding
      .then(refresh)
      .catch(() => setError('Could not load saved check-ins.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const add = useCallback(
    async (session: Session) => {
      await window.api.saveSession(session)
      await refresh()
    },
    [refresh]
  )

  return { sessions, loading, error, add }
}
```

- [ ] **Step 6: Score gauge and disclaimer**

`app\src\renderer\src\components\ScoreGauge.tsx`:
```tsx
import type { Band } from '../lib/types'

const R = 42
const CIRCUMFERENCE = 2 * Math.PI * R

interface Props {
  score: number
  band: Band
  size?: number
}

export function ScoreGauge({ score, band, size = 180 }: Props): JSX.Element {
  return (
    <svg className={`gauge band-${band}`} width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={`Score ${score} out of 100`}>
      <circle cx="50" cy="50" r={R} className="gauge-track" />
      <circle
        cx="50"
        cy="50"
        r={R}
        className="gauge-value"
        strokeDasharray={`${(score / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" className="gauge-text">{score}</text>
      <text x="50" y="68" textAnchor="middle" className="gauge-sub">/ 100</text>
    </svg>
  )
}
```

`app\src\renderer\src\components\Disclaimer.tsx`:
```tsx
export function Disclaimer(): JSX.Element {
  return (
    <p className="disclaimer small">
      EchoMind is a screening aid, not a diagnosis. Speech changes can have many causes, like tiredness, a cold, or
      stress. If you notice ongoing changes, talk to a doctor.
    </p>
  )
}
```

- [ ] **Step 7: Home screen**

`app\src\renderer\src\screens\HomeScreen.tsx`:
```tsx
import { Disclaimer } from '../components/Disclaimer'
import { ScoreGauge } from '../components/ScoreGauge'
import { formatDate } from '../lib/format'
import { TASK_LIST } from '../lib/scripts'
import type { Session, TaskId } from '../lib/types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

interface Props {
  sessions: Session[]
  onStart: (task: TaskId) => void
  onHistory: () => void
  onReport: () => void
}

export function HomeScreen({ sessions, onStart, onHistory, onReport }: Props): JSX.Element {
  const latest = sessions[sessions.length - 1]
  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <h1>{greeting()}</h1>
          <p className="lead">A one-minute voice check-in helps you and your family notice changes early.</p>
        </div>
        {latest && (
          <div className="hero-score">
            <ScoreGauge score={latest.score.score} band={latest.score.band} size={140} />
            <p className="muted small">Last check-in {formatDate(latest.createdAt)}</p>
          </div>
        )}
      </section>
      <h2>Start today&apos;s check-in</h2>
      <div className="task-grid">
        {TASK_LIST.map((task) => (
          <button key={task.id} className="card task-card" onClick={() => onStart(task.id)}>
            <span className="task-icon">{task.icon}</span>
            <strong>{task.title}</strong>
            <span className="muted">{task.summary}</span>
          </button>
        ))}
      </div>
      <div className="row">
        <button className="btn secondary" onClick={onHistory}>View history</button>
        <button className="btn secondary" onClick={onReport}>Doctor report</button>
      </div>
      <Disclaimer />
    </div>
  )
}
```

- [ ] **Step 8: App shell (home only for now; Task 18 wires the rest)**

Replace `app\src\renderer\src\App.tsx`:
```tsx
import { SettingsBar } from './components/SettingsBar'
import { useSessions } from './hooks/useSessions'
import { useSettings } from './hooks/useSettings'
import { HomeScreen } from './screens/HomeScreen'

export default function App(): JSX.Element {
  const { settings, toggle } = useSettings()
  const { sessions, loading, error } = useSessions()

  return (
    <div className="app">
      <header className="app-header no-print">
        <span className="brand">EchoMind</span>
        <SettingsBar settings={settings} onToggle={toggle} />
      </header>
      <main className="app-main">
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <HomeScreen sessions={sessions} onStart={() => undefined} onHistory={() => undefined} onReport={() => undefined} />
        )}
      </main>
    </div>
  )
}
```

- [ ] **Step 9: Verify in the app and through the API**

Run: `npm run dev`
Expected:
- The Home screen shows a greeting, a score gauge in the 80s–90s (from the seeded history), and three task cards.
- "Large text" and "High contrast" toggle correctly.
- The terminal prints the sessions file path and `EchoMind API listening on http://127.0.0.1:4317/api`.

While the app is running, in a second PowerShell window:
```powershell
curl.exe http://127.0.0.1:4317/api/sessions/latest
```
Expected: a JSON session with `"id":"seed-11"`, `score.label`, and `baseline.status` equal to `"ready"`.

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 10: Commit**

```powershell
git add src/renderer
git commit -m "feat: add app shell, accessibility settings, seeded home screen"
```

---

### Task 13: Recording flow: recorder hook, live waveform, pipeline, Record and Analyzing screens

**Files:**
- Create: `app\src\renderer\src\hooks\useRecorder.ts`
- Create: `app\src\renderer\src\components\LiveWaveform.tsx`
- Create: `app\src\renderer\src\lib\pipeline.ts`
- Create: `app\src\renderer\src\lib\sync.ts`
- Create: `app\src\renderer\src\screens\RecordScreen.tsx`
- Create: `app\src\renderer\src\screens\AnalyzingScreen.tsx`
- Create: `app\src\renderer\public\samples\.gitkeep`

- [ ] **Step 1: Recorder hook**

`app\src\renderer\src\hooks\useRecorder.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_RECORD_SEC = 60

interface LiveRecording {
  recorder: MediaRecorder
  stream: MediaStream
  ctx: AudioContext
  timer: number
}

export function useRecorder(onComplete: (audio: Blob) => void): {
  recording: boolean
  elapsed: number
  error: string | null
  analyser: AnalyserNode | null
  start: () => Promise<void>
  stop: () => void
} {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const live = useRef<LiveRecording | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const release = useCallback(() => {
    const current = live.current
    if (!current) return
    window.clearInterval(current.timer)
    current.stream.getTracks().forEach((track) => track.stop())
    void current.ctx.close()
    live.current = null
    setAnalyser(null)
  }, [])

  const start = useCallback(async () => {
    if (live.current) return
    setError(null)
    setElapsed(0)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError('We could not access a microphone. Check that one is connected and allowed, or use a demo sample below.')
      return
    }
    const ctx = new AudioContext()
    const node = ctx.createAnalyser()
    node.fftSize = 2048
    ctx.createMediaStreamSource(stream).connect(node)

    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      release()
      setRecording(false)
      onCompleteRef.current(new Blob(chunks, { type: 'audio/webm' }))
    }

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const sec = (Date.now() - startedAt) / 1000
      setElapsed(Math.min(sec, MAX_RECORD_SEC))
      if (sec >= MAX_RECORD_SEC && recorder.state === 'recording') recorder.stop()
    }, 200)

    live.current = { recorder, stream, ctx, timer }
    recorder.start()
    setAnalyser(node)
    setRecording(true)
  }, [release])

  const stop = useCallback(() => {
    const recorder = live.current?.recorder
    if (recorder && recorder.state === 'recording') recorder.stop()
  }, [])

  useEffect(
    () => () => {
      // Leaving the screen mid-recording: discard without analyzing.
      const current = live.current
      if (!current) return
      current.recorder.onstop = null
      if (current.recorder.state === 'recording') current.recorder.stop()
      release()
    },
    [release]
  )

  return { recording, elapsed, error, analyser, start, stop }
}
```

- [ ] **Step 2: Live waveform**

`app\src\renderer\src\components\LiveWaveform.tsx`:
```tsx
import { useEffect, useRef } from 'react'

export function LiveWaveform({ analyser }: { analyser: AnalyserNode | null }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    const data = new Uint8Array(2048)
    let frame = 0

    const draw = (): void => {
      g.clearRect(0, 0, canvas.width, canvas.height)
      g.strokeStyle = color
      g.lineWidth = 3
      g.beginPath()
      if (analyser) {
        analyser.getByteTimeDomainData(data)
        for (let i = 0; i < data.length; i++) {
          const x = (i / (data.length - 1)) * canvas.width
          const y = (data[i] / 255) * canvas.height
          if (i === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
      } else {
        g.moveTo(0, canvas.height / 2)
        g.lineTo(canvas.width, canvas.height / 2)
      }
      g.stroke()
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [analyser])

  return <canvas ref={canvasRef} className="live-wave" width={800} height={140} />
}
```

- [ ] **Step 3: Sharing badge delay**

`app\src\renderer\src\lib\sync.ts`:
```ts
// Short delay before the "available on the caregiver website" badge turns green. The data is already
// available through the local API; the delay just makes the hand-off visible in the demo.
export const SYNC_DELAY_MS = 1200

export function waitForShareAnimation(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SYNC_DELAY_MS))
}
```

- [ ] **Step 4: Analysis pipeline (produces a display-ready Session)**

`app\src\renderer\src\lib\pipeline.ts`:
```ts
import { analyzeAcoustics } from './acoustics'
import { compareToBaseline } from './baseline'
import { toWaveform } from './peaks'
import { ScriptedProvider, type AnalysisProvider } from './provider'
import { TASKS, type ScriptVariant } from './scripts'
import { scoreSession } from './scoring'
import type { Session, SessionCore, SessionSource, TaskId } from './types'

const MIN_SPEAKING_SEC = 3
const provider: AnalysisProvider = new ScriptedProvider()

export interface AnalysisInput {
  audio: Blob
  task: TaskId
  source: SessionSource
}

export interface AnalysisOutput {
  session: Session
  /** Object URL for in-app playback; revoke it when no longer shown. */
  audioUrl: string
}

async function decodeAudio(audio: Blob): Promise<{ samples: Float32Array; sampleRate: number }> {
  const ctx = new AudioContext()
  try {
    const buffer = await ctx.decodeAudioData(await audio.arrayBuffer())
    return { samples: buffer.getChannelData(0), sampleRate: buffer.sampleRate }
  } catch {
    throw new Error('We could not read that recording. Please try recording again.')
  } finally {
    void ctx.close()
  }
}

/** Used by both the in-app flow and website requests arriving through the local API. */
export async function runAnalysis({ audio, task, source }: AnalysisInput, history: Session[]): Promise<AnalysisOutput> {
  const { samples, sampleRate } = await decodeAudio(audio)
  const acoustics = analyzeAcoustics(samples, sampleRate)
  if (acoustics.speakingTimeSec < MIN_SPEAKING_SEC) {
    throw new Error("We couldn't hear enough speech. Try a quieter spot and sit a little closer to the microphone.")
  }
  const linguistic = await provider.analyze({ audio, task, source, acoustics })
  const core: SessionCore = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    task,
    taskTitle: TASKS[task].title,
    source,
    acoustics,
    linguistic,
    score: scoreSession(acoustics, linguistic),
    waveform: toWaveform(samples)
  }
  const session: Session = { ...core, baseline: compareToBaseline(core, history) }
  return { session, audioUrl: URL.createObjectURL(audio) }
}

export async function loadSample(task: TaskId, variant: ScriptVariant): Promise<Blob> {
  const file = `${task}-${variant}.webm`
  const res = await fetch(`./samples/${file}`)
  // Vite's dev server answers missing files with index.html, so check the content type too.
  if (!res.ok || res.headers.get('content-type')?.includes('text/html')) {
    throw new Error(`Demo sample "${file}" is missing. Record it first (see Task 17 of the plan).`)
  }
  return res.blob()
}
```

- [ ] **Step 5: Record screen**

`app\src\renderer\src\screens\RecordScreen.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { LiveWaveform } from '../components/LiveWaveform'
import { MAX_RECORD_SEC, useRecorder } from '../hooks/useRecorder'
import { formatDuration } from '../lib/format'
import { loadSample } from '../lib/pipeline'
import { TASKS, type ScriptVariant } from '../lib/scripts'
import { speak, stopSpeaking } from '../lib/speech'
import type { SessionSource, TaskId } from '../lib/types'

interface Props {
  task: TaskId
  error?: string
  voiceGuide: boolean
  onRecorded: (audio: Blob, source: SessionSource) => void
  onBack: () => void
}

export function RecordScreen({ task, error, voiceGuide, onRecorded, onBack }: Props): JSX.Element {
  const def = TASKS[task]
  const [message, setMessage] = useState<string | null>(error ?? null)
  const recorder = useRecorder((audio) => onRecorded(audio, 'live'))

  useEffect(() => {
    if (voiceGuide) speak(def.instructions)
    return () => stopSpeaking()
  }, [def, voiceGuide])

  const startRecording = (): void => {
    stopSpeaking()
    setMessage(null)
    void recorder.start()
  }

  const analyzeSample = async (variant: ScriptVariant): Promise<void> => {
    setMessage(null)
    try {
      onRecorded(await loadSample(task, variant), variant === 'healthy' ? 'sample-healthy' : 'sample-markers')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e))
    }
  }

  const shownError = message ?? recorder.error

  return (
    <div className="stack">
      <button className="link" onClick={onBack}>← Back</button>
      <section className="card">
        <h1>{def.icon} {def.title}</h1>
        <p className="lead">{def.instructions}</p>
        {def.passage && <blockquote className="passage">{def.passage}</blockquote>}
        <button className="btn ghost" onClick={() => speak(def.instructions)}>🔊 Repeat instructions</button>
      </section>
      <section className="card center">
        <LiveWaveform analyser={recorder.analyser} />
        <p className="timer">{formatDuration(recorder.elapsed)} / {formatDuration(MAX_RECORD_SEC)}</p>
        {recorder.recording ? (
          <button className="btn record recording" onClick={recorder.stop}>■ Stop</button>
        ) : (
          <button className="btn record" onClick={startRecording}>● Start recording</button>
        )}
        {shownError && <p className="error" role="alert">{shownError}</p>}
      </section>
      <section className="card">
        <h3>Demo samples</h3>
        <p className="muted">No microphone handy? Analyze a bundled recording instead.</p>
        <div className="row">
          <button className="btn secondary" disabled={recorder.recording} onClick={() => void analyzeSample('healthy')}>
            Typical speech sample
          </button>
          <button className="btn secondary" disabled={recorder.recording} onClick={() => void analyzeSample('markers')}>
            Sample with memory-related markers
          </button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Analyzing screen**

`app\src\renderer\src\screens\AnalyzingScreen.tsx`:
```tsx
import { useEffect, useState } from 'react'

const STEPS = [
  'Loading your recording',
  'Detecting pauses',
  'Measuring speech rate',
  'Tracking pitch changes',
  'Reviewing word patterns',
  'Comparing with your baseline'
]

/** Minimum time the analyzing screen stays up, so each step is readable during the demo. */
export const ANALYZING_MS = 2400

export function AnalyzingScreen(): JSX.Element {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = window.setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      ANALYZING_MS / STEPS.length
    )
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="card center">
      <div className="spinner" />
      <h2>Analyzing your speech…</h2>
      <ol className="steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'done' : i === step ? 'active' : ''}>
            {i < step ? '✓ ' : ''}
            {label}
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 7: Samples folder placeholder**

```powershell
New-Item -ItemType Directory -Force src\renderer\public\samples
New-Item -ItemType File src\renderer\public\samples\.gitkeep
```

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: no errors. (The screens aren't reachable in the UI until Task 18.)

- [ ] **Step 9: Commit**

```powershell
git add src/renderer
git commit -m "feat: add recorder, analysis pipeline, record and analyzing screens"
```

---

### Task 14: Results screen with pause map, baseline, metric cards, transcript

Every component here renders straight from the stored `Session`, which is the same data the website gets.

**Files:**
- Create: `app\src\renderer\src\components\PauseMapWaveform.tsx`
- Create: `app\src\renderer\src\components\MetricCard.tsx`
- Create: `app\src\renderer\src\components\Transcript.tsx`
- Create: `app\src\renderer\src\components\BaselineSummary.tsx`
- Create: `app\src\renderer\src\components\SyncBadge.tsx`
- Create: `app\src\renderer\src\screens\ResultsScreen.tsx`

- [ ] **Step 1: Pause map waveform (draws from stored waveform peaks)**

`app\src\renderer\src\components\PauseMapWaveform.tsx`:
```tsx
import { useEffect, useRef } from 'react'
import type { Pause } from '../lib/types'

interface Props {
  waveform: number[]
  durationSec: number
  pauses: Pause[]
}

export function PauseMapWaveform({ waveform, durationSec, pauses }: Props): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g || durationSec <= 0) return
    const { width, height } = canvas
    const css = getComputedStyle(document.documentElement)
    g.clearRect(0, 0, width, height)

    g.fillStyle = css.getPropertyValue('--pause').trim()
    for (const p of pauses) {
      const x0 = (p.startSec / durationSec) * width
      const x1 = (p.endSec / durationSec) * width
      g.fillRect(x0, 0, Math.max(2, x1 - x0), height)
    }

    const barWidth = width / Math.max(1, waveform.length)
    g.fillStyle = css.getPropertyValue('--accent').trim()
    waveform.forEach((v, i) => {
      const h = Math.max(2, v * (height - 10))
      g.fillRect(i * barWidth, (height - h) / 2, Math.max(1, barWidth - 1), h)
    })
  }, [waveform, durationSec, pauses])

  return (
    <figure className="pause-map">
      <canvas ref={ref} width={960} height={160} />
      <figcaption>
        <span className="swatch pause-swatch" />
        Pauses longer than 0.25 s ({pauses.length} found)
      </figcaption>
    </figure>
  )
}
```

- [ ] **Step 2: Metric card**

`app\src\renderer\src\components\MetricCard.tsx`:
```tsx
import type { ScoreFactor } from '../lib/types'

export function MetricCard({ factor }: { factor: ScoreFactor }): JSX.Element {
  const status = factor.points === 0 ? 'ok' : factor.points < 5 ? 'watch' : 'flag'
  const statusText = { ok: 'Typical', watch: 'Slight change', flag: 'Notable' }[status]
  return (
    <div className={`metric-card status-${status}`}>
      <div className="metric-top">
        <span>{factor.label}</span>
        <span>{statusText}</span>
      </div>
      <div className="metric-value">{factor.detail}</div>
      <p className="muted small">{factor.explanation}</p>
    </div>
  )
}
```

- [ ] **Step 3: Transcript**

`app\src\renderer\src\components\Transcript.tsx`:
```tsx
import type { TokenKind, TranscriptToken } from '../lib/types'

const KIND_TITLE: Record<TokenKind, string | undefined> = {
  word: undefined,
  filler: 'Filler word',
  repetition: 'Repeated word',
  wordfinding: 'Searching for a word',
  pause: 'Long pause'
}

export function Transcript({ tokens }: { tokens: TranscriptToken[] }): JSX.Element {
  return (
    <div>
      <p className="transcript">
        {tokens.map((t, i) => (
          <span key={i} className={`tok tok-${t.kind}`} title={KIND_TITLE[t.kind]}>
            {t.text}
          </span>
        ))}
      </p>
      <div className="legend small">
        <span className="tok tok-filler">um</span> filler
        <span className="tok tok-repetition">the</span> repeated
        <span className="tok tok-wordfinding">thing</span> word-finding
        <span className="tok tok-pause">…</span> long pause
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Baseline summary**

`app\src\renderer\src\components\BaselineSummary.tsx`:
```tsx
import type { BaselineResult } from '../lib/types'

export function BaselineSummary({ result }: { result: BaselineResult }): JSX.Element {
  if (result.status === 'building') {
    return (
      <section className="card">
        <h3>Your personal baseline</h3>
        <p className="muted">
          EchoMind compares you with yourself, not with other people. {result.remaining} more check-in
          {result.remaining === 1 ? '' : 's'} of this task will set your baseline.
        </p>
      </section>
    )
  }
  return (
    <section className="card">
      <h3>Compared with your baseline</h3>
      <ul className="deltas">
        {result.deltas.map((d) => (
          <li key={d.key} className={d.worse ? 'worse' : ''}>
            {d.worse ? '⚠ ' : '✓ '}
            {d.text}
          </li>
        ))}
      </ul>
      <p className="muted small">Your baseline is the average of your first three check-ins of this task.</p>
    </section>
  )
}
```

- [ ] **Step 5: Sharing badge**

`app\src\renderer\src\components\SyncBadge.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { waitForShareAnimation } from '../lib/sync'

export function SyncBadge(): JSX.Element {
  const [shared, setShared] = useState(false)

  useEffect(() => {
    let alive = true
    void waitForShareAnimation().then(() => {
      if (alive) setShared(true)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <span className={`sync-badge ${shared ? 'synced' : ''}`}>
      {shared ? '✓ Available on the caregiver website' : '⟳ Sharing with the caregiver website…'}
    </span>
  )
}
```

- [ ] **Step 6: Results screen**

`app\src\renderer\src\screens\ResultsScreen.tsx`:
```tsx
import { useEffect } from 'react'
import { BaselineSummary } from '../components/BaselineSummary'
import { Disclaimer } from '../components/Disclaimer'
import { MetricCard } from '../components/MetricCard'
import { PauseMapWaveform } from '../components/PauseMapWaveform'
import { ScoreGauge } from '../components/ScoreGauge'
import { SyncBadge } from '../components/SyncBadge'
import { Transcript } from '../components/Transcript'
import { formatDate, sourceLabel } from '../lib/format'
import type { AnalysisOutput } from '../lib/pipeline'

interface Props {
  view: AnalysisOutput
  onHome: () => void
  onHistory: () => void
  onReport: () => void
}

export function ResultsScreen({ view, onHome, onHistory, onReport }: Props): JSX.Element {
  const { session, audioUrl } = view
  const { score, acoustics, linguistic } = session

  useEffect(() => () => URL.revokeObjectURL(audioUrl), [audioUrl])

  return (
    <div className="stack">
      <section className="card hero">
        <ScoreGauge score={score.score} band={score.band} />
        <div>
          <p className={`band-pill band-${score.band}`}>{score.label}</p>
          <h1>{score.message}</h1>
          <p className="muted">
            {session.taskTitle} · {formatDate(session.createdAt)} · {sourceLabel(session.source)}
          </p>
          <SyncBadge />
        </div>
      </section>

      <BaselineSummary result={session.baseline} />

      <section className="card">
        <h2>Where you paused</h2>
        <PauseMapWaveform waveform={session.waveform} durationSec={acoustics.durationSec} pauses={acoustics.pauses} />
        <audio controls src={audioUrl} />
        <a className="btn ghost" href={audioUrl} download={`${session.task}-${session.source}.webm`}>
          Download recording
        </a>
      </section>

      <section>
        <h2>Speech markers</h2>
        <div className="metric-grid">
          {score.factors.map((f) => (
            <MetricCard key={f.label} factor={f} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>What you said</h2>
        <Transcript tokens={linguistic.transcript} />
        <ul>
          {linguistic.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="muted small">Transcript from the demo language provider. Acoustic markers are measured from your recording.</p>
      </section>

      <div className="row">
        <button className="btn" onClick={onHome}>Done</button>
        <button className="btn secondary" onClick={onHistory}>View history</button>
        <button className="btn secondary" onClick={onReport}>Doctor report</button>
      </div>
      <Disclaimer />
    </div>
  )
}
```

- [ ] **Step 7: Typecheck and commit**

Run: `npm run typecheck`
Expected: no errors.

```powershell
git add src/renderer/src
git commit -m "feat: add results screen with pause map, baseline and transcript"
```

---

### Task 15: History screen with trend chart

**Files:**
- Create: `app\src\renderer\src\components\TrendChart.tsx`
- Create: `app\src\renderer\src\components\SessionTable.tsx`
- Create: `app\src\renderer\src\screens\HistoryScreen.tsx`

- [ ] **Step 1: Trend chart**

`app\src\renderer\src\components\TrendChart.tsx`:
```tsx
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '../lib/format'
import { GREEN_MIN, YELLOW_MIN } from '../lib/scoring'
import type { Session } from '../lib/types'

interface Props {
  sessions: Session[]
  animate?: boolean
  height?: number
}

export function TrendChart({ sessions, animate = true, height = 260 }: Props): JSX.Element {
  const data = sessions.map((s) => ({ date: formatDate(s.createdAt), score: s.score.score }))
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted)" />
          <YAxis domain={[0, 100]} stroke="var(--muted)" />
          <Tooltip />
          <ReferenceLine y={GREEN_MIN} stroke="var(--green)" strokeDasharray="4 4" />
          <ReferenceLine y={YELLOW_MIN} stroke="var(--red)" strokeDasharray="4 4" />
          <Line type="monotone" dataKey="score" stroke="var(--accent)" strokeWidth={3} dot={{ r: 4 }} isAnimationActive={animate} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Session table (shared by History and Report)**

`app\src\renderer\src\components\SessionTable.tsx`:
```tsx
import { formatDate, sourceLabel } from '../lib/format'
import { fillersPer100 } from '../lib/scoring'
import type { Session } from '../lib/types'

export function SessionTable({ sessions }: { sessions: Session[] }): JSX.Element {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Task</th>
          <th>Score</th>
          <th>Speech rate</th>
          <th>Avg pause</th>
          <th>Fillers / 100 words</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>{formatDate(s.createdAt)}</td>
            <td>{s.taskTitle}</td>
            <td><span className={`band-pill band-${s.score.band}`}>{s.score.score}</span></td>
            <td>{s.acoustics.speechRate.toFixed(1)} /s</td>
            <td>{s.acoustics.meanPauseSec.toFixed(2)} s</td>
            <td>{fillersPer100(s.linguistic).toFixed(1)}</td>
            <td>{sourceLabel(s.source)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 3: History screen**

`app\src\renderer\src\screens\HistoryScreen.tsx`:
```tsx
import { SessionTable } from '../components/SessionTable'
import { TrendChart } from '../components/TrendChart'
import type { Session } from '../lib/types'

interface Props {
  sessions: Session[]
  onBack: () => void
  onReport: () => void
}

export function HistoryScreen({ sessions, onBack, onReport }: Props): JSX.Element {
  return (
    <div className="stack">
      <button className="link" onClick={onBack}>← Back</button>
      <section className="card">
        <h1>Your check-in history</h1>
        <p className="muted">Family members see this same trend on the EchoMind caregiver website.</p>
        <TrendChart sessions={sessions} />
      </section>
      <section className="card">
        <SessionTable sessions={[...sessions].reverse()} />
      </section>
      <button className="btn" onClick={onReport}>Create doctor report</button>
    </div>
  )
}
```

- [ ] **Step 4: Typecheck and commit**

Run: `npm run typecheck`
Expected: no errors.

```powershell
git add src/renderer/src
git commit -m "feat: add history screen with score trend chart"
```

---

### Task 16: Doctor report and PDF export

**Files:**
- Create: `app\src\renderer\src\screens\ReportScreen.tsx`

- [ ] **Step 1: Report screen**

`app\src\renderer\src\screens\ReportScreen.tsx`:
```tsx
import { useState } from 'react'
import { BaselineSummary } from '../components/BaselineSummary'
import { Disclaimer } from '../components/Disclaimer'
import { ScoreGauge } from '../components/ScoreGauge'
import { SessionTable } from '../components/SessionTable'
import { TrendChart } from '../components/TrendChart'
import { formatDate } from '../lib/format'
import type { Session } from '../lib/types'

const RECENT_COUNT = 8

interface Props {
  sessions: Session[]
  onBack: () => void
}

export function ReportScreen({ sessions, onBack }: Props): JSX.Element {
  const [status, setStatus] = useState<string | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="stack">
        <button className="link" onClick={onBack}>← Back</button>
        <p>No check-ins yet. Complete one to create a report.</p>
      </div>
    )
  }

  const first = sessions[0]
  const latest = sessions[sessions.length - 1]
  const flagged = latest.score.factors.filter((f) => f.points > 0)

  const savePdf = async (): Promise<void> => {
    setStatus('Saving…')
    try {
      const result = await window.api.exportReportPdf()
      setStatus(result.saved ? `Saved to ${result.filePath}` : null)
    } catch {
      setStatus('Could not save the PDF. Please try again.')
    }
  }

  return (
    <div className="report">
      <div className="row no-print">
        <button className="link" onClick={onBack}>← Back</button>
        <button className="btn" onClick={() => void savePdf()}>Save as PDF</button>
        {status && <span className="muted">{status}</span>}
      </div>

      <header>
        <h1>EchoMind speech check-in report</h1>
        <p className="muted">
          {sessions.length} check-ins · {formatDate(first.createdAt)} – {formatDate(latest.createdAt)} · Generated{' '}
          {formatDate(new Date().toISOString())}
        </p>
      </header>

      <section className="report-summary">
        <ScoreGauge score={latest.score.score} band={latest.score.band} size={120} />
        <div>
          <p className={`band-pill band-${latest.score.band}`}>{latest.score.label}</p>
          <p>
            Latest check-in: {formatDate(latest.createdAt)} ({latest.taskTitle})
          </p>
        </div>
      </section>

      <BaselineSummary result={latest.baseline} />

      <section>
        <h2>Score trend</h2>
        <TrendChart sessions={sessions} animate={false} height={220} />
      </section>

      <section>
        <h2>Latest check-in: markers outside the typical range</h2>
        {flagged.length === 0 ? (
          <p>No markers outside the typical range.</p>
        ) : (
          <ul>
            {flagged.map((f) => (
              <li key={f.label}>
                <strong>{f.label}:</strong> {f.detail}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Recent check-ins</h2>
        <SessionTable sessions={sessions.slice(-RECENT_COUNT).reverse()} />
      </section>

      <section>
        <h2>About these measures</h2>
        <p className="small">
          Pause, speech-rate and pitch measures are computed from the audio recording. Filler words, repetitions and
          word-finding moments come from the language analysis. Scores compare the patient with their own earlier
          check-ins of the same task. Research links changes in these markers with early cognitive decline, but they can
          also change with fatigue, illness, mood or hearing.
        </p>
      </section>

      <Disclaimer />
    </div>
  )
}
```

- [ ] **Step 2: Typecheck and commit**

Run: `npm run typecheck`
Expected: no errors.

```powershell
git add src/renderer/src
git commit -m "feat: add printable doctor report"
```

---

### Task 17: Record demo samples and calibrate thresholds

This task is done by hand with the running app, after Task 18.

**Files:**
- Create: `app\src\renderer\public\samples\{reading,fluency,story}-{healthy,markers}.webm`
- Possibly modify: `app\src\renderer\src\lib\scoring.ts` (the `THRESHOLDS` values only)

- [ ] **Step 1: Record the six clips in a quiet room**

For each task, open it in the app, press **Start recording**, and read the matching script from `lib/scripts.ts`:
- **healthy:** read it naturally and fluently.
- **markers:** say the fillers (`~um` → "um"), repeat the `^` words, say the `?` phrases hesitantly, and hold a **1.5–2 second silence** at every `...`.

On the results screen, click **Download recording** and save the file as `app\src\renderer\public\samples\<task>-<healthy|markers>.webm` (for example `reading-markers.webm`).

- [ ] **Step 2: Check the samples load**

Restart `npm run dev`. On each task, click both sample buttons.
Expected: typical samples score **≥ 75 (green)**, and marker samples score **< 65 (yellow or red)**.

- [ ] **Step 3: Calibrate if needed**

If a typical clip scores below 75, look at its metric cards and move that factor's `ok` value in `THRESHOLDS` just past the measured value. For example, if typical speech measures `3.1 syllables per second`, set `speechRate: { ok: 3.0, bad: 1.8, max: 15 }`. If a markers clip scores too high, re-record it with longer pauses rather than loosening thresholds.

Run: `npm test`
Expected: PASS. The scoring tests read `THRESHOLDS`, so tuning `ok`/`bad` won't break them as long as the `max` values still sum to 100.

- [ ] **Step 4: Commit**

```powershell
git add src/renderer/public/samples src/renderer/src/lib/scoring.ts
git commit -m "feat: add demo sample clips and calibrated thresholds"
```

---

### Task 18: Wire all screens and website requests into App

**Files:**
- Create: `app\src\renderer\src\hooks\useRemoteAnalysis.ts`
- Replace: `app\src\renderer\src\App.tsx`

- [ ] **Step 1: Remote analysis hook (this window is the website's analysis engine)**

`app\src\renderer\src\hooks\useRemoteAnalysis.ts`:
```ts
import { useEffect, useRef } from 'react'
import { runAnalysis } from '../lib/pipeline'
import type { Session } from '../lib/types'

/** Handles recordings the website POSTs to the local API: analyze, save, and send the session back. */
export function useRemoteAnalysis(sessions: Session[], add: (session: Session) => Promise<void>): void {
  const sessionsRef = useRef(sessions)

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  useEffect(
    () =>
      window.api.onRemoteAnalyzeRequest(async (request) => {
        try {
          const audio = new Blob([request.audio.slice()], { type: request.mimeType })
          const { session, audioUrl } = await runAnalysis(
            { audio, task: request.task, source: request.source },
            sessionsRef.current
          )
          URL.revokeObjectURL(audioUrl)
          await add(session)
          window.api.sendRemoteAnalyzeResult({ requestId: request.requestId, session })
        } catch (e) {
          window.api.sendRemoteAnalyzeResult({
            requestId: request.requestId,
            error: e instanceof Error ? e.message : 'Analysis failed'
          })
        }
      }),
    [add]
  )
}
```

- [ ] **Step 2: Full App with screen state machine and analysis orchestration**

Replace `app\src\renderer\src\App.tsx`:
```tsx
import { useState } from 'react'
import { SettingsBar } from './components/SettingsBar'
import { useRemoteAnalysis } from './hooks/useRemoteAnalysis'
import { useSessions } from './hooks/useSessions'
import { useSettings } from './hooks/useSettings'
import { runAnalysis, type AnalysisOutput } from './lib/pipeline'
import { stopSpeaking } from './lib/speech'
import type { SessionSource, TaskId } from './lib/types'
import { ANALYZING_MS, AnalyzingScreen } from './screens/AnalyzingScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { RecordScreen } from './screens/RecordScreen'
import { ReportScreen } from './screens/ReportScreen'
import { ResultsScreen } from './screens/ResultsScreen'

type Screen =
  | { name: 'home' }
  | { name: 'record'; task: TaskId; error?: string }
  | { name: 'analyzing' }
  | { name: 'results'; view: AnalysisOutput }
  | { name: 'history' }
  | { name: 'report' }

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export default function App(): JSX.Element {
  const { settings, toggle } = useSettings()
  const { sessions, loading, error, add } = useSessions()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  useRemoteAnalysis(sessions, add)

  const go = (next: Screen): void => {
    stopSpeaking()
    setScreen(next)
  }

  const analyze = async (audio: Blob, task: TaskId, source: SessionSource): Promise<void> => {
    go({ name: 'analyzing' })
    try {
      const [view] = await Promise.all([runAnalysis({ audio, task, source }, sessions), delay(ANALYZING_MS)])
      await add(view.session)
      setScreen({ name: 'results', view })
    } catch (e) {
      setScreen({
        name: 'record',
        task,
        error: e instanceof Error ? e.message : 'Something went wrong while analyzing. Please try again.'
      })
    }
  }

  const toHome = (): void => go({ name: 'home' })
  const toHistory = (): void => go({ name: 'history' })
  const toReport = (): void => go({ name: 'report' })

  const renderScreen = (): JSX.Element => {
    switch (screen.name) {
      case 'home':
        return <HomeScreen sessions={sessions} onStart={(task) => go({ name: 'record', task })} onHistory={toHistory} onReport={toReport} />
      case 'record':
        return (
          <RecordScreen
            key={`${screen.task}-${screen.error ?? ''}`}
            task={screen.task}
            error={screen.error}
            voiceGuide={settings.voiceGuide}
            onRecorded={(audio, source) => void analyze(audio, screen.task, source)}
            onBack={toHome}
          />
        )
      case 'analyzing':
        return <AnalyzingScreen />
      case 'results':
        return <ResultsScreen view={screen.view} onHome={toHome} onHistory={toHistory} onReport={toReport} />
      case 'history':
        return <HistoryScreen sessions={sessions} onBack={toHome} onReport={toReport} />
      case 'report':
        return <ReportScreen sessions={sessions} onBack={toHome} />
    }
  }

  return (
    <div className="app">
      <header className="app-header no-print">
        <button className="brand" onClick={toHome}>EchoMind</button>
        <SettingsBar settings={settings} onToggle={toggle} />
      </header>
      <main className="app-main">
        {error && <p className="error">{error}</p>}
        {loading ? <p className="muted">Loading…</p> : renderScreen()}
      </main>
    </div>
  )
}
```

- [ ] **Step 3: End-to-end check in the app**

Run: `npm test`, then `npm run typecheck`, then `npm run dev`.
Expected, in order:
1. On Home, click **Read aloud**. The instructions are spoken aloud, and the passage is shown.
2. **Start recording**: the live waveform moves and the timer counts. Read the passage, then **Stop**.
3. The analyzing screen steps through its checklist for about 2.4 seconds.
4. Results show the score gauge, band label and message, baseline deltas, the waveform with amber pause blocks, 8 metric cards, the highlighted transcript, and the badge changing to "✓ Available on the caregiver website".
5. **View history** shows the trend chart with 13 points and the table.
6. **Doctor report**, then **Save as PDF**: the saved PDF opens and has no header or buttons.
7. Record 1 second of silence. You're returned to the record screen with "We couldn't hear enough speech…".

- [ ] **Step 4: End-to-end check of the website path (the app processes audio posted over HTTP)**

With the app running and at least one sample clip recorded (Task 17), in a second PowerShell window from `C:\Coding\Hackathon\app`:
```powershell
curl.exe -s -X POST -H "Content-Type: audio/webm" --data-binary "@src/renderer/public/samples/reading-markers.webm" "http://127.0.0.1:4317/api/analyze?task=reading&source=sample-markers"
```
Expected: a JSON session with `"taskTitle":"Read aloud"`, a non-empty `waveform`, `score.band` of `"yellow"` or `"red"`, and `baseline.status` of `"ready"`. **View history** in the app now includes it.

If you don't have a clip yet, run the same command with any `.webm` recording downloaded from the results screen.

- [ ] **Step 5: Commit**

```powershell
git add src/renderer/src/App.tsx src/renderer/src/hooks/useRemoteAnalysis.ts
git commit -m "feat: wire all screens and website analysis requests into the app"
```

---

### Task 19: Demo script and README

**Files:**
- Create: `C:\Coding\Hackathon\docs\demo-script.md`
- Modify: `C:\Coding\Hackathon\README.MD`

- [ ] **Step 1: Demo script**

`C:\Coding\Hackathon\docs\demo-script.md`:
```markdown
# EchoMind demo (3 minutes)

## Before going on stage
- Reset history: close the app, delete `sessions.json` (path is printed in the terminal at startup), start `npm run dev`.
- Start the caregiver website and confirm it loads data from http://127.0.0.1:4317/api/health.
- Turn "Read instructions aloud" on. Test the mic once.

## Script
1. **Problem (20 s):** Around 75% of dementia cases go undiagnosed. Speech changes — longer pauses, slower speech, word-finding trouble — can appear years before a diagnosis, and a voice check-in costs nothing.
2. **Home (15 s):** Four weeks of check-ins; the score is drifting down, but slowly enough that family wouldn't notice.
3. **Live check-in (60 s):** Choose *Read aloud*. The app reads the instructions (accessibility for older users). Read the passage *with deliberate long pauses and a few "um"s*. Stop.
4. **Results (40 s):** Point at the amber pause map ("computed live from my voice"), the baseline comparison ("we compare you to *you*, not to a population"), the metric cards and the transcript highlights.
5. **Caregiver website (20 s):** Switch to the website — the new check-in is already there, rendered from the app's API. The app is the processing engine; the website is the family's window into it.
6. **Report (15 s):** History → Doctor report → Save as PDF. "This is what you bring to your GP."
7. **Close (10 s):** Audio never leaves the device. Next: a Whisper + Claude provider behind the same interface and a cloud database behind the same API.

## If the mic fails
Use **Sample with memory-related markers** on the record screen.

## Honest answers to likely questions
- *Is the transcript real?* Acoustic markers are measured live; the language layer is a demo provider behind a swappable interface.
- *Is this a diagnosis?* No — it is a screening aid that flags changes relative to the person's own baseline.
- *How does the website get data?* The desktop app runs a local API on 127.0.0.1; the website reads sessions and can post recordings for the app to analyze.
```

- [ ] **Step 2: README**

Replace `C:\Coding\Hackathon\README.MD`:
```markdown
# EchoMind

A voice check-in app that screens for early speech markers of Alzheimer's and dementia.

- `app/` — Electron desktop app: records, analyzes, stores check-ins, exports the doctor report, and serves the local API
- `docs/website-integration.md` — how the website reads check-ins and sends recordings to the app
- `docs/demo-script.md` — the pitch

## Run the app
    cd app
    npm install
    npm run dev

The app's API is then available at http://127.0.0.1:4317/api.

## Test
    cd app
    npm test
```

- [ ] **Step 3: Commit**

```powershell
cd C:\Coding\Hackathon
git add docs/demo-script.md README.MD
git commit -m "docs: add demo script and README"
```
