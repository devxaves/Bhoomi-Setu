import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { AuthProvider } from "@/components/AuthProvider"
import NavBar from "@/components/NavBar"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "BhoomiSetu — National Land Acquisition Control & Compliance Platform",
  description:
    "Real-time RFCTLARR Act compliance tracking, GIS-based parcel mapping, statutory deadline monitoring, and risk-scored decision support for India's land acquisition lifecycle. SIH 2025 Problem Statement 26016.",
  keywords: [
    "land acquisition",
    "RFCTLARR",
    "ULPIN",
    "BhoomiSetu",
    "Smart India Hackathon",
    "GIS",
    "land records",
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
      >
        <AuthProvider>
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-lg text-muted-foreground">Loading BhoomiSetu...</div>
              </div>
            }
          >
            <NavBar />
            <main className="min-h-[calc(100vh-56px)] bg-gray-50/80">{children}</main>

            <footer className="border-t bg-white py-4 text-center text-xs text-muted-foreground">
              <div className="mx-auto max-w-7xl px-4">
                BhoomiSetu — National Land Acquisition Control & Compliance Platform
                <span className="mx-2">·</span>
                SIH 2025 · PS 26016
                <span className="mx-2">·</span>
                Dept. of Land Resources, Ministry of Rural Development
              </div>
            </footer>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  )
}
