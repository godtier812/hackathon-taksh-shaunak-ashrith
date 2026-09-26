import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { AppProviders } from "@/components/providers/app-providers"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "MindTrace: Communication, over time",
  description:
    "MindTrace turns everyday conversations into a longitudinal communication record, helping caregivers notice gradual changes worth discussing with a healthcare professional. It does not diagnose any condition.",
}

export const viewport: Viewport = {
  themeColor: "#f8f6f1",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="min-h-svh">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
