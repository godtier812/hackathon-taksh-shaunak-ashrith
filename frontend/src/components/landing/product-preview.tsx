import { ArrowRight } from "lucide-react"

import { DashboardView } from "@/components/dashboard/dashboard-view"
import { PreviewFrame } from "@/components/landing/preview-frame"
import { PillLink } from "@/components/shared/pill"
import { Reveal } from "@/components/shared/reveal"

export function ProductPreview() {
  return (
    <section
      aria-labelledby="preview-title"
      className="relative -mt-[22svh] pb-20 md:-mt-[28svh] md:pb-24"
    >
      <div className="shell">
        <Reveal blur fadeDuration={0.7} className="mx-auto max-w-[40rem] text-center">
          <h2 id="preview-title" className="type-section text-ink">
            Margaret&rsquo;s record, at a glance.
          </h2>
          <p className="mt-3 type-body-lg text-ink-secondary">
            Every conversation adds a data point. Patterns emerge over weeks, not days.
          </p>
        </Reveal>

        <div className="mt-10 md:mt-12">
          <PreviewFrame>
            <DashboardView variant="preview" />
          </PreviewFrame>
        </div>

        <div className="mt-10 flex justify-center">
          <PillLink href="/dashboard">
            Open Margaret&rsquo;s dashboard
            <ArrowRight data-icon="inline-end" strokeWidth={1.75} aria-hidden="true" />
          </PillLink>
        </div>
      </div>
    </section>
  )
}
