import { useEffect, useRef, type JSX } from 'react'

export function LiveWaveform({ analyser }: { analyser: AnalyserNode | null }): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const g = canvas?.getContext('2d')
    if (!canvas || !g) return
    const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    const data = new Uint8Array(2048)
    let frame = 0

    const draw = (): void => {
      g.clearRect(0, 0, canvas.width, canvas.height)
      g.strokeStyle = color
      g.lineWidth = 3
      g.beginPath()
      if (analyser) {
        analyser.getByteTimeDomainData(data)
        for (let i = 0; i < data.length; i++) {
          const x = (i / (data.length - 1)) * canvas.width
          const y = (data[i] / 255) * canvas.height
          if (i === 0) g.moveTo(x, y)
          else g.lineTo(x, y)
        }
      } else {
        g.moveTo(0, canvas.height / 2)
        g.lineTo(canvas.width, canvas.height / 2)
      }
      g.stroke()
      frame = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(frame)
  }, [analyser])

  return <canvas ref={canvasRef} className="live-wave" width={800} height={140} />
}
