import { describe, it, expect } from 'vitest'
import { analyzeAcoustics, frameDb } from './acoustics'

const SR = 16000

function tone(sec: number, hz = 200, amp = 0.5): Float32Array {
  const out = new Float32Array(Math.round(sec * SR))
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * hz * i) / SR)
  return out
}

function silence(sec: number): Float32Array {
  return new Float32Array(Math.round(sec * SR))
}

/** 200 Hz carrier whose loudness rises and falls `rate` times per second, like syllables */
function syllables(sec: number, rate: number): Float32Array {
  const out = new Float32Array(Math.round(sec * SR))
  for (let i = 0; i < out.length; i++) {
    const t = i / SR
    const envelope = 0.55 + 0.45 * Math.sin(2 * Math.PI * rate * t)
    out[i] = envelope * 0.5 * Math.sin(2 * Math.PI * 200 * t)
  }
  return out
}

function concat(...parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

describe('frameDb', () => {
  it('returns -100 dB for silence and about -9 dB for a 0.5 amplitude sine', () => {
    const db = frameDb(concat(silence(0.1), tone(0.1)), SR)
    expect(db).toHaveLength(10)
    expect(db[0]).toBe(-100)
    expect(db[9]).toBeCloseTo(-9.03, 0)
  })
})

describe('analyzeAcoustics', () => {
  it('finds pauses between speech and ignores leading/trailing silence', () => {
    const signal = concat(
      silence(0.4),
      tone(0.5),
      silence(1.0),
      tone(0.5),
      silence(0.3),
      tone(0.5),
      silence(0.4)
    )
    const m = analyzeAcoustics(signal, SR)
    expect(m.durationSec).toBeCloseTo(3.6, 2)
    expect(m.pauseCount).toBe(2)
    expect(m.pauses[0].startSec).toBeCloseTo(0.9, 1)
    expect(m.longestPauseSec).toBeCloseTo(1.0, 1)
    expect(m.meanPauseSec).toBeCloseTo(0.65, 1)
    expect(m.speakingTimeSec).toBeCloseTo(1.5, 1)
    expect(m.silenceRatio).toBeCloseTo(1.3 / 2.8, 1)
  })

  it('treats gaps shorter than 150 ms as part of speech', () => {
    const m = analyzeAcoustics(concat(tone(0.5), silence(0.1), tone(0.5)), SR)
    expect(m.pauseCount).toBe(0)
    expect(m.speakingTimeSec).toBeCloseTo(1.1, 1)
  })

  it('returns zeros for pure silence', () => {
    const m = analyzeAcoustics(silence(2), SR)
    expect(m.speakingTimeSec).toBe(0)
    expect(m.pauseCount).toBe(0)
    expect(m.speechRate).toBe(0)
    expect(m.silenceRatio).toBe(0)
  })

  it('estimates about 4 syllables per second from a 4 Hz loudness envelope', () => {
    const m = analyzeAcoustics(syllables(3, 4), SR)
    expect(m.speechRate).toBeGreaterThan(3.3)
    expect(m.speechRate).toBeLessThan(4.7)
  })

  it('reports near-zero pitch variation for a steady tone', () => {
    expect(analyzeAcoustics(tone(2, 200), SR).pitchVariationSemitones).toBeLessThan(0.5)
  })

  it('reports about 6 semitones of variation for half 150 Hz, half 300 Hz', () => {
    const v = analyzeAcoustics(concat(tone(1, 150), tone(1, 300)), SR).pitchVariationSemitones
    expect(v).toBeGreaterThan(5)
    expect(v).toBeLessThan(7)
  })
})
