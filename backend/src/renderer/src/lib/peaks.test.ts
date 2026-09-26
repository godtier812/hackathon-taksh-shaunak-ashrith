import { describe, it, expect } from 'vitest'
import { computePeaks, toWaveform } from './peaks'

describe('computePeaks', () => {
  it('returns the max absolute sample per bucket', () => {
    expect(computePeaks(new Float32Array([0, 0.5, -1, 0.25]), 2)).toEqual([0.5, 1])
  })

  it('returns an empty array for empty input', () => {
    expect(computePeaks(new Float32Array(0), 10)).toEqual([])
  })
})

describe('toWaveform', () => {
  it('normalizes peaks so the loudest bucket is 1', () => {
    expect(toWaveform(new Float32Array([0, 0.25, -0.5, 0.125]), 2)).toEqual([0.5, 1])
  })

  it('returns zeros for silence', () => {
    expect(toWaveform(new Float32Array(4), 2)).toEqual([0, 0])
  })
})
