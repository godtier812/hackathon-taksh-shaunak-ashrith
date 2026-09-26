"use client"

import { animate, motion, useInView, useMotionValue, useTransform } from "motion/react"
import { useEffect, useRef } from "react"

import { formatSigned } from "@/lib/format"
import { usePrefersReducedMotion } from "@/lib/hooks"
import { easeOut } from "@/lib/motion"

/** A signed percentage that counts up once, the first time it becomes visible. */
export function MetricValue({ value, delay = 0 }: { value: number; delay?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.6 })
  const reduced = usePrefersReducedMotion()
  const count = useMotionValue(value)
  const text = useTransform(count, (v) => `${formatSigned(Math.round(v))}%`)

  useEffect(() => {
    if (!inView || reduced) return
    count.jump(0)
    const controls = animate(count, value, { duration: 0.9, delay, ease: easeOut })
    return () => controls.stop()
  }, [inView, reduced, value, delay, count])

  return (
    <motion.span ref={ref} className="tabular-nums">
      {text}
    </motion.span>
  )
}
