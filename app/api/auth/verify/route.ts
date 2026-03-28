import { NextRequest, NextResponse } from "next/server"
import { verifyMessage } from "viem"
import { createSession } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const { address, signature, nonce } = await req.json()

  if (!address || !signature || !nonce) {
    return NextResponse.json({ error: "address, signature, and nonce required." }, { status: 400 })
  }

  const message = `Sign in to x402-wrap: ${nonce}`

  let valid = false
  try {
    valid = await verifyMessage({ address, message, signature })
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 })
  }

  if (!valid) {
    return NextResponse.json({ error: "Signature verification failed." }, { status: 401 })
  }

  const token = await createSession(address)

  const res = NextResponse.json({ ok: true, address })
  res.cookies.set("x402-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return res
}
