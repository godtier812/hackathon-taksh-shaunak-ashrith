import type { ReactNode } from "react"

import { LEGAL_CONTACT, LEGAL_UPDATED } from "@/lib/legal"

/** Long-form legal copy with consistent, readable typography. */
export function LegalArticle({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string
  title: string
  intro: ReactNode
  children: ReactNode
}) {
  return (
    <article className="mx-auto max-w-[42.5rem]">
      <p className="font-mono type-eyebrow text-ink-tertiary">{eyebrow}</p>
      <h1 className="mt-4 type-page text-ink">{title}</h1>
      <p className="mt-3 font-mono type-caption text-ink-tertiary">Last updated {LEGAL_UPDATED}</p>
      <div className="mt-6 type-body-lg text-ink">{intro}</div>
      <div className="mt-2 [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-medium [&_strong]:text-ink [&>h2]:mt-12 [&>h2]:scroll-mt-24 [&>h2]:type-section [&>h2]:text-ink [&>p]:mt-4 [&>p]:type-body [&>p]:text-ink-secondary [&>ul]:mt-4 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-5 [&>ul>li]:type-body [&>ul>li]:text-ink-secondary [&>ul>li]:marker:text-line-strong">
        {children}
      </div>
    </article>
  )
}

/** A highlighted "short version" box at the top of a legal page. */
export function LegalSummary({ title = "The short version", items }: { title?: string; items: ReactNode[] }) {
  return (
    <section className="mt-8 rounded-card border border-line bg-surface p-6 shadow-rest">
      <h2 className="font-mono type-eyebrow text-ink-tertiary">{title}</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3 type-body text-ink">
            <span aria-hidden="true" className="mt-[9px] size-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LegalContact() {
  return (
    <p>
      Questions about this page? Contact the MindTrace team through{" "}
      <a href={LEGAL_CONTACT.href} rel="noopener noreferrer" target="_blank">
        {LEGAL_CONTACT.label}
      </a>
      .
    </p>
  )
}
