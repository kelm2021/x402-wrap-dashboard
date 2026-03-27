import Link from "next/link"

interface EndpointCardProps {
  endpoint: {
    endpointId: string
    proxyUrl: string
    price: string
    walletAddress: string
    originUrl: string
    pathPattern: string
    createdAt: string
    usage?: {
      totalRequests: number
      totalRevenue: string
    }
  }
}

export default function EndpointCard({ endpoint }: EndpointCardProps) {
  return (
    <Link
      href={`/dashboard/endpoints/${endpoint.endpointId}`}
      className="group rounded-3xl border border-gray-800 bg-gray-900/70 p-6 transition hover:border-purple-500/60 hover:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Endpoint</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{endpoint.endpointId}</h2>
          <p className="mt-3 break-all text-sm text-gray-400">{endpoint.originUrl}</p>
        </div>
        <div className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
          {endpoint.price} USDC
        </div>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-800 bg-black/20 p-4">
          <p className="text-gray-500">Requests</p>
          <p className="mt-2 text-lg text-white">{endpoint.usage?.totalRequests ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-gray-800 bg-black/20 p-4">
          <p className="text-gray-500">Revenue</p>
          <p className="mt-2 text-lg text-white">{endpoint.usage?.totalRevenue ?? "0.00"} USDC</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-gray-500">
        <span>{endpoint.pathPattern}</span>
        <span className="transition group-hover:text-purple-300">View details</span>
      </div>
    </Link>
  )
}
