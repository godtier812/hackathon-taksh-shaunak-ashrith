"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { DashboardData } from "@/lib/dashboard/types"
import { cn } from "@/lib/utils"

const COPY: Record<DashboardData["source"], { label: string; tooltip: string }> = {
  demo: {
    label: "Demo data",
    tooltip:
      "Margaret Reynolds is a fictional person. All values are synthetic. Open the MindTrace desktop app on this computer to see live check-ins.",
  },
  live: {
    label: "Live",
    tooltip: "Check-ins from the MindTrace desktop app on this computer. Updates automatically.",
  },
}

/** Says where the dashboard's numbers come from: Margaret's demo record or the desktop app. */
export function DataSourceBadge({ source }: { source: DashboardData["source"] }) {
  const { label, tooltip } = COPY[source]
  return (
    <Tooltip>
      <TooltipTrigger className="relative inline-flex h-8 items-center after:absolute after:-inset-1.5 after:content-[''] gap-2 rounded-full border border-line-strong bg-surface px-3 type-label text-ink-secondary transition-colors duration-150 hover:text-ink focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none">
        <span
          aria-hidden="true"
          className={cn("size-1.5 rounded-full", source === "live" ? "bg-accent" : "bg-neutral-trend")}
        />
        {label}
      </TooltipTrigger>
      <TooltipContent side="bottom" align="end" className="max-w-[260px] px-3 py-2 text-[12px] leading-snug">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
