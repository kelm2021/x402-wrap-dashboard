import Link from "next/link"

const steps = [
  {
    title: "Register endpoint",
    description: "Point the proxy at any existing API and set your price in USDC."
  },
  {
    title: "Get proxy URL",
    description: "Receive a managed x402-enabled URL with payment enforcement built in."
  },
  {
    title: "Earn USDC",
    description: "Track requests, revenue, and recent events from one dashboard."
  }
]

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-surface">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          x402-wrap
        </Link>
        <Link
          href="/sign-in"
          className="rounded-full border border-gray-800 px-4 py-2 text-sm text-gray-200 transition hover:border-purple-500 hover:text-white"
        >
          Sign In
        </Link>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col px-6 pb-16 pt-14 md:pb-24 md:pt-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-300">
            Managed x402 reverse proxy
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl">
            Monetize any API with USDC payments
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            x402-wrap lets you put paid access in front of any API without rebuilding your stack.
            Configure an origin, define pricing, and start collecting revenue through a managed proxy.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-full border border-gray-800 px-6 py-3 text-sm font-medium text-gray-200 transition hover:border-gray-700 hover:text-white"
            >
              Existing account
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-3xl border border-gray-800 bg-gray-900/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <div className="mb-4 text-sm font-medium text-purple-400">0{index + 1}</div>
            <h2 className="text-xl font-semibold text-white">{step.title}</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">{step.description}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
