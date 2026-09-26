"use client"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useScrollToSection } from "@/components/providers/smooth-scroll"
import { patient, recentConversations, type RecentConversation } from "@/lib/demo/margaret"
import { cn } from "@/lib/utils"

const MINI_W = 160
const MINI_H = 28

function MiniWaveform({ bars, active }: { bars: number[]; active: boolean }) {
  const pitch = MINI_W / bars.length
  const d = bars
    .map((amp, i) => {
      if (amp < 0.02) return ""
      const x = (i + 0.5) * pitch
      const half = Math.max(0.5, amp * (MINI_H / 2 - 2))
      return `M${x.toFixed(1)} ${(MINI_H / 2 - half).toFixed(1)}V${(MINI_H / 2 + half).toFixed(1)}`
    })
    .join("")
  return (
    <svg viewBox={`0 0 ${MINI_W} ${MINI_H}`} className="h-7 w-full max-w-[160px]" aria-hidden="true">
      <line x1={0} x2={MINI_W} y1={MINI_H / 2} y2={MINI_H / 2} stroke="var(--line-strong)" strokeWidth={1} />
      <path
        d={d}
        fill="none"
        stroke={active ? "var(--accent)" : "var(--brand)"}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  )
}

function ConversationRow({ conversation }: { conversation: RecentConversation }) {
  const { interactive, selectedT, selectSession } = useDashboard()
  const scrollToSection = useScrollToSection()
  const active = selectedT === conversation.t

  return (
    <li>
      <button
        type="button"
        aria-pressed={active}
        disabled={!interactive}
        onClick={() => {
          selectSession(active ? null : conversation.t)
          if (!active) scrollToSection("#trend-chart")
        }}
        className={cn(
          "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 rounded-inner px-3 py-3 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none enabled:hover:bg-surface-muted/70 @2xl:grid-cols-[9.5rem_minmax(0,160px)_minmax(0,1fr)_auto]",
          active && "bg-accent-soft enabled:hover:bg-accent-soft"
        )}
      >
        <span className="flex flex-col">
          <span className="text-[14px] font-medium text-ink">{conversation.dateLabel}</span>
          <span className="font-mono type-caption text-ink-tertiary">{conversation.minutes} min</span>
        </span>
        <span className="order-last col-span-full @2xl:order-none @2xl:col-span-1">
          <MiniWaveform bars={conversation.bars} active={active} />
        </span>
        <span className="order-last col-span-full flex flex-wrap gap-1.5 @2xl:order-none @2xl:col-span-1">
          {conversation.flags.map((flag) => (
            <span
              key={flag.label}
              className={cn(
                "rounded-chip px-2 py-0.5 font-mono text-[11px] tabular-nums",
                flag.tone === "signal" ? "bg-signal-soft text-signal-text" : "bg-surface-muted text-ink-secondary"
              )}
            >
              {flag.label}
            </span>
          ))}
        </span>
        <span className="text-right">
          <span className="block text-[15px] font-semibold text-ink tabular-nums">{conversation.index.toFixed(1)}</span>
          <span className="block font-mono type-caption text-ink-tertiary">index</span>
        </span>
      </button>
    </li>
  )
}

export function RecentConversations() {
  return (
    <section
      aria-labelledby="recent-title"
      className="h-full rounded-card border border-line bg-surface p-5 shadow-rest @3xl:p-7"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="recent-title" className="type-section text-ink">
          Recent conversations
        </h2>
        <p className="font-mono type-caption text-ink-tertiary">
          Latest {recentConversations.length} of {patient.sessionCount} · select one to find it on the chart
        </p>
      </div>
      <ul className="-mx-3 mt-4 flex flex-col divide-y divide-line">
        {recentConversations.map((conversation) => (
          <ConversationRow key={conversation.t} conversation={conversation} />
        ))}
      </ul>
    </section>
  )
}
