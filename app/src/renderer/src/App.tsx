import { useState, type JSX } from 'react'
import { SettingsBar } from './components/SettingsBar'
import { useRemoteAnalysis } from './hooks/useRemoteAnalysis'
import { useSessions } from './hooks/useSessions'
import { useSettings } from './hooks/useSettings'
import { runAnalysis, type AnalysisOutput } from './lib/pipeline'
import { stopSpeaking } from './lib/speech'
import type { SessionSource, TaskId } from './lib/types'
import { ANALYZING_MS, AnalyzingScreen } from './screens/AnalyzingScreen'
import { HistoryScreen } from './screens/HistoryScreen'
import { HomeScreen } from './screens/HomeScreen'
import { RecordScreen } from './screens/RecordScreen'
import { ReportScreen } from './screens/ReportScreen'
import { ResultsScreen } from './screens/ResultsScreen'

type Screen =
  | { name: 'home' }
  | { name: 'record'; task: TaskId; error?: string }
  | { name: 'analyzing' }
  | { name: 'results'; view: AnalysisOutput }
  | { name: 'history' }
  | { name: 'report' }

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

export default function App(): JSX.Element {
  const { settings, toggle } = useSettings()
  const { sessions, loading, error, add } = useSessions()
  const [screen, setScreen] = useState<Screen>({ name: 'home' })
  useRemoteAnalysis(sessions, add)

  const go = (next: Screen): void => {
    stopSpeaking()
    setScreen(next)
  }

  const analyze = async (audio: Blob, task: TaskId, source: SessionSource): Promise<void> => {
    go({ name: 'analyzing' })
    try {
      const [view] = await Promise.all([
        runAnalysis({ audio, task, source }, sessions),
        delay(ANALYZING_MS)
      ])
      await add(view.session)
      setScreen({ name: 'results', view })
    } catch (e) {
      setScreen({
        name: 'record',
        task,
        error:
          e instanceof Error ? e.message : 'Something went wrong while analyzing. Please try again.'
      })
    }
  }

  const toHome = (): void => go({ name: 'home' })
  const toHistory = (): void => go({ name: 'history' })
  const toReport = (): void => go({ name: 'report' })

  const renderScreen = (): JSX.Element => {
    switch (screen.name) {
      case 'home':
        return (
          <HomeScreen
            sessions={sessions}
            onStart={(task) => go({ name: 'record', task })}
            onHistory={toHistory}
            onReport={toReport}
          />
        )
      case 'record':
        return (
          <RecordScreen
            key={`${screen.task}-${screen.error ?? ''}`}
            task={screen.task}
            error={screen.error}
            voiceGuide={settings.voiceGuide}
            onRecorded={(audio, source) => void analyze(audio, screen.task, source)}
            onBack={toHome}
          />
        )
      case 'analyzing':
        return <AnalyzingScreen />
      case 'results':
        return (
          <ResultsScreen
            view={screen.view}
            onHome={toHome}
            onHistory={toHistory}
            onReport={toReport}
          />
        )
      case 'history':
        return <HistoryScreen sessions={sessions} onBack={toHome} onReport={toReport} />
      case 'report':
        return <ReportScreen sessions={sessions} onBack={toHome} />
    }
  }

  return (
    <div className="app">
      <header className="app-header no-print">
        <button className="brand" onClick={toHome}>
          EchoMind
        </button>
        <SettingsBar settings={settings} onToggle={toggle} />
      </header>
      <main className="app-main">
        {error && <p className="error">{error}</p>}
        {loading ? <p className="muted">Loading…</p> : renderScreen()}
      </main>
    </div>
  )
}
