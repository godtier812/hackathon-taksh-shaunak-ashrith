import { useEffect, useState, type JSX } from 'react'
import { waitForShareAnimation } from '../lib/sync'

export function SyncBadge(): JSX.Element {
  const [shared, setShared] = useState(false)

  useEffect(() => {
    let alive = true
    void waitForShareAnimation().then(() => {
      if (alive) setShared(true)
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <span className={`sync-badge ${shared ? 'synced' : ''}`}>
      {shared ? '✓ Available on the caregiver website' : '⟳ Sharing with the caregiver website…'}
    </span>
  )
}
