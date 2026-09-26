"use client"

import { NotebookPen } from "lucide-react"

import { useDashboard } from "@/components/dashboard/dashboard-context"
import { useScrollToSection } from "@/components/providers/smooth-scroll"
import { caregiverNotes } from "@/lib/demo/margaret"
import { formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"

/** Context a caregiver has added; each note also appears as a marker on the chart. */
export function CaregiverNotes() {
  const { interactive, activeNoteId, selectNote } = useDashboard()
  const scrollToSection = useScrollToSection()
  const notes = [...caregiverNotes].reverse()

  return (
    <section
      aria-labelledby="notes-title"
      className="h-full rounded-card border border-line bg-surface p-5 shadow-rest @3xl:p-7"
    >
      <div className="flex items-center gap-2.5">
        <NotebookPen className="size-[18px] text-ink-secondary" strokeWidth={1.5} aria-hidden="true" />
        <h2 id="notes-title" className="type-section text-ink">
          Caregiver notes
        </h2>
      </div>
      <p className="mt-1.5 type-caption text-ink-secondary">Context you add appears on the chart.</p>
      <ol className="-mx-3 mt-4 flex flex-col gap-1">
        {notes.map((note) => {
          const active = activeNoteId === note.id
          return (
            <li key={note.id}>
              <button
                type="button"
                aria-pressed={active}
                disabled={!interactive}
                onClick={() => {
                  selectNote(active ? null : note.id)
                  if (!active) scrollToSection("#trend-chart")
                }}
                className={cn(
                  "grid w-full grid-cols-[auto_minmax(0,1fr)] gap-x-3 rounded-inner px-3 py-2.5 text-left transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none enabled:hover:bg-surface-muted/70",
                  active && "bg-accent-soft enabled:hover:bg-accent-soft"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-[7px] size-[7px] rotate-45 rounded-[1.5px] border",
                    active ? "border-accent bg-accent" : "border-ink-tertiary bg-surface"
                  )}
                />
                <span>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium text-ink">{note.title}</span>
                    <span className="shrink-0 font-mono type-caption text-ink-tertiary">{formatShortDate(note.t)}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-secondary">{note.body}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
