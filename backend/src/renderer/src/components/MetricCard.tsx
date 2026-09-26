import type { JSX } from 'react'
import type { ScoreFactor } from '../lib/types'

export function MetricCard({ factor }: { factor: ScoreFactor }): JSX.Element {
  const status = factor.points === 0 ? 'ok' : factor.points < 5 ? 'watch' : 'flag'
  const statusText = { ok: 'Typical', watch: 'Slight change', flag: 'Notable' }[status]
  return (
    <div className={`metric-card status-${status}`}>
      <div className="metric-top">
        <span>{factor.label}</span>
        <span>{statusText}</span>
      </div>
      <div className="metric-value">{factor.detail}</div>
      <p className="muted small">{factor.explanation}</p>
    </div>
  )
}
