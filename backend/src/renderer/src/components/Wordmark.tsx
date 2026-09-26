import type { JSX } from 'react'

/** The website's mark: a short speech trace that settles into a point. */
export function Wordmark(): JSX.Element {
  return (
    <>
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M2 12h2.2l1.9-4.6 2.3 9.4 2.4-12.2 2.3 11 1.9-5.4 1.6 1.8h1.6"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="20.6" cy="12" r="2.1" fill="currentColor" />
      </svg>
      MindTrace
    </>
  )
}
