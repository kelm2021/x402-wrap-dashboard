import type { Metadata } from "next"
import Providers from "@/components/Providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "x402-wrap Dashboard",
  description: "Monetize any API with USDC payments."
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="bg-surface text-white antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
