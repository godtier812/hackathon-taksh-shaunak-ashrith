"use client"

import { CircleAlert, LoaderCircle, Mic, Square, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { pillClassName } from "@/components/shared/pill"
import { Button } from "@/components/ui/button"
import { mindtrace } from "@/lib/backend/connection"
import { TASK_LIST, TASKS } from "@/lib/backend/tasks"
import type { Session, TaskId } from "@/lib/backend/types"
import { formatClock } from "@/lib/format"
import { cn } from "@/lib/utils"

const MAX_SECONDS = 60

type Phase =
  | { name: "choose" }
  | { name: "recording"; elapsed: number }
  | { name: "analyzing" }
  | { name: "done"; session: Session }
  | { name: "error"; message: string }

type Recording = { recorder: MediaRecorder; stream: MediaStream; timer: number }

function micErrorMessage(error: unknown) {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone access is blocked. Allow it from the browser's address bar, then try again."
  }
  return "No microphone was found. Connect one and try again."
}

/**
 * Records a conversation in the browser and hands it to the MindTrace desktop
 * app, which analyzes and saves it. The dashboard picks the new check-in up
 * through `onAnalyzed`.
 */
export function AnalyzePanel({
  onClose,
  onAnalyzed,
}: {
  onClose: () => void
  onAnalyzed: () => void
}) {
  const [task, setTask] = useState<TaskId>("reading")
  const [phase, setPhase] = useState<Phase>({ name: "choose" })
  const recording = useRef<Recording | null>(null)
  const definition = TASKS[task]

  const release = () => {
    const current = recording.current
    if (!current) return
    window.clearInterval(current.timer)
    current.stream.getTracks().forEach((track) => track.stop())
    recording.current = null
  }

  // Leaving mid-recording discards the audio.
  useEffect(
    () => () => {
      const current = recording.current
      if (!current) return
      current.recorder.onstop = null
      if (current.recorder.state === "recording") current.recorder.stop()
      window.clearInterval(current.timer)
      current.stream.getTracks().forEach((track) => track.stop())
    },
    []
  )

  const analyze = async (audio: Blob) => {
    setPhase({ name: "analyzing" })
    try {
      const session = await mindtrace.analyze(audio, task, "live")
      setPhase({ name: "done", session })
      onAnalyzed()
    } catch (error) {
      const message =
        error instanceof TypeError
          ? "The MindTrace desktop app stopped responding. Check that it is still open."
          : error instanceof Error
            ? error.message
            : "Something went wrong while analyzing. Please try again."
      setPhase({ name: "error", message })
    }
  }

  const start = async () => {
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      setPhase({ name: "error", message: micErrorMessage(error) })
      return
    }
    const recorder = new MediaRecorder(stream)
    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      release()
      void analyze(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }))
    }
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000
      if (elapsed >= MAX_SECONDS && recorder.state === "recording") recorder.stop()
      else setPhase({ name: "recording", elapsed })
    }, 250)
    recording.current = { recorder, stream, timer }
    recorder.start()
    setPhase({ name: "recording", elapsed: 0 })
  }

  const stop = () => {
    const recorder = recording.current?.recorder
    if (recorder?.state === "recording") recorder.stop()
  }

  return (
    <section
      aria-labelledby="analyze-title"
      className="mt-7 rounded-card border border-line bg-surface p-5 shadow-rest @3xl:mt-8 @3xl:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id="analyze-title" className="type-section text-ink">
            New conversation
          </h2>
          <p className="mt-1.5 type-body text-ink-secondary">
            Recorded here, analyzed by the MindTrace app on this computer.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close"
          disabled={phase.name === "recording" || phase.name === "analyzing"}
          className="shrink-0 rounded-full text-ink-secondary hover:text-ink"
        >
          <X strokeWidth={1.75} aria-hidden="true" />
        </Button>
      </div>

      {phase.name === "choose" ? (
        <div className="mt-6">
          <div role="group" aria-label="Speech task" className="flex flex-wrap gap-2">
            {TASK_LIST.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === task}
                onClick={() => setTask(option.id)}
                className={cn(
                  "h-9 rounded-full border px-3.5 type-label transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:outline-none",
                  option.id === task
                    ? "border-brand bg-brand text-white"
                    : "border-line-strong text-ink-secondary hover:text-ink"
                )}
              >
                {option.title}
              </button>
            ))}
          </div>
          <p className="mt-5 max-w-[62ch] type-body text-ink">{definition.instructions}</p>
          {definition.passage ? (
            <blockquote className="mt-4 max-w-[68ch] rounded-inner bg-surface-muted px-5 py-4 type-body-lg text-ink">
              {definition.passage}
            </blockquote>
          ) : null}
          <Button type="button" onClick={() => void start()} className={pillClassName("primary", "md", "mt-6")}>
            <Mic data-icon="inline-start" strokeWidth={1.75} aria-hidden="true" />
            Start recording
          </Button>
        </div>
      ) : null}

      {phase.name === "recording" ? (
        <div className="mt-6 flex flex-col gap-5 @xl:flex-row @xl:items-center @xl:justify-between">
          {definition.passage ? (
            <blockquote className="max-w-[68ch] rounded-inner bg-surface-muted px-5 py-4 type-body-lg text-ink">
              {definition.passage}
            </blockquote>
          ) : (
            <p className="max-w-[62ch] type-body text-ink">{definition.instructions}</p>
          )}
          <div className="flex shrink-0 items-center gap-4">
            <p className="inline-flex items-center gap-2 font-mono type-label text-ink tabular-nums" aria-live="polite">
              <span aria-hidden="true" className="size-2 rounded-full bg-signal motion-safe:animate-pulse" />
              {formatClock(phase.elapsed)} / {formatClock(MAX_SECONDS)}
            </p>
            <Button type="button" onClick={stop} className={pillClassName("primary", "md")}>
              <Square data-icon="inline-start" strokeWidth={1.75} aria-hidden="true" />
              Stop and analyze
            </Button>
          </div>
        </div>
      ) : null}

      {phase.name === "analyzing" ? (
        <p className="mt-6 inline-flex items-center gap-2.5 type-body text-ink-secondary" role="status">
          <LoaderCircle className="size-4 motion-safe:animate-spin" strokeWidth={1.75} aria-hidden="true" />
          The MindTrace app is analyzing the recording…
        </p>
      ) : null}

      {phase.name === "done" ? (
        <div className="mt-6" role="status">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
            <p className="text-[2.5rem] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">
              {phase.session.score.score}
              <span className="ml-1 type-body text-ink-tertiary">/ 100</span>
            </p>
            <p
              className={cn(
                "rounded-full px-3 py-1 type-label",
                phase.session.score.band === "green"
                  ? "bg-accent-soft text-accent"
                  : "bg-signal-soft text-signal-text"
              )}
            >
              {phase.session.score.label}
            </p>
          </div>
          <p className="mt-3 max-w-[62ch] type-body text-ink">{phase.session.score.message}</p>
          {phase.session.baseline.status === "ready" ? (
            <ul className="mt-4 space-y-1.5 type-body text-ink-secondary">
              {phase.session.baseline.deltas.slice(0, 3).map((delta) => (
                <li key={delta.key} className={cn(delta.worse && "text-signal-text")}>
                  {delta.text}
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => setPhase({ name: "choose" })}
              className={pillClassName("secondary", "md")}
            >
              Record another
            </Button>
            <Button type="button" onClick={onClose} className={pillClassName("primary", "md")}>
              Done
            </Button>
          </div>
        </div>
      ) : null}

      {phase.name === "error" ? (
        <div className="mt-6" role="alert">
          <p className="flex max-w-[62ch] gap-2.5 type-body text-signal-text">
            <CircleAlert className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
            {phase.message}
          </p>
          <Button
            type="button"
            onClick={() => setPhase({ name: "choose" })}
            className={pillClassName("secondary", "md", "mt-5")}
          >
            Try again
          </Button>
        </div>
      ) : null}
    </section>
  )
}
