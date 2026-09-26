import type { JSX } from 'react'
import type { Settings } from '../hooks/useSettings'

const ITEMS: { key: keyof Settings; label: string }[] = [
  { key: 'largeText', label: 'Large text' },
  { key: 'highContrast', label: 'High contrast' },
  { key: 'voiceGuide', label: 'Read instructions aloud' }
]

interface Props {
  settings: Settings
  onToggle: (key: keyof Settings) => void
}

export function SettingsBar({ settings, onToggle }: Props): JSX.Element {
  return (
    <div className="settings-bar">
      {ITEMS.map((item) => (
        <label key={item.key} className="toggle">
          <input type="checkbox" checked={settings[item.key]} onChange={() => onToggle(item.key)} />
          {item.label}
        </label>
      ))}
    </div>
  )
}
