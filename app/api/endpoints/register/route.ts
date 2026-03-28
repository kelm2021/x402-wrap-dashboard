import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { saveEndpoint, addEndpointToWallet } from "@/lib/kv"
import { registerEndpoint } from "@/lib/proxy-client"

interface RegisterPayload {
  originUrl?: string
  price?: string
  pathPattern?: string
  originHeaders?: Record<string, string>
  // x402 payment fields
  signature?: string
  authorization?: {
    from: string
    to: string
    value: string
    validAfter: string
    validBefore: string
    nonce: string
  }
  paymentRequirements?: {
    scheme: string
    network: string
    maxAmountRequired: string
    resource: string
    description: string
    mimeType: string
    payTo: string
    maxTimeoutSeconds: number
    asset: string
    extra: { name: string; version: string } | null
  }
}

function isRecordOfStrings(value: unknown): value is Record<string, string> {
  return Boolean(
    value &&
      typeof value === "object" &&
      Object.values(value as Record<string, unknown>).every((entry) => typeof entry === "string")
  )
}

function encodePaymentHeader(
  signature: string,
  authorization: NonNullable<RegisterPayload["authorization"]>,
  paymentRequirements: NonNullable<RegisterPayload["paymentRequirements"]>
): string {
  const payment = {
    x402Version: 1,
    scheme: paymentRequirements.scheme,
    network: paymentRequirements.network,
    payload: {
      signature,
      authorization: {
        from: authorization.from,
        to: authorization.to,
        value: authorization.value,
        validAfter: authorization.validAfter,
        validBefore: authorization.validBefore,
        nonce: authorization.nonce,
      }
    }
  }
  // base64url encode (URL-safe, no padding issues)
  return Buffer.from(JSON.stringify(payment)).toString("base64url")
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized — connect wallet first." }, { status: 401 })
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

  if (!body.signature || !body.authorization || !body.paymentRequirements) {
    return NextResponse.json({ error: "Payment signature required." }, { status: 402 })
  }

  // Encode x402 payment header server-side
  const paymentHeader = encodePaymentHeader(body.signature, body.authorization, body.paymentRequirements)

  const payload = {
    originUrl: body.originUrl,
    price: body.price,
    walletAddress: body.authorization.from,
    pathPattern: body.pathPattern || "/*",
    originHeaders: isRecordOfStrings(body.originHeaders) ? body.originHeaders : undefined,
  }

  if (!payload.walletAddress) {
    return NextResponse.json({ error: "Payment wallet address missing." }, { status: 400 })
  }

  try {
    const endpoint = await registerEndpoint(payload, paymentHeader)

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
