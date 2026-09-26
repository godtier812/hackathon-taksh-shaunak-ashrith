import { ArrowRight } from "lucide-react"

import { HeroWaveform } from "@/components/landing/hero-waveform"
import { WordReveal } from "@/components/landing/word-reveal"
import { PillLink } from "@/components/shared/pill"
import { Reveal } from "@/components/shared/reveal"
import { EXCERPT_SECONDS, storyStages } from "@/lib/demo/margaret"

export function Hero() {
  const baseline = storyStages[0]

  return (
    <section aria-labelledby="hero-title">
      <div className="shell pt-10 pb-20 md:pt-12 md:pb-24">
        <Reveal y={0} fadeDuration={0.4}>
          <p className="font-mono type-eyebrow text-ink-tertiary">Longitudinal communication record</p>
        </Reveal>

        <h1 id="hero-title" className="mt-5 type-display text-ink md:mt-6">
          <WordReveal lines={["The earliest changes", "can be the hardest", "to notice."]} delay={0.05} />
        </h1>

        <Reveal delay={0.28} y={8}>
          <p className="mt-6 max-w-[35rem] type-body-lg text-ink-secondary">
            MindTrace turns everyday conversations into a longitudinal communication record, helping
            caregivers notice changes that may otherwise go unseen.
          </p>
        </Reveal>

        <Reveal delay={0.38} y={8}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PillLink href="/dashboard" className="w-full sm:w-auto">
              View Margaret&rsquo;s journey
              <ArrowRight data-icon="inline-end" strokeWidth={1.75} aria-hidden="true" />
            </PillLink>
            <PillLink href="/dashboard#analyze" variant="secondary" className="w-full sm:w-auto">
              Start a session
            </PillLink>
          </div>
        </Reveal>

        <Reveal delay={0.4} y={0} fadeDuration={0.3} className="mt-12">
          <HeroWaveform amps={baseline.wave.amps} dateLabel={baseline.dateLabel} seconds={EXCERPT_SECONDS} />
        </Reveal>
      </div>
    </section>
  )
}
