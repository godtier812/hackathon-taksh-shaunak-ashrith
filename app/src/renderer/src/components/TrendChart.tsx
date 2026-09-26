import type { JSX } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatDate } from '../lib/format'
import { GREEN_MIN, YELLOW_MIN } from '../lib/scoring'
import type { Session } from '../lib/types'

interface Props {
  sessions: Session[]
  animate?: boolean
  height?: number
}

export function TrendChart({ sessions, animate = true, height = 260 }: Props): JSX.Element {
  const data = sessions.map((s) => ({ date: formatDate(s.createdAt), score: s.score.score }))
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--muted)" />
          <YAxis domain={[0, 100]} stroke="var(--muted)" />
          <Tooltip />
          <ReferenceLine y={GREEN_MIN} stroke="var(--green)" strokeDasharray="4 4" />
          <ReferenceLine y={YELLOW_MIN} stroke="var(--red)" strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--accent)"
            strokeWidth={3}
            dot={{ r: 4 }}
            isAnimationActive={animate}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
