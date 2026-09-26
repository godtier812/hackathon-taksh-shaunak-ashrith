import { useEffect, type JSX } from 'react'
import { BaselineSummary } from '../components/BaselineSummary'
import { Disclaimer } from '../components/Disclaimer'
import { MetricCard } from '../components/MetricCard'
import { PauseMapWaveform } from '../components/PauseMapWaveform'
import { ScoreGauge } from '../components/ScoreGauge'
import { SyncBadge } from '../components/SyncBadge'
import { Transcript } from '../components/Transcript'
import { formatDate, sourceLabel } from '../lib/format'
import type { AnalysisOutput } from '../lib/pipeline'

interface Props {
  view: AnalysisOutput
  onHome: () => void
  onHistory: () => void
  onReport: () => void
}

export function ResultsScreen({ view, onHome, onHistory, onReport }: Props): JSX.Element {
  const { session, audioUrl } = view
  const { score, acoustics, linguistic } = session

  useEffect(() => () => URL.revokeObjectURL(audioUrl), [audioUrl])

  return (
    <div className="stack">
      <section className="card hero">
        <ScoreGauge score={score.score} band={score.band} />
        <div>
          <p className={`band-pill band-${score.band}`}>{score.label}</p>
          <h1>{score.message}</h1>
          <p className="muted">
            {session.taskTitle} · {formatDate(session.createdAt)} · {sourceLabel(session.source)}
          </p>
          <SyncBadge />
        </div>
      </section>

      <BaselineSummary result={session.baseline} />

      <section className="card">
        <h2>Where you paused</h2>
        <PauseMapWaveform waveform={session.waveform} durationSec={acoustics.durationSec} pauses={acoustics.pauses} />
        <audio controls src={audioUrl} />
        <a className="btn ghost" href={audioUrl} download={`${session.task}-${session.source}.webm`}>
          Download recording
        </a>
      </section>

      <section>
        <h2>Speech markers</h2>
        <div className="metric-grid">
          {score.factors.map((f) => (
            <MetricCard key={f.label} factor={f} />
          ))}
        </div>
      </section>

      <section className="card">
        <h2>What you said</h2>
        <Transcript tokens={linguistic.transcript} />
        <ul>
          {linguistic.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
        <p className="muted small">
          Transcript from the demo language provider. Acoustic markers are measured from your recording.
        </p>
      </section>

      <div className="row">
        <button className="btn" onClick={onHome}>
          Done
        </button>
        <button className="btn secondary" onClick={onHistory}>
          View history
        </button>
        <button className="btn secondary" onClick={onReport}>
          Doctor report
        </button>
      </div>
      <Disclaimer />
    </div>
  )
}
