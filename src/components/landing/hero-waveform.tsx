"use client"

import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
} from "motion/react"
import { useEffect, useId, useMemo, useRef, useState } from "react"

import { STORY_BAND_BOTTOM, STORY_BAND_TOP, useHandoff } from "@/components/landing/handoff"
import { formatClock } from "@/lib/format"
import { useElementSize, usePrefersReducedMotion } from "@/lib/hooks"
import { easeOut, padRange } from "@/lib/motion"
import { WAVE_SAMPLES, barPath, barStrokeWidth, poolAmps } from "@/lib/waveform"

const SWEEP_SECONDS = 9
const HOLD_MS = 900
const FROZEN_HEAD = 0.44

/** Left-to-right growth: each bar rises from the baseline slightly after its neighbour. */
function growGain(progress: number, index: number, count: number) {
  const local = Math.min(1, Math.max(0, progress * 1.5 - (index / count) * 0.5))
  return 1 - Math.pow(1 - local, 3)
}

/**
 * Handoff travel curve (cubic Hermite). The waveform leaves moving with the page
 * (relative velocity 0) and arrives docked (moving exactly counter to the page,
 * i.e. still on screen) as the story stage pins, covering `k` viewports of offset.
 */
function travel(t: number, k: number) {
  const x = Math.min(1, Math.max(0, t))
  return k * (3 * x * x - 2 * x * x * x) + (x * x * x - x * x)
}

type Flight = { dy: number; scale: number; viewport: number }

/**
 * The hero "review" waveform: Margaret's Day 1 conversation, with a slow
 * playhead sweeping across it. On scroll, the sweep completes and the waveform
 * glides into the story stage, where it becomes the story's Day 1 waveform.
 */
export function HeroWaveform({
  amps,
  dateLabel,
  seconds,
}: {
  amps: number[]
  dateLabel: string
  seconds: number
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(frameRef, { width: 1136, height: 120 })
  const bars = width < 640 ? WAVE_SAMPLES / 2 : WAVE_SAMPLES
  const values = useMemo(() => (bars === WAVE_SAMPLES ? amps : poolAmps(amps, bars)), [amps, bars])
  const stroke = barStrokeWidth(width, bars)
  const reduced = usePrefersReducedMotion()
  const inView = useInView(frameRef, { amount: 0.1 })
  const clipId = `hero-played-${useId().replace(/:/g, "")}`
  const handoff = useHandoff()
  const idle = useMotionValue(0)
  const progress = handoff && !reduced ? handoff.progress : idle

  const grow = useMotionValue(0)
  const head = useMotionValue(0)
  const d = useTransform(() => {
    const g = grow.get()
    return barPath(values, { width, height }, g >= 1 ? undefined : (i, n) => growGain(g, i, n))
  })

  // Scrolling completes the review sweep before the waveform travels.
  const sweep = useTransform(progress, ...padRange([0, 0.55], [0, 1]))
  const headX = useTransform(() => Math.max(head.get(), sweep.get()) * width)
  const timestamp = useTransform(() => `${formatClock(head.get() * seconds)} / ${formatClock(seconds)}`)
  const chromeOpacity = useTransform(progress, ...padRange([0.05, 0.35], [1, 0]))
  const selfOpacity = useTransform(progress, ...padRange([0.97, 1], [1, 0]))

  // Re-measure as the handoff begins, after entrance animations have settled.
  const [armed, setArmed] = useState(false)
  useMotionValueEvent(progress, "change", (p) => {
    const next = p > 0
    setArmed((prev) => (prev === next ? prev : next))
  })

  // Geometry of the flight into the story stage, measured on layout changes only.
  const [flight, setFlight] = useState<Flight>({ dy: 0, scale: 1, viewport: 800 })
  useEffect(() => {
    const anchor = frameRef.current
    if (!handoff || !anchor) return
    const measure = () => {
      const story = handoff.storyRef.current
      const stage = handoff.stageRef.current
      const wave = handoff.waveRef.current
      if (!story || !stage || !wave) return
      const anchorTop = anchor.getBoundingClientRect().top + window.scrollY
      const storyTop = story.getBoundingClientRect().top + window.scrollY
      const bandInStage = wave.getBoundingClientRect().top - stage.getBoundingClientRect().top + STORY_BAND_TOP
      const bandHeight = wave.offsetHeight - STORY_BAND_TOP - STORY_BAND_BOTTOM
      const next = {
        dy: Math.round(bandInStage - (anchorTop - storyTop)),
        scale: bandHeight / Math.max(1, anchor.offsetHeight),
        viewport: window.innerHeight,
      }
      setFlight((prev) =>
        Math.abs(prev.dy - next.dy) < 1 && Math.abs(prev.scale - next.scale) < 0.005 && prev.viewport === next.viewport
          ? prev
          : next
      )
    }
    const observer = new ResizeObserver(measure)
    observer.observe(anchor)
    observer.observe(document.documentElement)
    if (handoff.waveRef.current) observer.observe(handoff.waveRef.current)
    return () => observer.disconnect()
  }, [handoff, armed])

  const flightY = useTransform(() => travel(progress.get(), flight.dy / flight.viewport) * flight.viewport)
  const flightScale = useTransform(() => {
    const t = Math.min(1, Math.max(0, progress.get()))
    const eased = t * t * (3 - 2 * t)
    return 1 + (flight.scale - 1) * eased
  })

  useEffect(() => {
    if (reduced) {
      grow.jump(1)
      head.jump(FROZEN_HEAD)
      return
    }
    const controls = animate(grow, 1, { duration: 0.65, delay: 0.45, ease: easeOut })
    return () => controls.stop()
  }, [reduced, grow, head])

  useEffect(() => {
    if (reduced || !inView) return
    let controls: ReturnType<typeof animate> | undefined
    let timer: number | undefined
    const run = (from: number, delay: number) => {
      controls = animate(head, [from, 1], {
        duration: SWEEP_SECONDS * (1 - from),
        delay,
        ease: "linear",
        onComplete: () => {
          timer = window.setTimeout(() => {
            head.jump(0)
            run(0, 0)
          }, HOLD_MS)
        },
      })
    }
    const current = head.get()
    run(current >= 1 ? 0 : current, current === 0 ? 1.1 : 0)
    return () => {
      controls?.stop()
      window.clearTimeout(timer)
    }
  }, [reduced, inView, head])

  const cy = height / 2

  return (
    <figure className="w-full">
      <motion.figcaption
        className="flex items-center justify-between gap-4 font-mono type-caption text-ink-tertiary"
        style={{ opacity: chromeOpacity }}
      >
        <span>Conversation · {dateLabel}</span>
        <motion.span className="tabular-nums" aria-hidden="true">
          {timestamp}
        </motion.span>
      </motion.figcaption>
      <div ref={frameRef} className="relative mt-3 h-[88px] w-full sm:h-[120px]">
        <motion.div
          className="absolute inset-0 z-10"
          style={{ y: flightY, scaleY: flightScale, opacity: selfOpacity, transformOrigin: "50% 0%" }}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
            className="absolute inset-0 block size-full overflow-visible"
            role="img"
            aria-label={`Speech waveform of a conversation recorded ${dateLabel}: fluent phrases separated by short, natural pauses.`}
          >
            <defs>
              <clipPath id={clipId}>
                <motion.rect x={0} y={-4} height={height + 8} width={headX} />
              </clipPath>
            </defs>
            <line x1={0} x2={width} y1={cy} y2={cy} stroke="var(--line-strong)" strokeWidth={1} />
            <motion.path d={d} fill="none" stroke="var(--line-strong)" strokeWidth={stroke} strokeLinecap="round" />
            <g clipPath={`url(#${clipId})`}>
              <line x1={0} x2={width} y1={cy} y2={cy} stroke="var(--brand)" strokeOpacity={0.5} strokeWidth={1} />
              <motion.path d={d} fill="none" stroke="var(--brand)" strokeWidth={stroke} strokeLinecap="round" />
            </g>
            <motion.line
              x1={headX}
              x2={headX}
              y1={2}
              y2={height - 2}
              stroke="var(--brand)"
              strokeOpacity={0.35}
              strokeWidth={1}
              style={{ opacity: chromeOpacity }}
            />
          </svg>
        </motion.div>
      </div>
    </figure>
  )
}
