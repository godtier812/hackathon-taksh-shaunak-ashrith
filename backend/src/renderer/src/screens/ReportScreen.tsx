import { useState, type JSX } from 'react'
import { BaselineSummary } from '../components/BaselineSummary'
import { Disclaimer } from '../components/Disclaimer'
import { ScoreGauge } from '../components/ScoreGauge'
import { SessionTable } from '../components/SessionTable'
import { TrendChart } from '../components/TrendChart'
import { formatDate } from '../lib/format'
import type { Session } from '../lib/types'

const RECENT_COUNT = 8

interface Props {
  sessions: Session[]
  onBack: () => void
}

export function ReportScreen({ sessions, onBack }: Props): JSX.Element {
  const [status, setStatus] = useState<string | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="stack">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <p>No check-ins yet. Complete one to create a report.</p>
      </div>
    )
  }

  const first = sessions[0]
  const latest = sessions[sessions.length - 1]
  const flagged = latest.score.factors.filter((f) => f.points > 0)

  const savePdf = async (): Promise<void> => {
    setStatus('Saving…')
    try {
      const result = await window.api.exportReportPdf()
      setStatus(result.saved ? `Saved to ${result.filePath}` : null)
    } catch {
      setStatus('Could not save the PDF. Please try again.')
    }
  }

  return (
    <div className="report">
      <div className="row no-print">
        <button className="link" onClick={onBack}>
          ← Back
        </button>
        <button className="btn" onClick={() => void savePdf()}>
          Save as PDF
        </button>
        {status && <span className="muted">{status}</span>}
      </div>

      <header>
        <h1>MindTrace speech check-in report</h1>
        <p className="muted">
          {sessions.length} check-ins · {formatDate(first.createdAt)} –{' '}
          {formatDate(latest.createdAt)} · Generated {formatDate(new Date().toISOString())}
        </p>
      </header>

      <section className="report-summary">
        <ScoreGauge score={latest.score.score} band={latest.score.band} size={120} />
        <div>
          <p className={`band-pill band-${latest.score.band}`}>{latest.score.label}</p>
          <p>
            Latest check-in: {formatDate(latest.createdAt)} ({latest.taskTitle})
          </p>
        </div>
      </section>

      <BaselineSummary result={latest.baseline} />

      <section>
        <h2>Score trend</h2>
        <TrendChart sessions={sessions} animate={false} height={220} />
      </section>

      <section>
        <h2>Latest check-in: markers outside the typical range</h2>
        {flagged.length === 0 ? (
          <p>No markers outside the typical range.</p>
        ) : (
          <ul>
            {flagged.map((f) => (
              <li key={f.label}>
                <strong>{f.label}:</strong> {f.detail}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Recent check-ins</h2>
        <SessionTable sessions={sessions.slice(-RECENT_COUNT).reverse()} />
      </section>

      <section>
        <h2>About these measures</h2>
        <p className="small">
          Pause, speech-rate and pitch measures are computed from the audio recording. Filler words,
          repetitions and word-finding moments come from the language analysis. Scores compare the
          patient with their own earlier check-ins of the same task. Research links changes in these
          markers with early cognitive decline, but they can also change with fatigue, illness, mood
          or hearing.
        </p>
      </section>

      <Disclaimer />
    </div>
  )
}
