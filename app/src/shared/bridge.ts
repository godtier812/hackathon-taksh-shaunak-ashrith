import type { Session, SessionSource, TaskId } from './types'

/** Main -> renderer: please analyze this audio that arrived through the HTTP API. */
export interface RemoteAnalyzeRequest {
  requestId: string
  task: TaskId
  source: SessionSource
  mimeType: string
  audio: Uint8Array
}

/** Renderer -> main: the saved session, or an error message to return as HTTP 422. */
export interface RemoteAnalyzeResult {
  requestId: string
  session?: Session
  error?: string
}
