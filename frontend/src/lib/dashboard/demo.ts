import type { DashboardData } from "@/lib/dashboard/types"
import {
  BASELINE_BAND,
  BASELINE_INDEX,
  chartRanges,
  chartSummary,
  latestSession,
  metricSummaries,
  patient,
  summaryCopy,
  summaryDisclaimer,
} from "@/lib/demo/margaret"

/** Margaret's synthetic record, packaged for the dashboard components. */
export const demoDashboard: DashboardData = {
  source: "demo",
  patient: {
    name: patient.name,
    initials: patient.initials,
    details: `Age ${patient.age} · Monitoring since ${patient.monitoringSince}`,
  },
  chart: {
    subtitle: "Composite of five indicators, relative to Margaret’s June baseline.",
    ranges: chartRanges,
    latest: { t: latestSession.t, index: latestSession.index },
    baseline: BASELINE_INDEX,
    baselineBand: BASELINE_BAND,
    yDomain: [86, 104],
    yTicks: [90, 95, 100],
    valueDigits: 1,
    summary: chartSummary,
    footerLeft: `${patient.sessionCount} conversations · ${patient.rangeLabel}`,
    footerRight: "Demo index · not a clinical measure",
  },
  metrics: metricSummaries,
  metricsFootnote:
    "Demo indicators, not clinical thresholds. Changes are measured against Margaret’s own June baseline.",
  summary: { title: "90-day summary", copy: summaryCopy, disclaimer: summaryDisclaimer },
}
