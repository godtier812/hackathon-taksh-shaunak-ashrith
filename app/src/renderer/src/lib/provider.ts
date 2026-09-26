import { SCRIPTS, type ScriptVariant } from './scripts'
import { parseScript, summarizeTokens, type TokenSummary } from './transcript'
import type { AcousticMetrics, LinguisticResult, SessionSource, TaskId } from './types'

export interface AnalysisRequest {
  audio: Blob
  task: TaskId
  source: SessionSource
  acoustics: AcousticMetrics
}

/** Swap ScriptedProvider for a Whisper + Claude implementation without touching the UI or the API. */
export interface AnalysisProvider {
  analyze(request: AnalysisRequest): Promise<LinguisticResult>
}

const LIVE_MARKERS_SILENCE_RATIO = 0.3
const LIVE_MARKERS_MEAN_PAUSE_SEC = 0.9

export function pickVariant(source: SessionSource, acoustics: AcousticMetrics): ScriptVariant {
  if (source === 'sample-healthy') return 'healthy'
  if (source === 'sample-markers') return 'markers'
  return acoustics.silenceRatio > LIVE_MARKERS_SILENCE_RATIO ||
    acoustics.meanPauseSec > LIVE_MARKERS_MEAN_PAUSE_SEC
    ? 'markers'
    : 'healthy'
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

export function buildNotes(summary: TokenSummary): string[] {
  const notes: string[] = []
  if (summary.fillerCount > 0) notes.push(`${plural(summary.fillerCount, 'filler word')} (like "um" or "uh")`)
  if (summary.repetitionCount > 0) notes.push(plural(summary.repetitionCount, 'repeated word'))
  if (summary.wordFindingEvents > 0) notes.push(`${plural(summary.wordFindingEvents, 'moment')} of searching for a word`)
  if (notes.length === 0) notes.push('Fluent speech with no hesitation markers')
  return notes
}

export class ScriptedProvider implements AnalysisProvider {
  async analyze({ task, source, acoustics }: AnalysisRequest): Promise<LinguisticResult> {
    const transcript = parseScript(SCRIPTS[task][pickVariant(source, acoustics)])
    const summary = summarizeTokens(transcript)
    return { transcript, ...summary, notes: buildNotes(summary) }
  }
}
