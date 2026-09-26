import type { Band, SessionSource } from './types'

export function pct(ratio: number): string {
  return `${Math.round(ratio * 100)}%`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDuration(sec: number): string {
  const whole = Math.floor(sec)
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`
}

export function sourceLabel(source: SessionSource): string {
  switch (source) {
    case 'live':
      return 'Live recording'
    case 'sample-healthy':
      return 'Demo sample (typical)'
    case 'sample-markers':
      return 'Demo sample (markers)'
    case 'seed':
      return 'Earlier check-in'
  }
}

export const BAND_LABEL: Record<Band, string> = {
  green: 'Typical for you',
  yellow: 'Worth watching',
  red: 'Consider a check-up'
}

export const BAND_MESSAGE: Record<Band, string> = {
  green: 'Your speech patterns look typical.',
  yellow: 'A few speech markers changed. Keep checking in.',
  red: 'Several speech markers changed. Consider sharing this report with a doctor.'
}

export const FACTOR_EXPLANATIONS: Record<string, string> = {
  Silence: 'How much of your speaking time was spent in pauses.',
  'Pause length': 'Long pauses mid-sentence often happen while searching for words.',
  'Speech rate': 'Slower, more effortful speech can be an early sign of changes in thinking.',
  'Pitch variation': 'Flatter, more monotone speech is linked with cognitive changes.',
  'Filler words': 'Frequent "um" and "uh" can signal trouble retrieving words.',
  Repetitions: 'Repeating words or phrases can reflect lapses in working memory.',
  'Word-finding': 'Vague substitutes like "the thing" suggest difficulty naming.',
  Vocabulary: 'A narrower range of words can reflect changes in language.'
}
