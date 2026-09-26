import { describe, it, expect } from 'vitest'
import { generateSeedSessions } from './seed'

const now = new Date(Date.UTC(2026, 8, 26, 12))
const DAY = 86_400_000

describe('generateSeedSessions', () => {
  const sessions = generateSeedSessions(now)

  it('creates 12 uniquely identified sessions in date order within the last 31 days', () => {
    expect(sessions).toHaveLength(12)
    expect(new Set(sessions.map((s) => s.id)).size).toBe(12)
    const times = sessions.map((s) => Date.parse(s.createdAt))
    expect([...times].sort((a, b) => a - b)).toEqual(times)
    expect(times.every((t) => t < now.getTime() && t > now.getTime() - 31 * DAY)).toBe(true)
  })

  it('includes at least 3 sessions per task so every task has a baseline', () => {
    for (const task of ['reading', 'fluency', 'story']) {
      expect(sessions.filter((s) => s.task === task).length).toBeGreaterThanOrEqual(3)
    }
  })

  it('attaches baselines: early sessions are building, the last one is ready', () => {
    expect(sessions[0].baseline.status).toBe('building')
    expect(sessions[11].baseline.status).toBe('ready')
  })

  it('shows a gentle decline', () => {
    expect(sessions[0].score.score).toBeGreaterThan(sessions[11].score.score)
  })

  it('is deterministic', () => {
    expect(generateSeedSessions(now)).toEqual(sessions)
  })
})
