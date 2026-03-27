import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
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
    <ClerkProvider>
      <html lang="en">
        <body className="bg-surface text-white antialiased">{children}</body>
      </html>
    </ClerkProvider>
  )
}
