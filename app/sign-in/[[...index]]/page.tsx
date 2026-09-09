"use client"

import { SignIn } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <SignIn routing="hash" />
    </div>
  )
}
