import Link from "next/link"
import ApisCatalogExplorer from "@/components/ApisCatalogExplorer"
import { fetchApisCatalog } from "@/lib/apis-catalog"

export const metadata = {
  title: "AurelianFlo APIs Catalog",
  description: "Browse curated x402-enabled API endpoints from AurelianFlo APIs."
}

export default async function ApisCatalogPage() {
  const catalog = await fetchApisCatalog()
  const categoryCount = new Set(catalog.catalog.map((item) => item.category).filter(Boolean)).size

  return (
    <main className="min-h-screen bg-[#121210]">
      <header className="border-b border-[#4A4A4A] bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-[#8C857A]">AurelianFlo product</p>
            <h1 className="mt-1 text-xl font-semibold text-[#F5F0E8]">AurelianFlo APIs</h1>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={catalog.discoveryUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#4A4A4A] px-4 py-2 text-sm text-[#C8C2B8] transition hover:border-[#8C857A] hover:text-[#F5F0E8]"
            >
              Raw JSON
            </a>
            <Link
              href="/"
              className="rounded-full bg-[#C8942A] px-4 py-2 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#D4A84B]"
            >
              AurelianFlo Wrapped
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-6 sm:p-8">
          <h2 className="text-3xl font-semibold tracking-tight text-[#F5F0E8]">
            Endpoint catalog
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#A8A29E]">
            Clean, filterable catalog UI for the live discovery feed at{" "}
            <span className="text-[#F5F0E8]">{catalog.discoveryUrl}</span>.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Endpoints" value={String(catalog.endpoints ?? catalog.catalog.length)} />
            <Stat label="Categories" value={String(categoryCount)} />
            <Stat label="Version" value={catalog.version || "unknown"} />
          </div>
          <p className="mt-4 text-xs text-[#8C857A]">
            Last generated: {catalog.generatedAt ? new Date(catalog.generatedAt).toLocaleString() : "Unavailable"}
          </p>
        </div>

        <div className="mt-6">
          <ApisCatalogExplorer endpoints={catalog.catalog} baseUrl={catalog.baseUrl || "https://x402.aurelianflo.com"} />
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
      <p className="text-xs uppercase tracking-[0.1em] text-[#8C857A]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#F5F0E8]">{value}</p>
    </div>
  )
}
