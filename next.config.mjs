/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const apiOrigin = process.env.APIS_UPSTREAM_ORIGIN || "https://x402-data-bazaar.vercel.app"
    return {
      beforeFiles: [
        {
          source: "/api",
          destination: `${apiOrigin}/api`
        },
        // Preserve legacy AurelianFlo APIs surface while keeping dashboard internal APIs local.
        {
          source: "/api/:path((?!auth(?:/|$)|endpoints(?:/|$)).*)",
          destination: `${apiOrigin}/api/:path`
        },
        {
          source: "/.well-known/:path*",
          destination: `${apiOrigin}/.well-known/:path*`
        },
        {
          source: "/well-known/:path*",
          destination: `${apiOrigin}/well-known/:path*`
        }
      ]
    }
  },
  webpack: (config) => {
    config.resolve.fallback = { "pino-pretty": false }
    return config
  }
}

export default nextConfig
