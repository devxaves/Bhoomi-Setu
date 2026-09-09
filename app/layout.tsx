import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css"
import { ClerkProvider } from "@clerk/nextjs"
import Link from "next/link"
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
  const publishableKey =
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k";

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body
          className={`font-sans ${GeistSans.variable} ${GeistMono.variable} min-h-dvh bg-background text-foreground antialiased`}
        >
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse text-lg text-muted-foreground">Loading BhoomiSetu...</div>
              </div>
            }
          >
            <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md shadow-sm animate-fade-in">
              <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
                {/* Logo / Brand */}
                <Link
                  href="/landing"
                  className="font-bold text-xl tracking-tight hover:opacity-80 transition-opacity duration-200 flex items-center gap-2"
                >
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-green-600 text-white text-sm font-black">
                    भ
                  </span>
                  <span>
                    <span className="text-amber-600">Bhoomi</span>
                    <span className="text-green-700">Setu</span>
                  </span>
                </Link>

                {/* Navigation Links */}
                <div className="flex items-center gap-0.5">
                  <NavLink href="/dashboard">Dashboard</NavLink>
                  <NavLink href="/atlas">Atlas</NavLink>
                  <NavLink href="/upload">Upload</NavLink>
                  <NavLink href="/workflow">Workflow</NavLink>
                  <NavLink href="/risk">Risk</NavLink>
                  <NavLink href="/archive">Archive</NavLink>
                  <NavLink href="/citizen">Citizen</NavLink>
                  <NavLink href="/admin">Admin</NavLink>
                </div>
              </nav>
            </header>

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
        </body>
      </html>
    </ClerkProvider>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      className="text-sm font-medium text-gray-600 hover:text-amber-700 transition-colors duration-200 px-2.5 py-1.5 rounded-md hover:bg-amber-50"
      href={href}
    >
      {children}
    </Link>
  )
}
