import { ImageResponse } from "next/og"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14213D",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 12h2.2l1.9-4.6 2.3 9.4 2.4-12.2 2.3 11 1.9-5.4 1.6 1.8h1.6"
            stroke="#FFFFFF"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20.6" cy="12" r="2" fill="#FFFFFF" />
        </svg>
      </div>
    ),
    size
  )
}
