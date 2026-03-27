import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import EndpointCard from "@/components/EndpointCard"
import { getUserEndpoints } from "@/lib/kv"
import { getEmptyUsage, getUsage } from "@/lib/proxy-client"

interface DashboardEndpoint {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
  usage: {
    totalRequests: number
    totalRevenue: string
  }
}

async function getEndpoints(): Promise<DashboardEndpoint[]> {
  const { userId } = auth()

  if (!userId) {
    return []
  }

  const endpoints = await getUserEndpoints(userId)

  return Promise.all(
    endpoints.map(async (endpoint) => {
      try {
        const usage = await getUsage(endpoint.endpointId)
        return {
          ...endpoint,
          usage: {
            totalRequests: usage.totalRequests,
            totalRevenue: usage.totalRevenue
          }
        }
      } catch {
        const usage = getEmptyUsage()
        return {
          ...endpoint,
          usage: {
            totalRequests: usage.totalRequests,
            totalRevenue: usage.totalRevenue
          }
        }
      }
    })
  )
}

export default async function DashboardPage() {
  const endpoints = await getEndpoints()

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Your endpoints</h1>
          <p className="mt-2 text-sm text-gray-400">
            Monitor active routes, pricing, request volume, and revenue.
          </p>
        </div>
        <Link
          href="/dashboard/register"
          className="inline-flex items-center justify-center rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
        >
          Register New Endpoint
        </Link>
      </div>

      {endpoints.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-800 bg-gray-900/70 p-10 text-center">
          <h2 className="text-xl font-semibold text-white">Register your first endpoint</h2>
          <p className="mt-3 text-sm text-gray-400">
            Add an origin URL, set a USDC price, and start collecting payments through x402-wrap.
          </p>
          <Link
            href="/dashboard/register"
            className="mt-6 inline-flex rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
          >
            Go to registration
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {endpoints.map((endpoint) => (
            <EndpointCard key={endpoint.endpointId} endpoint={endpoint} />
          ))}
        </div>
      )}
    </section>
  )
}
