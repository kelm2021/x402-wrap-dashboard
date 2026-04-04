import Link from "next/link"
import UsageChart from "@/components/UsageChart"
import { getEndpointById } from "@/lib/kv"
import { getEmptyUsage, getUsage } from "@/lib/proxy-client"
import { endpointPayoutPercent, proxyFeePercent } from "@/lib/fees"

export default async function EndpointDetailPage({
  params
}: {
  params: { id: string }
}) {
  const endpoint = await getEndpointById(params.id)

  if (!endpoint) {
    return (
      <section className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-10">
        <h1 className="text-2xl font-semibold text-[#F5F0E8]">Endpoint not found</h1>
        <p className="mt-3 text-sm text-[#A8A29E]">
          Check the endpoint ID and try again.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full border border-[#4A4A4A] px-5 py-3 text-sm text-[#F5F0E8] transition hover:border-[#8C857A]"
        >
          Back to dashboard
        </Link>
      </section>
    )
  }

  let usage = getEmptyUsage()
  if (endpoint.status === "active") try {
    usage = await getUsage(endpoint.endpointId)
  } catch {
    // fallback to empty
  }

  const createdAt = formatCreatedAt(endpoint.createdAt)
  const originUrl = endpoint.originUrl || "Origin URL unavailable for this legacy endpoint record."
  const price = endpoint.price || "Unknown"
  const pathPattern = endpoint.pathPattern || "Unknown"
  const walletAddress = endpoint.walletAddress || "Unknown"

  return (
    <section className="space-y-8">
      <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm text-[#A8A29E]">Endpoint ID</p>
            <h1 className="mt-2 text-2xl font-semibold text-[#F5F0E8]">{endpoint.endpointId}</h1>
            <p className="mt-2 text-sm text-[#A8A29E]">{originUrl}</p>
          </div>
          <div className="grid gap-3 text-sm text-[#C8C2B8]">
            <div><span className="text-[#A8A29E]">Proxy URL:</span> {endpoint.proxyUrl}</div>
            <div><span className="text-[#A8A29E]">Price:</span> {price} USDC</div>
            <div><span className="text-[#A8A29E]">Path pattern:</span> {pathPattern}</div>
            <div><span className="text-[#A8A29E]">Status:</span> {endpoint.status}</div>
            <div><span className="text-[#A8A29E]">Visibility:</span> {endpoint.visibility}</div>
            <div><span className="text-[#A8A29E]">Wallet:</span> {walletAddress}</div>
            <div><span className="text-[#A8A29E]">Split:</span> {endpointPayoutPercent}% endpoint owner / {proxyFeePercent}% AurelianFlo Wrapped fee</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[#F5F0E8]">Requests, last 7 days</h2>
            <p className="mt-1 text-sm text-[#A8A29E]">
              Total requests: {usage.totalRequests} | Revenue: {usage.totalRevenue} USDC
            </p>
            <p className="mt-1 text-xs text-[#8C857A]">
              Revenue shown is net payout after the {proxyFeePercent}% AurelianFlo Wrapped fee.
            </p>
          </div>
          <UsageChart data={usage.dailyStats.slice(-7)} />
        </div>

        <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-6">
          <h2 className="text-lg font-semibold text-[#F5F0E8]">Summary</h2>
          <div className="mt-5 space-y-4 text-sm">
            <div className="rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
              <p className="text-[#A8A29E]">Created</p>
              <p className="mt-2 text-[#F5F0E8]">{createdAt}</p>
            </div>
            <div className="rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
              <p className="text-[#A8A29E]">Recent event count</p>
              <p className="mt-2 text-[#F5F0E8]">{usage.recentEvents.length}</p>
            </div>
            <div className="rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
              <p className="text-[#A8A29E]">Fee split</p>
              <p className="mt-2 text-[#F5F0E8]">{endpointPayoutPercent}% owner / {proxyFeePercent}% AurelianFlo Wrapped</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-6">
        <h2 className="text-lg font-semibold text-[#F5F0E8]">Recent events</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[#A8A29E]">
              <tr>
                <th className="pb-3 pr-6 font-medium">Time</th>
                <th className="pb-3 pr-6 font-medium">Method</th>
                <th className="pb-3 pr-6 font-medium">Path</th>
                <th className="pb-3 font-medium">Amount (net)</th>
              </tr>
            </thead>
            <tbody>
              {usage.recentEvents.length === 0 ? (
                <tr>
                  <td className="py-4 text-[#A8A29E]" colSpan={4}>No recent events yet.</td>
                </tr>
              ) : (
                usage.recentEvents.map((event) => (
                  <tr key={`${event.timestamp}-${event.path}`} className="border-t border-[#4A4A4A]">
                    <td className="py-4 pr-6 text-[#C8C2B8]">{new Date(event.timestamp).toLocaleString()}</td>
                    <td className="py-4 pr-6 text-[#C8C2B8]">{event.method}</td>
                    <td className="py-4 pr-6 text-[#C8C2B8]">{event.path}</td>
                    <td className="py-4 text-[#C8C2B8]">{event.amount} USDC</td>
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

function formatCreatedAt(createdAt: string): string {
  if (!createdAt) return "Unavailable"
  const date = new Date(createdAt)
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString()
}
