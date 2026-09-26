"use client"

import { animate, motion, useMotionValue, useTransform, type MotionValue } from "motion/react"
import { useEffect, type ReactNode } from "react"

import { usePrefersReducedMotion } from "@/lib/hooks"
import { smoothstep } from "@/lib/motion"
import { mulberry32 } from "@/lib/random"

/*
 * Five small looping diagrams, one per indicator. Each is driven by a single
 * 0 → 1 loop value; when not playing (or with reduced motion) it rests on a
 * representative still frame.
 */

type VisualProps = { playing: boolean }

function useLoop(playing: boolean, seconds: number, still: number) {
  const reduced = usePrefersReducedMotion()
  const t = useMotionValue(still)
  useEffect(() => {
    if (!playing || reduced) {
      t.jump(still)
      return
    }
    t.jump(0)
    const controls = animate(t, 1, { duration: seconds, ease: "linear", repeat: Infinity })
    return () => controls.stop()
  }, [playing, reduced, seconds, still, t])
  return t
}

/** Fade in over [start, start + 0.06], hold, fade out at the end of each loop. */
function useAppear(t: MotionValue<number>, start: number, end = 0.9) {
  return useTransform(t, [start, start + 0.06, end, end + 0.06], [0, 1, 1, 0])
}

const W = 360
const H = 140
const CY = 70
const PITCH = 6
const MAX_HALF = 38

function phraseBars(seed: number, count: number) {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, (_, i) => {
    const arch = Math.pow(Math.sin(Math.PI * ((i + 0.5) / count)), 0.5)
    return 0.28 + 0.72 * arch * (0.55 + 0.45 * rand())
  })
}

function Bars({ values, x0, color = "var(--brand)" }: { values: number[]; x0: number; color?: string }) {
  const d = values
    .map((v, i) => {
      const x = x0 + (i + 0.5) * PITCH
      const half = v * MAX_HALF
      return `M${x.toFixed(1)} ${(CY - half).toFixed(1)}V${(CY + half).toFixed(1)}`
    })
    .join("")
  return <path d={d} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden="true">
      {children}
    </svg>
  )
}

/* 1 — Pauses: the silence between two phrases stretches. */
const PAUSE_A = phraseBars(101, 12)
const PAUSE_B = phraseBars(202, 14)
const PAUSE_A_END = 24 + PAUSE_A.length * PITCH
const GAP_MIN = 22
const GAP_MAX = 108

export function PausesVisual({ playing }: VisualProps) {
  const t = useLoop(playing, 4.4, 0.55)
  const gap = useTransform(t, [0, 0.42, 0.7, 1], [GAP_MIN, GAP_MAX, GAP_MAX, GAP_MIN], { ease: smoothstep })
  const bracket = useTransform(gap, (g) => {
    const x0 = PAUSE_A_END + 4
    const x1 = PAUSE_A_END + g - 4
    return `M${x0} ${CY - 3}V${CY + 3}M${x0} ${CY}H${x1}M${x1} ${CY - 3}V${CY + 3}`
  })
  const labelX = useTransform(gap, (g) => PAUSE_A_END + g / 2)
  const seconds = useTransform(gap, (g) => `${(0.4 + ((g - GAP_MIN) / (GAP_MAX - GAP_MIN)) * 1.2).toFixed(1)}s`)
  const marked = useTransform(gap, [GAP_MIN + 8, GAP_MIN + 40], [0, 1])

  return (
    <Frame>
      <line x1={12} x2={W - 12} y1={CY} y2={CY} stroke="var(--line-strong)" strokeWidth={1} />
      <Bars values={PAUSE_A} x0={24} />
      <motion.g style={{ x: gap }}>
        <Bars values={PAUSE_B} x0={PAUSE_A_END} />
      </motion.g>
      <motion.g style={{ opacity: marked }}>
        <motion.path d={bracket} fill="none" stroke="var(--signal)" strokeWidth={1} />
        <motion.text
          x={labelX}
          y={CY - 10}
          textAnchor="middle"
          className="fill-signal-text font-mono text-[11px] tabular-nums"
        >
          {seconds}
        </motion.text>
      </motion.g>
    </Frame>
  )
}

/* 2 — Repetition: a phrase returns, and an arc ties it to the original. */
const REP_A = phraseBars(303, 10)
const REP_B = phraseBars(404, 13)
const REP_A_X = 24
const REP_B_X = REP_A_X + REP_A.length * PITCH + 22
const REP_C_X = REP_B_X + REP_B.length * PITCH + 26
const REP_TOP = CY - MAX_HALF - 8

export function RepetitionVisual({ playing }: VisualProps) {
  const t = useLoop(playing, 4.8, 0.7)
  const copyOpacity = useAppear(t, 0.08, 0.86)
  const copyY = useTransform(t, [0.08, 0.16], [8, 0])
  const arc = useTransform(t, [0.26, 0.48], [0, 1], { ease: smoothstep })
  const arcOpacity = useAppear(t, 0.26, 0.86)
  const label = useAppear(t, 0.44, 0.86)
  const a = REP_A_X + (REP_A.length * PITCH) / 2
  const c = REP_C_X + (REP_A.length * PITCH) / 2
  const apex = REP_TOP - 22

  return (
    <Frame>
      <line x1={12} x2={W - 12} y1={CY} y2={CY} stroke="var(--line-strong)" strokeWidth={1} />
      <Bars values={REP_A} x0={REP_A_X} />
      <Bars values={REP_B} x0={REP_B_X} color="var(--line-strong)" />
      <motion.g style={{ opacity: copyOpacity, y: copyY }}>
        <Bars values={REP_A} x0={REP_C_X} />
      </motion.g>
      <motion.path
        d={`M${a} ${REP_TOP}C${a} ${apex} ${c} ${apex} ${c} ${REP_TOP}`}
        fill="none"
        stroke="var(--signal)"
        strokeWidth={1.25}
        style={{ pathLength: arc, opacity: arcOpacity }}
      />
      <motion.text
        x={(a + c) / 2}
        y={REP_TOP - 4}
        textAnchor="middle"
        className="fill-signal-text font-mono text-[11px]"
        style={{ opacity: label }}
      >
        repeated
      </motion.text>
    </Frame>
  )
}

/* 3 — Vocabulary diversity: distinct words out of all words spoken. */
const PASSAGE = "We went to the market and the market was busy we bought bread and bread is what we always buy"
const TOKENS = (() => {
  const seen = new Set<string>()
  return PASSAGE.split(" ").map((word) => {
    const key = word.toLowerCase()
    const repeat = seen.has(key)
    seen.add(key)
    return { word, repeat }
  })
})()
const TOKEN_SPAN = 0.6

function tokenStart(index: number) {
  return 0.04 + (index / TOKENS.length) * TOKEN_SPAN
}

function Token({ t, index }: { t: MotionValue<number>; index: number }) {
  const { word, repeat } = TOKENS[index]
  const opacity = useAppear(t, tokenStart(index), 0.9)
  const y = useTransform(t, [tokenStart(index), tokenStart(index) + 0.06], [4, 0])
  return (
    <motion.span
      style={{ opacity, y }}
      className={
        repeat
          ? "rounded-[6px] border border-dashed border-line-strong px-1.5 py-0.5 font-mono text-[11px] text-ink-tertiary"
          : "rounded-[6px] border border-transparent bg-surface-muted px-1.5 py-0.5 font-mono text-[11px] text-ink"
      }
    >
      {word}
    </motion.span>
  )
}

export function VocabularyVisual({ playing }: VisualProps) {
  const t = useLoop(playing, 5.6, 0.8)
  const distinct = useTransform(t, (v) => {
    const shown = TOKENS.filter((_, i) => v >= tokenStart(i) + 0.03)
    return String(shown.filter((token) => !token.repeat).length)
  })
  const total = useTransform(t, (v) => String(TOKENS.filter((_, i) => v >= tokenStart(i) + 0.03).length))

  return (
    <div className="flex aspect-[360/140] flex-col justify-between">
      <div className="flex flex-wrap content-start gap-1.5">
        {TOKENS.map((_, i) => (
          <Token key={i} t={t} index={i} />
        ))}
      </div>
      <p className="font-mono type-caption text-ink-tertiary">
        <motion.span className="font-medium text-ink tabular-nums">{distinct}</motion.span> distinct ·{" "}
        <motion.span className="tabular-nums">{total}</motion.span> words
      </p>
    </div>
  )
}

/* 4 — Speech rate: words flow past at a steady pace, inside her baseline range. */
const RATE_TICKS = (() => {
  const rand = mulberry32(505)
  return Array.from({ length: 18 }, (_, i) => ({ x: i * (W / 18), w: 6 + Math.round(rand() * 14) }))
})()
const SCALE_X0 = 40
const SCALE_X1 = W - 40
const wpmX = (wpm: number) => SCALE_X0 + ((wpm - 110) / 60) * (SCALE_X1 - SCALE_X0)

export function SpeechRateVisual({ playing }: VisualProps) {
  const t = useLoop(playing, 6, 0.3)
  const flow = useTransform(t, (v) => -v * W)
  const wpm = useTransform(t, (v) => 138 + 1.8 * Math.sin(v * Math.PI * 4))
  const needle = useTransform(wpm, wpmX)
  const readout = useTransform(wpm, (v) => `${Math.round(v)} wpm`)

  return (
    <Frame>
      <defs>
        <linearGradient id="rate-fade" x1="0" x2="1">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.15" stopColor="white" stopOpacity="1" />
          <stop offset="0.85" stopColor="white" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="rate-mask">
          <rect width={W} height={H} fill="url(#rate-fade)" />
        </mask>
      </defs>
      <g mask="url(#rate-mask)">
        <motion.g style={{ x: flow }}>
          {[0, W].map((offset) =>
            RATE_TICKS.map((tick) => (
              <rect
                key={`${offset}-${tick.x}`}
                x={offset + tick.x}
                y={34}
                width={tick.w}
                height={8}
                rx={4}
                fill="var(--brand)"
                opacity={0.85}
              />
            ))
          )}
        </motion.g>
      </g>
      <line x1={W / 2} x2={W / 2} y1={24} y2={52} stroke="var(--brand)" strokeWidth={1} opacity={0.35} />

      <rect x={wpmX(132)} y={86} width={wpmX(146) - wpmX(132)} height={22} rx={4} fill="var(--surface-muted)" />
      <line x1={SCALE_X0} x2={SCALE_X1} y1={97} y2={97} stroke="var(--line-strong)" strokeWidth={1} />
      {[110, 140, 170].map((v) => (
        <text key={v} x={wpmX(v)} y={126} textAnchor="middle" className="fill-ink-tertiary font-mono text-[10px]">
          {v}
        </text>
      ))}
      <text x={wpmX(139)} y={80} textAnchor="middle" className="fill-ink-tertiary font-mono text-[10px]">
        baseline range
      </text>
      <motion.line x1={needle} x2={needle} y1={84} y2={110} stroke="var(--brand)" strokeWidth={2} strokeLinecap="round" />
      <motion.text x={SCALE_X1} y={60} textAnchor="end" className="fill-ink font-mono text-[12px] font-medium tabular-nums">
        {readout}
      </motion.text>
    </Frame>
  )
}

/* 5 — Semantic coherence: each sentence links to the next; one link is looser. */
const NODES = [
  { x: 42, y: 52 },
  { x: 112, y: 90 },
  { x: 182, y: 50 },
  { x: 252, y: 88 },
  { x: 318, y: 50 },
]
const NODE_W = 50
const NODE_H = 26
const LOOSE_LINK = 3

function linkPath(i: number) {
  const a = NODES[i]
  const b = NODES[i + 1]
  const x0 = a.x + NODE_W / 2 - 4
  const x1 = b.x - NODE_W / 2 + 4
  const mid = (x0 + x1) / 2
  return `M${x0} ${a.y}C${mid} ${a.y} ${mid} ${b.y} ${x1} ${b.y}`
}

function CoherenceNode({ t, index }: { t: MotionValue<number>; index: number }) {
  const node = NODES[index]
  const opacity = useAppear(t, 0.04 + index * 0.13, 0.88)
  return (
    <motion.g style={{ opacity }}>
      <rect
        x={node.x - NODE_W / 2}
        y={node.y - NODE_H / 2}
        width={NODE_W}
        height={NODE_H}
        rx={7}
        fill="var(--surface)"
        stroke="var(--line-strong)"
      />
      <line x1={node.x - 15} x2={node.x + 15} y1={node.y - 4} y2={node.y - 4} stroke="var(--ink-tertiary)" strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <line x1={node.x - 15} x2={node.x + 6} y1={node.y + 4} y2={node.y + 4} stroke="var(--ink-tertiary)" strokeWidth={2} strokeLinecap="round" opacity={0.35} />
    </motion.g>
  )
}

function CoherenceLink({ t, index }: { t: MotionValue<number>; index: number }) {
  const start = 0.1 + index * 0.13
  const draw = useTransform(t, [start, start + 0.1], [0, 1], { ease: smoothstep })
  const opacity = useAppear(t, start, 0.88)
  const loose = index === LOOSE_LINK
  if (loose) {
    const a = NODES[index]
    const b = NODES[index + 1]
    return (
      <motion.g style={{ opacity }}>
        <path d={linkPath(index)} fill="none" stroke="var(--neutral-trend)" strokeWidth={1.25} strokeDasharray="3 4" />
        <circle cx={(a.x + b.x) / 2 + 2} cy={(a.y + b.y) / 2} r={2.5} fill="var(--signal)" />
        <text x={(a.x + b.x) / 2 + 2} y={124} textAnchor="middle" className="fill-ink-tertiary font-mono text-[10px]">
          looser link
        </text>
      </motion.g>
    )
  }
  return (
    <motion.path
      d={linkPath(index)}
      fill="none"
      stroke="var(--brand)"
      strokeWidth={1.25}
      style={{ pathLength: draw, opacity }}
    />
  )
}

export function CoherenceVisual({ playing }: VisualProps) {
  const t = useLoop(playing, 5.2, 0.8)
  return (
    <Frame>
      {NODES.slice(0, -1).map((_, i) => (
        <CoherenceLink key={i} t={t} index={i} />
      ))}
      {NODES.map((_, i) => (
        <CoherenceNode key={i} t={t} index={i} />
      ))}
    </Frame>
  )
}

export const INDICATOR_VISUALS = [
  PausesVisual,
  RepetitionVisual,
  VocabularyVisual,
  SpeechRateVisual,
  CoherenceVisual,
] as const
