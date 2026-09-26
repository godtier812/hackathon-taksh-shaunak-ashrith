import { useEffect, useRef } from 'react'
import { runAnalysis } from '../lib/pipeline'
import type { Session } from '../lib/types'

/** Handles recordings the website POSTs to the local API: analyze, save, and send the session back. */
export function useRemoteAnalysis(
  sessions: Session[],
  add: (session: Session) => Promise<void>
): void {
  const sessionsRef = useRef(sessions)

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  useEffect(
    () =>
      window.api.onRemoteAnalyzeRequest(async (request) => {
        try {
          const audio = new Blob([request.audio.slice()], { type: request.mimeType })
          const { session, audioUrl } = await runAnalysis(
            { audio, task: request.task, source: request.source },
            sessionsRef.current
          )
          URL.revokeObjectURL(audioUrl)
          await add(session)
          window.api.sendRemoteAnalyzeResult({ requestId: request.requestId, session })
        } catch (e) {
          window.api.sendRemoteAnalyzeResult({
            requestId: request.requestId,
            error: e instanceof Error ? e.message : 'Analysis failed'
          })
        }
      }),
    [add]
  )
}
