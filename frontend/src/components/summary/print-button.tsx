"use client"

import { Printer } from "lucide-react"

import { pillClassName } from "@/components/shared/pill"
import { Button } from "@/components/ui/button"

export function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()} className={pillClassName("primary", "sm")}>
      <Printer data-icon="inline-start" strokeWidth={1.75} aria-hidden="true" />
      Print or save as PDF
    </Button>
  )
}
