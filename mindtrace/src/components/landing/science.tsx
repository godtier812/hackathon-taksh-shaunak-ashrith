import { BookOpenText, Gauge, Pause, Repeat2, Waypoints, type LucideIcon } from "lucide-react"

import { Reveal } from "@/components/shared/reveal"

const INDICATORS: { icon: LucideIcon; name: string; description: string }[] = [
  { icon: Pause, name: "Pauses", description: "How often and how long the silences between phrases are." },
  { icon: Repeat2, name: "Repetition", description: "Phrases or questions that recur within a conversation." },
  { icon: BookOpenText, name: "Vocabulary diversity", description: "The range of distinct words used." },
  { icon: Gauge, name: "Speech rate", description: "Words per minute, compared with her own baseline." },
  {
    icon: Waypoints,
    name: "Semantic coherence",
    description: "How well ideas connect from one sentence to the next.",
  },
]

export function Science() {
  return (
    <section
      id="the-science"
      aria-labelledby="science-title"
      className="scroll-mt-16 border-t border-line section-y"
    >
      <div className="shell grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal className="lg:sticky lg:top-28 lg:self-start">
          <p className="font-mono type-eyebrow text-ink-tertiary">The science</p>
          <h2 id="science-title" className="mt-4 type-page text-ink">
            What MindTrace pays attention to.
          </h2>
        </Reveal>

        <div>
          <ul className="border-t border-line">
            {INDICATORS.map(({ icon: Icon, name, description }, i) => (
              <li key={name} className="border-b border-line">
                <Reveal delay={i * 0.05} y={8} amount={0.6}>
                  <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 py-6 md:grid-cols-[auto_minmax(0,14rem)_minmax(0,1fr)] md:items-baseline md:gap-x-8 md:py-7">
                    <Icon
                      className="size-[18px] translate-y-[3px] text-ink-secondary"
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <h3 className="text-[17px] leading-snug font-semibold tracking-[-0.015em] text-ink">
                      {name}
                    </h3>
                    <p className="col-start-2 mt-1 type-body text-ink-secondary md:col-start-3 md:mt-0">
                      {description}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
          <Reveal y={8} amount={0.6}>
            <p className="mt-10 max-w-[36rem] type-body-lg text-ink">
              MindTrace compares each person only to their own baseline. It does not diagnose any condition.
              It helps you notice changes worth discussing with a healthcare professional.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
