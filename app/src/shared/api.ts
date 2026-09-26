import type { SessionSource, TaskId } from './types'

export const API_PORT = 4317
export const API_VERSION = 1
export const API_BASE = `http://127.0.0.1:${API_PORT}/api`

export const TASK_IDS: readonly TaskId[] = ['reading', 'fluency', 'story']
/** Sources a website may send. 'seed' is reserved for demo history. */
export const REMOTE_SOURCES: readonly SessionSource[] = ['live', 'sample-healthy', 'sample-markers']

export interface HealthResponse {
  ok: true
  app: 'EchoMind'
  version: number
}

export interface ApiError {
  error: string
}

export function isTaskId(value: unknown): value is TaskId {
  return typeof value === 'string' && (TASK_IDS as readonly string[]).includes(value)
}

export function isRemoteSource(value: unknown): value is SessionSource {
  return typeof value === 'string' && (REMOTE_SOURCES as readonly string[]).includes(value)
}
