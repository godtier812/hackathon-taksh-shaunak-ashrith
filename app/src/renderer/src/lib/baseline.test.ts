import { describe, it, expect } from 'vitest'
import { compareToBaseline } from './baseline'
import type { MetricDelta, SessionCore, TaskId } from './types'

const NOW = Date.UTC(2026, 8, 26)
const DAY = 86_400_000

function makeSession(id: string, daysAgo: number, task: TaskId, score: number, speechRate: number): SessionCore {
  return {
    id,
    createdAt: new Date(NOW - daysAgo * DAY).toISOString(),
    task,
    taskTitle: 'Test task',
    source: 'seed',
    acoustics: {
      durationSec: 60,
      speakingTimeSec: 45,
      pauseCount: 8,
      meanPauseSec: 0.5,
      longestPauseSec: 1,
      silenceRatio: 0.2,
      speechRate,
      pitchVariationSemitones: 3,
      pauses: []
    },
    linguistic: {
      transcript: [],
      wordCount: 100,
      fillerCount: 2,
      repetitionCount: 0,
      wordFindingEvents: 0,
      typeTokenRatio: 0.7,
      notes: []
    },
    score: { score, band: 'green', label: '', message: '', factors: [] },
    waveform: []
  }
}

function readyDeltas(current: SessionCore, history: SessionCore[]): MetricDelta[] {
  const result = compareToBaseline(current, history)
  if (result.status !== 'ready') throw new Error(`expected ready, got ${result.status}`)
  return result.deltas
}

describe('compareToBaseline', () => {
  it('is still building with fewer than 3 earlier sessions of the same task', () => {
    const current = makeSession('c', 0, 'reading', 70, 3)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('f1', 15, 'fluency', 90, 4),
      current
    ]
    expect(compareToBaseline(current, history)).toEqual({ status: 'building', remaining: 1 })
  })

  it('ignores sessions recorded after the current one', () => {
    const current = makeSession('c', 10, 'reading', 70, 3)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('r3', 5, 'reading', 90, 4)
    ]
    expect(compareToBaseline(current, history)).toEqual({ status: 'building', remaining: 1 })
  })

  it('compares with the mean of the first 3 earlier sessions of the same task', () => {
    const current = makeSession('c', 0, 'reading', 70, 3)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('r3', 10, 'reading', 90, 4),
      makeSession('r4', 5, 'reading', 10, 1),
      current
    ]
    const rate = readyDeltas(current, history).find((d) => d.key === 'speechRate')
    expect(rate).toMatchObject({ baseline: 4, current: 3, pctChange: -25, worse: true })
    expect(rate?.text).toBe('Speech rate is 25% lower than your baseline')
    const score = readyDeltas(current, history).find((d) => d.key === 'score')
    expect(score?.baseline).toBe(90)
    expect(score?.worse).toBe(true)
  })

  it('describes small changes as about the same', () => {
    const current = makeSession('c', 0, 'reading', 90, 4.1)
    const history = [
      makeSession('r1', 30, 'reading', 90, 4),
      makeSession('r2', 20, 'reading', 90, 4),
      makeSession('r3', 10, 'reading', 90, 4)
    ]
    const rate = readyDeltas(current, history).find((d) => d.key === 'speechRate')
    expect(rate?.text).toBe('Speech rate is about the same as your baseline')
    expect(rate?.worse).toBe(false)
  })
})
