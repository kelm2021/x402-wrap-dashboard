import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { getRequiredServerEnv } from "@/lib/env"

function getSessionSecret(): Uint8Array {
  return new TextEncoder().encode(
    getRequiredServerEnv("JWT_SECRET", {
      developmentFallback: "dev-secret-change-in-production-please",
    }),
  )
}

export interface SessionPayload {
  walletAddress: string
  exp?: number
}

export async function createSession(walletAddress: string): Promise<string> {
  return new SignJWT({ walletAddress })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSessionSecret())
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSessionSecret())
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("x402-session")?.value
  if (!token) return null
  return verifySession(token)
}
