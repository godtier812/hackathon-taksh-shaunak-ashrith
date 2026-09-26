import Link from "next/link"

import { Wordmark } from "@/components/brand/wordmark"
import { DemoDataBadge } from "@/components/dashboard/demo-data-badge"
import { MotionToggle } from "@/components/shared/motion-toggle"

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="MindTrace home"
          className="relative -mx-1 rounded-md px-1 py-1 after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
        >
          <Wordmark />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <MotionToggle />
          <DemoDataBadge />
        </div>
      </div>
    </header>
  )
}
