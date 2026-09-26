import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'http'
import {
  API_PORT,
  API_VERSION,
  REMOTE_SOURCES,
  TASK_IDS,
  isRemoteSource,
  isTaskId,
  type ApiError,
  type HealthResponse
} from '../shared/api'
import type { Session, SessionSource, TaskId } from '../shared/types'

export const MAX_AUDIO_BYTES = 20 * 1024 * 1024
export const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
]

export interface ApiDeps {
  listSessions: () => Promise<Session[]>
  analyze: (
    audio: Buffer,
    mimeType: string,
    task: TaskId,
    source: SessionSource
  ) => Promise<Session>
  allowedOrigins: string[]
  maxAudioBytes?: number
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message)
  }
}

/** Comma-separated MINDTRACE_ALLOWED_ORIGINS overrides the defaults; "*" allows any origin. */
export function allowedOriginsFromEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = env.MINDTRACE_ALLOWED_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean)
  return configured?.length ? configured : DEFAULT_ALLOWED_ORIGINS
}

export function corsHeaders(origin: string | undefined, allowed: string[]): Record<string, string> {
  if (!origin || !(allowed.includes('*') || allowed.includes(origin))) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    // Lets pages served from a public origin call this localhost API in Chromium.
    'Access-Control-Allow-Private-Network': 'true',
    Vary: 'Origin'
  }
}

/** Read the whole body; if it exceeds the limit keep draining (so the 413 reaches the client) and reject. */
function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size <= limit) chunks.push(chunk)
    })
    req.on('end', () => {
      if (size > limit) reject(new HttpError(413, `Audio exceeds the ${limit}-byte limit`))
      else resolve(Buffer.concat(chunks))
    })
    req.on('error', reject)
  })
}

export function createApiHandler(
  deps: ApiDeps
): (req: IncomingMessage, res: ServerResponse) => Promise<void> {
  return async (req, res) => {
    const cors = corsHeaders(req.headers.origin, deps.allowedOrigins)
    const send = (status: number, body?: unknown): void => {
      res.writeHead(
        status,
        body === undefined ? cors : { ...cors, 'Content-Type': 'application/json' }
      )
      res.end(body === undefined ? undefined : JSON.stringify(body))
    }

    try {
      if (req.method === 'OPTIONS') return send(204)
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      const path = url.pathname.replace(/\/+$/, '')

      if (req.method === 'GET' && path === '/api/health') {
        return send(200, {
          ok: true,
          app: 'MindTrace',
          version: API_VERSION
        } satisfies HealthResponse)
      }
      if (req.method === 'GET' && path === '/api/sessions')
        return send(200, await deps.listSessions())
      if (req.method === 'GET' && path.startsWith('/api/sessions/')) {
        const id = decodeURIComponent(path.slice('/api/sessions/'.length))
        const sessions = await deps.listSessions()
        const session =
          id === 'latest' ? sessions[sessions.length - 1] : sessions.find((s) => s.id === id)
        if (!session) throw new HttpError(404, 'Session not found')
        return send(200, session)
      }
      if (req.method === 'POST' && path === '/api/analyze') {
        const task = url.searchParams.get('task')
        const source = url.searchParams.get('source') ?? 'live'
        if (!isTaskId(task)) throw new HttpError(400, `task must be one of: ${TASK_IDS.join(', ')}`)
        if (!isRemoteSource(source))
          throw new HttpError(400, `source must be one of: ${REMOTE_SOURCES.join(', ')}`)
        const audio = await readBody(req, deps.maxAudioBytes ?? MAX_AUDIO_BYTES)
        if (audio.length === 0) throw new HttpError(400, 'Request body must contain audio')
        let session: Session
        try {
          session = await deps.analyze(
            audio,
            req.headers['content-type'] ?? 'audio/webm',
            task,
            source
          )
        } catch (e) {
          throw new HttpError(422, e instanceof Error ? e.message : 'Analysis failed')
        }
        return send(201, session)
      }
      throw new HttpError(404, 'Not found')
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500
      send(status, { error: e instanceof Error ? e.message : 'Internal error' } satisfies ApiError)
    }
  }
}

/** Listen on 127.0.0.1 only; the API is never exposed to the network. */
export function startApiServer(deps: ApiDeps, port: number = API_PORT): Server {
  const handler = createApiHandler(deps)
  const server = createServer((req, res) => void handler(req, res))
  server.on('error', (e) => console.error('MindTrace API server error:', e))
  server.listen(port, '127.0.0.1', () => {
    const address = server.address()
    const actualPort = typeof address === 'object' && address ? address.port : port
    console.log(`MindTrace API listening on http://127.0.0.1:${actualPort}/api`)
  })
  return server
}
