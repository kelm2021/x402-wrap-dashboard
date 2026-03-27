import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import UsageChart from "@/components/UsageChart"
import { getUserEndpoints } from "@/lib/kv"
import { getEmptyUsage, getUsage } from "@/lib/proxy-client"

interface EndpointDetail {
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
    dailyStats: { date: string; requests: number; revenue: string }[]
    recentEvents: { path: string; method: string; amount: string; timestamp: string }[]
  }
}

async function getEndpoint(id: string): Promise<EndpointDetail | null> {
  const { userId } = auth()

  if (!userId) {
    return null
  }

  const endpoints = await getUserEndpoints(userId)
  const endpoint = endpoints.find((entry) => entry.endpointId === id)

  if (!endpoint) {
    return null
  }

  try {
    const usage = await getUsage(endpoint.endpointId)
    return { ...endpoint, usage }
  } catch {
    return { ...endpoint, usage: getEmptyUsage() }
  }
}

export default async function EndpointDetailPage({
  params
}: {
  params: { id: string }
}) {
  const endpoint = await getEndpoint(params.id)

  if (!endpoint) {
    return (
      <section className="rounded-3xl border border-gray-800 bg-gray-900/70 p-10">
        <h1 className="text-2xl font-semibold text-white">Endpoint not found</h1>
        <p className="mt-3 text-sm text-gray-400">
          The endpoint may not belong to this account or has not been synced yet.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full border border-gray-700 px-5 py-3 text-sm text-white transition hover:border-gray-600"
        >
          Back to dashboard
        </Link>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-gray-500">Endpoint ID</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">{endpoint.endpointId}</h1>
            <p className="mt-2 text-sm text-gray-400">{endpoint.originUrl}</p>
          </div>
          <div className="grid gap-3 text-sm text-gray-300">
            <div>
              <span className="text-gray-500">Proxy URL:</span> {endpoint.proxyUrl}
            </div>
            <div>
              <span className="text-gray-500">Price:</span> {endpoint.price} USDC
            </div>
            <div>
              <span className="text-gray-500">Path pattern:</span> {endpoint.pathPattern}
            </div>
            <div>
              <span className="text-gray-500">Wallet:</span> {endpoint.walletAddress}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">Requests, last 7 days</h2>
            <p className="mt-1 text-sm text-gray-400">
              Total requests: {endpoint.usage.totalRequests} | Revenue: {endpoint.usage.totalRevenue}
              {" "}USDC
            </p>
          </div>
          <UsageChart data={endpoint.usage.dailyStats.slice(-7)} />
        </div>

        <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Summary</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-gray-800 bg-black/20 p-4">
              <p className="text-gray-500">Created</p>
              <p className="mt-2 text-white">{new Date(endpoint.createdAt).toLocaleString()}</p>
            </div>
            <div className="rounded-2xl border border-gray-800 bg-black/20 p-4">
              <p className="text-gray-500">Recent event count</p>
              <p className="mt-2 text-white">{endpoint.usage.recentEvents.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Recent events</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="pb-3 pr-6 font-medium">Time</th>
                <th className="pb-3 pr-6 font-medium">Method</th>
                <th className="pb-3 pr-6 font-medium">Path</th>
                <th className="pb-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.usage.recentEvents.length === 0 ? (
                <tr>
                  <td className="py-4 text-gray-400" colSpan={4}>
                    No recent events yet.
                  </td>
                </tr>
              ) : (
                endpoint.usage.recentEvents.map((event) => (
                  <tr key={`${event.timestamp}-${event.path}`} className="border-t border-gray-800">
                    <td className="py-4 pr-6 text-gray-300">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4 pr-6 text-gray-300">{event.method}</td>
                    <td className="py-4 pr-6 text-gray-300">{event.path}</td>
                    <td className="py-4 text-gray-300">{event.amount} USDC</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
