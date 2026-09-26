/**
 * Margaret Reynolds — synthetic demonstration record.
 *
 * Margaret is fictional and every value below is generated deterministically
 * (seeded PRNG, fixed UTC dates). This module is the single source of truth for
 * the trend chart, metric cards, sparklines, scroll-story waveforms and summary.
 * All comparisons are against Margaret's own June baseline, never population norms.
 */
import { formatDate, formatMonthYear, formatShortDate } from "@/lib/format"
import { gaussian, mulberry32 } from "@/lib/random"
import { buildWaveState, type WaveSegment, type WaveState } from "@/lib/waveform"

const DAY_MS = 86_400_000
const START = Date.UTC(2026, 5, 2) // Tue, Jun 2, 2026 — first recorded conversation
const END = Date.UTC(2026, 8, 24) // Thu, Sep 24, 2026 — latest conversation
const TOTAL_DAYS = (END - START) / DAY_MS
const WINDOW_DAYS = 14 // baseline = first two weeks, current = last two weeks

const SESSION_WEEKDAYS = new Set([2, 4, 6]) // Tue, Thu, Sat (UTC)
const SKIPPED = new Set([Date.UTC(2026, 6, 4), Date.UTC(2026, 7, 13), Date.UTC(2026, 8, 5)])

export type IndicatorKey = "pauses" | "repetition" | "vocabulary" | "speechRate" | "coherence"

type IndicatorModel = {
  /** Baseline level in the indicator's own unit. */
  baseline: number
  /** Relative change from the baseline window to the current window. */
  change: number
  /** Session-to-session variation (same unit as baseline). */
  noise: number
  /** How a change maps to "worth noticing" in the composite. */
  concern: "increase" | "decrease" | "either"
  weight: number
}

const INDICATORS: Record<IndicatorKey, IndicatorModel> = {
  pauses: { baseline: 9.5, change: 0.18, noise: 0.24, concern: "increase", weight: 0.25 }, // pauses / min
  repetition: { baseline: 2.5, change: 0.12, noise: 0.09, concern: "increase", weight: 0.2 }, // repeated phrases / conversation
  vocabulary: { baseline: 0.62, change: -0.06, noise: 0.006, concern: "decrease", weight: 0.25 }, // moving type–token ratio
  speechRate: { baseline: 138, change: -0.01, noise: 1.6, concern: "either", weight: 0.1 }, // words / min
  coherence: { baseline: 0.84, change: -0.04, noise: 0.007, concern: "decrease", weight: 0.2 }, // adjacent-sentence similarity
}

const INDICATOR_KEYS = Object.keys(INDICATORS) as IndicatorKey[]

export type Session = {
  t: number
  day: number
  /** Composite demo index, 100 = mean of the first two weeks. */
  index: number
  values: Record<IndicatorKey, number>
}

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length

const sessionDates: number[] = []
for (let t = START; t <= END; t += DAY_MS) {
  if (SESSION_WEEKDAYS.has(new Date(t).getUTCDay()) && !SKIPPED.has(t)) sessionDates.push(t)
}
const sessionDays = sessionDates.map((t) => (t - START) / DAY_MS)
const inBaseline = sessionDays.map((day) => day < WINDOW_DAYS)
const inCurrent = sessionDays.map((day) => day > TOTAL_DAYS - WINDOW_DAYS)

function windowMean(values: number[], mask: boolean[]) {
  return mean(values.filter((_, i) => mask[i]))
}

// Gradual, cliff-free drift, normalised to 0 across the baseline window and 1 across the current window.
const rawRamp = sessionDays.map((day) => Math.pow(day / TOTAL_DAYS, 1.6))
const rampLow = windowMean(rawRamp, inBaseline)
const rampHigh = windowMean(rawRamp, inCurrent)
const ramp = rawRamp.map((r) => (r - rampLow) / (rampHigh - rampLow))

function indicatorSeries(key: IndicatorKey, seed: number) {
  const model = INDICATORS[key]
  const rand = mulberry32(seed)
  const noise = sessionDays.map(() => gaussian(rand) * model.noise)
  // Remove noise bias inside both comparison windows so card percentages are exact.
  const biasLow = windowMean(noise, inBaseline)
  const biasHigh = windowMean(noise, inCurrent)
  return ramp.map((r, i) => {
    const bias = inBaseline[i] ? biasLow : inCurrent[i] ? biasHigh : 0
    return model.baseline * (1 + model.change * r) + noise[i] - bias
  })
}

const series = Object.fromEntries(
  INDICATOR_KEYS.map((key, i) => [key, indicatorSeries(key, 20260602 + i * 97)])
) as Record<IndicatorKey, number[]>

// Composite: 100 minus the weighted "concerning" deviation from Margaret's own baseline.
const COMPOSITE_GAIN = 97
const rawComposite = sessionDates.map((_, i) => {
  const deviation = INDICATOR_KEYS.reduce((sum, key) => {
    const model = INDICATORS[key]
    const relative = series[key][i] / model.baseline - 1
    const concern =
      model.concern === "increase" ? relative : model.concern === "decrease" ? -relative : Math.abs(relative)
    return sum + model.weight * concern
  }, 0)
  return 100 - COMPOSITE_GAIN * deviation
})
const compositeOffset = 100 - windowMean(rawComposite, inBaseline)

export const sessions: Session[] = sessionDates.map((t, i) => ({
  t,
  day: sessionDays[i],
  index: Math.round((rawComposite[i] + compositeOffset) * 10) / 10,
  values: Object.fromEntries(INDICATOR_KEYS.map((key) => [key, series[key][i]])) as Record<
    IndicatorKey,
    number
  >,
}))

export const latestSession = sessions[sessions.length - 1]

export const patient = {
  name: "Margaret Reynolds",
  initials: "MR",
  age: 72,
  monitoringSince: formatMonthYear(sessions[0].t),
  firstSessionLabel: formatDate(sessions[0].t),
  sessionCount: sessions.length,
  rangeLabel: `${formatShortDate(sessions[0].t)} – ${formatDate(latestSession.t)}`,
}

/* ------------------------------------------------------------------ chart */

export const BASELINE_INDEX = 100
export const BASELINE_BAND: [number, number] = [97, 103]

export type ChartRange = "30d" | "90d" | "all"
export type ChartPoint = { t: number; index: number }

const RANGE_DAYS: Record<ChartRange, number> = { "30d": 30, "90d": 90, all: Infinity }

function monthMidTicks(from: number, to: number) {
  const ticks: number[] = []
  for (let month = 5; month <= 8; month++) {
    const t = Date.UTC(2026, month, 15)
    if (t >= from && t <= to) ticks.push(t)
  }
  return ticks
}

function weeklyTicks(from: number, to: number) {
  const ticks: number[] = []
  for (let t = to; t >= from; t -= 7 * DAY_MS) ticks.unshift(t)
  return ticks
}

export const chartRanges: Record<
  ChartRange,
  { points: ChartPoint[]; ticks: number[]; tickFormat: "month" | "day" }
> = Object.fromEntries(
  (Object.keys(RANGE_DAYS) as ChartRange[]).map((range) => {
    const from = END - (RANGE_DAYS[range] - 1) * DAY_MS
    const points = sessions.filter((s) => s.t >= from).map(({ t, index }) => ({ t, index }))
    const first = points[0].t
    return [
      range,
      range === "30d"
        ? { points, ticks: weeklyTicks(first, END), tickFormat: "day" }
        : { points, ticks: monthMidTicks(first, END), tickFormat: "month" },
    ]
  })
) as Record<ChartRange, { points: ChartPoint[]; ticks: number[]; tickFormat: "month" | "day" }>

export const chartSummary = `Margaret's composite communication index stayed close to her June baseline of 100 through early July, then drifted gradually to ${Math.round(
  latestSession.index
)} by ${formatDate(latestSession.t)}. This is a demo index, not a clinical measure.`

/* ---------------------------------------------------------------- metrics */

export type MetricTone = "signal" | "neutral"
export type MetricDirection = "up" | "down" | "flat"

export type MetricSummary = {
  key: IndicatorKey
  label: string
  /** Percent change vs baseline, when the card shows a number. */
  percent: number | null
  /** Text value, when the card shows a word instead of a number. */
  valueText: string | null
  descriptor: string
  direction: MetricDirection
  tone: MetricTone
  /** Small amber dot beside a neutral descriptor. */
  signalDot: boolean
  /** ~13 weekly means covering the last 90 days. */
  sparkline: number[]
  baseline: number
}

function percentChange(key: IndicatorKey) {
  const values = series[key]
  return (windowMean(values, inCurrent) / windowMean(values, inBaseline) - 1) * 100
}

const WEEKS = 13
function weeklyMeans(key: IndicatorKey) {
  const out: number[] = []
  for (let w = WEEKS - 1; w >= 0; w--) {
    const binEnd = END - w * 7 * DAY_MS
    const binStart = binEnd - 6 * DAY_MS
    const values = sessions.filter((s) => s.t >= binStart && s.t <= binEnd).map((s) => s.values[key])
    out.push(mean(values))
  }
  return out
}

const pct = (key: IndicatorKey) => Math.round(percentChange(key))

function metric(
  key: IndicatorKey,
  label: string,
  display: Pick<MetricSummary, "descriptor" | "direction" | "tone" | "signalDot"> & {
    showPercent: boolean
    valueText?: string
  }
): MetricSummary {
  return {
    key,
    label,
    percent: display.showPercent ? pct(key) : null,
    valueText: display.valueText ?? null,
    descriptor: display.descriptor,
    direction: display.direction,
    tone: display.tone,
    signalDot: display.signalDot,
    sparkline: weeklyMeans(key),
    baseline: windowMean(series[key], inBaseline),
  }
}

const speechRateStable = Math.abs(percentChange("speechRate")) < 3

export const metricSummaries: MetricSummary[] = [
  metric("pauses", "Pause frequency", {
    showPercent: true,
    descriptor: "Increasing",
    direction: "up",
    tone: "signal",
    signalDot: false,
  }),
  metric("repetition", "Repetition", {
    showPercent: true,
    descriptor: "Increasing",
    direction: "up",
    tone: "signal",
    signalDot: false,
  }),
  metric("vocabulary", "Vocabulary diversity", {
    showPercent: true,
    descriptor: "Slight decline",
    direction: "down",
    tone: "neutral",
    signalDot: true,
  }),
  metric("speechRate", "Speech rate", {
    showPercent: false,
    valueText: speechRateStable ? "Stable" : "Changing",
    descriptor: "Within baseline range",
    direction: "flat",
    tone: "neutral",
    signalDot: false,
  }),
  metric("coherence", "Semantic coherence", {
    showPercent: false,
    valueText: "Slight decline",
    descriptor: "Compared with baseline",
    direction: "down",
    tone: "neutral",
    signalDot: true,
  }),
]

export const summaryCopy =
  "Over the past 90 days, Margaret's conversations show a gradual increase in pauses and repeated phrases. Vocabulary diversity shows a slight decline, while speech rate remains stable."

export const summaryDisclaimer =
  "This is not a diagnosis. Persistent or concerning changes should be discussed with a qualified healthcare professional."

/* ------------------------------------------------------------ story waves */

const VOICE_SEED = 1954
const phrase = (id: number, length: number, repeat = false): WaveSegment => ({
  kind: "phrase",
  phrase: id,
  length,
  repeat,
})
const pause = (length: number): WaveSegment => ({ kind: "pause", length })

// Lengths are in 0.1s samples; every script totals 160 samples (a 16s excerpt).
const DAY_1: WaveSegment[] = [
  pause(2), phrase(0, 18), pause(4), phrase(1, 16), pause(3), phrase(2, 20), pause(5),
  phrase(3, 14), pause(4), phrase(4, 19), pause(3), phrase(5, 17), pause(4), phrase(6, 15),
  pause(4), phrase(7, 10), pause(2),
]
const DAY_30: WaveSegment[] = [
  pause(2), phrase(0, 15), pause(6), phrase(1, 14), pause(10), phrase(2, 18), pause(5),
  phrase(3, 12), pause(11), phrase(4, 15), pause(6), phrase(2, 18, true), pause(10),
  phrase(6, 16), pause(2),
]
const DAY_90: WaveSegment[] = [
  pause(2), phrase(0, 12), pause(7), phrase(1, 11), pause(16), phrase(2, 12), pause(9),
  phrase(2, 12, true), pause(21), phrase(3, 8), pause(12), phrase(2, 12, true), pause(13),
  phrase(1, 11, true), pause(2),
]

export type StoryStage = {
  key: "day1" | "day30" | "day90"
  label: string
  dateLabel: string
  headline: string
  wave: WaveState
}

function sessionNear(day: number) {
  return sessions.reduce((best, s) => (Math.abs(s.day - day) <= Math.abs(best.day - day) ? s : best))
}

export const EXCERPT_SECONDS = 16

export const storyStages: StoryStage[] = [
  {
    key: "day1",
    label: "Day 1",
    dateLabel: formatDate(sessions[0].t),
    headline: "A baseline conversation.",
    wave: buildWaveState(DAY_1, VOICE_SEED, 1),
  },
  {
    key: "day30",
    label: "Day 30",
    dateLabel: formatDate(sessionNear(29).t),
    headline: "Small changes begin to appear.",
    wave: buildWaveState(DAY_30, VOICE_SEED, 0.95),
  },
  {
    key: "day90",
    label: "Day 90",
    dateLabel: formatDate(sessionNear(89).t),
    headline: "Over time, the pattern becomes clear.",
    wave: buildWaveState(DAY_90, VOICE_SEED, 0.8),
  },
]
