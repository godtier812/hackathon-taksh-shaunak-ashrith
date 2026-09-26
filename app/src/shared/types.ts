export type TaskId = 'reading' | 'fluency' | 'story'

export type SessionSource = 'live' | 'sample-healthy' | 'sample-markers' | 'seed'

export interface Pause {
  startSec: number
  endSec: number
}

export interface AcousticMetrics {
  durationSec: number
  speakingTimeSec: number
  pauseCount: number
  meanPauseSec: number
  longestPauseSec: number
  /** Share of the active speaking span (first to last voiced frame) spent in pauses, 0..1 */
  silenceRatio: number
  /** Estimated syllables per second of voiced time */
  speechRate: number
  /** Standard deviation of pitch in semitones; low = monotone */
  pitchVariationSemitones: number
  pauses: Pause[]
}

export type TokenKind = 'word' | 'filler' | 'repetition' | 'wordfinding' | 'pause'

export interface TranscriptToken {
  text: string
  kind: TokenKind
}

export interface LinguisticResult {
  transcript: TranscriptToken[]
  wordCount: number
  fillerCount: number
  repetitionCount: number
  wordFindingEvents: number
  /** Unique words / total words, 0..1 */
  typeTokenRatio: number
  notes: string[]
}

export type Band = 'green' | 'yellow' | 'red'

export interface ScoreFactor {
  label: string
  /** Points subtracted from 100; 0 = typical */
  points: number
  /** Measured value as display text, e.g. "3.4 syllables per second" */
  detail: string
  /** Plain-English meaning of this marker */
  explanation: string
}

export interface ScoreResult {
  score: number
  band: Band
  /** Short band label, e.g. "Worth watching" */
  label: string
  /** One-sentence headline for this band */
  message: string
  factors: ScoreFactor[]
}

export type MetricKey = 'score' | 'speechRate' | 'meanPause' | 'silence' | 'fillers'

export interface MetricDelta {
  key: MetricKey
  label: string
  current: number
  baseline: number
  pctChange: number
  worse: boolean
  /** Display text, e.g. "Speech rate is 18% lower than your baseline" */
  text: string
}

export type BaselineResult =
  | { status: 'building'; remaining: number }
  | { status: 'ready'; deltas: MetricDelta[] }

export interface Session {
  id: string
  createdAt: string
  task: TaskId
  taskTitle: string
  source: SessionSource
  acoustics: AcousticMetrics
  linguistic: LinguisticResult
  score: ScoreResult
  /** Normalized 0..1 loudness peaks for drawing the pause map; empty for seeded history */
  waveform: number[]
  /** Comparison with this patient's baseline, computed when the session was analyzed */
  baseline: BaselineResult
}

/** A session before its baseline comparison has been attached. */
export type SessionCore = Omit<Session, 'baseline'>
