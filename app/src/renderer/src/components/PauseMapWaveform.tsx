import { useEffect, useRef, type JSX } from 'react'
import type { Pause } from '../lib/types'

interface Props {
  waveform: number[]
  durationSec: number
  pauses: Pause[]
}

export function PauseMapWaveform({ waveform, durationSec, pauses }: Props): JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g || durationSec <= 0) return
    const { width, height } = canvas
    const css = getComputedStyle(document.documentElement)
    g.clearRect(0, 0, width, height)

    g.fillStyle = css.getPropertyValue('--pause').trim()
    for (const p of pauses) {
      const x0 = (p.startSec / durationSec) * width
      const x1 = (p.endSec / durationSec) * width
      g.fillRect(x0, 0, Math.max(2, x1 - x0), height)
    }

    const barWidth = width / Math.max(1, waveform.length)
    g.fillStyle = css.getPropertyValue('--accent').trim()
    waveform.forEach((v, i) => {
      const h = Math.max(2, v * (height - 10))
      g.fillRect(i * barWidth, (height - h) / 2, Math.max(1, barWidth - 1), h)
    })
  }, [waveform, durationSec, pauses])

  return (
    <figure className="pause-map">
      <canvas ref={ref} width={960} height={160} />
      <figcaption>
        <span className="swatch pause-swatch" />
        Pauses longer than 0.25 s ({pauses.length} found)
      </figcaption>
    </figure>
  )
}
