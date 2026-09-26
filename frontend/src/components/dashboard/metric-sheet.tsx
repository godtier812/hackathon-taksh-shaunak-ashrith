"use client"

import { Dialog } from "@base-ui/react/dialog"
import { Info, X } from "lucide-react"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { METRIC_ICONS } from "@/components/dashboard/metric-icons"
import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { chartRanges, indicatorDetails, metricSummaries, type IndicatorDetail } from "@/lib/demo/margaret"
import { formatDate, formatMonth, formatSigned } from "@/lib/format"
import { usePrefersReducedMotion } from "@/lib/hooks"
import { cn } from "@/lib/utils"

const chartConfig = { value: { label: "Value", color: "var(--brand)" } } satisfies ChartConfig

function DetailTooltip({ active, payload, detail }: Partial<TooltipContentProps<number, string>> & { detail: IndicatorDetail }) {
  const point = payload?.[0]?.payload as { t: number; value: number } | undefined
  if (!active || !point) return null
  const pct = (point.value / detail.baseline - 1) * 100
  return (
    <div className="min-w-[168px] rounded-inner border border-line bg-surface px-3.5 py-3 shadow-raised animate-in fade-in-0 slide-in-from-bottom-1 duration-150">
      <p className="font-mono type-caption text-ink-tertiary">{formatDate(point.t)}</p>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[17px] font-semibold text-ink tabular-nums">{point.value.toFixed(detail.decimals)}</span>
        <span className="type-caption text-ink-secondary tabular-nums">{formatSigned(pct, 0)}% vs baseline</span>
      </p>
    </div>
  )
}

function DetailChart({ detail, signal }: { detail: IndicatorDetail; signal: boolean }) {
  const reduced = usePrefersReducedMotion()
  const values = detail.history.map((point) => point.value)
  const lo = Math.min(...values, detail.baselineRange[0])
  const hi = Math.max(...values, detail.baselineRange[1])
  const pad = (hi - lo) * 0.18 || detail.baseline * 0.02
  const domain: [number, number] = [lo - pad, hi + pad]

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[220px] w-full [&_.recharts-cartesian-axis-tick-value]:fill-ink-tertiary [&_.recharts-cartesian-axis-tick-value]:font-mono [&_.recharts-cartesian-axis-tick-value]:text-[11px]"
    >
      <LineChart data={detail.history} margin={{ top: 10, right: 8, bottom: 0, left: 0 }} accessibilityLayer={false}>
        <CartesianGrid vertical={false} stroke="var(--line)" strokeOpacity={0.9} />
        <ReferenceArea
          y1={detail.baselineRange[0]}
          y2={detail.baselineRange[1]}
          fill="var(--surface-muted)"
          fillOpacity={1}
          stroke="none"
          label={{ value: "June range", position: "insideTopRight", offset: 8, className: "fill-ink-tertiary font-mono text-[11px]" }}
        />
        <ReferenceLine y={detail.baseline} stroke="var(--line-strong)" strokeDasharray="3 4" />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          ticks={chartRanges.all.ticks}
          tickFormatter={(t: number) => formatMonth(t)}
          axisLine={false}
          tickLine={false}
          tickMargin={10}
          interval={0}
        />
        <YAxis
          domain={domain}
          tickCount={4}
          tickFormatter={(v: number) => v.toFixed(Math.min(detail.decimals, 2))}
          axisLine={false}
          tickLine={false}
          tickMargin={6}
          width={44}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
          content={<DetailTooltip detail={detail} />}
          animationDuration={120}
          wrapperStyle={{ outline: "none" }}
        />
        <Line
          dataKey="value"
          type="monotone"
          stroke={signal ? "var(--signal)" : "var(--brand)"}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: signal ? "var(--signal)" : "var(--brand)", stroke: "#ffffff", strokeWidth: 2 }}
          isAnimationActive={!reduced}
          animationDuration={900}
          animationEasing="ease-out"
        />
      </LineChart>
    </ChartContainer>
  )
}

/** Side panel with one indicator's full history against Margaret's own June range. */
export function MetricSheet() {
  const { metric, metricOpen, closeMetric } = useDashboard()
  const detail = metric ? indicatorDetails[metric] : null
  const summary = metric ? metricSummaries.find((m) => m.key === metric) : null
  const Icon = metric ? METRIC_ICONS[metric] : null
  const signal = summary?.tone === "signal"

  return (
    <Dialog.Root
      open={metricOpen}
      onOpenChange={(open) => {
        if (!open) closeMetric()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop
          data-lenis-prevent
          className="fixed inset-0 z-50 bg-ink/20 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0"
        />
        <Dialog.Popup
          data-lenis-prevent
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[520px] flex-col overflow-y-auto overscroll-contain border-l border-line bg-canvas shadow-raised outline-none transition-[translate,opacity] duration-300 ease-out-expo data-ending-style:opacity-0 data-starting-style:opacity-0 motion-ok:data-ending-style:translate-x-full motion-ok:data-starting-style:translate-x-full"
        >
          {detail && summary && Icon ? (
            <>
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-canvas/90 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <Icon className="size-[18px] text-ink-secondary" strokeWidth={1.5} aria-hidden="true" />
                  <Dialog.Title className="type-section text-ink">{detail.label}</Dialog.Title>
                </div>
                <Dialog.Close
                  aria-label="Close"
                  className="inline-flex size-10 items-center justify-center rounded-full text-ink-secondary transition-colors duration-150 hover:bg-surface-muted hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
                >
                  <X className="size-5" strokeWidth={1.5} aria-hidden="true" />
                </Dialog.Close>
              </div>

              <div className="flex flex-col gap-6 px-6 py-6">
                <div>
                  <p className="type-metric text-ink">
                    {summary.percent !== null ? `${formatSigned(summary.percent)}%` : summary.valueText}
                  </p>
                  <p
                    className={cn(
                      "mt-2 type-label",
                      signal ? "text-signal-text" : "text-ink-secondary"
                    )}
                  >
                    {summary.descriptor} · compared with her June baseline
                  </p>
                </div>

                <section className="rounded-card border border-line bg-surface p-4">
                  <div className="flex items-baseline justify-between gap-3 font-mono type-caption text-ink-tertiary">
                    <span>Every conversation since June</span>
                    <span>{detail.unit}</span>
                  </div>
                  <div className="mt-3">
                    <DetailChart detail={detail} signal={signal} />
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-inner border border-line bg-surface p-4">
                    <p className="font-mono type-caption text-ink-tertiary">June baseline</p>
                    <p className="mt-1 text-[18px] font-semibold text-ink tabular-nums">
                      {detail.baseline.toFixed(detail.decimals)}
                    </p>
                  </div>
                  <div className="rounded-inner border border-line bg-surface p-4">
                    <p className="font-mono type-caption text-ink-tertiary">Last two weeks</p>
                    <p className="mt-1 text-[18px] font-semibold text-ink tabular-nums">
                      {detail.current.toFixed(detail.decimals)}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="type-label text-ink">What this measures</h3>
                  <Dialog.Description className="mt-1.5 type-body text-ink-secondary">{detail.measures}</Dialog.Description>
                </div>
                <div>
                  <h3 className="type-label text-ink">What has changed</h3>
                  <p className="mt-1.5 type-body text-ink-secondary">{detail.reading}</p>
                </div>

                <p className="flex gap-2.5 border-t border-line pt-5 text-[13px] leading-5 text-ink-secondary">
                  <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  Demo data. A single indicator is not a diagnosis; persistent changes are worth discussing with a
                  qualified healthcare professional.
                </p>
              </div>
            </>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
