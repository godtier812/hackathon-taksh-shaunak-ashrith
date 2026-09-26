import { describe, it, expect } from 'vitest'
import { ScriptedProvider, pickVariant } from './provider'
import type { AcousticMetrics } from './types'

const calm: AcousticMetrics = {
  durationSec: 30,
  speakingTimeSec: 25,
  pauseCount: 4,
  meanPauseSec: 0.4,
  longestPauseSec: 0.8,
  silenceRatio: 0.15,
  speechRate: 4,
  pitchVariationSemitones: 3,
  pauses: []
}

describe('pickVariant', () => {
  it('follows the sample type for bundled samples', () => {
    expect(pickVariant('sample-healthy', { ...calm, silenceRatio: 0.9 })).toBe('healthy')
    expect(pickVariant('sample-markers', calm)).toBe('markers')
  })

  it('uses the measured pauses for live recordings', () => {
    expect(pickVariant('live', calm)).toBe('healthy')
    expect(pickVariant('live', { ...calm, silenceRatio: 0.4 })).toBe('markers')
    expect(pickVariant('live', { ...calm, meanPauseSec: 1.2 })).toBe('markers')
  })
})

describe('ScriptedProvider', () => {
  const provider = new ScriptedProvider()

  it('returns a marker-free result for a typical sample', async () => {
    const r = await provider.analyze({
      audio: new Blob(),
      task: 'reading',
      source: 'sample-healthy',
      acoustics: calm
    })
    expect(r.fillerCount).toBe(0)
    expect(r.transcript.length).toBeGreaterThan(20)
    expect(r.notes).toEqual(['Fluent speech with no hesitation markers'])
  })

  it('returns markers and readable notes for a markers sample', async () => {
    const r = await provider.analyze({
      audio: new Blob(),
      task: 'story',
      source: 'sample-markers',
      acoustics: calm
    })
    expect(r.fillerCount).toBeGreaterThan(0)
    expect(r.wordFindingEvents).toBeGreaterThan(0)
    expect(r.notes[0]).toMatch(/filler word/)
  })
})
