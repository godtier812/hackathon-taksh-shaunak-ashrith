import type { Metadata } from "next"

import { LiveDashboard } from "@/components/dashboard/live-dashboard"

export const metadata: Metadata = {
  title: "Dashboard · MindTrace",
  description:
    "A communication record compared only with the person's own baseline. Shows live check-ins from the MindTrace desktop app, or a fictional demo record when the app isn't running.",
}

export default function DashboardPage() {
  return <LiveDashboard />
}
