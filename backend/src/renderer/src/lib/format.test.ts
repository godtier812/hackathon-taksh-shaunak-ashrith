import { describe, it, expect } from 'vitest'
import { formatDuration, pct, sourceLabel } from './format'

describe('format', () => {
  it('formats seconds as m:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65.7)).toBe('1:05')
  })

  it('formats a ratio as a whole percent', () => {
    expect(pct(0.253)).toBe('25%')
  })

  it('labels session sources for display', () => {
    expect(sourceLabel('sample-markers')).toBe('Demo sample (markers)')
  })
})
