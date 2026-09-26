import { compareToBaseline } from './baseline'
import { buildNotes } from './provider'
import { scoreSession } from './scoring'
import { TASKS } from './scripts'
import type { AcousticMetrics, LinguisticResult, Session, SessionCore, TaskId } from './types'

const COUNT = 12
const DAY = 86_400_000
const TASK_ORDER: TaskId[] = ['reading', 'fluency', 'story']
/** How far toward the "markers" profile the last seeded session drifts (0..1). */
const MAX_DRIFT = 0.45

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/** Deterministic pseudo-random value in [-1, 1]. */
function jitter(i: number): number {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return (x - Math.floor(x)) * 2 - 1
}

export function generateSeedSessions(now: Date): Session[] {
  const cores: SessionCore[] = Array.from({ length: COUNT }, (_, i) => {
    const t = Math.min(1, Math.max(0, (i / (COUNT - 1)) * MAX_DRIFT + jitter(i) * 0.04))
    const task = TASK_ORDER[i % TASK_ORDER.length]
    const acoustics: AcousticMetrics = {
      durationSec: 60,
      speakingTimeSec: lerp(48, 38, t),
      pauseCount: Math.round(lerp(7, 14, t)),
      meanPauseSec: lerp(0.5, 1.25, t),
      longestPauseSec: lerp(1.0, 2.6, t),
      silenceRatio: lerp(0.2, 0.42, t),
      speechRate: lerp(4.3, 2.8, t),
      pitchVariationSemitones: lerp(3.2, 1.7, t),
      pauses: []
    }
    const summary = {
      wordCount: 110,
      fillerCount: Math.round(lerp(1, 9, t)),
      repetitionCount: Math.round(lerp(0, 3, t)),
      wordFindingEvents: Math.round(lerp(0, 3, t)),
      typeTokenRatio: lerp(0.68, 0.5, t)
    }
    const linguistic: LinguisticResult = { transcript: [], ...summary, notes: buildNotes(summary) }
    return {
      id: `seed-${i}`,
      createdAt: new Date(now.getTime() - (30 - i * 2.5) * DAY).toISOString(),
      task,
      taskTitle: TASKS[task].title,
      source: 'seed',
      acoustics,
      linguistic,
      score: scoreSession(acoustics, linguistic),
      waveform: []
    }
  })
  return cores.map((core) => ({ ...core, baseline: compareToBaseline(core, cores) }))
}
