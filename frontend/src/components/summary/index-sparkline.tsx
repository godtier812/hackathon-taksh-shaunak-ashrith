import { BASELINE_BAND, BASELINE_INDEX, sessions } from "@/lib/demo/margaret"
import { formatMonth } from "@/lib/format"

const W = 640
const H = 150
const PAD_X = 34
const PAD_TOP = 10
const PAD_BOTTOM = 24
const Y_MIN = 86
const Y_MAX = 104

/** Static, print-friendly version of the composite index chart. */
export function IndexSparkline() {
  const first = sessions[0].t
  const last = sessions[sessions.length - 1].t
  const x = (t: number) => PAD_X + ((t - first) / (last - first)) * (W - PAD_X - 8)
  const y = (v: number) => PAD_TOP + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD_TOP - PAD_BOTTOM)
  const line = sessions.map((s, i) => `${i ? "L" : "M"}${x(s.t).toFixed(1)} ${y(s.index).toFixed(1)}`).join("")
  const latest = sessions[sessions.length - 1]
  const months = [5, 6, 7, 8].map((m) => Date.UTC(2026, m, 15))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full"
      role="img"
      aria-label="Composite index from June to September 2026, drifting gradually from about 100 to about 91."
    >
      <rect
        x={PAD_X}
        y={y(BASELINE_BAND[1])}
        width={W - PAD_X - 8}
        height={y(BASELINE_BAND[0]) - y(BASELINE_BAND[1])}
        fill="var(--surface-muted)"
      />
      <line
        x1={PAD_X}
        x2={W - 8}
        y1={y(BASELINE_INDEX)}
        y2={y(BASELINE_INDEX)}
        stroke="var(--line-strong)"
        strokeDasharray="3 4"
      />
      {[90, 95, 100].map((v) => (
        <text key={v} x={PAD_X - 8} y={y(v) + 3.5} textAnchor="end" className="fill-ink-tertiary font-mono text-[10px]">
          {v}
        </text>
      ))}
      {months.map((t) => (
        <text key={t} x={x(t)} y={H - 6} textAnchor="middle" className="fill-ink-tertiary font-mono text-[10px]">
          {formatMonth(t)}
        </text>
      ))}
      <path d={line} fill="none" stroke="var(--brand)" strokeWidth={1.75} strokeLinejoin="round" />
      <circle cx={x(latest.t)} cy={y(latest.index)} r={3.5} fill="var(--brand)" />
    </svg>
  )
}
