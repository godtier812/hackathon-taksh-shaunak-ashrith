import type { Session } from "@/lib/backend/types"
import type {
  ChartPoint,
  ChartRange,
  ChartView,
  DashboardData,
  IndicatorKey,
  MetricSummary,
} from "@/lib/dashboard/types"
import { formatDate, formatMonthYear, formatShortDate, formatSigned } from "@/lib/format"

/**
 * The desktop app has no patient profile yet, so the caregiver view names the
 * person here. Change these to match whoever is using the app.
 */
export const LIVE_PATIENT = { name: "Margaret Reynolds", initials: "MR", age: 72 }

const DAY_MS = 86_400_000
/** Baseline = first two weeks of check-ins, current = last two weeks (at least 3 each). */
const WINDOW_DAYS = 14
const MIN_WINDOW = 3
const SPARKLINE_POINTS = 13
/** Average syllables per English word, to express speech rate in words per minute. */
const SYLLABLES_PER_WORD = 1.5
/** Changes smaller than this read as "Stable"; larger than SIGNAL_PCT are highlighted. */
const STABLE_PCT = 5
const SIGNAL_PCT = 10

type Concern = "increase" | "decrease"

type LiveIndicator = {
  key: Exclude<IndicatorKey, "coherence">
  label: string
  concern: Concern
  /** Denominator floor, so a baseline of 0 (e.g. no repetitions yet) can't divide by zero. */
  floor: number
  value: (s: Session) => number
}

const INDICATORS: LiveIndicator[] = [
  {
    key: "pauses",
    label: "Pause frequency",
    concern: "increase",
    floor: 1,
    value: (s) => s.acoustics.pauseCount / Math.max(s.acoustics.durationSec / 60, 0.25),
  },
  {
    key: "repetition",
    label: "Repetition",
    concern: "increase",
    floor: 0.5,
    value: (s) => s.linguistic.repetitionCount,
  },
  {
    key: "vocabulary",
    label: "Vocabulary diversity",
    concern: "decrease",
    floor: 0.05,
    value: (s) => s.linguistic.typeTokenRatio,
  },
  {
    key: "speechRate",
    label: "Speech rate",
    concern: "decrease",
    floor: 1,
    value: (s) => (s.acoustics.speechRate * 60) / SYLLABLES_PER_WORD,
  },
  {
    key: "fillers",
    label: "Filler words",
    concern: "increase",
    floor: 0.5,
    value: (s) =>
      s.linguistic.wordCount > 0 ? (s.linguistic.fillerCount / s.linguistic.wordCount) * 100 : 0,
  },
]

const mean = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length
const time = (s: Session) => Date.parse(s.createdAt)

/** Sessions in the first/last WINDOW_DAYS, widened to at least MIN_WINDOW sessions. */
function windows(sessions: Session[]) {
  const first = time(sessions[0])
  const last = time(sessions[sessions.length - 1])
  const early = sessions.filter((s) => time(s) < first + WINDOW_DAYS * DAY_MS)
  const late = sessions.filter((s) => time(s) > last - WINDOW_DAYS * DAY_MS)
  return {
    baseline: early.length >= MIN_WINDOW ? early : sessions.slice(0, MIN_WINDOW),
    current: late.length >= MIN_WINDOW ? late : sessions.slice(-MIN_WINDOW),
  }
}

function describe(concern: Concern, percent: number) {
  const size = Math.abs(percent)
  if (size < STABLE_PCT) {
    return { descriptor: "Stable", direction: "flat" as const, tone: "neutral" as const, signalDot: false }
  }
  const rising = percent > 0
  const concerning = concern === "increase" ? rising : !rising
  const direction = rising ? ("up" as const) : ("down" as const)
  if (!concerning) {
    return { descriptor: rising ? "Increasing" : "Decreasing", direction, tone: "neutral" as const, signalDot: false }
  }
  if (size >= SIGNAL_PCT) {
    return { descriptor: rising ? "Increasing" : "Declining", direction, tone: "signal" as const, signalDot: false }
  }
  return {
    descriptor: rising ? "Slight increase" : "Slight decline",
    direction,
    tone: "neutral" as const,
    signalDot: true,
  }
}

function summarizeIndicator(
  indicator: LiveIndicator,
  sessions: Session[],
  win: ReturnType<typeof windows>
): MetricSummary {
  const baseline = mean(win.baseline.map(indicator.value))
  const current = mean(win.current.map(indicator.value))
  const percent = ((current - baseline) / Math.max(baseline, indicator.floor)) * 100
  const recent = sessions.slice(-SPARKLINE_POINTS).map(indicator.value)
  const sparkline = recent.length > 1 ? recent : [recent[0], recent[0]]
  const shape = describe(indicator.concern, percent)

  if (indicator.key === "speechRate") {
    const stable = Math.abs(percent) < STABLE_PCT
    return {
      key: indicator.key,
      label: indicator.label,
      percent: null,
      valueText: stable ? "Stable" : percent < 0 ? "Slower" : "Faster",
      descriptor: stable ? "Within baseline range" : `${formatSigned(percent)}% vs baseline`,
      direction: shape.direction,
      tone: "neutral",
      signalDot: Math.abs(percent) >= SIGNAL_PCT,
      sparkline,
      baseline,
    }
  }

  return {
    key: indicator.key,
    label: indicator.label,
    percent: Math.round(percent),
    valueText: null,
    ...shape,
    sparkline,
    baseline,
  }
}

function weeklyTicks(from: number, to: number) {
  const ticks: number[] = []
  for (let t = to; t >= from; t -= 7 * DAY_MS) ticks.unshift(t)
  return ticks
}

function monthMidTicks(from: number, to: number) {
  const ticks: number[] = []
  const start = new Date(from)
  for (let y = start.getUTCFullYear(), m = start.getUTCMonth(); ; m++) {
    const t = Date.UTC(y, m, 15)
    if (t > to) break
    if (t >= from) ticks.push(t)
  }
  return ticks
}

const RANGE_DAYS: Record<ChartRange, number> = { "30d": 30, "90d": 90, all: Infinity }

function chartRanges(points: ChartPoint[]): Record<ChartRange, ChartView> {
  const end = points[points.length - 1].t
  const entries = (Object.keys(RANGE_DAYS) as ChartRange[]).map((range): [ChartRange, ChartView] => {
    const from = end - (RANGE_DAYS[range] - 1) * DAY_MS
    const inRange = points.filter((p) => p.t >= from)
    const first = inRange[0].t
    const months = monthMidTicks(first, end)
    // Short histories have no mid-month tick worth showing, so fall back to weekly dates.
    const useMonths = range !== "30d" && months.length >= 2
    return [
      range,
      useMonths
        ? { points: inRange, ticks: months, tickFormat: "month" }
        : { points: inRange, ticks: weeklyTicks(first, end), tickFormat: "day" },
    ]
  })
  return Object.fromEntries(entries) as Record<ChartRange, ChartView>
}

/** Round axis bounds and 2–4 evenly spaced ticks around the scores and baseline band. */
function axis(values: number[], band: [number, number]) {
  const lo = Math.max(0, Math.floor(Math.min(...values, band[0]) - 4))
  // Headroom above the band so its "baseline range" label never sits on the line.
  const hi = Math.min(106, Math.ceil(Math.max(...values, band[1]) + 6))
  const span = hi - lo
  const step = span > 60 ? 20 : span > 30 ? 10 : 5
  const ticks: number[] = []
  for (let t = Math.ceil((lo + 1) / step) * step; t < hi; t += step) ticks.push(t)
  return { domain: [lo, hi] as [number, number], ticks }
}

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`
}

/** Third-person band wording; the desktop app's own messages address the patient directly. */
const BAND_PHRASE: Record<Session["score"]["band"], string> = {
  green: "within the typical range",
  yellow: "which is worth watching",
  red: "which is worth discussing with a doctor",
}

const SIGNAL_PHRASES: Partial<Record<IndicatorKey, string>> = {
  pauses: "more frequent pauses",
  repetition: "more repeated words",
  vocabulary: "a narrower vocabulary",
  fillers: "more filler words",
}

function summaryCopy(firstName: string, days: number, metrics: MetricSummary[], latest: Session) {
  const changes = metrics
    .filter((m) => SIGNAL_PHRASES[m.key] && (m.tone === "signal" || m.signalDot))
    .map((m) => SIGNAL_PHRASES[m.key] as string)
  const rate = metrics.find((m) => m.key === "speechRate")
  const trend = changes.length
    ? `Over the past ${days} days, ${firstName}'s check-ins show ${joinList(changes)} compared with ${firstName}'s own baseline.`
    : `Over the past ${days} days, ${firstName}'s check-ins show no notable change from ${firstName}'s own baseline.`
  const speech =
    !rate || rate.valueText === "Stable"
      ? " Speech rate remains stable."
      : ` Speech rate is ${(rate.valueText ?? "changing").toLowerCase()} than at baseline.`
  const last = ` The latest check-in (${latest.taskTitle}, ${formatDate(time(latest))}) scored ${latest.score.score} out of 100, ${BAND_PHRASE[latest.score.band]}.`
  return trend + speech + last
}

/** Turns the desktop app's check-ins (oldest first) into dashboard data, or null if there are none. */
export function toLiveDashboard(sessions: Session[]): DashboardData | null {
  if (sessions.length === 0) return null
  const sorted = [...sessions].sort((a, b) => time(a) - time(b))
  const latest = sorted[sorted.length - 1]
  const first = sorted[0]
  const win = windows(sorted)

  const points = sorted.map((s) => ({ t: time(s), index: s.score.score }))
  const baseline = Math.round(mean(win.baseline.map((s) => s.score.score)))
  const band: [number, number] = [baseline - 3, Math.min(100, baseline + 3)]
  const { domain, ticks } = axis(
    points.map((p) => p.index),
    band
  )
  const metrics = INDICATORS.map((indicator) => summarizeIndicator(indicator, sorted, win))
  const days = Math.max(1, Math.round((time(latest) - time(first)) / DAY_MS))
  const firstName = LIVE_PATIENT.name.split(" ")[0]
  const count = sorted.length

  return {
    source: "live",
    patient: {
      name: LIVE_PATIENT.name,
      initials: LIVE_PATIENT.initials,
      details: `Age ${LIVE_PATIENT.age} · Monitoring since ${formatMonthYear(time(first))}`,
    },
    chart: {
      subtitle: `MindTrace check-in score from the desktop app, relative to ${firstName}'s first check-ins.`,
      ranges: chartRanges(points),
      latest: points[points.length - 1],
      baseline,
      baselineBand: band,
      yDomain: domain,
      yTicks: ticks,
      valueDigits: 0,
      summary: `${firstName}'s MindTrace score across ${count} check-ins, from ${formatDate(time(first))} to ${formatDate(time(latest))}. The baseline is ${baseline} and the latest score is ${latest.score.score}.`,
      footerLeft: `${count} check-in${count === 1 ? "" : "s"} · ${
        count === 1
          ? formatDate(time(latest))
          : `${formatShortDate(time(first))} – ${formatDate(time(latest))}`
      }`,
      footerRight: "Screening aid · not a clinical measure",
    },
    metrics,
    metricsFootnote: `Live from the MindTrace app. Changes compare the last two weeks with ${firstName}'s first two weeks of check-ins. Filler words replace semantic coherence, which the app does not measure yet.`,
    summary: {
      title: `${days}-day summary`,
      copy: summaryCopy(firstName, days, metrics, latest),
      disclaimer:
        "This is not a diagnosis. Persistent or concerning changes should be discussed with a qualified healthcare professional.",
    },
  }
}
