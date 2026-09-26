import { app } from 'electron'
import { promises as fs } from 'fs'
import { join } from 'path'
import type { Session } from '../shared/types'

export function sessionsFile(): string {
  return join(app.getPath('userData'), 'sessions.json')
}

export async function listSessions(): Promise<Session[]> {
  try {
    return JSON.parse(await fs.readFile(sessionsFile(), 'utf8')) as Session[]
  } catch {
    return []
  }
}

export async function saveSession(session: Session): Promise<void> {
  const all = await listSessions()
  const next = [...all.filter((s) => s.id !== session.id), session].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  )
  await fs.writeFile(sessionsFile(), JSON.stringify(next, null, 2))
}
