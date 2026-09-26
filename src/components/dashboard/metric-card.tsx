import {
  BookOpenText,
  Gauge,
  MessageCircleMore,
  Minus,
  Pause,
  Repeat2,
  TrendingDown,
  TrendingUp,
  Waypoints,
  type LucideIcon,
} from "lucide-react"

import { MetricValue } from "@/components/dashboard/metric-value"
import { Sparkline } from "@/components/dashboard/sparkline"
import type { IndicatorKey, MetricDirection, MetricSummary } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

const ICONS: Record<IndicatorKey, LucideIcon> = {
  pauses: Pause,
  repetition: Repeat2,
  vocabulary: BookOpenText,
  speechRate: Gauge,
  coherence: Waypoints,
  fillers: MessageCircleMore,
}

const GLYPHS: Record<MetricDirection, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  flat: Minus,
}

export function MetricCard({ metric, delay = 0 }: { metric: MetricSummary; delay?: number }) {
  const Icon = ICONS[metric.key]
  const Glyph = GLYPHS[metric.direction]
  const signal = metric.tone === "signal"

  return (
    <article className="flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-rest transition-[translate,box-shadow] duration-200 ease-out-expo hover:-translate-y-0.5 hover:shadow-raised">
      <h3 className="flex items-center gap-2 type-label text-ink-secondary">
        <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        {metric.label}
      </h3>

      <p className="mt-5 flex h-10 items-end text-ink">
        {metric.percent !== null ? (
          <span className="type-metric">
            <MetricValue value={metric.percent} delay={delay} />
          </span>
        ) : (
          <span className="text-[1.5rem] leading-none font-semibold tracking-[-0.025em]">
            {metric.valueText}
          </span>
        )}
      </p>

      <p
        className={cn(
          "mt-2.5 flex items-center gap-1.5 type-label",
          signal ? "text-signal-text" : "text-neutral-trend"
        )}
      >
        <Glyph className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
        {metric.descriptor}
        {metric.signalDot ? (
          <span aria-hidden="true" className="ml-0.5 size-1.5 shrink-0 rounded-full bg-signal" />
        ) : null}
      </p>

      <div className="mt-auto pt-5">
        <Sparkline values={metric.sparkline} baseline={metric.baseline} tone={metric.tone} />
      </div>
    </article>
  )
}
