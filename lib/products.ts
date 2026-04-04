export const APIS_PRODUCT_URL =
  process.env.NEXT_PUBLIC_APIS_URL || "/apis"

export const APIS_UPSTREAM_ORIGIN =
  process.env.APIS_UPSTREAM_ORIGIN || "https://x402-data-bazaar.vercel.app"

export const APIS_CATALOG_URL =
  process.env.APIS_CATALOG_URL ||
  process.env.NEXT_PUBLIC_APIS_CATALOG_URL ||
  `${APIS_UPSTREAM_ORIGIN}/api`
