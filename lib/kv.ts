import { Redis } from "@upstash/redis"

const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    })
  : null

export interface StoredEndpoint {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
}

export async function getUserEndpoints(userId: string): Promise<StoredEndpoint[]> {
  if (!redis) {
    return []
  }

  const data = await redis.get<StoredEndpoint[]>(`user:${userId}:endpoints`)
  return data || []
}

export async function addEndpointToUser(userId: string, endpoint: StoredEndpoint): Promise<void> {
  if (!redis) {
    return
  }

  const existing = await getUserEndpoints(userId)
  existing.push(endpoint)
  await redis.set(`user:${userId}:endpoints`, existing)
}
