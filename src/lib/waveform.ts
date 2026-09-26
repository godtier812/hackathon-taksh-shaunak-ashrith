import { mulberry32 } from "@/lib/random"

/**
 * Speech-like waveform envelopes.
 *
 * A conversation excerpt is described as a script of phrases and pauses. Every
 * state renders to exactly WAVE_SAMPLES samples, so any two states can be
 * interpolated sample by sample. Each sample is an amplitude envelope value
 * in [0, 1] covering SAMPLE_SECONDS of audio; pauses are exactly 0.
 */
export const WAVE_SAMPLES = 160
export const SAMPLE_SECONDS = 0.1

export type WaveSegment =
  | { kind: "phrase"; phrase: number; length: number; repeat?: boolean }
  | { kind: "pause"; length: number }

/** Half-open sample range [start, end). */
export type WaveMark = { start: number; end: number }
export type PauseMark = WaveMark & { seconds: number }

export type WaveState = {
  amps: number[]
  /** Pauses between phrases (leading and trailing silence excluded). */
  pauses: PauseMark[]
  /** Phrases that repeat an earlier phrase in the same conversation. */
  repeats: WaveMark[]
  avgPauseSeconds: number
}

const SYLLABLE_SHAPES: Record<number, number[]> = {
  // onset → nucleus → decay; 2–3 samples per syllable ≈ 3.3–5 syllables per second
  2: [1, 0.52],
  3: [0.68, 1, 0.48],
}

/**
 * One phrase: a syllabic envelope under a phrase-level arch (louder mid-phrase,
 * tapering at both ends). The same phrase id, length and voice seed always yield
 * the same shape, which is what makes a repeated phrase visibly identical.
 */
function phraseEnvelope(phrase: number, length: number, voiceSeed: number) {
  const rand = mulberry32(voiceSeed * 7919 + phrase * 104729 + length * 131)
  const out: number[] = []
  while (out.length < length) {
    const size = rand() < 0.55 ? 2 : 3
    const strength = 0.55 + rand() * 0.45
    for (const shape of SYLLABLE_SHAPES[size]) {
      if (out.length < length) out.push(strength * shape)
    }
  }
  const contour = rand() * Math.PI * 2
  return out.map((value, i) => {
    const x = (i + 0.5) / length
    const arch = Math.pow(Math.sin(Math.PI * x), 0.45)
    const stress = 0.86 + 0.14 * Math.sin(contour + x * Math.PI * 2.4)
    return Math.max(0.14, value * arch * stress)
  })
}

const SPREAD_PIVOT = 0.55

export function buildWaveState(
  script: WaveSegment[],
  voiceSeed: number,
  /** < 1 compresses phrase amplitude toward the mean (less prosodic variation). */
  spread = 1
): WaveState {
  const amps: number[] = []
  const pauses: PauseMark[] = []
  const repeats: WaveMark[] = []

  script.forEach((segment, index) => {
    const start = amps.length
    if (segment.kind === "pause") {
      for (let k = 0; k < segment.length; k++) amps.push(0)
      const isEdge = index === 0 || index === script.length - 1
      if (!isEdge) {
        pauses.push({
          start,
          end: amps.length,
          seconds: Math.round(segment.length * SAMPLE_SECONDS * 10) / 10,
        })
      }
      return
    }
    for (const value of phraseEnvelope(segment.phrase, segment.length, voiceSeed)) {
      amps.push(SPREAD_PIVOT + (value - SPREAD_PIVOT) * spread)
    }
    if (segment.repeat) repeats.push({ start, end: amps.length })
  })

  if (amps.length !== WAVE_SAMPLES) {
    throw new Error(`Wave script renders ${amps.length} samples, expected ${WAVE_SAMPLES}`)
  }

  const totalPause = pauses.reduce((sum, p) => sum + p.seconds, 0)
  return {
    amps,
    pauses,
    repeats,
    avgPauseSeconds: Math.round((totalPause / Math.max(1, pauses.length)) * 10) / 10,
  }
}

/** Max-pool an envelope to fewer bars (same data on smaller screens). */
export function poolAmps(amps: number[], bars: number) {
  const factor = amps.length / bars
  const out: number[] = []
  for (let i = 0; i < bars; i++) {
    let peak = 0
    for (let k = Math.floor(i * factor); k < Math.floor((i + 1) * factor); k++) {
      peak = Math.max(peak, amps[k])
    }
    out.push(peak)
  }
  return out
}

/** Linear interpolation between two equal-length envelopes. */
export function mixAmps(a: number[], b: number[], t: number) {
  if (t <= 0) return a
  if (t >= 1) return b
  return a.map((value, i) => value + (b[i] - value) * t)
}

export function barStrokeWidth(width: number, bars: number) {
  return Math.min(3, Math.max(1.5, (width / bars) * 0.5))
}

export type BarLayout = {
  width: number
  /** Height of the waveform band. */
  height: number
  /** Vertical offset of the band inside the SVG. */
  top?: number
}

/**
 * Mirrored bars as a single path of vertical strokes (rendered with round caps).
 * Near-silent samples are skipped so silence reads as the 1px baseline.
 */
export function barPath(
  values: number[],
  { width, height, top = 0 }: BarLayout,
  gain?: (index: number, count: number) => number
) {
  const count = values.length
  const pitch = width / count
  const stroke = barStrokeWidth(width, count)
  const cy = top + height / 2
  const maxHalf = height / 2 - stroke / 2 - 1
  let d = ""
  for (let i = 0; i < count; i++) {
    const amp = values[i] * (gain ? gain(i, count) : 1)
    if (amp < 0.02) continue
    const half = Math.max(0.5, amp * maxHalf)
    const x = ((i + 0.5) * pitch).toFixed(1)
    d += `M${x} ${(cy - half).toFixed(1)}V${(cy + half).toFixed(1)}`
  }
  return d || `M0 ${cy}`
}

/** x position (px) of a sample boundary, independent of how many bars are drawn. */
export function sampleX(sample: number, width: number) {
  return (sample / WAVE_SAMPLES) * width
}
