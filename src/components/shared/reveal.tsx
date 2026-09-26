"use client"

import { motion } from "motion/react"
import type { ReactNode } from "react"

import { duration, easeOut, spring } from "@/lib/motion"

type RevealProps = {
  children: ReactNode
  className?: string
  delay?: number
  /** Vertical travel in px (0 = pure fade). */
  y?: number
  /** Use the soft spring instead of the ease-out curve. */
  springy?: boolean
  /** Fraction of the element that must be visible before revealing. */
  amount?: number
  fadeDuration?: number
  /** Sharpen from a light blur (used for section headings). */
  blur?: boolean
}

/** One-time reveal when the element first enters the viewport. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 12,
  springy = false,
  amount = 0.25,
  fadeDuration = duration.enter,
  blur = false,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, ...(blur ? { filter: "blur(10px)" } : {}) }}
      whileInView={{ opacity: 1, y: 0, ...(blur ? { filter: "blur(0px)" } : {}) }}
      viewport={{ once: true, amount }}
      transition={
        springy
          ? { y: { ...spring.soft, delay }, opacity: { duration: fadeDuration, delay, ease: easeOut } }
          : { duration: fadeDuration, delay, ease: easeOut }
      }
    >
      {children}
    </motion.div>
  )
}
