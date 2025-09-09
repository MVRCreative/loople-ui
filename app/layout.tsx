import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { ConditionalSidebar } from "@/components/conditional-sidebar"
import { AuthProvider } from "@/lib/auth-context"
import { ClubProvider } from "@/lib/club-context"
import { Suspense } from "react"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

export const metadata: Metadata = {
  title: "Loople",
  description: "Community management platform",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <Suspense fallback={null}>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              <ClubProvider>
                <ConditionalSidebar>
                  {children}
                </ConditionalSidebar>
              </ClubProvider>
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
        <Analytics />
        <Toaster richColors closeButton />
      </body>
    </html>
  )
}
