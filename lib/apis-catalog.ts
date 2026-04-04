import { APIS_CATALOG_URL } from "@/lib/products"

export interface ApiCatalogEndpoint {
  method: string
  path: string
  price: string
  description: string
  category?: string
  tags?: string[]
  routeKey?: string
  priceUsd?: number
  examplePath?: string
  exampleUrl?: string
}

export interface ApiCatalogPayload {
  title?: string
  name?: string
  description?: string
  version?: string
  generatedAt?: string
  baseUrl?: string
  discoveryUrl?: string
  healthUrl?: string
  endpoints?: number
  catalog: ApiCatalogEndpoint[]
}

export async function fetchApisCatalog(): Promise<ApiCatalogPayload> {
  try {
    const res = await fetch(APIS_CATALOG_URL, {
      next: { revalidate: 300 }
    })

    if (!res.ok) throw new Error(`Catalog request failed (${res.status})`)

    const data = (await res.json()) as Partial<ApiCatalogPayload>
    const catalog = Array.isArray(data.catalog) ? data.catalog : []

    return {
      title: data.title || "AurelianFlo APIs",
      name: data.name || "AurelianFlo APIs",
      description: data.description || "Curated, high-signal endpoints.",
      version: data.version || "unknown",
      generatedAt: data.generatedAt,
      baseUrl: data.baseUrl || "https://x402.aurelianflo.com",
      discoveryUrl: data.discoveryUrl || APIS_CATALOG_URL,
      healthUrl: data.healthUrl || "https://x402.aurelianflo.com",
      endpoints: typeof data.endpoints === "number" ? data.endpoints : catalog.length,
      catalog
    }
  } catch {
    return {
      title: "AurelianFlo APIs",
      name: "AurelianFlo APIs",
      description: "Catalog unavailable right now.",
      version: "unknown",
      baseUrl: "https://x402.aurelianflo.com",
      discoveryUrl: APIS_CATALOG_URL,
      healthUrl: "https://x402.aurelianflo.com",
      endpoints: 0,
      catalog: []
    }
  }
}
