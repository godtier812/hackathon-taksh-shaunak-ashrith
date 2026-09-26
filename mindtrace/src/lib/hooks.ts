"use client"

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
const MOTION_KEY = "mindtrace-motion"

type MotionOverride = "on" | "off"

/*
 * Motion preference: the device setting, unless the visitor has flipped the
 * Motion switch, which is remembered in this browser (in memory if storage is
 * unavailable).
 */
const listeners = new Set<() => void>()
let memoryOverride: MotionOverride | null = null

function readOverride(): MotionOverride | null {
  try {
    const stored = window.localStorage.getItem(MOTION_KEY)
    return stored === "on" || stored === "off" ? stored : memoryOverride
  } catch {
    return memoryOverride
  }
}

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION)
  listeners.add(onChange)
  query.addEventListener("change", onChange)
  window.addEventListener("storage", onChange)
  return () => {
    listeners.delete(onChange)
    query.removeEventListener("change", onChange)
    window.removeEventListener("storage", onChange)
  }
}

function reducedSnapshot() {
  const override = readOverride()
  return override ? override === "off" : window.matchMedia(REDUCED_MOTION).matches
}

/**
 * Hydration-safe reduced-motion flag: `false` on the server and during
 * hydration, then the device preference or the visitor's Motion switch.
 */
export function usePrefersReducedMotion() {
  return useSyncExternalStore(subscribeMotion, reducedSnapshot, () => false)
}

/** Turn animations on or off for this browser, overriding the device setting. */
export function setMotionEnabled(enabled: boolean) {
  memoryOverride = enabled ? "on" : "off"
  try {
    window.localStorage.setItem(MOTION_KEY, memoryOverride)
  } catch {
    // Storage unavailable (private mode); the in-memory override still applies.
  }
  listeners.forEach((notify) => notify())
}

export type Size = { width: number; height: number }

/** Element content size, updated on resize only (never per frame). */
export function useElementSize(ref: RefObject<Element | null>, fallback: Size) {
  const [size, setSize] = useState(fallback)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width)
      const height = Math.round(entry.contentRect.height)
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [ref])
  return size
}
