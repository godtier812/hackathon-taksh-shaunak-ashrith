import type { LinguisticResult, TranscriptToken } from './types'

export type TokenSummary = Pick<
  LinguisticResult,
  'wordCount' | 'fillerCount' | 'repetitionCount' | 'wordFindingEvents' | 'typeTokenRatio'
>

export function parseScript(script: string): TranscriptToken[] {
  return script
    .trim()
    .split(/\s+/)
    .map((raw): TranscriptToken => {
      if (raw === '...') return { text: '…', kind: 'pause' }
      if (raw.startsWith('~')) return { text: raw.slice(1), kind: 'filler' }
      if (raw.startsWith('^')) return { text: raw.slice(1), kind: 'repetition' }
      if (raw.startsWith('?')) return { text: raw.slice(1), kind: 'wordfinding' }
      return { text: raw, kind: 'word' }
    })
}

export function summarizeTokens(tokens: TranscriptToken[]): TokenSummary {
  const lexical = tokens.filter((t) => t.kind !== 'filler' && t.kind !== 'pause')
  const normalized = lexical
    .map((t) => t.text.toLowerCase().replace(/[^a-z']/g, ''))
    .filter(Boolean)
  const wordFindingEvents = tokens.filter(
    (t, i) => t.kind === 'wordfinding' && (i === 0 || tokens[i - 1].kind !== 'wordfinding')
  ).length

  return {
    wordCount: normalized.length,
    fillerCount: tokens.filter((t) => t.kind === 'filler').length,
    repetitionCount: tokens.filter((t) => t.kind === 'repetition').length,
    wordFindingEvents,
    typeTokenRatio: normalized.length ? new Set(normalized).size / normalized.length : 0
  }
}
