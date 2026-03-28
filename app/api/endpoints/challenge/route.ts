import { NextResponse } from "next/server"

const PROXY_API_URL = process.env.PROXY_API_URL || "https://wrap-api.aurelianflo.com"

export const dynamic = "force-dynamic"

export async function GET() {
  // Fetch the 402 challenge from proxy to get payment requirements
  const res = await fetch(`${PROXY_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ originUrl: "https://placeholder.invalid", price: "0", walletAddress: "0x0000000000000000000000000000000000000000" })
  })

  if (res.status !== 402) {
    return NextResponse.json({ error: "Expected 402 from proxy" }, { status: 500 })
  }

  const challenge = await res.json()
  const req = challenge.accepts?.[0]
  if (!req) return NextResponse.json({ error: "Invalid challenge" }, { status: 500 })

  // Build the unsigned authorization for client to sign
  const now = Math.floor(Date.now() / 1000)
  const validAfter = String(now - 600)
  const validBefore = String(now + req.maxTimeoutSeconds)
  const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b => b.toString(16).padStart(2, "0")).join("")}`

  return NextResponse.json({
    paymentRequirements: req,
    authorization: {
      from: null, // filled in by client with their address
      to: req.payTo,
      value: req.maxAmountRequired,
      validAfter,
      validBefore,
      nonce,
    },
    typedData: {
      domain: {
        name: req.extra?.name ?? "USD Coin",
        version: req.extra?.version ?? "2",
        chainId: req.network === "base" ? 8453 : 84532,
        verifyingContract: req.asset,
      },
      types: {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ]
      },
      message: {
        to: req.payTo,
        value: req.maxAmountRequired,
        validAfter,
        validBefore,
        nonce,
      }
    }
  })
}
