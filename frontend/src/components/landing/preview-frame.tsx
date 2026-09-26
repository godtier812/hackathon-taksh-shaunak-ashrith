"use client"

import { motion, useScroll, useTransform } from "motion/react"
import Link from "next/link"
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"

import { useElementSize, usePrefersReducedMotion } from "@/lib/hooks"
import { padRange } from "@/lib/motion"

/** Width the dashboard is laid out at before being scaled into the frame. */
const INNER_WIDTH = 1360
const MIN_SCALED_WIDTH = 700
const PHONE_CLIP = 600
/** Space kept below the clip marker, in unscaled px. */
const CLIP_PADDING = 28

/** Unscaled height down to the element marked `data-preview-end` (header, chart and metrics). */
function usePreviewClip(ref: RefObject<HTMLDivElement | null>, fallback: number) {
  const [clip, setClip] = useState(fallback)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(() => {
      const end = node.querySelector<HTMLElement>("[data-preview-end]")
      const next = end
        ? end.getBoundingClientRect().bottom - node.getBoundingClientRect().top
        : node.getBoundingClientRect().height
      const scale = node.getBoundingClientRect().width / node.offsetWidth || 1
      setClip(Math.round(next / scale + CLIP_PADDING))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return clip
}

/**
 * Frames the real dashboard at reduced scale. The frame rises into place as it
 * enters the viewport (scale .94 → 1, y 40 → 0, radius 28 → 20). The inner
 * dashboard is inert: the whole frame is one link, and keyboard users get the
 * explicit button below it.
 */
export function PreviewFrame({ children }: { children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const { width } = useElementSize(frameRef, { width: INNER_WIDTH, height: 0 })
  const clip = usePreviewClip(innerRef, 960)
  const reduced = usePrefersReducedMotion()

  const scaled = width >= MIN_SCALED_WIDTH
  const scale = scaled ? Math.min(1, width / INNER_WIDTH) : 1

  const { scrollYProgress } = useScroll({ target: frameRef, offset: ["start end", "start 0.3"] })
  const frameScale = useTransform(scrollYProgress, [0, 1], [0.94, 1])
  const frameY = useTransform(scrollYProgress, [0, 1], [40, 0])
  const radius = useTransform(scrollYProgress, [0, 1], [28, 20])
  const opacity = useTransform(scrollYProgress, ...padRange([0, 0.35], [0.35, 1]))

  return (
    <motion.div
      ref={frameRef}
      className="relative overflow-hidden border border-line bg-canvas shadow-raised"
      style={{
        scale: reduced ? 1 : frameScale,
        y: reduced ? 0 : frameY,
        borderRadius: reduced ? 20 : radius,
        opacity,
      }}
    >
      <div aria-hidden="true" className="flex h-10 items-center gap-3 border-b border-line bg-surface px-4">
        <span className="flex gap-1.5">
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
          <span className="size-2 rounded-full bg-line-strong" />
        </span>
        <span className="mx-auto hidden font-mono text-[11px] text-ink-tertiary sm:block">
          Margaret Reynolds · communication record
        </span>
        <span className="w-[42px]" />
      </div>

      <div
        className="relative overflow-hidden"
        style={{ height: scaled ? Math.round(clip * scale) : PHONE_CLIP }}
      >
        <div
          ref={innerRef}
          inert
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-0 origin-top-left px-5 py-6 select-none md:px-10 md:py-10"
          style={{
            width: scaled ? INNER_WIDTH : "100%",
            transform: scaled ? `scale(${scale})` : undefined,
          }}
        >
          {children}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-canvas to-transparent md:h-24" />
      </div>

      <Link
        href="/dashboard"
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 z-10 cursor-pointer"
      />
    </motion.div>
  )
}
