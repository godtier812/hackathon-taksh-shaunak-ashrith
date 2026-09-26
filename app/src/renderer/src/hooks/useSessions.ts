import { useCallback, useEffect, useState } from 'react'
import { generateSeedSessions } from '../lib/seed'
import type { Session } from '../lib/types'

let seeding: Promise<void> | null = null

async function ensureSeeded(): Promise<void> {
  const existing = await window.api.listSessions()
  if (existing.length > 0) return
  for (const session of generateSeedSessions(new Date())) await window.api.saveSession(session)
}

export function useSessions(): {
  sessions: Session[]
  loading: boolean
  error: string | null
  add: (session: Session) => Promise<void>
} {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setSessions(await window.api.listSessions())
  }, [])

  useEffect(() => {
    seeding ??= ensureSeeded()
    seeding
      .then(refresh)
      .catch(() => setError('Could not load saved check-ins.'))
      .finally(() => setLoading(false))
  }, [refresh])

  const add = useCallback(
    async (session: Session) => {
      await window.api.saveSession(session)
      await refresh()
    },
    [refresh]
  )

  return { sessions, loading, error, add }
}
