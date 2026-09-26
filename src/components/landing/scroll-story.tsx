"use client"

import { motion, useMotionValue, useScroll, useTransform, type MotionValue } from "motion/react"
import { useMemo, useRef, type ReactNode } from "react"

import { STORY_BAND_BOTTOM, STORY_BAND_TOP, useHandoff } from "@/components/landing/handoff"
import type { StoryStage } from "@/lib/demo/margaret"
import { useElementSize, usePrefersReducedMotion } from "@/lib/hooks"
import { padRange, smoothstep } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { WAVE_SAMPLES, barPath, barStrokeWidth, mixAmps, poolAmps, sampleX } from "@/lib/waveform"

/*
 * Scroll map (progress 0 → 1 across the tall section; the stage is sticky):
 *   0.00–0.26  Day 1 hold          0.26–0.35  morph to Day 30
 *   0.35–0.58  Day 30 hold         0.58–0.67  morph to Day 90
 *   0.67–0.84  Day 90 hold         0.84–0.90  stage text out, waveform dims
 *   0.86–0.96  resolution line     0.955–1.0  waveform resolves into a single point
 */
const MORPHS: [number, number][] = [
  [0.26, 0.35],
  [0.58, 0.67],
]

function stageBlend(p: number): [number, number, number] {
  const [a, b] = MORPHS
  if (p < a[0]) return [0, 0, 0]
  if (p < a[1]) return [0, 1, smoothstep((p - a[0]) / (a[1] - a[0]))]
  if (p < b[0]) return [1, 1, 0]
  if (p < b[1]) return [1, 2, smoothstep((p - b[0]) / (b[1] - b[0]))]
  return [2, 2, 0]
}

/** Visibility window for each stage's text; only one headline is fully visible at a time. */
const STAGE_WINDOWS = [
  { input: [0, 0.29, 0.32], opacity: [1, 1, 0], y: [0, 0, -8] },
  { input: [0.3, 0.33, 0.61, 0.64], opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] },
  { input: [0.62, 0.65, 0.84, 0.88], opacity: [0, 1, 1, 0], y: [8, 0, 0, -8] },
]

/** Waveform layer windows used when motion is reduced (crossfade instead of morph). */
const REDUCED_WAVE_WINDOWS = [
  { input: [0.29, 0.32], opacity: [1, 0] },
  { input: [0.3, 0.33, 0.61, 0.64], opacity: [0, 1, 1, 0] },
  { input: [0.62, 0.65], opacity: [0, 1] },
]

const STAGE_STARTS = [0, 0.31, 0.63]

type Progress = MotionValue<number>

/** Scroll-linked transform with keyframes padded to the full 0–1 range. */
function useRange(progress: Progress, input: number[], output: number[]) {
  const [paddedInput, paddedOutput] = padRange(input, output)
  return useTransform(progress, paddedInput, paddedOutput)
}

function StageLayer({
  progress,
  index,
  drift = true,
  reduced,
  className,
  children,
}: {
  progress: Progress
  index: number
  drift?: boolean
  reduced: boolean
  className?: string
  children: ReactNode
}) {
  const range = STAGE_WINDOWS[index]
  const opacity = useRange(progress, range.input, range.opacity)
  const y = useRange(progress, range.input, range.y)
  return (
    <motion.div
      className={cn("col-start-1 row-start-1", className)}
      style={{ opacity, y: drift && !reduced ? y : 0 }}
    >
      {children}
    </motion.div>
  )
}

function Chip({
  progress,
  reduced,
  label,
  values,
  signalFrom,
}: {
  progress: Progress
  reduced: boolean
  label: string
  values: string[]
  signalFrom: number
}) {
  const start = STAGE_STARTS[signalFrom]
  const signal = useRange(progress, [start - 0.01, start + 0.02], [0, 1])
  return (
    <div className="relative inline-flex items-center gap-2.5 rounded-chip border border-line bg-surface px-3 py-2 font-mono type-caption shadow-rest">
      <motion.span
        aria-hidden="true"
        className="absolute -inset-px rounded-chip border border-signal/35 bg-signal-soft"
        style={{ opacity: signal }}
      />
      <span className="relative text-ink-secondary">{label}</span>
      <span className="relative grid min-w-[2.5ch] justify-items-end font-medium tabular-nums">
        {values.map((value, i) => (
          <StageLayer key={i} progress={progress} index={i} drift={false} reduced={reduced}>
            <span className={i >= signalFrom ? "text-signal-text" : "text-ink"}>{value}</span>
          </StageLayer>
        ))}
      </span>
    </div>
  )
}

function StaticWaveLayer({
  progress,
  index,
  d,
  stroke,
}: {
  progress: Progress
  index: number
  d: string
  stroke: number
}) {
  const range = REDUCED_WAVE_WINDOWS[index]
  const opacity = useRange(progress, range.input, range.opacity)
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="var(--brand)"
      strokeWidth={stroke}
      strokeLinecap="round"
      style={{ opacity }}
    />
  )
}

const BRACKET_SPACE = STORY_BAND_TOP

function StoryWaveform({
  progress,
  stages,
  reduced,
  describedBy,
}: {
  progress: Progress
  stages: StoryStage[]
  reduced: boolean
  describedBy: string
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(frameRef, { width: 1136, height: 260 })
  const compact = width < 640
  const bars = compact ? WAVE_SAMPLES / 2 : WAVE_SAMPLES
  const pooled = useMemo(
    () => stages.map((s) => (bars === WAVE_SAMPLES ? s.wave.amps : poolAmps(s.wave.amps, bars))),
    [stages, bars]
  )
  const layout = useMemo(
    () => ({ width, height: height - BRACKET_SPACE - STORY_BAND_BOTTOM, top: BRACKET_SPACE }),
    [width, height]
  )
  const cy = layout.top + layout.height / 2
  const stroke = barStrokeWidth(width, bars)

  const d = useTransform(() => {
    const [from, to, t] = stageBlend(progress.get())
    return barPath(mixAmps(pooled[from], pooled[to], t), layout)
  })
  const ghostOpacity = useRange(progress, [0.26, 0.35, 0.84, 0.9], [0, 0.12, 0.12, 0])
  const day30Marks = useRange(progress, [0.3, 0.34, 0.58, 0.62], [0, 1, 1, 0])
  const day90Marks = useRange(progress, [0.63, 0.67, 0.84, 0.88], [0, 1, 1, 0])
  const waveOpacity = useRange(progress, [0.84, 0.9, 0.975, 0.995], [1, 0.3, 0.3, 0])
  const collapse = useRange(progress, [0.955, 0.995], [1, 0.01])
  const pointOpacity = useRange(progress, [0.975, 0.995], [0, 1])

  const x = (sample: number) => sampleX(sample, width)
  const bracketY = BRACKET_SPACE - 12

  const brackets = (stage: StoryStage) =>
    stage.wave.repeats.map((mark, i) => {
      const x0 = x(mark.start) + 2
      const x1 = x(mark.end) - 2
      const showLabel = !compact || i === 0
      return (
        <g key={`r-${mark.start}`}>
          <path
            d={`M${x0} ${bracketY + 6}V${bracketY}H${x1}V${bracketY + 6}`}
            fill="none"
            stroke="var(--signal)"
            strokeWidth={1}
          />
          {showLabel ? (
            <text
              x={(x0 + x1) / 2}
              y={bracketY - 6}
              textAnchor="middle"
              className="fill-signal-text font-mono text-[11px]"
            >
              repeated
            </text>
          ) : null}
        </g>
      )
    })

  const pauseMarks = (stage: StoryStage) =>
    stage.wave.pauses
      .filter((p) => p.seconds >= (compact ? 1.5 : 1.2))
      .map((mark) => {
        const x0 = x(mark.start) + 4
        const x1 = x(mark.end) - 4
        return (
          <g key={`p-${mark.start}`}>
            <path
              d={`M${x0} ${cy - 3}V${cy + 3}M${x0} ${cy}H${x1}M${x1} ${cy - 3}V${cy + 3}`}
              fill="none"
              stroke="var(--signal)"
              strokeWidth={1}
            />
            <text
              x={(x0 + x1) / 2}
              y={cy - 9}
              textAnchor="middle"
              className="fill-signal-text font-mono text-[11px] tabular-nums"
            >
              {mark.seconds.toFixed(1)}s
            </text>
          </g>
        )
      })

  const staticPaths = useMemo(() => pooled.map((values) => barPath(values, layout)), [pooled, layout])

  return (
    <div ref={frameRef} className="relative h-[190px] w-full md:h-[260px]">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 block size-full overflow-visible"
        role="img"
        aria-label="Waveforms of Margaret's conversations on day 1, day 30 and day 90"
        aria-describedby={describedBy}
      >
        <motion.g style={{ opacity: waveOpacity, scaleX: reduced ? 1 : collapse }}>
          <line x1={0} x2={width} y1={cy} y2={cy} stroke="var(--line-strong)" strokeWidth={1} />
          <motion.path
            d={staticPaths[0]}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={stroke}
            strokeLinecap="round"
            style={{ opacity: ghostOpacity }}
          />
          {reduced ? (
            staticPaths.map((path, i) => (
              <StaticWaveLayer key={i} progress={progress} index={i} d={path} stroke={stroke} />
            ))
          ) : (
            <motion.path d={d} fill="none" stroke="var(--brand)" strokeWidth={stroke} strokeLinecap="round" />
          )}
          <motion.g style={{ opacity: day30Marks }}>{brackets(stages[1])}</motion.g>
          <motion.g style={{ opacity: day90Marks }}>
            {brackets(stages[2])}
            {pauseMarks(stages[2])}
          </motion.g>
        </motion.g>
        <motion.circle cx={width / 2} cy={cy} r={5} fill="var(--brand)" style={{ opacity: pointOpacity }} />
      </svg>
    </div>
  )
}

function TimelineRail({ progress, stages }: { progress: Progress; stages: StoryStage[] }) {
  const fill = useRange(progress, [0, STAGE_STARTS[1], STAGE_STARTS[2]], [0, 0.5, 1])
  return (
    <div aria-hidden="true" className="relative">
      <div className="relative mx-[3px] h-px bg-line-strong">
        <motion.div className="absolute inset-0 origin-left bg-brand" style={{ scaleX: fill }} />
        {stages.map((stage, i) => (
          <RailTick key={stage.key} progress={progress} index={i} />
        ))}
      </div>
      <div className="mt-3 flex justify-between font-mono type-caption text-ink-tertiary">
        {stages.map((stage) => (
          <span key={stage.key}>{stage.label}</span>
        ))}
      </div>
    </div>
  )
}

function RailTick({ progress, index }: { progress: Progress; index: number }) {
  const start = STAGE_STARTS[index]
  const active = useRange(progress, [Math.max(0, start - 0.01), start], [index === 0 ? 1 : 0, 1])
  return (
    <span
      className="absolute top-1/2 size-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-strong bg-canvas"
      style={{ left: `${index * 50}%` }}
    >
      <motion.span className="absolute -inset-px rounded-full bg-brand" style={{ opacity: active }} />
    </span>
  )
}

function ResolutionLine({ progress, reduced }: { progress: Progress; reduced: boolean }) {
  const opacity = useRange(progress, [0.86, 0.9], [0, 1])
  const y = useRange(progress, [0.86, 0.9], [10, 0])
  const words = ["MindTrace", "makes", "them", "visible."]
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-[22svh] md:pb-[30svh]">
      <motion.p
        className="shell text-center type-display"
        style={{ opacity, y: reduced ? 0 : y }}
      >
        <span className="block text-ink-tertiary">Changes happen gradually.</span>
        <span className="block text-ink">
          {words.map((word, i) => (
            <RevealWord key={word} progress={progress} range={[0.9 + i * 0.014, 0.915 + i * 0.014]}>
              {word}
              {i < words.length - 1 ? " " : null}
            </RevealWord>
          ))}
        </span>
      </motion.p>
    </div>
  )
}

function RevealWord({
  progress,
  range,
  children,
}: {
  progress: Progress
  range: [number, number]
  children: ReactNode
}) {
  const opacity = useRange(progress, range, [0.12, 1])
  return <motion.span style={{ opacity }}>{children}</motion.span>
}

export function ScrollStory({ stages }: { stages: StoryStage[] }) {
  const handoff = useHandoff()
  const localSectionRef = useRef<HTMLElement>(null)
  const localStageRef = useRef<HTMLDivElement>(null)
  const localWaveRef = useRef<HTMLDivElement>(null)
  const sectionRef = handoff?.storyRef ?? localSectionRef
  const stageRef = handoff?.stageRef ?? localStageRef
  const waveRef = handoff?.waveRef ?? localWaveRef
  const { scrollYProgress: progress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  })
  const reduced = usePrefersReducedMotion()

  // While the hero waveform travels in, the stage text waits until the path is clear
  // and the story waveform takes over only once the two are aligned.
  const arrived = useMotionValue(1)
  const entry = handoff && !reduced ? handoff.progress : arrived
  const textIn = useTransform(entry, ...padRange([0.9, 1], [0, 1]))
  const waveIn = useTransform(entry, ...padRange([0.97, 1], [0, 1]))
  const [day1, day30, day90] = stages
  const longest = Math.max(...day90.wave.pauses.map((p) => p.seconds))

  const chips = [
    { label: "Avg pause", values: stages.map((s) => `${s.wave.avgPauseSeconds.toFixed(1)}s`), signalFrom: 1 },
    { label: "Repeated phrases", values: stages.map((s) => String(s.wave.repeats.length)), signalFrom: 2 },
  ]

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      aria-labelledby="story-title"
      className="relative h-[260vh] md:h-[380vh]"
    >
      <h2 id="story-title" className="sr-only">
        How MindTrace works: one person&rsquo;s conversations, three points in time
      </h2>
      <p id="story-summary" className="sr-only">
        On {day1.label.toLowerCase()} ({day1.dateLabel}), Margaret&rsquo;s conversation flows in fluent
        phrases with short pauses averaging {day1.wave.avgPauseSeconds} seconds. By{" "}
        {day30.label.toLowerCase()}, a few pauses have widened to an average of {day30.wave.avgPauseSeconds}{" "}
        seconds and one phrase repeats. By {day90.label.toLowerCase()}, pauses are longer and more frequent,
        averaging {day90.wave.avgPauseSeconds} seconds and up to {longest} seconds, and{" "}
        {day90.wave.repeats.length} phrases repeat. Each conversation is compared only with her own baseline.
      </p>

      <div ref={stageRef} className="sticky top-0 h-svh overflow-hidden">
        <div className="shell flex h-full flex-col justify-center pt-16 pb-8">
          <motion.div style={{ opacity: textIn }}>
            <StoryStageContent progress={progress} stages={stages} reduced={reduced} chips={chips} />
          </motion.div>
          <motion.div ref={waveRef} className="mt-8 md:mt-10" style={{ opacity: waveIn }}>
            <StoryWaveform progress={progress} stages={stages} reduced={reduced} describedBy="story-summary" />
          </motion.div>
          <motion.div className="mt-8 md:mt-12" style={{ opacity: textIn }}>
            <StageFade progress={progress}>
              <TimelineRail progress={progress} stages={stages} />
            </StageFade>
          </motion.div>
        </div>
        <ResolutionLine progress={progress} reduced={reduced} />
      </div>
    </section>
  )
}

function StageFade({
  progress,
  className,
  children,
}: {
  progress: Progress
  className?: string
  children: ReactNode
}) {
  const opacity = useRange(progress, [0.84, 0.88], [1, 0])
  return (
    <motion.div className={className} style={{ opacity }}>
      {children}
    </motion.div>
  )
}

function StoryStageContent({
  progress,
  stages,
  reduced,
  chips,
}: {
  progress: Progress
  stages: StoryStage[]
  reduced: boolean
  chips: { label: string; values: string[]; signalFrom: number }[]
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
      <div className="grid">
        {stages.map((stage, i) => (
          <StageLayer key={stage.key} progress={progress} index={i} reduced={reduced}>
            <p className="font-mono type-eyebrow text-ink-tertiary">
              {stage.label} · {stage.dateLabel}
            </p>
            <p className="mt-3 type-page text-ink">{stage.headline}</p>
          </StageLayer>
        ))}
      </div>
      <StageFade progress={progress} className="flex flex-wrap gap-2 md:justify-end">
        <div aria-hidden="true" className="contents">
          {chips.map((chip) => (
            <Chip key={chip.label} progress={progress} reduced={reduced} {...chip} />
          ))}
        </div>
      </StageFade>
    </div>
  )
}
