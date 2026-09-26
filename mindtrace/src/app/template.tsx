import type { ReactNode } from "react"

/**
 * Enter-only route transition. Templates remount on navigation, which replays
 * the CSS animation; no exit animation is attempted (App Router has no reliable
 * exit hook). Pure CSS, so first paint never waits for hydration.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>
}
