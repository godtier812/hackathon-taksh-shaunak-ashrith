"use client"

import { AudioLines } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { AnalyzePanel } from "@/components/dashboard/analyze-panel"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { TopBar } from "@/components/dashboard/top-bar"
import { pillClassName } from "@/components/shared/pill"
import { Button } from "@/components/ui/button"
import { mindtrace, OFFLINE_MESSAGE } from "@/lib/backend/connection"
import { demoDashboard } from "@/lib/dashboard/demo"
import { toLiveDashboard } from "@/lib/dashboard/live"
import type { DashboardData } from "@/lib/dashboard/types"

/** How often to look for new check-ins while live, and for the app coming online while offline. */
const POLL_MS = 4000
const OFFLINE_POLL_MS = 12000

type Connection = "connecting" | "live" | "offline"

/**
 * The /dashboard page. Shows the MindTrace desktop app's check-ins when the app
 * is running on this computer, and Margaret's demo record when it isn't. Polls,
 * so a check-in recorded in the desktop app appears here on its own.
 */
export function LiveDashboard() {
  const [connection, setConnection] = useState<Connection>("connecting")
  const [live, setLive] = useState<DashboardData | null>(null)
  const [recorderOpen, setRecorderOpen] = useState(false)
  const lastSignature = useRef("")

  /** Returns whether the desktop app answered. */
  const refresh = useCallback(async () => {
    try {
      const sessions = await mindtrace.listSessions()
      // `/dashboard#analyze` (the landing page's "Start a session") opens the recorder once the app is found.
      if (lastSignature.current === "" && window.location.hash === "#analyze") setRecorderOpen(true)
      // Rebuild only when a check-in was added, so the page doesn't re-render every poll.
      const signature = `${sessions.length}:${sessions[sessions.length - 1]?.id ?? ""}`
      if (signature !== lastSignature.current) {
        lastSignature.current = signature
        setLive(toLiveDashboard(sessions))
      }
      setConnection("live")
      return true
    } catch {
      setConnection("offline")
      return false
    }
  }, [])

  useEffect(() => {
    let timer = 0
    let stopped = false
    const poll = async () => {
      const online = await refresh()
      if (!stopped) timer = window.setTimeout(() => void poll(), online ? POLL_MS : OFFLINE_POLL_MS)
    }
    timer = window.setTimeout(() => void poll(), 0)
    return () => {
      stopped = true
      window.clearTimeout(timer)
    }
  }, [refresh])

  if (connection === "connecting") {
    return (
      <>
        <TopBar />
        <main className="shell pt-8 pb-24 md:pt-10 md:pb-32">
          <p role="status" className="font-mono type-caption text-ink-tertiary motion-safe:animate-pulse">
            Connecting to the MindTrace app…
          </p>
        </main>
      </>
    )
  }

  const isLive = connection === "live" && live !== null
  const data = isLive ? live : demoDashboard

  const action = (
    <Button
      type="button"
      onClick={() => {
        if (isLive) setRecorderOpen(true)
        else toast(OFFLINE_MESSAGE, { id: "mindtrace-offline" })
      }}
      className={pillClassName("primary", "md", "w-full shrink-0 @2xl:w-auto")}
    >
      <AudioLines data-icon="inline-start" strokeWidth={1.75} aria-hidden="true" />
      Analyze new conversation
    </Button>
  )

  return (
    <>
      <TopBar source={data.source} />
      <main className="shell pt-8 pb-24 md:pt-10 md:pb-32">
        <DashboardView
          key={data.source}
          variant="page"
          data={data}
          action={action}
          panel={
            isLive && recorderOpen ? (
              <AnalyzePanel onClose={() => setRecorderOpen(false)} onAnalyzed={() => void refresh()} />
            ) : null
          }
        />
      </main>
    </>
  )
}
