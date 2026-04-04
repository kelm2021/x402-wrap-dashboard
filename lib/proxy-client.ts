import { getRequiredServerEnv } from "@/lib/env"

const PROXY_API_URL = getRequiredServerEnv("PROXY_API_URL", {
  developmentFallback: "http://localhost:3402",
  aliases: ["NEXT_PUBLIC_PROXY_API_URL"],
})

export interface RegisterRequest {
  originUrl: string
  price: string
  walletAddress: string
  pathPattern?: string
  originHeaders?: Record<string, string>
  visibility?: "private" | "public"
}

export interface RegisterIntentResponse {
  endpointId: string
  proxyUrl: string
  status: string
  visibility: "private" | "public"
  verificationToken?: string
  verificationPath?: string
  verificationUrl?: string
  activationUrl?: string
  verificationApiUrl?: string
}

export interface ActivateResponse {
  endpointId: string
  proxyUrl: string
  status: string
  visibility: "private" | "public"
  paymentTxHash?: string | null
  activationTxHash?: string | null
}

export interface VerifyResponse {
  endpointId: string
  status: string
  verified: boolean
  verifiedAt?: string
}

export interface UsageEvent {
  path: string
  method: string
  amount: string
  timestamp: string
}

export interface UsageDailyStat {
  date: string
  requests: number
  revenue: string
}

export interface UsageData {
  totalRequests: number
  totalRevenue: string
  dailyStats: UsageDailyStat[]
  recentEvents: UsageEvent[]
}

function buildErrorMessage(prefix: string, details: string): string {
  return `${prefix}${details ? `: ${details}` : ""}`
}

export async function createRegistrationIntent(data: RegisterRequest): Promise<RegisterIntentResponse> {
  const res = await fetch(`${PROXY_API_URL}/register-intent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    throw new Error(buildErrorMessage("Failed to create registration intent", await res.text()))
  }

  return res.json()
}

export async function verifyEndpoint(endpointId: string): Promise<VerifyResponse> {
  const res = await fetch(`${PROXY_API_URL}/verify/${endpointId}`, {
    method: "POST",
  })

  if (!res.ok) {
    throw new Error(buildErrorMessage("Failed to verify origin", await res.text()))
  }

  return res.json()
}

export async function activateEndpoint(endpointId: string, paymentHeader?: string): Promise<ActivateResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (paymentHeader) headers["X-PAYMENT"] = paymentHeader

  const res = await fetch(`${PROXY_API_URL}/activate/${endpointId}`, {
    method: "POST",
    headers,
  })

  if (res.status === 402) {
    throw new Error("Payment required - please complete the USDC payment in your wallet.")
  }

  if (!res.ok) {
    throw new Error(buildErrorMessage("Failed to activate endpoint", await res.text()))
  }

  return res.json()
}

export async function getActivationChallenge(endpointId: string): Promise<{
  free?: boolean
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
  authorization?: {
    from: string | null
    to: string
    value: string
    validAfter: string
    validBefore: string
    nonce: string
  }
  typedData?: {
    domain: Record<string, unknown>
    types: Record<string, Array<{ name: string; type: string }>>
    message: Record<string, unknown>
  }
}> {
  const res = await fetch(`${PROXY_API_URL}/activate/${endpointId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })

  if (res.status === 200) {
    return { free: true }
  }

  if (res.status === 409) {
    throw new Error(buildErrorMessage("Endpoint is not ready for activation", await res.text()))
  }

  if (res.status !== 402) {
    throw new Error(buildErrorMessage("Failed to fetch activation challenge", await res.text()))
  }

  const challenge = await res.json()
  const req = challenge.accepts?.[0]
  if (!req) {
    throw new Error("Invalid activation challenge")
  }

  const now = Math.floor(Date.now() / 1000)
  const validAfter = String(now - 600)
  const validBefore = String(now + req.maxTimeoutSeconds)
  const nonce = `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map((b) => b.toString(16).padStart(2, "0")).join("")}`

  return {
    paymentRequirements: req,
    authorization: {
      from: null,
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
  }
}

export async function getUsage(endpointId: string): Promise<UsageData> {
  const res = await fetch(`${PROXY_API_URL}/usage/${endpointId}`, {
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error(buildErrorMessage("Failed to fetch usage", await res.text()))
  }

  const raw = await res.json()
  return normalizeUsage(raw)
}

export function getEmptyUsage(): UsageData {
  return {
    totalRequests: 0,
    totalRevenue: "0.00",
    dailyStats: [],
    recentEvents: []
  }
}

function normalizeUsage(raw: unknown): UsageData {
  const fallback = getEmptyUsage()
  if (!raw || typeof raw !== "object") return fallback

  const usage = raw as {
    totalRequests?: unknown
    totalRevenue?: unknown
    dailyStats?: unknown
    recentEvents?: unknown
  }

  const recentEvents = normalizeRecentEvents(usage.recentEvents)
  const dailyStats = normalizeDailyStats(usage.dailyStats, recentEvents)

  return {
    totalRequests: normalizeNumber(usage.totalRequests, recentEvents.length),
    totalRevenue: normalizeAmountString(usage.totalRevenue, sumEventAmounts(recentEvents)),
    dailyStats,
    recentEvents
  }
}

function normalizeRecentEvents(value: unknown): UsageEvent[] {
  if (!Array.isArray(value)) return []

  return value.map((event) => {
    const e = (event ?? {}) as {
      path?: unknown
      requestPath?: unknown
      method?: unknown
      amount?: unknown
      paidAmount?: unknown
      timestamp?: unknown
      createdAt?: unknown
    }

    return {
      path: normalizeString(e.path ?? e.requestPath, "/"),
      method: normalizeString(e.method, "GET"),
      amount: normalizeAmountString(e.amount ?? e.paidAmount, "0.00"),
      timestamp: normalizeString(e.timestamp ?? e.createdAt, new Date(0).toISOString())
    }
  })
}

function normalizeDailyStats(value: unknown, recentEvents: UsageEvent[]): UsageDailyStat[] {
  if (Array.isArray(value)) {
    return value.map((entry) => {
      const stat = (entry ?? {}) as { date?: unknown; requests?: unknown; revenue?: unknown }
      return {
        date: normalizeString(stat.date, new Date(0).toISOString()),
        requests: normalizeNumber(stat.requests, 0),
        revenue: normalizeAmountString(stat.revenue, "0.00")
      }
    })
  }

  // Legacy backend compatibility: derive daily stats from recent events if absent.
  const buckets = new Map<string, { requests: number; revenue: number }>()
  for (const event of recentEvents) {
    const date = event.timestamp.slice(0, 10)
    const current = buckets.get(date) ?? { requests: 0, revenue: 0 }
    current.requests += 1
    current.revenue += parseFloat(event.amount) || 0
    buckets.set(date, current)
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, stat]) => ({
      date,
      requests: stat.requests,
      revenue: trimAmount(stat.revenue.toFixed(6))
    }))
}

function normalizeAmountString(value: unknown, fallback: string): string {
  if (typeof value === "number") {
    return trimAmount(value.toFixed(6))
  }

  if (typeof value === "string") {
    const parsed = Number(value)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return trimAmount(parsed.toFixed(6))
    }
  }

  return fallback
}

function normalizeNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = Number(value)
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback
}

function sumEventAmounts(events: UsageEvent[]): string {
  const sum = events.reduce((acc, event) => acc + (parseFloat(event.amount) || 0), 0)
  return trimAmount(sum.toFixed(6))
}

function trimAmount(value: string): string {
  return value.replace(/0+$/, "").replace(/\.$/, "") || "0.00"
}
