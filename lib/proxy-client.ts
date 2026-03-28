const PROXY_API_URL = process.env.PROXY_API_URL || "http://localhost:3402"

export interface RegisterRequest {
  originUrl: string
  price: string
  walletAddress: string
  pathPattern?: string
  originHeaders?: Record<string, string>
}

export interface RegisterResponse {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
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

export async function registerEndpoint(data: RegisterRequest, paymentHeader?: string): Promise<RegisterResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (paymentHeader) headers["X-PAYMENT"] = paymentHeader

  const res = await fetch(`${PROXY_API_URL}/register`, {
    method: "POST",
    headers,
    body: JSON.stringify(data)
  })

  if (res.status === 402) {
    throw new Error("Payment required — please complete the $1 USDC payment in your wallet.")
  }

  if (!res.ok) {
    throw new Error(buildErrorMessage("Failed to register endpoint", await res.text()))
  }

  return res.json()
}

export async function getUsage(endpointId: string): Promise<UsageData> {
  const res = await fetch(`${PROXY_API_URL}/usage/${endpointId}`, {
    cache: "no-store"
  })

  if (!res.ok) {
    throw new Error(buildErrorMessage("Failed to fetch usage", await res.text()))
  }

  return res.json()
}

export function getEmptyUsage(): UsageData {
  return {
    totalRequests: 0,
    totalRevenue: "0.00",
    dailyStats: [],
    recentEvents: []
  }
}
