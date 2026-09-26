import type { Transition } from "motion/react"

/** Motion tokens. Nothing outside scroll-linked motion runs longer than 1.2s. */
export const easeOut = [0.16, 1, 0.3, 1] as const
export const easeInOut = [0.65, 0, 0.35, 1] as const

export const duration = {
  hover: 0.15,
  ui: 0.22,
  enter: 0.5,
  draw: 1,
} as const

export const spring = {
  soft: { type: "spring", stiffness: 260, damping: 30 },
  snappy: { type: "spring", stiffness: 420, damping: 34 },
} as const satisfies Record<string, Transition>

export const stagger = 0.06

/** Smoothstep for scroll-linked interpolation between two states. */
export function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

/**
 * Pad scroll-linked keyframes so they span the full 0–1 input range. Motion can
 * hand array-based transforms of scroll progress to a native scroll timeline;
 * keyframes that stop short of 0 or 1 would then interpolate back toward the
 * element's underlying style instead of holding their edge values.
 */
export function padRange(input: number[], output: number[]): [number[], number[]] {
  const i = [...input]
  const o = [...output]
  if (i[0] > 0) {
    i.unshift(0)
    o.unshift(o[0])
  }
  if (i[i.length - 1] < 1) {
    i.push(1)
    o.push(o[o.length - 1])
  }
  return [i, o]
}
