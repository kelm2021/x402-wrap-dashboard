import { NextRequest, NextResponse } from "next/server"
import { getEndpointById } from "@/lib/kv"
import { getEmptyUsage, getUsage } from "@/lib/proxy-client"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id query param required." }, { status: 400 })
  }

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
