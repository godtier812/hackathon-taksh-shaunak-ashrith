import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import { corsHeaders, startApiServer, type ApiDeps } from './apiServer'
import { createEchoMindClient, type EchoMindClient } from '../shared/apiClient'
import type { Session, TaskId } from '../shared/types'

const s1 = { id: 's1', createdAt: '2026-09-01T00:00:00.000Z' } as unknown as Session
const s2 = { id: 's2', createdAt: '2026-09-02T00:00:00.000Z' } as unknown as Session

let server: Server
let deps: ApiDeps
let base: string
let client: EchoMindClient

beforeEach(async () => {
  deps = {
    listSessions: vi.fn(async () => [s1, s2]),
    analyze: vi.fn(async () => s2),
    allowedOrigins: ['http://localhost:3000'],
    maxAudioBytes: 16
  }
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  server = startApiServer(deps, 0)
  await new Promise<void>((resolve) => server.once('listening', () => resolve()))
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`
  client = createEchoMindClient(base)
})

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
  vi.restoreAllMocks()
})

const audio = (bytes: number[]): Blob => new Blob([new Uint8Array(bytes)], { type: 'audio/webm' })

describe('EchoMind API', () => {
  it('reports health', async () => {
    expect(await client.health()).toEqual({ ok: true, app: 'EchoMind', version: 1 })
  })

  it('lists sessions and returns latest or by id', async () => {
    expect(await client.listSessions()).toEqual([s1, s2])
    expect(await client.latestSession()).toEqual(s2)
    expect(await client.getSession('s1')).toEqual(s1)
  })

  it('returns 404 for an unknown session', async () => {
    await expect(client.getSession('nope')).rejects.toThrow('Session not found')
  })

  it('passes posted audio to the analyzer and returns the new session', async () => {
    expect(await client.analyze(audio([1, 2, 3]), 'reading')).toEqual(s2)
    expect(deps.analyze).toHaveBeenCalledWith(Buffer.from([1, 2, 3]), 'audio/webm', 'reading', 'live')
  })

  it('rejects an unknown task', async () => {
    await expect(client.analyze(audio([1]), 'dancing' as TaskId)).rejects.toThrow(/task must be one of/)
  })

  it('rejects an empty body', async () => {
    await expect(client.analyze(audio([]), 'reading')).rejects.toThrow('Request body must contain audio')
  })

  it('rejects audio over the size limit', async () => {
    await expect(client.analyze(audio(new Array(32).fill(1)), 'reading')).rejects.toThrow(/limit/)
  })

  it('surfaces analysis failures as errors', async () => {
    deps.analyze = vi.fn(async () => {
      throw new Error("We couldn't hear enough speech.")
    })
    await expect(client.analyze(audio([1, 2]), 'story')).rejects.toThrow("We couldn't hear enough speech.")
  })

  it('returns 404 for unknown routes', async () => {
    expect((await fetch(`${base}/nope`)).status).toBe(404)
  })
})

describe('corsHeaders', () => {
  it('allows listed origins, including private-network preflight', () => {
    expect(corsHeaders('http://localhost:3000', ['http://localhost:3000'])).toMatchObject({
      'Access-Control-Allow-Origin': 'http://localhost:3000',
      'Access-Control-Allow-Private-Network': 'true'
    })
  })

  it('omits CORS headers for other origins', () => {
    expect(corsHeaders('https://evil.example', ['http://localhost:3000'])).toEqual({})
  })

  it('allows any origin with *', () => {
    expect(corsHeaders('https://site.example', ['*'])['Access-Control-Allow-Origin']).toBe('https://site.example')
  })
})
