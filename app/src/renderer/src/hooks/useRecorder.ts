import { useCallback, useEffect, useRef, useState } from 'react'

export const MAX_RECORD_SEC = 60

interface LiveRecording {
  recorder: MediaRecorder
  stream: MediaStream
  ctx: AudioContext
  timer: number
}

export function useRecorder(onComplete: (audio: Blob) => void): {
  recording: boolean
  elapsed: number
  error: string | null
  analyser: AnalyserNode | null
  start: () => Promise<void>
  stop: () => void
} {
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const live = useRef<LiveRecording | null>(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  const release = useCallback(() => {
    const current = live.current
    if (!current) return
    window.clearInterval(current.timer)
    current.stream.getTracks().forEach((track) => track.stop())
    void current.ctx.close()
    live.current = null
    setAnalyser(null)
  }, [])

  const start = useCallback(async () => {
    if (live.current) return
    setError(null)
    setElapsed(0)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setError(
        'We could not access a microphone. Check that one is connected and allowed, or use a demo sample below.'
      )
      return
    }
    const ctx = new AudioContext()
    const node = ctx.createAnalyser()
    node.fftSize = 2048
    ctx.createMediaStreamSource(stream).connect(node)

    const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }
    recorder.onstop = () => {
      release()
      setRecording(false)
      onCompleteRef.current(new Blob(chunks, { type: 'audio/webm' }))
    }

    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      const sec = (Date.now() - startedAt) / 1000
      setElapsed(Math.min(sec, MAX_RECORD_SEC))
      if (sec >= MAX_RECORD_SEC && recorder.state === 'recording') recorder.stop()
    }, 200)

    live.current = { recorder, stream, ctx, timer }
    recorder.start()
    setAnalyser(node)
    setRecording(true)
  }, [release])

  const stop = useCallback(() => {
    const recorder = live.current?.recorder
    if (recorder && recorder.state === 'recording') recorder.stop()
  }, [])

  useEffect(
    () => () => {
      // Leaving the screen mid-recording: discard without analyzing.
      const current = live.current
      if (!current) return
      current.recorder.onstop = null
      if (current.recorder.state === 'recording') current.recorder.stop()
      release()
    },
    [release]
  )

  return { recording, elapsed, error, analyser, start, stop }
}
