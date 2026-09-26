"use client"

import { MotionConfig } from "motion/react"
import type { ReactNode } from "react"

import { SmoothScroll } from "@/components/providers/smooth-scroll"
import { AppToaster } from "@/components/shared/app-toaster"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScroll>
        <TooltipProvider delay={150}>{children}</TooltipProvider>
      </SmoothScroll>
      <AppToaster />
    </MotionConfig>
  )
}
