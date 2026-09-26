"use client"

import type { ReactNode } from "react"

import { pillClassName } from "@/components/shared/pill"
import { Button } from "@/components/ui/button"
import { announcePhase2 } from "@/lib/phase2"

/** Fully styled Phase 2 entry point; clicking shows a single placeholder toast. */
export function Phase2Button({
  variant = "primary",
  className,
  children,
}: {
  variant?: "primary" | "secondary"
  className?: string
  children: ReactNode
}) {
  return (
    <Button type="button" onClick={announcePhase2} className={pillClassName(variant, "md", className)}>
      {children}
    </Button>
  )
}
