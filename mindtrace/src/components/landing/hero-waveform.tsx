"use client"

import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react"
import { useEffect, useId, useMemo, useRef } from "react"

import { formatClock } from "@/lib/format"
import { useElementSize, usePrefersReducedMotion } from "@/lib/hooks"
import { easeOut } from "@/lib/motion"
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
 * The hero "review" waveform: Margaret's Day 1 conversation, with a slow
 * playhead sweeping across it. Bars behind the playhead are navy, bars ahead
 * are neutral. All per-frame work runs through motion values, not React state.
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

  const grow = useMotionValue(0)
  const head = useMotionValue(0)
  const d = useTransform(() => {
    const g = grow.get()
    return barPath(values, { width, height }, g >= 1 ? undefined : (i, n) => growGain(g, i, n))
  })
  const headX = useTransform(() => head.get() * width)
  const timestamp = useTransform(() => `${formatClock(head.get() * seconds)} / ${formatClock(seconds)}`)

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
      <figcaption className="flex items-center justify-between gap-4 font-mono type-caption text-ink-tertiary">
        <span>Conversation · {dateLabel}</span>
        <motion.span className="tabular-nums" aria-hidden="true">
          {timestamp}
        </motion.span>
      </figcaption>
      <div ref={frameRef} className="relative mt-3 h-[88px] w-full sm:h-[120px]">
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
          />
        </svg>
      </div>
    </figure>
  )
}
