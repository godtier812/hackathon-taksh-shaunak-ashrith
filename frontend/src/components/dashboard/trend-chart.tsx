"use client"

import { useInView } from "motion/react"
import { useRef, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceDot,
  ReferenceLine,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts"

import { ChartContainer, ChartTooltip, type ChartConfig } from "@/components/ui/chart"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ChartPoint, ChartRange, DashboardData } from "@/lib/dashboard/types"
import { formatDate, formatMonth, formatShortDate, formatSigned } from "@/lib/format"
import { usePrefersReducedMotion } from "@/lib/hooks"

type ChartData = DashboardData["chart"]

const chartConfig = {
  index: { label: "Composite index", color: "var(--brand)" },
} satisfies ChartConfig

const RANGE_OPTIONS: { value: ChartRange; label: string }[] = [
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "all", label: "All" },
]

const isRange = (value: unknown): value is ChartRange =>
  RANGE_OPTIONS.some((option) => option.value === value)

function TrendTooltip({
  active,
  payload,
  baseline,
  digits,
}: Partial<TooltipContentProps<number, string>> & { baseline: number; digits: number }) {
  const point = payload?.[0]?.payload as ChartPoint | undefined
  if (!active || !point) return null
  return (
    <div className="min-w-[176px] rounded-inner border border-line bg-surface px-3.5 py-3 shadow-raised animate-in fade-in-0 slide-in-from-bottom-1 duration-150">
      <p className="font-mono type-caption text-ink-tertiary">{formatDate(point.t)}</p>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className="text-[18px] font-semibold tracking-[-0.02em] text-ink tabular-nums">
          {point.index.toFixed(digits)}
        </span>
        <span className="type-caption text-ink-secondary tabular-nums">
          {formatSigned(point.index - baseline, digits)} vs baseline
        </span>
      </p>
    </div>
  )
}

function LatestPoint({ cx, cy, latest }: { cx?: number; cy?: number; latest: ChartPoint }) {
  if (cx == null || cy == null) return <g />
  return (
    <g className="animate-in fade-in-0 duration-300">
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--accent)"
        opacity={0}
        className="[transform-box:fill-box] [transform-origin:center] motion-safe:animate-[point-halo_1.1s_var(--ease-out-expo)_both]"
      />
      <circle cx={cx} cy={cy} r={4.5} fill="var(--brand)" stroke="#ffffff" strokeWidth={2} />
      <text x={cx + 12} y={cy - 3} className="fill-ink-tertiary font-mono text-[11px]">
        {formatShortDate(latest.t)}
      </text>
      <text x={cx + 12} y={cy + 13} className="fill-ink text-[13px] font-semibold tabular-nums">
        {Math.round(latest.index)}
      </text>
    </g>
  )
}

/**
 * "Communication over time": the patient's score relative to their own baseline
 * (Margaret's composite demo index, or the live MindTrace check-in score).
 * The line draws once when the chart first enters the viewport.
 */
export function TrendChart({ chart, interactive = true }: { chart: ChartData; interactive?: boolean }) {
  const [range, setRange] = useState<ChartRange>("90d")
  const [drawn, setDrawn] = useState(false)
  const plotRef = useRef<HTMLDivElement>(null)
  const inView = useInView(plotRef, { once: true, amount: 0.4 })
  const reduced = usePrefersReducedMotion()
  const { points, ticks, tickFormat } = chart.ranges[range]
  const { latest } = chart

  return (
    <section
      aria-labelledby={interactive ? "trend-title" : undefined}
      className="rounded-card border border-line bg-surface p-5 shadow-rest @3xl:p-7"
    >
      <div className="flex flex-col gap-4 @2xl:flex-row @2xl:items-start @2xl:justify-between">
        <div>
          <h2 id={interactive ? "trend-title" : undefined} className="type-section text-ink">
            Communication over time
          </h2>
          <p className="mt-1.5 type-body text-ink-secondary">{chart.subtitle}</p>
        </div>
        <Tabs
          value={range}
          onValueChange={(value) => {
            if (isRange(value)) setRange(value)
          }}
          className="shrink-0"
        >
          <TabsList
            aria-label="Chart range"
            className="rounded-full border border-line bg-surface-muted p-[3px] group-data-horizontal/tabs:h-11 @3xl:group-data-horizontal/tabs:h-9"
          >
            {RANGE_OPTIONS.map((option) => (
              <TabsTrigger
                key={option.value}
                value={option.value}
                className="h-full min-w-11 rounded-full px-3 before:absolute before:inset-x-0 before:-inset-y-1 before:content-[''] font-mono text-[12px] font-medium text-ink-secondary hover:text-ink focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none data-active:bg-surface data-active:text-ink data-active:shadow-rest"
              >
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <p className="sr-only">{chart.summary}</p>

      <div ref={plotRef} aria-hidden="true" className="mt-5 @3xl:mt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[260px] w-full @3xl:h-[300px] [&_.recharts-cartesian-axis-tick-value]:fill-ink-tertiary [&_.recharts-cartesian-axis-tick-value]:font-mono [&_.recharts-cartesian-axis-tick-value]:text-[11px]"
        >
          <AreaChart
            data={points}
            margin={{ top: 12, right: 52, bottom: 0, left: 0 }}
            accessibilityLayer={false}
          >
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.09} />
                <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              horizontalValues={chart.yTicks.filter((tick) => tick !== chart.baseline)}
              stroke="var(--line)"
              strokeOpacity={0.9}
            />
            <ReferenceArea
              y1={chart.baselineBand[0]}
              y2={chart.baselineBand[1]}
              fill="var(--surface-muted)"
              fillOpacity={1}
              stroke="none"
              ifOverflow="hidden"
              label={{
                value: "baseline range",
                position: "insideTopLeft",
                offset: 8,
                className: "fill-ink-tertiary font-mono text-[11px]",
              }}
            />
            <ReferenceLine y={chart.baseline} stroke="var(--line-strong)" strokeDasharray="3 4" />
            <XAxis
              dataKey="t"
              type="number"
              scale="time"
              domain={["dataMin", "dataMax"]}
              ticks={ticks}
              tickFormatter={(t: number) => (tickFormat === "month" ? formatMonth(t) : formatShortDate(t))}
              axisLine={false}
              tickLine={false}
              tickMargin={12}
              interval={0}
            />
            <YAxis
              domain={chart.yDomain}
              ticks={chart.yTicks}
              axisLine={false}
              tickLine={false}
              tickMargin={6}
              width={36}
            />
            {interactive ? (
              <ChartTooltip
                cursor={{ stroke: "var(--line-strong)", strokeWidth: 1 }}
                content={<TrendTooltip baseline={chart.baseline} digits={chart.valueDigits} />}
                animationDuration={120}
                wrapperStyle={{ outline: "none" }}
              />
            ) : null}
            {inView ? (
              <Area
                dataKey="index"
                type="monotone"
                stroke="var(--brand)"
                strokeWidth={2}
                fill="url(#trend-fill)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--brand)", stroke: "#ffffff", strokeWidth: 2 }}
                isAnimationActive={!reduced}
                animationBegin={150}
                animationDuration={drawn ? 450 : 1000}
                animationEasing="ease-out"
                onAnimationEnd={() => setDrawn(true)}
              />
            ) : null}
            {inView && (drawn || reduced) ? (
              <ReferenceDot
                x={latest.t}
                y={latest.index}
                r={0}
                ifOverflow="visible"
                shape={(props) => <LatestPoint cx={props.cx} cy={props.cy} latest={latest} />}
              />
            ) : null}
          </AreaChart>
        </ChartContainer>
      </div>

      <div className="mt-4 flex flex-col gap-1 font-mono type-caption text-ink-tertiary @xl:flex-row @xl:justify-between">
        <span>{chart.footerLeft}</span>
        <span>{chart.footerRight}</span>
      </div>
    </section>
  )
}
