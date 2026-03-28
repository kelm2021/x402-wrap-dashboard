"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import EndpointCard from "@/components/EndpointCard"

interface Endpoint {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
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
        <p className="text-sm text-gray-400">Loading…</p>
      </section>
    )
  }

  if (!authed) {
    return (
      <section className="space-y-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Your endpoints</h1>
          <p className="mt-2 text-sm text-gray-400">Connect your wallet to see your endpoints.</p>
        </div>
        <div className="rounded-3xl border border-dashed border-gray-800 bg-gray-900/70 p-10 text-center">
          <h2 className="text-xl font-semibold text-white">Connect your wallet</h2>
          <p className="mt-3 text-sm text-gray-400">
            Sign in with your wallet to view and manage your registered endpoints.
          </p>
          <Link
            href="/dashboard/register"
            className="mt-6 inline-flex rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
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
          <h1 className="text-3xl font-semibold tracking-tight text-white">Your endpoints</h1>
          <p className="mt-2 text-sm text-gray-400">
            Monitor active routes, pricing, request volume, and revenue.
          </p>
        </div>
        <Link
          href="/dashboard/register"
          className="inline-flex items-center justify-center rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
        >
          Register New Endpoint
        </Link>
      </div>

      {endpoints.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-800 bg-gray-900/70 p-10 text-center">
          <h2 className="text-xl font-semibold text-white">Register your first endpoint</h2>
          <p className="mt-3 text-sm text-gray-400">
            Add an origin URL, set a USDC price, and start collecting payments through x402-wrap.
          </p>
          <Link
            href="/dashboard/register"
            className="mt-6 inline-flex rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
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
