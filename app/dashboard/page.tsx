"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import EndpointCard from "@/components/EndpointCard"
import { endpointPayoutPercent, proxyFeePercent } from "@/lib/fees"

interface Endpoint {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
  status: string
  visibility: "private" | "public"
  usage: {
    totalRequests: number
    totalRevenue: string
  }
}

export default function DashboardPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    fetch("/api/endpoints")
      .then((r) => {
        if (r.status === 401) {
          setAuthed(false)
          return null
        }
        setAuthed(true)
        return r.json()
      })
      .then((data) => {
        if (data) setEndpoints(data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <section className="flex items-center justify-center py-20">
        <p className="text-sm text-[#A8A29E]">Loading...</p>
      </section>
    )
  }

  if (!authed) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#F5F0E8]">Your endpoints</h1>
          <p className="mt-2 text-sm text-[#A8A29E]">Connect your wallet to see your endpoints.</p>
        </div>
        <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-10 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <h2 className="text-xl font-semibold text-[#F5F0E8]">Connect your wallet</h2>
          <p className="mt-3 text-sm text-[#A8A29E]">
            Sign in with your wallet to view and manage your registered endpoints.
          </p>
          <Link
            href="/dashboard/register"
            className="mt-6 inline-flex rounded-full bg-[#C8942A] px-5 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#D4A84B]"
          >
            Register a new endpoint
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#F5F0E8]">Your endpoints</h1>
          <p className="mt-2 text-sm text-[#A8A29E]">
            Monitor active routes, pricing, request volume, and revenue.
          </p>
          <p className="mt-1 text-xs text-[#8C857A]">
            Revenue values are net payouts ({endpointPayoutPercent}% owner / {proxyFeePercent}% AurelianFlo Wrapped fee).
          </p>
        </div>
        <Link
          href="/dashboard/register"
          className="inline-flex items-center justify-center rounded-full bg-[#C8942A] px-5 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#D4A84B]"
        >
          Register New Endpoint
        </Link>
      </div>

      {endpoints.length === 0 ? (
        <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-10 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <h2 className="text-xl font-semibold text-[#F5F0E8]">Register your first endpoint</h2>
          <p className="mt-3 text-sm text-[#A8A29E]">
            Add an origin URL, set a USDC price, and start collecting payments through AurelianFlo Wrapped.
          </p>
          <Link
            href="/dashboard/register"
            className="mt-6 inline-flex rounded-full bg-[#C8942A] px-5 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#D4A84B]"
          >
            Go to registration
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {endpoints.map((endpoint) => (
            <EndpointCard key={endpoint.endpointId} endpoint={endpoint} />
          ))}
        </div>
      )}
    </section>
  )
}
