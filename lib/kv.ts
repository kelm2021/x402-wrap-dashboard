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

export async function getEndpointsByWallet(address: string): Promise<StoredEndpoint[]> {
  if (!redis) return []
  const ids = await redis.lrange<string>(`wallet:${address.toLowerCase()}:endpoints`, 0, -1)
  if (!ids.length) return []
  const endpoints = await Promise.all(ids.map((id) => redis.get<StoredEndpoint>(`endpoint:${id}`)))
  return endpoints.filter(Boolean) as StoredEndpoint[]
}

export async function addEndpointToWallet(address: string, endpointId: string): Promise<void> {
  if (!redis) return
  await redis.lpush(`wallet:${address.toLowerCase()}:endpoints`, endpointId)
}
