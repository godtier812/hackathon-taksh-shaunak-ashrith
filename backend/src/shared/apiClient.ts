import { API_BASE, type ApiError, type HealthResponse } from './api'
import type { Session, SessionSource, TaskId } from './types'

export interface MindTraceClient {
  health: () => Promise<HealthResponse>
  listSessions: () => Promise<Session[]>
  latestSession: () => Promise<Session>
  getSession: (id: string) => Promise<Session>
  analyze: (audio: Blob, task: TaskId, source?: SessionSource) => Promise<Session>
}

/** Typed client for the MindTrace desktop app's local API. Used by the website. */
export function createMindTraceClient(baseUrl: string = API_BASE): MindTraceClient {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, init)
    const body = (await res.json().catch(() => ({}))) as T | Partial<ApiError>
    if (!res.ok)
      throw new Error((body as Partial<ApiError>).error ?? `MindTrace API error ${res.status}`)
    return body as T
  }

  return {
    health: () => request<HealthResponse>('/health'),
    listSessions: () => request<Session[]>('/sessions'),
    latestSession: () => request<Session>('/sessions/latest'),
    getSession: (id) => request<Session>(`/sessions/${encodeURIComponent(id)}`),
    analyze: (audio, task, source = 'live') =>
      request<Session>(`/analyze?task=${task}&source=${source}`, {
        method: 'POST',
        headers: { 'Content-Type': audio.type || 'application/octet-stream' },
        body: audio
      })
  }
}
