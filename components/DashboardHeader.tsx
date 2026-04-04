"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import WalletAuth from "./WalletAuth"
import { APIS_PRODUCT_URL } from "@/lib/products"

export default function DashboardHeader() {
  const [authedAddress, setAuthedAddress] = useState<string | null>(null)

  return (
    <header className="border-b border-[#4A4A4A] bg-black/30 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-[#F5F0E8]">
            <Image
              src="/circuit-sovereign.png"
              alt="AurelianFlo"
              width={30}
              height={30}
              className="h-7 w-7 rounded-full border border-[#C8942A]/60 object-cover"
            />
            AurelianFlo Wrapped
          </Link>
          <nav className="flex items-center gap-4 text-sm text-[#A8A29E]">
            <Link href={APIS_PRODUCT_URL} className="transition hover:text-[#F5F0E8]">
              APIs
            </Link>
            <Link href="/dashboard" className="transition hover:text-[#F5F0E8]">
              Endpoints
            </Link>
            <Link href="/dashboard/register" className="transition hover:text-[#F5F0E8]">
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
