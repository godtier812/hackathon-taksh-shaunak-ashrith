import { ImageResponse } from "next/og"

import { storyStages } from "@/lib/demo/margaret"
import { poolAmps } from "@/lib/waveform"

export const alt = "MindTrace: the earliest changes can be the hardest to notice."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const BARS = poolAmps(storyStages[0].wave.amps, 80)

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#F8F6F1",
          padding: "64px 72px",
          color: "#0F1115",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 12h2.2l1.9-4.6 2.3 9.4 2.4-12.2 2.3 11 1.9-5.4 1.6 1.8h1.6"
              stroke="#14213D"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="20.6" cy="12" r="2.1" fill="#14213D" />
          </svg>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#14213D", letterSpacing: -1 }}>MindTrace</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.04, letterSpacing: -2.5, maxWidth: 900 }}>
            The earliest changes can be the hardest to notice.
          </div>
          <div style={{ fontSize: 28, color: "#676E7B", lineHeight: 1.4, maxWidth: 860 }}>
            A longitudinal communication record that helps caregivers notice gradual change.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", height: 110, gap: 8 }}>
          {BARS.map((amp, i) => (
            <div
              key={i}
              style={{
                width: 5,
                height: Math.max(3, Math.round(amp * 104)),
                borderRadius: 3,
                background: amp < 0.02 ? "#D1D5DB" : "#14213D",
              }}
            />
          ))}
        </div>
      </div>
    ),
    size
  )
}
