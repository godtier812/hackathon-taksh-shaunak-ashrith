import type { JSX } from 'react'
import { SessionTable } from '../components/SessionTable'
import { TrendChart } from '../components/TrendChart'
import type { Session } from '../lib/types'

interface Props {
  sessions: Session[]
  onBack: () => void
  onReport: () => void
}

export function HistoryScreen({ sessions, onBack, onReport }: Props): JSX.Element {
  return (
    <div className="stack">
      <button className="link" onClick={onBack}>
        ← Back
      </button>
      <section className="card">
        <h1>Your check-in history</h1>
        <p className="muted">
          Family members see this same trend on the EchoMind caregiver website.
        </p>
        <TrendChart sessions={sessions} />
      </section>
      <section className="card">
        <SessionTable sessions={[...sessions].reverse()} />
      </section>
      <button className="btn" onClick={onReport}>
        Create doctor report
      </button>
    </div>
  )
}
