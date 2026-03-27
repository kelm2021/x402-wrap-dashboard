import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserEndpoints } from "@/lib/kv"
import { getEmptyUsage, getUsage } from "@/lib/proxy-client"

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const endpoints = await getUserEndpoints(userId)

  const merged = await Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const usage = await getUsage(endpoint.endpointId)
        return { ...endpoint, usage }
      } catch {
        return { ...endpoint, usage: getEmptyUsage() }
      }
    })
  )

  return NextResponse.json(merged)
}
