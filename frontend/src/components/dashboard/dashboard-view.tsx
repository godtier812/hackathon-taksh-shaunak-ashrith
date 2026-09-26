import { AudioLines } from "lucide-react"
import type { ReactNode } from "react"

import { MetricCard } from "@/components/dashboard/metric-card"
import { PatientHeader } from "@/components/dashboard/patient-header"
import { SummaryCard } from "@/components/dashboard/summary-card"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { pillClassName } from "@/components/shared/pill"
import { Reveal } from "@/components/shared/reveal"
import type { DashboardData } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

/** 5 across on wide containers, 3 + 2 on medium, 2 on tablet, 1 on phones. */
function metricSpan(index: number) {
  return cn(
    index < 3 ? "@4xl:col-span-2" : "@4xl:col-span-3",
    index === 4 && "@2xl:col-span-2",
    "@6xl:col-span-1"
  )
}

/** The preview's copy of the action button: same look, nothing to click. */
function PreviewAction() {
  return (
    <span className={cn(pillClassName("primary", "md"), "inline-flex w-full shrink-0 items-center justify-center @2xl:w-auto")}>
      <AudioLines data-icon="inline-start" strokeWidth={1.75} aria-hidden="true" />
      Analyze new conversation
    </span>
  )
}

/**
 * The caregiver dashboard. Rendered as the real page (demo or live data) and,
 * with Margaret's demo data, as the scaled landing-page preview (`preview`
 * drops headings and interactivity). Layout uses container queries so the
 * preview lays out like the page.
 */
export function DashboardView({
  variant,
  data,
  action,
  panel,
}: {
  variant: "page" | "preview"
  data: DashboardData
  /** Header action for the page; the preview shows a static button. */
  action?: ReactNode
  /** Optional panel under the header (the conversation recorder). */
  panel?: ReactNode
}) {
  const isPage = variant === "page"

  return (
    <div className="@container">
      <div className="flex flex-col">
        <Reveal y={0} fadeDuration={0.25} amount={0.1}>
          <PatientHeader patient={data.patient} asHeading={isPage} action={action ?? <PreviewAction />} />
        </Reveal>

        {panel}

        <Reveal delay={0.15} y={12} springy amount={0.15} className="mt-7 @3xl:mt-8">
          <TrendChart chart={data.chart} interactive={isPage} />
        </Reveal>

        <div className="mt-4 grid grid-cols-1 gap-4 @2xl:grid-cols-2 @4xl:grid-cols-6 @6xl:grid-cols-5">
          {data.metrics.map((metric, i) => (
            <Reveal
              key={metric.key}
              delay={0.3 + i * 0.06}
              y={6}
              amount={0.2}
              className={metricSpan(i)}
            >
              <MetricCard metric={metric} delay={0.3 + i * 0.06} />
            </Reveal>
          ))}
        </div>
        <p data-preview-end className="mt-3 type-caption text-ink-tertiary">
          {data.metricsFootnote}
        </p>

        <Reveal delay={0.55} y={8} amount={0.15} className="mt-8">
          <SummaryCard summary={data.summary} headingId={isPage ? "summary-title" : undefined} />
        </Reveal>
      </div>
    </div>
  )
}
