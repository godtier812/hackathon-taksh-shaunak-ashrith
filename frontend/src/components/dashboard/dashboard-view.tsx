import { CaregiverNotes } from "@/components/dashboard/caregiver-notes"
import { DashboardProvider } from "@/components/dashboard/dashboard-context"
import { MetricCard } from "@/components/dashboard/metric-card"
import { MetricSheet } from "@/components/dashboard/metric-sheet"
import { PatientHeader } from "@/components/dashboard/patient-header"
import { RecentConversations } from "@/components/dashboard/recent-conversations"
import { SummaryCard } from "@/components/dashboard/summary-card"
import { TrendChart } from "@/components/dashboard/trend-chart"
import { Reveal } from "@/components/shared/reveal"
import { metricSummaries } from "@/lib/demo/margaret"
import { cn } from "@/lib/utils"

/** 5 across on wide containers, 3 + 2 on medium, 2 on tablet, 1 on phones. */
function metricSpan(index: number) {
  return cn(
    index < 3 ? "@4xl:col-span-2" : "@4xl:col-span-3",
    index === 4 && "@2xl:col-span-2",
    "@6xl:col-span-1"
  )
}

/**
 * Margaret's caregiver dashboard. Rendered as the real page and, unchanged, as
 * the scaled landing-page preview (`preview` drops headings and interactivity).
 * Layout uses container queries so the preview lays out like the page.
 */
export function DashboardView({ variant }: { variant: "page" | "preview" }) {
  const isPage = variant === "page"

  return (
    <DashboardProvider interactive={isPage}>
    <div className="@container">
      <div className="flex flex-col">
        <Reveal y={0} fadeDuration={0.25} amount={0.1}>
          <PatientHeader asHeading={isPage} />
        </Reveal>

        <Reveal delay={0.15} y={12} springy amount={0.15} className="mt-7 @3xl:mt-8">
          <TrendChart />
        </Reveal>

        <div className="mt-4 grid grid-cols-1 gap-4 @2xl:grid-cols-2 @4xl:grid-cols-6 @6xl:grid-cols-5">
          {metricSummaries.map((metric, i) => (
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
          Demo indicators, not clinical thresholds. Changes are measured against Margaret&rsquo;s own June
          baseline.
        </p>

        <div className="mt-8 grid gap-4 @4xl:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
          <Reveal y={8} amount={0.15}>
            <RecentConversations />
          </Reveal>
          <Reveal delay={0.06} y={8} amount={0.15}>
            <CaregiverNotes />
          </Reveal>
        </div>

        <Reveal y={8} amount={0.15} className="mt-8">
          <SummaryCard headingId={isPage ? "summary-title" : undefined} showReportLink={isPage} />
        </Reveal>
      </div>
    </div>
    {isPage ? <MetricSheet /> : null}
    </DashboardProvider>
  )
}
