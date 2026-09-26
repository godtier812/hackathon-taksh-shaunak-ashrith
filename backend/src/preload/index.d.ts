import type { RemoteAnalyzeRequest, RemoteAnalyzeResult } from '../shared/bridge'
import type { Session } from '../shared/types'

declare global {
  interface Window {
    api: {
      listSessions: () => Promise<Session[]>
      saveSession: (session: Session) => Promise<void>
      exportReportPdf: () => Promise<{ saved: boolean; filePath?: string }>
      /** Returns an unsubscribe function. */
      onRemoteAnalyzeRequest: (handler: (request: RemoteAnalyzeRequest) => void) => () => void
      sendRemoteAnalyzeResult: (result: RemoteAnalyzeResult) => void
    }
  }
}

export {}
