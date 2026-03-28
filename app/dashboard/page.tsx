import Link from "next/link"

export default function DashboardPage() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">x402-wrap</h1>
          <p className="mt-2 text-sm text-gray-400">
            Monetize any API with USDC payments — no account required.
          </p>
        </div>
        <Link
          href="/dashboard/register"
          className="inline-flex items-center justify-center rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
        >
          Register Endpoint
        </Link>
      </div>

      <div className="rounded-3xl border border-dashed border-gray-800 bg-gray-900/70 p-10 text-center">
        <h2 className="text-xl font-semibold text-white">Have an endpoint ID?</h2>
        <p className="mt-3 text-sm text-gray-400">
          Go to <span className="font-mono text-gray-300">/dashboard/endpoints/YOUR_ID</span> to view usage and details.
        </p>
        <Link
          href="/dashboard/register"
          className="mt-6 inline-flex rounded-full bg-purple-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
        >
          Register a new endpoint
        </Link>
      </div>
    </section>
  )
}
