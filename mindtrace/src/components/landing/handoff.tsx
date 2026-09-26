"use client"

import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react"
import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from "react"

import { usePrefersReducedMotion } from "@/lib/hooks"
import { padRange } from "@/lib/motion"

/** Vertical space above the story waveform band (repeat brackets live there). */
export const STORY_BAND_TOP = 34
/** Space below the story waveform band. */
export const STORY_BAND_BOTTOM = 4

type Handoff = {
  /** 0 → 1 while the story section rises from the bottom of the viewport to the top. */
  progress: MotionValue<number>
  storyRef: RefObject<HTMLElement | null>
  stageRef: RefObject<HTMLDivElement | null>
  waveRef: RefObject<HTMLDivElement | null>
}

const HandoffContext = createContext<Handoff | null>(null)

/**
 * Links the hero and the scroll story: the hero's Day 1 waveform travels into
 * the story stage and becomes the story's waveform as the stage pins.
 */
export function HandoffProvider({ children }: { children: ReactNode }) {
  const storyRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const waveRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: storyRef, offset: ["start end", "start start"] })
  const value = useMemo(
    () => ({ progress: scrollYProgress, storyRef, stageRef, waveRef }),
    [scrollYProgress]
  )
  return <HandoffContext.Provider value={value}>{children}</HandoffContext.Provider>
}

export function useHandoff() {
  return useContext(HandoffContext)
}

/** Fades (and optionally lifts) its children across a slice of the handoff. */
export function HandoffFade({
  children,
  range,
  from = 1,
  to = 0,
  lift = 0,
  className,
}: {
  children: ReactNode
  range: [number, number]
  from?: number
  to?: number
  lift?: number
  className?: string
}) {
  const handoff = useHandoff()
  const reduced = usePrefersReducedMotion()
  const idle = useMotionValue(0)
  const progress = handoff?.progress ?? idle
  const opacity = useTransform(progress, ...padRange(range, [from, to]))
  const y = useTransform(progress, ...padRange(range, [0, lift]))
  if (!handoff || reduced) return <div className={className}>{children}</div>
  return (
    <motion.div className={className} style={{ opacity, y }}>
      {children}
    </motion.div>
  )
}
