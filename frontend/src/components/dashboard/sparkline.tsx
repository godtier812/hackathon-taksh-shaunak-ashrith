import type { MetricTone } from "@/lib/dashboard/types"

const WIDTH = 120
const HEIGHT = 32
const PAD = 3
/** Minimum visible range around baseline, so noise never reads as a trend. */
const MIN_SPAN = 0.06

/** Catmull-Rom → cubic Bézier for a gently smoothed line through every point. */
function smoothPath(points: [number, number][]) {
  let d = `M${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`
  }
  return d
}

export function Sparkline({
  values,
  baseline,
  tone,
}: {
  values: number[]
  baseline: number
  tone: MetricTone
}) {
  const lo = Math.min(...values, baseline * (1 - MIN_SPAN))
  const hi = Math.max(...values, baseline * (1 + MIN_SPAN))
  const y = (v: number) => PAD + (1 - (v - lo) / (hi - lo)) * (HEIGHT - PAD * 2)
  const points = values.map((v, i): [number, number] => [(i / (values.length - 1)) * WIDTH, y(v)])

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className="block h-8 w-full overflow-visible"
    >
      <line
        x1={0}
        x2={WIDTH}
        y1={y(baseline)}
        y2={y(baseline)}
        stroke="var(--line-strong)"
        strokeDasharray="2 3"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={smoothPath(points)}
        fill="none"
        stroke={tone === "signal" ? "var(--signal)" : "var(--neutral-trend)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
