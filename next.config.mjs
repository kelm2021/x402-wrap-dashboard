/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = { "pino-pretty": false }
    return config
  }
}

export default nextConfig
