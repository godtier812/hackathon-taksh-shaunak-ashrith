import type { Metadata } from "next"

import { DashboardView } from "@/components/dashboard/dashboard-view"
import { TopBar } from "@/components/dashboard/top-bar"

export const metadata: Metadata = {
  title: "Margaret Reynolds · MindTrace",
  description:
    "A demonstration communication record for a fictional person, compared only with her own baseline. All values are synthetic.",
}

export default function DashboardPage() {
  return (
    <>
      <TopBar />
      <main className="shell pt-8 pb-20 md:pt-10 md:pb-24">
        <DashboardView variant="page" />
      </main>
    </>
  )
}
