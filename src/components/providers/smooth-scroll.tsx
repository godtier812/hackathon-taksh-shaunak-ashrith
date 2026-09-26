"use client"

import Lenis from "lenis"
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react"

type ScrollToSection = (selector: string) => void

const ScrollContext = createContext<ScrollToSection>(() => {})

/**
 * Lenis smooth scrolling for the whole document. Created imperatively (not a
 * wrapper element) so it never breaks position: sticky, and simply skipped when
 * the visitor prefers reduced motion. Touch stays native.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1 })
    lenisRef.current = lenis
    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Both paths honour the target's scroll-margin-top, which accounts for the sticky nav.
  const scrollToSection = useCallback<ScrollToSection>((selector) => {
    const target = document.querySelector<HTMLElement>(selector)
    if (!target) return
    const lenis = lenisRef.current
    if (lenis) lenis.scrollTo(target)
    else target.scrollIntoView({ block: "start" })
  }, [])

  return <ScrollContext.Provider value={scrollToSection}>{children}</ScrollContext.Provider>
}

export function useScrollToSection() {
  return useContext(ScrollContext)
}
