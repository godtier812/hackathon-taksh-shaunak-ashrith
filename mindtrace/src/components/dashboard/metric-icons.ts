import { BookOpenText, Gauge, Pause, Repeat2, Waypoints, type LucideIcon } from "lucide-react"

import type { IndicatorKey } from "@/lib/demo/margaret"

export const METRIC_ICONS: Record<IndicatorKey, LucideIcon> = {
  pauses: Pause,
  repetition: Repeat2,
  vocabulary: BookOpenText,
  speechRate: Gauge,
  coherence: Waypoints,
}
