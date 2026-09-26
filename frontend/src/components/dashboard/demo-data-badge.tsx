"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function DemoDataBadge() {
  return (
    <Tooltip>
      <TooltipTrigger className="relative inline-flex h-8 items-center after:absolute after:-inset-1.5 after:content-[''] gap-2 rounded-full border border-line-strong bg-surface px-3 type-label text-ink-secondary transition-colors duration-150 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-neutral-trend" />
        Demo data
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-[260px] px-3 py-2 text-[12px] leading-snug">
        Margaret Reynolds is a fictional person. All values are synthetic.
      </TooltipContent>
    </Tooltip>
  )
}
