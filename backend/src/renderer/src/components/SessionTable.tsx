import type { JSX } from 'react'
import { formatDate, sourceLabel } from '../lib/format'
import { fillersPer100 } from '../lib/scoring'
import type { Session } from '../lib/types'

export function SessionTable({ sessions }: { sessions: Session[] }): JSX.Element {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Task</th>
          <th>Score</th>
          <th>Speech rate</th>
          <th>Avg pause</th>
          <th>Fillers / 100 words</th>
          <th>Source</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id}>
            <td>{formatDate(s.createdAt)}</td>
            <td>{s.taskTitle}</td>
            <td>
              <span className={`band-pill band-${s.score.band}`}>{s.score.score}</span>
            </td>
            <td>{s.acoustics.speechRate.toFixed(1)} /s</td>
            <td>{s.acoustics.meanPauseSec.toFixed(2)} s</td>
            <td>{fillersPer100(s.linguistic).toFixed(1)}</td>
            <td>{sourceLabel(s.source)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
