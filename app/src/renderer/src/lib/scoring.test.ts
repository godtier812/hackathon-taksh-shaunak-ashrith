import { describe, it, expect } from 'vitest'
import { THRESHOLDS, bandFor, fillersPer100, scoreSession } from './scoring'
import type { AcousticMetrics, LinguisticResult } from './types'

function acoustics(level: 'ok' | 'bad'): AcousticMetrics {
  return {
    durationSec: 60,
    speakingTimeSec: 45,
    pauseCount: 8,
    meanPauseSec: THRESHOLDS.meanPauseSec[level],
    longestPauseSec: 1,
    silenceRatio: THRESHOLDS.silenceRatio[level],
    speechRate: THRESHOLDS.speechRate[level],
    pitchVariationSemitones: THRESHOLDS.pitchVariation[level],
    pauses: []
  }
}

function linguistic(level: 'ok' | 'bad'): LinguisticResult {
  return {
    transcript: [],
    wordCount: 100,
    fillerCount: THRESHOLDS.fillersPer100[level],
    repetitionCount: THRESHOLDS.repetitions[level],
    wordFindingEvents: THRESHOLDS.wordFinding[level],
    typeTokenRatio: THRESHOLDS.typeTokenRatio[level],
    notes: []
  }
}

describe('scoreSession', () => {
  it('has factor maximums that add up to 100', () => {
    expect(Object.values(THRESHOLDS).reduce((sum, r) => sum + r.max, 0)).toBe(100)
  })

  it('gives 100, green and display text when every metric is typical', () => {
    const r = scoreSession(acoustics('ok'), linguistic('ok'))
    expect(r.score).toBe(100)
    expect(r.band).toBe('green')
    expect(r.label).toBe('Typical for you')
    expect(r.message).toBe('Your speech patterns look typical.')
    expect(r.factors.every((f) => f.points === 0)).toBe(true)
    expect(r.factors.every((f) => f.explanation.length > 0)).toBe(true)
  })

  it('gives 0 and red when every metric is at its worst', () => {
    const r = scoreSession(acoustics('bad'), linguistic('bad'))
    expect(r.score).toBe(0)
    expect(r.band).toBe('red')
  })

  it('scales a penalty linearly between ok and bad', () => {
    const { ok, bad, max } = THRESHOLDS.silenceRatio
    const r = scoreSession({ ...acoustics('ok'), silenceRatio: (ok + bad) / 2 }, linguistic('ok'))
    expect(r.factors.find((f) => f.label === 'Silence')?.points).toBe(Math.round(max / 2))
    expect(r.score).toBe(100 - Math.round(max / 2))
  })
})

describe('bandFor', () => {
  it('uses 75 and 55 as band edges', () => {
    expect(bandFor(75)).toBe('green')
    expect(bandFor(74)).toBe('yellow')
    expect(bandFor(55)).toBe('yellow')
    expect(bandFor(54)).toBe('red')
  })
})

describe('fillersPer100', () => {
  it('normalizes fillers by word count', () => {
    expect(fillersPer100({ fillerCount: 3, wordCount: 60 })).toBe(5)
    expect(fillersPer100({ fillerCount: 3, wordCount: 0 })).toBe(0)
  })
})
