"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import type { IndicatorKey } from "@/lib/demo/margaret"

/** Invisible full-card button that opens the metric's detail panel (dashboard page only). */
export function MetricOpenButton({ metricKey, label }: { metricKey: IndicatorKey; label: string }) {
  const { interactive, openMetric } = useDashboard()
  if (!interactive) return null
  return (
    <button
      type="button"
      onClick={() => openMetric(metricKey)}
      aria-label={`${label}: view details`}
      className="absolute inset-0 z-[1] cursor-pointer rounded-card focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
    />
  )
}
