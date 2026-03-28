"use client"

import Link from "next/link"
import { useState } from "react"
import WalletAuth from "./WalletAuth"

export default function DashboardHeader() {
  const [authedAddress, setAuthedAddress] = useState<string | null>(null)

  return (
    <header className="border-b border-gray-900 bg-black/20 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-white">
            x402-wrap
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/dashboard" className="transition hover:text-white">
              Endpoints
            </Link>
            <Link href="/dashboard/register" className="transition hover:text-white">
              Register
            </Link>
          </nav>
        </div>
        <WalletAuth
          isAuthenticated={!!authedAddress}
          onAuth={(addr) => setAuthedAddress(addr)}
          onSignOut={() => setAuthedAddress(null)}
        />
      </div>
    </header>
  )
}
