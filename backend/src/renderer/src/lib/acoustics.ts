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
