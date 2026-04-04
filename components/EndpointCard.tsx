import Link from "next/link"
import { endpointPayoutPercent, proxyFeePercent } from "@/lib/fees"

interface EndpointCardProps {
  endpoint: {
    endpointId: string
    proxyUrl: string
    price: string
    walletAddress: string
    originUrl: string
    pathPattern: string
    createdAt: string
    status: string
    visibility: "private" | "public"
    usage?: {
      totalRequests: number
      totalRevenue: string
    }
  }
}

export default function EndpointCard({ endpoint }: EndpointCardProps) {
  const price = endpoint.price || "Unknown"
  const originUrl = endpoint.originUrl || "Origin URL unavailable"
  const pathPattern = endpoint.pathPattern || "Unknown pattern"

  return (
    <Link
      href={`/dashboard/endpoints/${endpoint.endpointId}`}
      className="group rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-6 transition hover:border-[#C8942A]/60"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-[#A8A29E]">Endpoint</p>
          <h2 className="mt-2 text-xl font-semibold text-[#F5F0E8]">{endpoint.endpointId}</h2>
          <p className="mt-3 break-all text-sm text-[#A8A29E]">{originUrl}</p>
        </div>
        <div className="space-y-2 text-right">
          <div className="rounded-full border border-[#C8942A]/35 bg-[#C8942A]/10 px-3 py-1 text-xs text-[#D4A84B]">
            {price} USDC
          </div>
          <div className="rounded-full border border-[#4A4A4A] bg-[#121210] px-3 py-1 text-xs text-[#C8C2B8]">
            {endpoint.status}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 text-sm text-[#C8C2B8] sm:grid-cols-2">
        <div className="rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
          <p className="text-[#A8A29E]">Requests</p>
          <p className="mt-2 text-lg text-[#F5F0E8]">{endpoint.usage?.totalRequests ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
          <p className="text-[#A8A29E]">Revenue</p>
          <p className="mt-2 text-lg text-[#F5F0E8]">{endpoint.usage?.totalRevenue ?? "0.00"} USDC</p>
          <p className="mt-1 text-xs text-[#8C857A]">
            Net ({endpointPayoutPercent}% owner / {proxyFeePercent}% fee)
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between text-xs text-[#8C857A]">
        <span>{pathPattern} • {endpoint.visibility}</span>
        <span className="transition group-hover:text-[#D4A84B]">View details</span>
      </div>
    </Link>
  )
}
