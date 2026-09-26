import { analyzeAcoustics } from './acoustics'
import { compareToBaseline } from './baseline'
import { toWaveform } from './peaks'
import { ScriptedProvider, type AnalysisProvider } from './provider'
import { TASKS, type ScriptVariant } from './scripts'
import { scoreSession } from './scoring'
import type { Session, SessionCore, SessionSource, TaskId } from './types'

const MIN_SPEAKING_SEC = 3
const provider: AnalysisProvider = new ScriptedProvider()

export interface AnalysisInput {
  audio: Blob
  task: TaskId
  source: SessionSource
}

export interface AnalysisOutput {
  session: Session
  /** Object URL for in-app playback; revoke it when no longer shown. */
  audioUrl: string
}

async function decodeAudio(audio: Blob): Promise<{ samples: Float32Array; sampleRate: number }> {
  const ctx = new AudioContext()
  try {
    const buffer = await ctx.decodeAudioData(await audio.arrayBuffer())
    return { samples: buffer.getChannelData(0), sampleRate: buffer.sampleRate }
  } catch {
    throw new Error('We could not read that recording. Please try recording again.')
  } finally {
    void ctx.close()
  }
}

/** Used by both the in-app flow and website requests arriving through the local API. */
export async function runAnalysis(
  { audio, task, source }: AnalysisInput,
  history: Session[]
): Promise<AnalysisOutput> {
  const { samples, sampleRate } = await decodeAudio(audio)
  const acoustics = analyzeAcoustics(samples, sampleRate)
  if (acoustics.speakingTimeSec < MIN_SPEAKING_SEC) {
    throw new Error(
      "We couldn't hear enough speech. Try a quieter spot and sit a little closer to the microphone."
    )
  }
  const linguistic = await provider.analyze({ audio, task, source, acoustics })
  const core: SessionCore = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    task,
    taskTitle: TASKS[task].title,
    source,
    acoustics,
    linguistic,
    score: scoreSession(acoustics, linguistic),
    waveform: toWaveform(samples)
  }
  const session: Session = { ...core, baseline: compareToBaseline(core, history) }
  return { session, audioUrl: URL.createObjectURL(audio) }
}

/** Real voice recordings (.webm) take priority over the text-to-speech placeholders (.wav). */
const SAMPLE_EXTENSIONS = ['webm', 'wav']

export async function loadSample(task: TaskId, variant: ScriptVariant): Promise<Blob> {
  for (const ext of SAMPLE_EXTENSIONS) {
    const res = await fetch(`./samples/${task}-${variant}.${ext}`)
    // Vite's dev server answers missing files with index.html, so check the content type too.
    if (res.ok && !res.headers.get('content-type')?.includes('text/html')) return res.blob()
  }
  throw new Error(
    `Demo sample "${task}-${variant}" is missing. Record it and save it to src/renderer/public/samples.`
  )
}
