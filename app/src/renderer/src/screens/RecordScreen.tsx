import { useEffect, useState, type JSX } from 'react'
import { LiveWaveform } from '../components/LiveWaveform'
import { MAX_RECORD_SEC, useRecorder } from '../hooks/useRecorder'
import { formatDuration } from '../lib/format'
import { loadSample } from '../lib/pipeline'
import { TASKS, type ScriptVariant } from '../lib/scripts'
import { speak, stopSpeaking } from '../lib/speech'
import type { SessionSource, TaskId } from '../lib/types'

interface Props {
  task: TaskId
  error?: string
  voiceGuide: boolean
  onRecorded: (audio: Blob, source: SessionSource) => void
  onBack: () => void
}

export function RecordScreen({ task, error, voiceGuide, onRecorded, onBack }: Props): JSX.Element {
  const def = TASKS[task]
  const [message, setMessage] = useState<string | null>(error ?? null)
  const recorder = useRecorder((audio) => onRecorded(audio, 'live'))

  useEffect(() => {
    if (voiceGuide) speak(def.instructions)
    return () => stopSpeaking()
  }, [def, voiceGuide])

  const startRecording = (): void => {
    stopSpeaking()
    setMessage(null)
    void recorder.start()
  }

  const analyzeSample = async (variant: ScriptVariant): Promise<void> => {
    setMessage(null)
    try {
      onRecorded(await loadSample(task, variant), variant === 'healthy' ? 'sample-healthy' : 'sample-markers')
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e))
    }
  }

  const shownError = message ?? recorder.error

  return (
    <div className="stack">
      <button className="link" onClick={onBack}>
        ← Back
      </button>
      <section className="card">
        <h1>
          {def.icon} {def.title}
        </h1>
        <p className="lead">{def.instructions}</p>
        {def.passage && <blockquote className="passage">{def.passage}</blockquote>}
        <button className="btn ghost" onClick={() => speak(def.instructions)}>
          🔊 Repeat instructions
        </button>
      </section>
      <section className="card center">
        <LiveWaveform analyser={recorder.analyser} />
        <p className="timer">
          {formatDuration(recorder.elapsed)} / {formatDuration(MAX_RECORD_SEC)}
        </p>
        {recorder.recording ? (
          <button className="btn record recording" onClick={recorder.stop}>
            ■ Stop
          </button>
        ) : (
          <button className="btn record" onClick={startRecording}>
            ● Start recording
          </button>
        )}
        {shownError && (
          <p className="error" role="alert">
            {shownError}
          </p>
        )}
      </section>
      <section className="card">
        <h3>Demo samples</h3>
        <p className="muted">No microphone handy? Analyze a bundled recording instead.</p>
        <div className="row">
          <button
            className="btn secondary"
            disabled={recorder.recording}
            onClick={() => void analyzeSample('healthy')}
          >
            Typical speech sample
          </button>
          <button
            className="btn secondary"
            disabled={recorder.recording}
            onClick={() => void analyzeSample('markers')}
          >
            Sample with memory-related markers
          </button>
        </div>
      </section>
    </div>
  )
}
