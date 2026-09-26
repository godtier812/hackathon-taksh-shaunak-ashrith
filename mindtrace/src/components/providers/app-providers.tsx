"use client"

import { MotionConfig } from "motion/react"
import { useEffect, type ReactNode } from "react"

import { SmoothScroll } from "@/components/providers/smooth-scroll"
import { AppToaster } from "@/components/shared/app-toaster"
import { TooltipProvider } from "@/components/ui/tooltip"
import { usePrefersReducedMotion } from "@/lib/hooks"

export function AppProviders({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion()

  // Lets CSS-only animations follow the same preference as the Motion switch.
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "off" : "on"
  }, [reduced])

  return (
    <MotionConfig reducedMotion={reduced ? "always" : "never"}>
      <SmoothScroll>
        <TooltipProvider delay={150}>{children}</TooltipProvider>
      </SmoothScroll>
      <AppToaster />
    </MotionConfig>
  )
}
