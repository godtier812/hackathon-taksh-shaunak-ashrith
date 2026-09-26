import { useEffect, useState } from 'react'

export interface Settings {
  largeText: boolean
  highContrast: boolean
  voiceGuide: boolean
}

const KEY = 'echomind-settings'
const DEFAULTS: Settings = { largeText: false, highContrast: false, voiceGuide: true }

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

export function useSettings(): { settings: Settings; toggle: (key: keyof Settings) => void } {
  const [settings, setSettings] = useState<Settings>(load)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('large-text', settings.largeText)
    root.classList.toggle('high-contrast', settings.highContrast)
    try {
      localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
      // Storage unavailable: settings still apply for this session.
    }
  }, [settings])

  const toggle = (key: keyof Settings): void => setSettings((s) => ({ ...s, [key]: !s[key] }))
  return { settings, toggle }
}
