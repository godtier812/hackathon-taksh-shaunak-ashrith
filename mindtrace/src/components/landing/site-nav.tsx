"use client"

import { ArrowRight } from "lucide-react"
import { motion, useMotionValueEvent, useScroll } from "motion/react"
import Link from "next/link"
import { useState, type MouseEvent } from "react"

import { Wordmark } from "@/components/brand/wordmark"
import { MobileMenu } from "@/components/landing/mobile-menu"
import { useScrollToSection } from "@/components/providers/smooth-scroll"
import { MotionToggle } from "@/components/shared/motion-toggle"
import { PillLink } from "@/components/shared/pill"
import { cn } from "@/lib/utils"

const sections = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#the-science", label: "The science" },
]

const linkClass =
  "rounded-full px-3 py-2 text-[14px] font-medium text-ink-secondary transition-colors duration-150 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"

export function SiteNav() {
  const { scrollY, scrollYProgress } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const scrollToSection = useScrollToSection()

  useMotionValueEvent(scrollY, "change", (y) => {
    const next = y > 24
    setScrolled((prev) => (prev === next ? prev : next))
  })

  const onAnchor = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    event.preventDefault()
    scrollToSection(href)
    history.replaceState(null, "", href)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color,backdrop-filter] duration-200",
        scrolled
          ? "border-line bg-canvas/80 backdrop-blur-md"
          : "border-transparent bg-canvas/0 backdrop-blur-none"
      )}
    >
      <motion.div
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 -bottom-px h-px origin-left bg-brand transition-opacity duration-200",
          scrolled ? "opacity-100" : "opacity-0"
        )}
        style={{ scaleX: scrollYProgress }}
      />
      <nav aria-label="Primary" className="shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label="MindTrace home"
          className="relative -mx-1 rounded-md px-1 py-1 after:absolute after:-inset-y-2 after:inset-x-0 after:content-[''] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
        >
          <Wordmark />
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          <div className="hidden items-center md:flex">
            {sections.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => onAnchor(event, item.href)}
                className={linkClass}
              >
                {item.label}
              </a>
            ))}
            <Link href="/dashboard" className={cn(linkClass, "hidden lg:inline-flex")}>
              View demo
            </Link>
          </div>
          <MotionToggle className="hidden md:ml-1 md:inline-flex" />
          <MobileMenu />
          <PillLink href="/dashboard" size="sm" className="ml-1 h-11 md:ml-2 md:h-10">
            <span className="md:hidden">View demo</span>
            <span className="hidden md:inline">View Margaret&rsquo;s journey</span>
            <ArrowRight data-icon="inline-end" strokeWidth={1.75} aria-hidden="true" />
          </PillLink>
        </div>
      </nav>
    </header>
  )
}
