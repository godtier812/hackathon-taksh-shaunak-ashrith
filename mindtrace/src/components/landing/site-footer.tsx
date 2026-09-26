import Link from "next/link"

import { Wordmark } from "@/components/brand/wordmark"
import { LEGAL_PAGES } from "@/lib/legal"

export function SiteFooter() {
  return (
    <footer className="border-t border-line print:hidden">
      <div className="shell flex flex-col gap-5 py-10 text-[13px] leading-5 text-ink-tertiary">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Wordmark size="sm" />
          <nav aria-label="Legal" className="-mx-1 flex flex-wrap gap-x-4">
            {LEGAL_PAGES.map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="inline-flex h-11 items-center rounded-md px-1 text-ink-secondary underline-offset-4 transition-colors hover:text-ink hover:underline focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none md:h-auto"
              >
                {page.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-1.5 border-t border-line pt-5 md:flex-row md:justify-between">
          <p>A caregiver tool, not a diagnostic device. All data shown is synthetic.</p>
          <p>© 2026 MindTrace</p>
        </div>
      </div>
    </footer>
  )
}
