import { BAND_LABEL, BAND_MESSAGE, FACTOR_EXPLANATIONS, pct } from './format'
import type { AcousticMetrics, Band, LinguisticResult, ScoreFactor, ScoreResult } from './types'

interface Rule {
  ok: number
  bad: number
  max: number
}

/** Tune ok/bad with real recordings. Keep the max values summing to 100. */
export const THRESHOLDS = {
  silenceRatio: { ok: 0.25, bad: 0.5, max: 20 },
  meanPauseSec: { ok: 0.6, bad: 1.5, max: 15 },
  speechRate: { ok: 3.5, bad: 2.0, max: 15 },
  pitchVariation: { ok: 2.5, bad: 1.0, max: 10 },
  fillersPer100: { ok: 3, bad: 12, max: 15 },
  repetitions: { ok: 0, bad: 4, max: 10 },
  wordFinding: { ok: 0, bad: 3, max: 10 },
  typeTokenRatio: { ok: 0.55, bad: 0.35, max: 5 }
} satisfies Record<string, Rule>

export const GREEN_MIN = 75
export const YELLOW_MIN = 55

/** Linear penalty from 0 at `ok` to `max` at `bad`; works whether higher or lower is worse. */
export function penalty(value: number, { ok, bad, max }: Rule): number {
  const t = (value - ok) / (bad - ok)
  return Math.round(Math.min(1, Math.max(0, t)) * max)
}

export function fillersPer100(l: Pick<LinguisticResult, 'fillerCount' | 'wordCount'>): number {
  return l.wordCount > 0 ? (l.fillerCount / l.wordCount) * 100 : 0
}

export function bandFor(score: number): Band {
  if (score >= GREEN_MIN) return 'green'
  if (score >= YELLOW_MIN) return 'yellow'
  return 'red'
}

function factor(label: string, points: number, detail: string): ScoreFactor {
  return { label, points, detail, explanation: FACTOR_EXPLANATIONS[label] ?? '' }
}

export function scoreSession(a: AcousticMetrics, l: LinguisticResult): ScoreResult {
  const T = THRESHOLDS
  const factors: ScoreFactor[] = [
    factor('Silence', penalty(a.silenceRatio, T.silenceRatio), `Pauses filled ${pct(a.silenceRatio)} of your speaking time`),
    factor('Pause length', penalty(a.meanPauseSec, T.meanPauseSec), `Average pause ${a.meanPauseSec.toFixed(1)} s`),
    factor('Speech rate', penalty(a.speechRate, T.speechRate), `${a.speechRate.toFixed(1)} syllables per second`),
    factor('Pitch variation', penalty(a.pitchVariationSemitones, T.pitchVariation), `${a.pitchVariationSemitones.toFixed(1)} semitones of pitch movement`),
    factor('Filler words', penalty(fillersPer100(l), T.fillersPer100), `${fillersPer100(l).toFixed(1)} per 100 words`),
    factor('Repetitions', penalty(l.repetitionCount, T.repetitions), `${l.repetitionCount} repeated words`),
    factor('Word-finding', penalty(l.wordFindingEvents, T.wordFinding), `${l.wordFindingEvents} word-finding moments`),
    factor('Vocabulary', penalty(l.typeTokenRatio, T.typeTokenRatio), `${pct(l.typeTokenRatio)} unique words`)
  ]
  const score = Math.max(0, 100 - factors.reduce((sum, f) => sum + f.points, 0))
  const band = bandFor(score)
  return { score, band, label: BAND_LABEL[band], message: BAND_MESSAGE[band], factors }
}
