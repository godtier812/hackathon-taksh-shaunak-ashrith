import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Wordmark } from "@/components/brand/wordmark"
import { SiteFooter } from "@/components/landing/site-footer"

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-canvas">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label="MindTrace home"
            className="relative -mx-1 rounded-md px-1 py-1 after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
          >
            <Wordmark />
          </Link>
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-full px-1 text-[14px] font-medium text-ink-secondary transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
            Back to MindTrace
          </Link>
        </div>
      </header>
      <main className="shell pt-12 pb-24 md:pt-16 md:pb-32">{children}</main>
      <SiteFooter />
    </>
  )
}
