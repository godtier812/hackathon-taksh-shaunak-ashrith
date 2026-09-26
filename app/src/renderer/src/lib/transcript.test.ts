import { describe, it, expect } from 'vitest'
import { parseScript, summarizeTokens } from './transcript'
import { SCRIPTS } from './scripts'

describe('parseScript', () => {
  it('turns markup into typed tokens', () => {
    expect(parseScript('The ~um ^cat cat ... ?the ?thing')).toEqual([
      { text: 'The', kind: 'word' },
      { text: 'um', kind: 'filler' },
      { text: 'cat', kind: 'repetition' },
      { text: 'cat', kind: 'word' },
      { text: '…', kind: 'pause' },
      { text: 'the', kind: 'wordfinding' },
      { text: 'thing', kind: 'wordfinding' }
    ])
  })
})

describe('summarizeTokens', () => {
  it('counts markers; consecutive word-finding tokens are one event', () => {
    expect(summarizeTokens(parseScript('The ~um ^cat cat ... ?the ?thing sat ~uh'))).toEqual({
      wordCount: 6,
      fillerCount: 2,
      repetitionCount: 1,
      wordFindingEvents: 1,
      typeTokenRatio: 4 / 6
    })
  })
})

describe('SCRIPTS', () => {
  it('has marker-free healthy scripts and marker-rich marker scripts for every task', () => {
    for (const task of ['reading', 'fluency', 'story'] as const) {
      const healthy = summarizeTokens(parseScript(SCRIPTS[task].healthy))
      const markers = summarizeTokens(parseScript(SCRIPTS[task].markers))
      expect(healthy.fillerCount + healthy.repetitionCount + healthy.wordFindingEvents).toBe(0)
      expect(markers.fillerCount).toBeGreaterThan(0)
      expect(markers.repetitionCount).toBeGreaterThan(0)
      expect(markers.wordFindingEvents).toBeGreaterThan(0)
    }
  })
})
