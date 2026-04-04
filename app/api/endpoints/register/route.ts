import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { saveEndpoint, addEndpointToWallet } from "@/lib/kv"
import { createRegistrationIntent } from "@/lib/proxy-client"

interface RegisterPayload {
  originUrl?: string
  price?: string
  pathPattern?: string
  originHeaders?: Record<string, string>
  visibility?: "private" | "public"
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
    return NextResponse.json({ error: "Unauthorized - connect wallet first." }, { status: 401 })
  }

  const body = (await req.json()) as RegisterPayload

  if (!body.originUrl || !body.price) {
    return NextResponse.json({ error: "originUrl and price are required." }, { status: 400 })
  }

  try {
    new URL(body.originUrl)
  } catch {
    return NextResponse.json({ error: "originUrl must be a valid URL." }, { status: 400 })
  }

  const payload = {
    originUrl: body.originUrl,
    price: body.price,
    walletAddress: session.walletAddress,
    pathPattern: body.pathPattern || "/*",
    originHeaders: isRecordOfStrings(body.originHeaders) ? body.originHeaders : undefined,
    visibility: body.visibility || "private",
  }

  if (!payload.walletAddress) {
    return NextResponse.json({ error: "Payment wallet address missing." }, { status: 400 })
  }

  try {
    const endpoint = await createRegistrationIntent(payload)

    await saveEndpoint({
      endpointId: endpoint.endpointId,
      proxyUrl: endpoint.proxyUrl,
      price: payload.price,
      walletAddress: payload.walletAddress,
      originUrl: payload.originUrl,
      pathPattern: payload.pathPattern,
      createdAt: new Date().toISOString(),
      status: endpoint.status,
      visibility: endpoint.visibility,
      verificationPath: endpoint.verificationPath,
      verificationUrl: endpoint.verificationUrl,
      verifiedAt: null,
      activatedAt: null,
      paymentTxHash: null,
      activationTxHash: null,
    })

    await addEndpointToWallet(session.walletAddress, endpoint.endpointId)

    return NextResponse.json(endpoint, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register endpoint."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
