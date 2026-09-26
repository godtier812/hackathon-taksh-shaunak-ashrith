import { fillersPer100 } from './scoring'
import type { BaselineResult, MetricDelta, MetricKey, SessionCore } from './types'

export const BASELINE_SIZE = 3
const WORSE_PCT = 10
const SAME_PCT = 5

interface MetricDef {
  key: MetricKey
  label: string
  higherIsBetter: boolean
  get: (s: SessionCore) => number
}

const METRICS: MetricDef[] = [
  { key: 'score', label: 'Overall score', higherIsBetter: true, get: (s) => s.score.score },
  {
    key: 'speechRate',
    label: 'Speech rate',
    higherIsBetter: true,
    get: (s) => s.acoustics.speechRate
  },
  {
    key: 'meanPause',
    label: 'Average pause',
    higherIsBetter: false,
    get: (s) => s.acoustics.meanPauseSec
  },
  {
    key: 'silence',
    label: 'Time spent silent',
    higherIsBetter: false,
    get: (s) => s.acoustics.silenceRatio
  },
  {
    key: 'fillers',
    label: 'Filler words',
    higherIsBetter: false,
    get: (s) => fillersPer100(s.linguistic)
  }
]

export function compareToBaseline(current: SessionCore, history: SessionCore[]): BaselineResult {
  const base = history
    .filter(
      (s) => s.id !== current.id && s.task === current.task && s.createdAt < current.createdAt
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(0, BASELINE_SIZE)
  if (base.length < BASELINE_SIZE)
    return { status: 'building', remaining: BASELINE_SIZE - base.length }

  const deltas = METRICS.map((m): MetricDelta => {
    const baseline = base.reduce((sum, s) => sum + m.get(s), 0) / base.length
    const value = m.get(current)
    const pctChange = baseline === 0 ? 0 : ((value - baseline) / baseline) * 100
    const worse = m.higherIsBetter ? pctChange < -WORSE_PCT : pctChange > WORSE_PCT
    const text =
      Math.abs(pctChange) < SAME_PCT
        ? `${m.label} is about the same as your baseline`
        : `${m.label} is ${Math.round(Math.abs(pctChange))}% ${pctChange < 0 ? 'lower' : 'higher'} than your baseline`
    return { key: m.key, label: m.label, current: value, baseline, pctChange, worse, text }
  })
  return { status: 'ready', deltas }
}
