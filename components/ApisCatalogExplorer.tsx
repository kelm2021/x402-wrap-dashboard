"use client"

import { useMemo, useState } from "react"
import type { ApiCatalogEndpoint } from "@/lib/apis-catalog"

interface ApisCatalogExplorerProps {
  endpoints: ApiCatalogEndpoint[]
  baseUrl: string
}

export default function ApisCatalogExplorer({ endpoints, baseUrl }: ApisCatalogExplorerProps) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [method, setMethod] = useState("all")

  const categories = useMemo(() => {
    const values = new Set<string>()
    for (const endpoint of endpoints) {
      if (endpoint.category) values.add(endpoint.category)
    }
    return ["all", ...[...values].sort((a, b) => a.localeCompare(b))]
  }, [endpoints])

  const methods = useMemo(() => {
    const values = new Set<string>()
    for (const endpoint of endpoints) {
      if (endpoint.method) values.add(endpoint.method.toUpperCase())
    }
    return ["all", ...[...values].sort((a, b) => a.localeCompare(b))]
  }, [endpoints])

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return endpoints
      .filter((endpoint) => {
        if (category !== "all" && endpoint.category !== category) return false
        if (method !== "all" && endpoint.method.toUpperCase() !== method) return false
        if (!normalizedQuery) return true

        const haystack = [
          endpoint.method,
          endpoint.path,
          endpoint.description,
          endpoint.category || "",
          endpoint.routeKey || "",
          ...(endpoint.tags || [])
        ]
          .join(" ")
          .toLowerCase()

        return haystack.includes(normalizedQuery)
      })
      .sort((a, b) => {
        const aPrice = typeof a.priceUsd === "number" ? a.priceUsd : Number.MAX_SAFE_INTEGER
        const bPrice = typeof b.priceUsd === "number" ? b.priceUsd : Number.MAX_SAFE_INTEGER
        if (aPrice !== bPrice) return aPrice - bPrice
        return a.path.localeCompare(b.path)
      })
  }, [category, endpoints, method, query])

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-5 sm:p-6">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8C857A]">Search</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Path, tag, category, description..."
              className="w-full rounded-2xl border border-[#4A4A4A] bg-[#121210] px-4 py-3 text-sm text-[#F5F0E8] outline-none transition placeholder:text-[#8C857A] focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20"
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8C857A]">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-w-[220px] rounded-2xl border border-[#4A4A4A] bg-[#121210] px-4 py-3 text-sm text-[#F5F0E8] outline-none transition focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All categories" : item}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.12em] text-[#8C857A]">Method</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="min-w-[140px] rounded-2xl border border-[#4A4A4A] bg-[#121210] px-4 py-3 text-sm text-[#F5F0E8] outline-none transition focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20"
            >
              {methods.map((item) => (
                <option key={item} value={item}>
                  {item === "all" ? "All methods" : item}
                </option>
              ))}
            </select>
          </label>
        </div>

        <p className="mt-4 text-sm text-[#A8A29E]">
          Showing <span className="text-[#F5F0E8]">{filtered.length}</span> of{" "}
          <span className="text-[#F5F0E8]">{endpoints.length}</span> endpoints.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-8 text-center">
          <h2 className="text-lg font-semibold text-[#F5F0E8]">No endpoints match these filters</h2>
          <p className="mt-2 text-sm text-[#A8A29E]">Try clearing search or switching category/method filters.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {filtered.map((endpoint) => (
            <article
              key={`${endpoint.method}-${endpoint.path}`}
              className="rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-5 transition hover:border-[#C8942A]/50"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="rounded-full border border-[#C8942A]/45 bg-[#C8942A]/10 px-3 py-1 text-xs font-semibold text-[#D4A84B]">
                  {endpoint.method.toUpperCase()}
                </span>
                <span className="rounded-full border border-[#4A4A4A] bg-[#121210] px-3 py-1 text-xs text-[#F5F0E8]">
                  {endpoint.price || "Price unavailable"}
                </span>
              </div>

              <p className="mt-4 break-all font-mono text-sm text-[#F5F0E8]">{endpoint.path}</p>
              <p className="mt-3 text-sm leading-6 text-[#A8A29E]">{endpoint.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {endpoint.category ? (
                  <span className="rounded-full border border-[#4A4A4A] bg-[#121210] px-3 py-1 text-xs text-[#C8C2B8]">
                    {endpoint.category}
                  </span>
                ) : null}
                {(endpoint.tags || []).slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#4A4A4A] bg-[#121210] px-3 py-1 text-xs text-[#8C857A]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                {endpoint.exampleUrl ? (
                  <a
                    href={endpoint.exampleUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex rounded-full border border-[#C8942A]/55 px-4 py-2 text-xs font-medium text-[#F5F0E8] transition hover:border-[#D4A84B]"
                  >
                    Open example
                  </a>
                ) : null}
                {endpoint.examplePath ? (
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(`${baseUrl}${endpoint.examplePath}`)}
                    className="inline-flex rounded-full border border-[#4A4A4A] px-4 py-2 text-xs font-medium text-[#C8C2B8] transition hover:border-[#8C857A] hover:text-[#F5F0E8]"
                  >
                    Copy example URL
                  </button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
