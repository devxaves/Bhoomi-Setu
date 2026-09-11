import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { AuthProvider } from "@/components/AuthProvider"
import { LanguageProvider } from "@/components/LanguageProvider"
import NavBar from "@/components/NavBar"
import BhoomiChatbot from "@/components/BhoomiChatbot"
import { Suspense } from "react"

export const metadata: Metadata = {
  title: "BhoomiSetu — National Land Acquisition Control & Compliance Portal",
  description:
    "Integrated GIS-native platform for RFCTLARR Act 2013 statutory compliance, 14-digit ULPIN parcel mapping, statutory deadline monitoring, and transparent land acquisition management across India. Department of Land Resources (DoLR), Ministry of Rural Development, Government of India.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/favicon.svg",
    apple: "/icon.svg",
  },
  keywords: [
    "land acquisition",
    "RFCTLARR Act 2013",
    "ULPIN",
    "BhoomiSetu",
    "GIS Cadastral Map",
    "Land Records",
    "DoLR",
    "Ministry of Rural Development",
    "PM GatiShakti",
    "Digital India",
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
      >
        <LanguageProvider>
          <AuthProvider>
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-screen">
                  <div className="animate-pulse text-lg text-muted-foreground">Loading BhoomiSetu Portal...</div>
                </div>
              }
            >
              <NavBar />
              <main className="min-h-[calc(100vh-56px)] bg-gray-50/80">{children}</main>
              <BhoomiChatbot />

              <footer className="border-t border-slate-200 bg-white py-4 text-center">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-800">भूमि सेतु</span>
                    <span className="text-slate-300">·</span>
                    <span>National Land Acquisition & Compliance Portal</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <span>Dept. of Land Resources</span>
                    <span className="text-slate-300">·</span>
                    <span>Ministry of Rural Development</span>
                    <span className="text-slate-300">·</span>
                    <span className="font-semibold text-slate-500">Government of India</span>
                  </div>
                </div>
              </footer>
            </Suspense>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
