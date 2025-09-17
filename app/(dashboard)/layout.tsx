import type React from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="w-full">
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {children}
      </div>
    </div>
  )
}
