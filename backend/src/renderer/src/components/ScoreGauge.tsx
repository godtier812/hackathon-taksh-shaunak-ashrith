import type { JSX } from 'react'
import type { Band } from '../lib/types'

const R = 42
const CIRCUMFERENCE = 2 * Math.PI * R

interface Props {
  score: number
  band: Band
  size?: number
}

export function ScoreGauge({ score, band, size = 180 }: Props): JSX.Element {
  return (
    <svg
      className={`gauge band-${band}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Score ${score} out of 100`}
    >
      <circle cx="50" cy="50" r={R} className="gauge-track" />
      <circle
        cx="50"
        cy="50"
        r={R}
        className="gauge-value"
        strokeDasharray={`${(score / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="54" textAnchor="middle" className="gauge-text">
        {score}
      </text>
      <text x="50" y="68" textAnchor="middle" className="gauge-sub">
        / 100
      </text>
    </svg>
  )
}
