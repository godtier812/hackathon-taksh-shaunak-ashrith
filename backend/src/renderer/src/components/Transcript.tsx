import type { JSX } from 'react'
import type { TokenKind, TranscriptToken } from '../lib/types'

const KIND_TITLE: Record<TokenKind, string | undefined> = {
  word: undefined,
  filler: 'Filler word',
  repetition: 'Repeated word',
  wordfinding: 'Searching for a word',
  pause: 'Long pause'
}

export function Transcript({ tokens }: { tokens: TranscriptToken[] }): JSX.Element {
  return (
    <div>
      <p className="transcript">
        {tokens.map((t, i) => (
          <span key={i} className={`tok tok-${t.kind}`} title={KIND_TITLE[t.kind]}>
            {t.text}
          </span>
        ))}
      </p>
      <div className="legend small">
        <span className="tok tok-filler">um</span> filler
        <span className="tok tok-repetition">the</span> repeated
        <span className="tok tok-wordfinding">thing</span> word-finding
        <span className="tok tok-pause">…</span> long pause
      </div>
    </div>
  )
}
