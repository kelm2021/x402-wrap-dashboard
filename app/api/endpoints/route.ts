import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { getEndpointById, getEndpointsByWallet } from "@/lib/kv"
import { getEmptyUsage, getUsage } from "@/lib/proxy-client"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  // Single endpoint lookup by ID (public)
  if (id) {
    const endpoint = await getEndpointById(id)
    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint not found." }, { status: 404 })
    }
    try {
      const usage = await getUsage(id)
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
  const merged = await Promise.all(
    endpoints.map(async (ep) => {
      try {
        const usage = await getUsage(ep.endpointId)
        return { ...ep, usage }
      } catch {
        return { ...ep, usage: getEmptyUsage() }
      }
    })
  )
  return NextResponse.json(merged)
}
