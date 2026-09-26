/**
 * The one shape every dashboard component renders from. It is built either from
 * Margaret's synthetic record (`demo.ts`) or from the MindTrace desktop app's
 * check-ins (`live.ts`), so the page, the landing preview and live mode share
 * the same components.
 */

export type IndicatorKey =
  | "pauses"
  | "repetition"
  | "vocabulary"
  | "speechRate"
  | "coherence"
  | "fillers"

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
  /** Recent values, oldest first (at least two). */
  sparkline: number[]
  baseline: number
}

export type ChartRange = "30d" | "90d" | "all"
export type ChartPoint = { t: number; index: number }
export type ChartView = { points: ChartPoint[]; ticks: number[]; tickFormat: "month" | "day" }

export type DashboardData = {
  source: "demo" | "live"
  patient: {
    name: string
    initials: string
    /** "Age 72 · Monitoring since June 2026" */
    details: string
  }
  chart: {
    subtitle: string
    ranges: Record<ChartRange, ChartView>
    latest: ChartPoint
    baseline: number
    baselineBand: [number, number]
    yDomain: [number, number]
    yTicks: number[]
    /** Decimal places shown for values in the tooltip. */
    valueDigits: number
    /** Screen-reader description of the whole chart. */
    summary: string
    footerLeft: string
    footerRight: string
  }
  metrics: MetricSummary[]
  metricsFootnote: string
  summary: { title: string; copy: string; disclaimer: string }
}
