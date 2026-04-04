import { Redis } from "@upstash/redis"
import { getOptionalServerEnv, getRequiredServerEnv } from "@/lib/env"

const redisUrl = getOptionalServerEnv("UPSTASH_REDIS_REST_URL")
const redisToken = getOptionalServerEnv("UPSTASH_REDIS_REST_TOKEN")

function createRedisClient(): Redis | null {
  if (!redisUrl && !redisToken) return null

  return new Redis({
    url: getRequiredServerEnv("UPSTASH_REDIS_REST_URL"),
    token: getRequiredServerEnv("UPSTASH_REDIS_REST_TOKEN"),
  })
}

const redis = createRedisClient()

export interface StoredEndpoint {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
  status: string
  visibility: "private" | "public"
  verificationPath?: string
  verificationUrl?: string
  verifiedAt?: string | null
  activatedAt?: string | null
  paymentTxHash?: string | null
  activationTxHash?: string | null
}

function endpointKey(endpointId: string): string {
  return `dashboard:endpoint:${endpointId}`
}

function walletEndpointsKey(address: string): string {
  return `dashboard:wallet:${address.toLowerCase()}:endpoints`
}

export async function getEndpointById(endpointId: string): Promise<StoredEndpoint | null> {
  if (!redis) return null
  return redis.get<StoredEndpoint>(endpointKey(endpointId))
}

export async function saveEndpoint(endpoint: StoredEndpoint): Promise<void> {
  if (!redis) return
  await redis.set(endpointKey(endpoint.endpointId), endpoint)
}

export async function getEndpointsByWallet(address: string): Promise<StoredEndpoint[]> {
  if (!redis) return []
  const ids = await redis.lrange<string>(walletEndpointsKey(address), 0, -1)
  if (!ids.length) return []
  const endpoints = await Promise.all(ids.map((id) => redis.get<StoredEndpoint>(endpointKey(id))))
  return endpoints.filter(Boolean) as StoredEndpoint[]
}

export async function addEndpointToWallet(address: string, endpointId: string): Promise<void> {
  if (!redis) return
  await redis.lpush(walletEndpointsKey(address), endpointId)
}
