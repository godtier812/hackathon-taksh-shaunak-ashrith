import type { JSX } from 'react'
import type { BaselineResult } from '../lib/types'

export function BaselineSummary({ result }: { result: BaselineResult }): JSX.Element {
  if (result.status === 'building') {
    return (
      <section className="card">
        <h3>Your personal baseline</h3>
        <p className="muted">
          EchoMind compares you with yourself, not with other people. {result.remaining} more
          check-in
          {result.remaining === 1 ? '' : 's'} of this task will set your baseline.
        </p>
      </section>
    )
  }
  return (
    <section className="card">
      <h3>Compared with your baseline</h3>
      <ul className="deltas">
        {result.deltas.map((d) => (
          <li key={d.key} className={d.worse ? 'worse' : ''}>
            {d.worse ? '⚠ ' : '✓ '}
            {d.text}
          </li>
        ))}
      </ul>
      <p className="muted small">
        Your baseline is the average of your first three check-ins of this task.
      </p>
    </section>
  )
}
