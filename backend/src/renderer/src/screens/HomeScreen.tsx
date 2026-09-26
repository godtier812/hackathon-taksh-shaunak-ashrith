import type { JSX } from 'react'
import { Disclaimer } from '../components/Disclaimer'
import { ScoreGauge } from '../components/ScoreGauge'
import { formatDate } from '../lib/format'
import { TASK_LIST } from '../lib/scripts'
import type { Session, TaskId } from '../lib/types'

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

interface Props {
  sessions: Session[]
  onStart: (task: TaskId) => void
  onHistory: () => void
  onReport: () => void
}

export function HomeScreen({ sessions, onStart, onHistory, onReport }: Props): JSX.Element {
  const latest = sessions[sessions.length - 1]
  return (
    <div className="stack">
      <section className="card hero">
        <div>
          <h1>{greeting()}</h1>
          <p className="lead">
            A one-minute voice check-in helps you and your family notice changes early.
          </p>
        </div>
        {latest && (
          <div className="hero-score">
            <ScoreGauge score={latest.score.score} band={latest.score.band} size={140} />
            <p className="muted small">Last check-in {formatDate(latest.createdAt)}</p>
          </div>
        )}
      </section>
      <h2>Start today&apos;s check-in</h2>
      <div className="task-grid">
        {TASK_LIST.map((task) => (
          <button key={task.id} className="card task-card" onClick={() => onStart(task.id)}>
            <span className="task-icon">{task.icon}</span>
            <strong>{task.title}</strong>
            <span className="muted">{task.summary}</span>
          </button>
        ))}
      </div>
      <div className="row">
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
