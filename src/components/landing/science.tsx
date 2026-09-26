"use client"

import { BookOpenText, Gauge, Pause, Repeat2, Waypoints, type LucideIcon } from "lucide-react"
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react"
import { useRef, useState } from "react"

import { INDICATOR_VISUALS } from "@/components/landing/indicator-visuals"
import { Reveal } from "@/components/shared/reveal"
import { useElementSize, usePrefersReducedMotion } from "@/lib/hooks"
import { easeOut } from "@/lib/motion"

const INDICATORS: { icon: LucideIcon; name: string; description: string; caption: string }[] = [
  {
    icon: Pause,
    name: "Pauses",
    description: "How often and how long the silences between phrases are.",
    caption: "The silence between two phrases, lengthening",
  },
  {
    icon: Repeat2,
    name: "Repetition",
    description: "Phrases or questions that recur within a conversation.",
    caption: "The same phrase, returning in one conversation",
  },
  {
    icon: BookOpenText,
    name: "Vocabulary diversity",
    description: "The range of distinct words used.",
    caption: "Distinct words out of all words spoken",
  },
  {
    icon: Gauge,
    name: "Speech rate",
    description: "Words per minute, compared with her own baseline.",
    caption: "A steady pace, inside her own baseline range",
  },
  {
    icon: Waypoints,
    name: "Semantic coherence",
    description: "How well ideas connect from one sentence to the next.",
    caption: "Each sentence linked to the one before",
  },
]

const count = INDICATORS.length
const pad = (n: number) => String(n).padStart(2, "0")

/** Large-screen panel: the active indicator's diagram, swapping as the list scrolls. */
function IndicatorPanel({ active }: { active: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.3 })
  const indicator = INDICATORS[active]
  const Visual = INDICATOR_VISUALS[active]

  return (
    <div ref={ref} className="rounded-card border border-line bg-surface p-6 shadow-rest">
      <div className="flex items-baseline justify-between gap-4 font-mono type-caption text-ink-tertiary">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={indicator.name}
            className="text-ink"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: easeOut }}
          >
            {indicator.name}
          </motion.span>
        </AnimatePresence>
        <span className="tabular-nums">
          {pad(active + 1)} / {pad(count)}
        </span>
      </div>
      <div className="relative mt-5 aspect-[360/140]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: easeOut }}
          >
            <Visual playing={inView} />
          </motion.div>
        </AnimatePresence>
      </div>
      <p className="mt-5 border-t border-line pt-4 type-caption text-ink-secondary">{indicator.caption}</p>
    </div>
  )
}

/** Small-screen version: each row plays its own diagram while it is on screen. */
function InlineVisual({ index }: { index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.6 })
  const Visual = INDICATOR_VISUALS[index]
  return (
    <div ref={ref} className="mt-4 rounded-inner border border-line bg-surface p-4 lg:hidden">
      <Visual playing={inView} />
    </div>
  )
}

/** A hairline that fills beside the list, with a point travelling at its tip. */
function ProgressLine({ progress, height }: { progress: MotionValue<number>; height: number }) {
  const reduced = usePrefersReducedMotion()
  const dotY = useTransform(progress, (p) => p * height)
  return (
    <div aria-hidden="true" className="absolute top-0 bottom-0 left-0 w-px bg-line">
      <motion.div className="absolute inset-0 origin-top bg-brand" style={{ scaleY: progress }} />
      {reduced ? null : (
        <motion.span
          className="absolute -top-[3.5px] -left-[3px] size-[7px] rounded-full bg-brand ring-4 ring-canvas"
          style={{ y: dotY }}
        />
      )}
    </div>
  )
}

export function Science() {
  const listRef = useRef<HTMLOListElement>(null)
  const { height } = useElementSize(listRef, { width: 0, height: 600 })
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 0.62", "end 0.62"] })
  const [active, setActive] = useState(0)

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(p * count)))
    setActive((prev) => (prev === next ? prev : next))
  })

  return (
    <section id="the-science" aria-labelledby="science-title" className="scroll-mt-16 border-t border-line section-y">
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Reveal blur fadeDuration={0.7}>
            <p className="font-mono type-eyebrow text-ink-tertiary">The science</p>
            <h2 id="science-title" className="mt-4 type-page text-ink">
              What MindTrace pays attention to.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-10 hidden lg:block">
            <IndicatorPanel active={active} />
          </Reveal>
        </div>

        <div>
          <div className="relative pl-6 md:pl-8">
            <ProgressLine progress={scrollYProgress} height={height} />
            <ol ref={listRef}>
              {INDICATORS.map(({ icon: Icon, name, description }, i) => (
                <li
                  key={name}
                  data-active={active === i}
                  className="group border-b border-line transition-opacity duration-300 first:border-t lg:opacity-45 lg:data-[active=true]:opacity-100"
                >
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 py-6 md:grid-cols-[auto_minmax(0,13rem)_minmax(0,1fr)] md:items-baseline md:gap-x-8 md:py-7 lg:py-9">
                    <Icon
                      className="size-[18px] translate-y-[3px] text-ink-secondary transition-colors duration-300 group-data-[active=true]:text-brand"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <h3 className="text-[17px] leading-snug font-semibold tracking-[-0.015em] text-ink">{name}</h3>
                    <p className="col-start-2 mt-1 type-body text-ink-secondary md:col-start-3 md:mt-0">
                      {description}
                    </p>
                    <div className="col-span-full md:col-start-2">
                      <InlineVisual index={i} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <Reveal y={8} amount={0.6}>
            <p className="mt-10 max-w-[36rem] pl-6 type-body-lg text-ink md:pl-8">
              MindTrace compares each person only to their own baseline. It does not diagnose any condition. It
              helps you notice changes worth discussing with a healthcare professional.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
