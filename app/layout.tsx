import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
// Removed Vercel Analytics - not needed for cPanel deployment
// import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { RealTimeProvider } from "@/components/providers/real-time-provider"
import "./globals.css"

export const metadata: Metadata = {
  title: "CCLPI Plans Dashboard",
  description: "Sales Performance Dashboard for CCLPI Plans",
  generator: "CCLPI Plans",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <RealTimeProvider>
          <Suspense fallback={null}>{children}</Suspense>
        </RealTimeProvider>
        {/* Removed Analytics component - not deploying to Vercel */}
      </body>
    </html>
  )
}
