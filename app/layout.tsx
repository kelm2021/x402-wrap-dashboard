import type { Metadata } from "next"
import dynamic from "next/dynamic"
import "./globals.css"

const Providers = dynamic(() => import("@/components/Providers"), { ssr: false })

export const metadata: Metadata = {
  title: "AurelianFlo Wrapped Dashboard",
  description: "Monetize any API with x402 and USDC using AurelianFlo Wrapped."
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-[#121210] text-white antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
