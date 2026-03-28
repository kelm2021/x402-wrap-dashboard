import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { saveEndpoint, addEndpointToWallet } from "@/lib/kv"
import { registerEndpoint } from "@/lib/proxy-client"

interface RegisterPayload {
  originUrl?: string
  price?: string
  pathPattern?: string
  originHeaders?: Record<string, string>
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.values(value as Record<string, unknown>).every((entry) => typeof entry === "string")
  )
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized — connect wallet first." }, { status: 401 })
  }

  const body = (await req.json()) as RegisterPayload

  if (!body.originUrl || !body.price) {
    return NextResponse.json(
      { error: "originUrl and price are required." },
      { status: 400 }
    )
  }

  try {
    new URL(body.originUrl)
  } catch {
    return NextResponse.json({ error: "originUrl must be a valid URL." }, { status: 400 })
  }

  const payload = {
    originUrl: body.originUrl,
    price: body.price,
    walletAddress: session.walletAddress, // always from session, not request body
    pathPattern: body.pathPattern || "/*",
    originHeaders: isRecordOfStrings(body.originHeaders) ? body.originHeaders : undefined
  }

  try {
    const endpoint = await registerEndpoint(payload)

    await saveEndpoint({
      endpointId: endpoint.endpointId,
      proxyUrl: endpoint.proxyUrl,
      price: endpoint.price,
      walletAddress: endpoint.walletAddress,
      originUrl: endpoint.originUrl,
      pathPattern: endpoint.pathPattern,
      createdAt: endpoint.createdAt
    })

    await addEndpointToWallet(session.walletAddress, endpoint.endpointId)

    return NextResponse.json(endpoint, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register endpoint."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
