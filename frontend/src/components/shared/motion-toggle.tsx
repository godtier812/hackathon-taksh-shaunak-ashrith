"use client"

import { setMotionEnabled, usePrefersReducedMotion } from "@/lib/hooks"
import { cn } from "@/lib/utils"

/**
 * Small "Motion" switch for the top bars. Starts from the device's reduced-motion
 * setting; flipping it overrides that setting for this browser.
 */
export function MotionToggle({ className }: { className?: string }) {
  const on = !usePrefersReducedMotion()

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Animations"
      title={on ? "Animations on" : "Animations off"}
      onClick={() => setMotionEnabled(!on)}
      className={cn(
        "inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-1.5 text-ink-secondary transition-colors duration-150 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none",
        className
      )}
    >
      <span className="hidden font-mono text-[12px] lg:inline">Motion</span>
      <SwitchTrack on={on} />
    </button>
  )
}

/** The visual track and thumb, shared with the mobile menu's Motion item. */
export function SwitchTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full border transition-colors duration-200",
        on ? "border-brand bg-brand" : "border-line-strong bg-surface-muted"
      )}
    >
      <span
        className={cn(
          "absolute left-[2px] size-3 rounded-full bg-white shadow-rest transition-transform duration-200 ease-out-expo",
          on ? "translate-x-[14px]" : "translate-x-0 ring-1 ring-line-strong"
        )}
      />
    </span>
  )
}
