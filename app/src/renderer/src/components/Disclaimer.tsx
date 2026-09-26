import type { JSX } from 'react'

export function Disclaimer(): JSX.Element {
  return (
    <p className="disclaimer small">
      EchoMind is a screening aid, not a diagnosis. Speech changes can have many causes, like tiredness, a cold, or
      stress. If you notice ongoing changes, talk to a doctor.
    </p>
  )
}
