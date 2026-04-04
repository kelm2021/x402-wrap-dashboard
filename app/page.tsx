import Link from "next/link"
import Image from "next/image"
import { proxyFeePercent, registrationFeeUsdc } from "@/lib/fees"
import { APIS_PRODUCT_URL } from "@/lib/products"

const steps = [
  {
    title: "Register endpoint",
    description: "Point Wrapped at any existing API and set your price in USDC."
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
    <main className="min-h-screen bg-[#121210]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="inline-flex items-center gap-3 text-lg font-semibold tracking-tight text-[#F5F0E8]">
          <Image
            src="/circuit-sovereign.png"
            alt="AurelianFlo"
            width={34}
            height={34}
            className="h-8 w-8 rounded-full border border-[#C8942A]/60 object-cover"
          />
          AurelianFlo Wrapped
        </Link>
        <Link
          href="/dashboard"
          className="rounded-full border border-[#8C857A]/50 px-4 py-2 text-sm text-[#F5F0E8] transition hover:border-[#C8942A] hover:text-[#F5F0E8]"
        >
          Connect Wallet
        </Link>
      </header>

      <section className="mx-auto flex max-w-6xl flex-col px-6 pb-16 pt-14 md:pb-24 md:pt-24">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full border border-[#C8942A]/30 bg-[#C8942A]/10 px-3 py-1 text-sm text-[#D4A84B]">
            AurelianFlo product: Wrapped
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[#F5F0E8] sm:text-5xl md:text-6xl">
            Monetize any API with USDC payments
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#A8A29E]">
            AurelianFlo Wrapped lets you put paid access in front of any API without rebuilding your stack.
            Configure an origin, define pricing, and start collecting revenue through a managed proxy.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-[#8C857A]">
            Transparent economics: ${registrationFeeUsdc} USDC registration, then {proxyFeePercent}% fee per paid request.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-[#A8A29E]">
            Need prebuilt data endpoints instead?{" "}
            <Link
              href={APIS_PRODUCT_URL}
              className="text-[#D4A84B] underline decoration-[#D4A84B]/60 underline-offset-4 hover:text-[#C8942A]"
            >
              Explore AurelianFlo APIs
            </Link>
            .
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-full bg-[#C8942A] px-6 py-3 text-sm font-medium text-[#1A1A1A] transition hover:bg-[#D4A84B]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={step.title}
            className="rounded-3xl border border-[#4A4A4A] bg-[#121210]/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]"
          >
            <div className="mb-4 text-sm font-medium text-[#D4A84B]">0{index + 1}</div>
            <h2 className="text-xl font-semibold text-[#F5F0E8]">{step.title}</h2>
            <p className="mt-3 text-sm leading-6 text-[#A8A29E]">{step.description}</p>
          </div>
        ))}
      </section>
    </main>
  )
}
