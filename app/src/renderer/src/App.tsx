import type { JSX } from 'react'
import { SettingsBar } from './components/SettingsBar'
import { useSessions } from './hooks/useSessions'
import { useSettings } from './hooks/useSettings'
import { HomeScreen } from './screens/HomeScreen'

export default function App(): JSX.Element {
  const { settings, toggle } = useSettings()
  const { sessions, loading, error } = useSessions()

  return (
    <div className="app">
      <header className="app-header no-print">
        <span className="brand">EchoMind</span>
        <SettingsBar settings={settings} onToggle={toggle} />
      </header>
      <main className="app-main">
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <HomeScreen
            sessions={sessions}
            onStart={() => undefined}
            onHistory={() => undefined}
            onReport={() => undefined}
          />
        )}
      </main>
    </div>
  )
}
