import { ArrowLeft, Info } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import { Wordmark } from "@/components/brand/wordmark"
import { IndexSparkline } from "@/components/summary/index-sparkline"
import { PrintButton } from "@/components/summary/print-button"
import {
  caregiverNotes,
  indicatorDetails,
  latestSession,
  metricSummaries,
  patient,
  summaryCopy,
  summaryDisclaimer,
} from "@/lib/demo/margaret"
import { formatDate, formatSigned } from "@/lib/format"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Appointment summary · MindTrace",
  description: "A printable 90-day communication summary for a fictional person. All values are synthetic.",
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-mono type-eyebrow text-ink-tertiary">{children}</h2>
}

export default function AppointmentSummaryPage() {
  const rows = metricSummaries.map((metric) => {
    const detail = indicatorDetails[metric.key]
    const pct = Math.round((detail.current / detail.baseline - 1) * 100)
    return { metric, detail, pct }
  })
  const changed = rows.filter((row) => Math.abs(row.pct) >= 3)
  const steady = rows.filter((row) => Math.abs(row.pct) < 3)

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas print:hidden">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-full px-1 text-[14px] font-medium text-ink-secondary transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Back to dashboard
          </Link>
          <PrintButton />
        </div>
      </header>

      <main className="shell pt-8 pb-20 md:pt-12 print:p-0">
        <article className="mx-auto max-w-[52rem] rounded-card border border-line bg-surface p-6 shadow-rest md:p-12 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Wordmark size="sm" />
              <h1 className="mt-5 type-page text-ink">Communication summary</h1>
              <p className="mt-2 type-body text-ink-secondary">
                {patient.name} · Age {patient.age} · {patient.rangeLabel} · {patient.sessionCount} conversations
              </p>
            </div>
            <p className="font-mono type-caption text-ink-tertiary sm:text-right">
              Prepared for an appointment
              <br />
              Demo data · fictional person
            </p>
          </div>

          <section className="mt-8">
            <SectionTitle>Overview</SectionTitle>
            <p className="mt-3 type-body-lg text-ink">{summaryCopy}</p>
          </section>

          <section className="mt-10">
            <SectionTitle>Indicators compared with her June baseline</SectionTitle>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-left text-[14px]">
                <thead>
                  <tr className="border-b border-line font-mono type-caption text-ink-tertiary">
                    <th scope="col" className="py-2 pr-4 font-normal">
                      Indicator
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-normal">
                      June baseline
                    </th>
                    <th scope="col" className="py-2 pr-4 text-right font-normal">
                      Last two weeks
                    </th>
                    <th scope="col" className="py-2 text-right font-normal">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ metric, detail, pct }) => (
                    <tr key={metric.key} className="border-b border-line">
                      <th scope="row" className="py-3 pr-4 font-medium text-ink">
                        {detail.label}
                        <span className="block font-mono text-[11px] font-normal text-ink-tertiary">{detail.unit}</span>
                      </th>
                      <td className="py-3 pr-4 text-right text-ink-secondary tabular-nums">
                        {detail.baseline.toFixed(detail.decimals)}
                      </td>
                      <td className="py-3 pr-4 text-right text-ink tabular-nums">
                        {detail.current.toFixed(detail.decimals)}
                      </td>
                      <td
                        className={cn(
                          "py-3 text-right font-medium tabular-nums",
                          metric.tone === "signal" ? "text-signal-text" : "text-ink-secondary"
                        )}
                      >
                        {Math.abs(pct) < 3 ? "Stable" : `${formatSigned(pct)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mt-10 break-inside-avoid">
            <div className="flex items-baseline justify-between gap-4">
              <SectionTitle>Communication index over time</SectionTitle>
              <span className="font-mono type-caption text-ink-tertiary">
                {formatDate(latestSession.t)} · {Math.round(latestSession.index)}
              </span>
            </div>
            <div className="mt-4">
              <IndexSparkline />
            </div>
            <p className="mt-2 type-caption text-ink-tertiary">
              Composite of five indicators; 100 is her June baseline and the shaded band is her usual range. Demo
              index, not a clinical measure.
            </p>
          </section>

          <section className="mt-10 grid gap-8 sm:grid-cols-2">
            <div>
              <SectionTitle>Changes you may want to mention</SectionTitle>
              <ul className="mt-3 flex flex-col gap-2.5 type-body text-ink">
                {changed.map(({ detail, pct }) => (
                  <li key={detail.key} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-signal" />
                    <span>
                      {detail.label} {pct > 0 ? "has increased" : "has eased"} gradually ({formatSigned(pct)}%)
                      since June.
                    </span>
                  </li>
                ))}
                {steady.map(({ detail }) => (
                  <li key={detail.key} className="flex gap-2.5">
                    <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-neutral-trend" />
                    <span>{detail.label} has stayed within her baseline range.</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <SectionTitle>Caregiver notes</SectionTitle>
              <ul className="mt-3 flex flex-col gap-3">
                {caregiverNotes.map((note) => (
                  <li key={note.id}>
                    <p className="text-[14px] font-medium text-ink">
                      {note.title}
                      <span className="ml-2 font-mono text-[11px] font-normal text-ink-tertiary">
                        {formatDate(note.t)}
                      </span>
                    </p>
                    <p className="text-[13px] leading-snug text-ink-secondary">{note.body}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <p className="mt-10 flex gap-2.5 border-t border-line pt-6 text-[13px] leading-5 text-ink-secondary">
            <Info className="mt-0.5 size-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {summaryDisclaimer} MindTrace compares each person only to their own baseline and does not diagnose any
            condition. All values in this summary are synthetic demo data.
          </p>
        </article>
      </main>
    </>
  )
}
