"use client"

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"

import { caregiverNotes, chartRanges, type ChartRange, type IndicatorKey } from "@/lib/demo/margaret"

type DashboardState = {
  /** False in the landing-page preview: everything renders, nothing responds. */
  interactive: boolean
  range: ChartRange
  setRange: (range: ChartRange) => void
  /** Conversation highlighted on the chart. */
  selectedT: number | null
  selectSession: (t: number | null) => void
  /** Caregiver note highlighted on the chart and in the notes list. */
  activeNoteId: string | null
  selectNote: (id: string | null) => void
  /** Metric shown in the detail panel (kept while the panel animates closed). */
  metric: IndicatorKey | null
  metricOpen: boolean
  openMetric: (key: IndicatorKey) => void
  closeMetric: () => void
}

const noop = () => {}

const DashboardContext = createContext<DashboardState>({
  interactive: false,
  range: "90d",
  setRange: noop,
  selectedT: null,
  selectSession: noop,
  activeNoteId: null,
  selectNote: noop,
  metric: null,
  metricOpen: false,
  openMetric: noop,
  closeMetric: noop,
})

function inRange(range: ChartRange, t: number) {
  const points = chartRanges[range].points
  return t >= points[0].t && t <= points[points.length - 1].t
}

export function DashboardProvider({ interactive, children }: { interactive: boolean; children: ReactNode }) {
  const [range, setRange] = useState<ChartRange>("90d")
  const [selectedT, setSelectedT] = useState<number | null>(null)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  const [metric, setMetric] = useState<IndicatorKey | null>(null)
  const [metricOpen, setMetricOpen] = useState(false)

  const selectSession = useCallback((t: number | null) => {
    setSelectedT(t)
    setActiveNoteId(null)
  }, [])

  // Selecting a note outside the visible range widens the chart so the marker is on screen.
  const selectNote = useCallback(
    (id: string | null) => {
      setActiveNoteId(id)
      setSelectedT(null)
      const note = caregiverNotes.find((n) => n.id === id)
      if (note && !inRange(range, note.t)) setRange("all")
    },
    [range]
  )

  const openMetric = useCallback((key: IndicatorKey) => {
    setMetric(key)
    setMetricOpen(true)
  }, [])
  const closeMetric = useCallback(() => setMetricOpen(false), [])

  const value = useMemo(
    () => ({
      interactive,
      range,
      setRange,
      selectedT,
      selectSession,
      activeNoteId,
      selectNote,
      metric,
      metricOpen,
      openMetric,
      closeMetric,
    }),
    [interactive, range, selectedT, selectSession, activeNoteId, selectNote, metric, metricOpen, openMetric, closeMetric]
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  return useContext(DashboardContext)
}
