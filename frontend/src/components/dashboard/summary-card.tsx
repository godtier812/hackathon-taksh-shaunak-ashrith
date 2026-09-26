import { Info, NotebookPen } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import type { DashboardData } from "@/lib/dashboard/types"

export function SummaryCard({
  summary,
  headingId,
}: {
  summary: DashboardData["summary"]
  headingId?: string
}) {
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-card border border-line bg-[color-mix(in_srgb,var(--accent-soft)_38%,var(--surface))] p-6 shadow-rest @3xl:p-8"
    >
      <div className="flex items-center gap-2.5">
        <NotebookPen className="size-[18px] text-ink-secondary" strokeWidth={1.5} aria-hidden="true" />
        <h2 id={headingId} className="type-section text-ink">
          {summary.title}
        </h2>
      </div>
      <p className="mt-4 max-w-[62ch] type-body-lg text-ink">{summary.copy}</p>
      <Separator className="my-6 bg-line" />
      <p className="flex max-w-[62ch] gap-2.5 text-[13px] leading-5 text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        {summary.disclaimer}
      </p>
    </section>
  )
}
