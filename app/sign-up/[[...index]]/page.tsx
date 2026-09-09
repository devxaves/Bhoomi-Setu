"use client"

import { SignUp } from "@clerk/nextjs"

export default function Page() {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center">
      <SignUp routing="hash" />
    </div>
  )
}
