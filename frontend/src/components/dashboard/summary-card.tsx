import { ArrowRight, FileText, Info } from "lucide-react"

import { PillLink } from "@/components/shared/pill"
import { Separator } from "@/components/ui/separator"
import { summaryCopy, summaryDisclaimer } from "@/lib/demo/margaret"

export function SummaryCard({ headingId, showReportLink = false }: { headingId?: string; showReportLink?: boolean }) {
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-card border border-line bg-[color-mix(in_srgb,var(--accent-soft)_38%,var(--surface))] p-6 shadow-rest @3xl:p-8"
    >
      <div className="flex items-center gap-2.5">
        <FileText className="size-[18px] text-ink-secondary" strokeWidth={1.5} aria-hidden="true" />
        <h2 id={headingId} className="type-section text-ink">
          90-day summary
        </h2>
      </div>
      <p className="mt-4 max-w-[62ch] type-body-lg text-ink">{summaryCopy}</p>
      {showReportLink ? (
        <PillLink href="/dashboard/summary" variant="secondary" className="mt-6 bg-surface">
          Prepare appointment summary
          <ArrowRight data-icon="inline-end" strokeWidth={1.75} aria-hidden="true" />
        </PillLink>
      ) : null}
      <Separator className="my-6 bg-line" />
      <p className="flex max-w-[62ch] gap-2.5 text-[13px] leading-5 text-ink-secondary">
        <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        {summaryDisclaimer}
      </p>
    </section>
  )
}
