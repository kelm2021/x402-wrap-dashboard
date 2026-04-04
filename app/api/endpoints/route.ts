import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getEndpointById, getEndpointsByWallet } from "@/lib/kv"
import { getEmptyUsage, getUsage } from "@/lib/proxy-client"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  // Single endpoint lookup by ID: public only for active+public endpoints.
  if (id) {
    const endpoint = await getEndpointById(id)
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found." }, { status: 404 })
    }
    const isPublicEndpoint = endpoint.status === "active" && endpoint.visibility === "public"
    if (!isPublicEndpoint) {
      const session = await getSession()
      if (!session) {
        return NextResponse.json({ error: "Endpoint not found." }, { status: 404 })
      }

      const ownedEndpoints = await getEndpointsByWallet(session.walletAddress)
      if (!ownedEndpoints.some((candidate) => candidate.endpointId === endpoint.endpointId)) {
        return NextResponse.json({ error: "Endpoint not found." }, { status: 404 })
      }
    }
    if (endpoint.status !== "active") {
      return NextResponse.json({ ...endpoint, usage: getEmptyUsage() })
    }
    try {
      const usage = await getUsageWithRetry(id)
      return NextResponse.json({ ...endpoint, usage })
    } catch {
      return NextResponse.json({ ...endpoint, usage: getEmptyUsage() })
    }
  }

  // All endpoints for authenticated wallet
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const endpoints = await getEndpointsByWallet(session.walletAddress)
  const merged = []

  // Usage reads can be expensive (on-chain fallback): fetch sequentially with retry
  // to avoid rate-limit bursts that silently zero out all cards.
  for (const ep of endpoints) {
    if (ep.status !== "active") {
      merged.push({ ...ep, usage: getEmptyUsage() })
      continue
    }
    try {
      const usage = await getUsageWithRetry(ep.endpointId)
      merged.push({ ...ep, usage })
    } catch {
      merged.push({ ...ep, usage: getEmptyUsage() })
    }
  }

  return NextResponse.json(merged)
}

async function getUsageWithRetry(endpointId: string) {
  try {
    return await getUsage(endpointId)
  } catch {
    await sleep(150)
    return getUsage(endpointId)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
