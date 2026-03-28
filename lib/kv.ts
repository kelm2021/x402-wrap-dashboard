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

export async function getEndpointById(endpointId: string): Promise<StoredEndpoint | null> {
  if (!redis) return null
  return redis.get<StoredEndpoint>(`endpoint:${endpointId}`)
}

export async function saveEndpoint(endpoint: StoredEndpoint): Promise<void> {
  if (!redis) return
  await redis.set(`endpoint:${endpoint.endpointId}`, endpoint)
}
