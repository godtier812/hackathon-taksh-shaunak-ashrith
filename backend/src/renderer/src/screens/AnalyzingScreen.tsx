import { useEffect, useState, type JSX } from 'react'

const STEPS = [
  'Loading your recording',
  'Detecting pauses',
  'Measuring speech rate',
  'Tracking pitch changes',
  'Reviewing word patterns',
  'Comparing with your baseline'
]

/** Minimum time the analyzing screen stays up, so each step is readable during the demo. */
export const ANALYZING_MS = 2400

export function AnalyzingScreen(): JSX.Element {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = window.setInterval(
      () => setStep((s) => Math.min(s + 1, STEPS.length - 1)),
      ANALYZING_MS / STEPS.length
    )
    return () => window.clearInterval(id)
  }, [])

  return (
    <section className="card center">
      <div className="spinner" />
      <h2>Analyzing your speech…</h2>
      <ol className="steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'done' : i === step ? 'active' : ''}>
            {i < step ? '✓ ' : ''}
            {label}
          </li>
        ))}
      </ol>
    </section>
  )
}
