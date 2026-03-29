"use client"

import { useState, useEffect } from "react"
import { useAccount, useSignTypedData } from "wagmi"

interface RegisterResponse {
  endpointId: string
  proxyUrl: string
  price: string
  walletAddress: string
  originUrl: string
  pathPattern: string
  createdAt: string
}

interface FormErrors {
  originUrl?: string
  price?: string
  paymentWallet?: string
  originHeaders?: string
  general?: string
}

export default function RegisterForm() {
  const { address, isConnected } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const [originUrl, setOriginUrl] = useState("")
  const [price, setPrice] = useState("")
  const [paymentWallet, setPaymentWallet] = useState("")
  const [pathPattern, setPathPattern] = useState("/*")
  const [originHeaders, setOriginHeaders] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState("")
  const [result, setResult] = useState<RegisterResponse | null>(null)

  useEffect(() => {
    if (address && !paymentWallet) setPaymentWallet(address)
  }, [address])

  function validate(): { valid: boolean; parsedHeaders?: Record<string, string> } {
    const next: FormErrors = {}
    if (!originUrl) {
      next.originUrl = "Required."
    } else {
      try { new URL(originUrl) } catch { next.originUrl = "Enter a valid URL." }
    }
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      next.price = "Enter a positive number."
    }
    if (!paymentWallet || !/^0x[a-fA-F0-9]{40}$/.test(paymentWallet)) {
      next.paymentWallet = "Enter a valid Ethereum address."
    }
    let parsedHeaders: Record<string, string> | undefined
    if (originHeaders.trim()) {
      try {
        const parsed = JSON.parse(originHeaders) as unknown
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
          !Object.values(parsed as Record<string, unknown>).every(v => typeof v === "string")) throw new Error()
        parsedHeaders = parsed as Record<string, string>
      } catch {
        next.originHeaders = "Must be valid JSON with string values."
      }
    }
    setErrors(next)
    return { valid: Object.keys(next).length === 0, parsedHeaders }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    setErrors({})

    const { valid, parsedHeaders } = validate()
    if (!valid) return
    if (!isConnected || !address) { setErrors({ general: "Connect your wallet first." }); return }

    setIsSubmitting(true)
    try {
      // Step 1: Get payment challenge from our API
      setStep("Preparing payment…")
      const challengeRes = await fetch("/api/endpoints/challenge")
      if (!challengeRes.ok) throw new Error("Failed to fetch payment details.")
      const challenge = await challengeRes.json()

      // Step 2: Sign the typed data
      setStep("Sign in your wallet…")
      const typedData = challenge.typedData
      const authorization = {
        ...challenge.authorization,
        from: paymentWallet, // payment wallet (may differ from auth wallet)
      }

      const signature = await signTypedDataAsync({
        domain: typedData.domain,
        types: typedData.types,
        primaryType: "TransferWithAuthorization",
        message: {
          ...typedData.message,
          from: paymentWallet,
        },
      })

      // Step 3: Submit to our API with signature
      setStep("Registering endpoint…")
      const res = await fetch("/api/endpoints/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originUrl,
          price,
          pathPattern: pathPattern || "/*",
          originHeaders: parsedHeaders,
          signature,
          authorization,
          paymentRequirements: challenge.paymentRequirements,
        })
      })

      const data = await res.json() as RegisterResponse | { error: string }
      if (!res.ok) { setErrors({ general: "error" in data ? data.error : "Registration failed." }); return }
      setResult(data as RegisterResponse)
    } catch (err) {
      if (err instanceof Error && (err.message.includes("User rejected") || err.message.includes("denied"))) {
        setErrors({ general: "Payment cancelled." })
      } else {
        setErrors({ general: err instanceof Error ? err.message : "Registration failed." })
      }
    } finally {
      setIsSubmitting(false)
      setStep("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-3 text-sm text-yellow-300">
        Registration costs <strong>$2 USDC</strong> on Base — paid from the payment wallet below.
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 sm:p-8 space-y-6">
        <Field label="Origin URL" name="originUrl" placeholder="https://api.example.com"
          value={originUrl} onChange={setOriginUrl} error={errors.originUrl} />

        <div className="grid gap-6 md:grid-cols-2">
          <Field label="Per-request price (USDC)" name="price" type="number" placeholder="0.01" step="0.001"
            value={price} onChange={setPrice} error={errors.price} />
          <Field
            label="Payment wallet"
            name="paymentWallet"
            placeholder="0x..."
            value={paymentWallet}
            onChange={setPaymentWallet}
            error={errors.paymentWallet}
            hint="Receives per-request earnings. Pays the $2 registration fee."
          />
        </div>

        <Field label="Path Pattern" name="pathPattern" placeholder="/*"
          value={pathPattern} onChange={setPathPattern} />

        <div className="space-y-2">
          <label htmlFor="originHeaders" className="text-sm font-medium text-gray-200">
            Origin Headers <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea id="originHeaders" rows={4} placeholder='{"Authorization":"Bearer secret"}'
            value={originHeaders} onChange={e => setOriginHeaders(e.target.value)}
            className="w-full rounded-2xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
          />
          {errors.originHeaders
            ? <p className="text-sm text-red-400">{errors.originHeaders}</p>
            : <p className="text-xs text-gray-500">Forwarded to your origin on every request.</p>}
        </div>

        {errors.general && <p className="text-sm text-red-400">{errors.general}</p>}

        <button type="submit" disabled={isSubmitting}
          className="inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? step || "Processing…" : "Register Endpoint ($2 USDC)"}
        </button>
      </form>

      {result && (
        <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6 space-y-3">
          <p className="text-sm font-medium text-purple-200">✅ Endpoint registered</p>
          <div className="text-sm text-gray-200 space-y-1">
            <p><span className="text-gray-400">Endpoint ID:</span> {result.endpointId}</p>
            <p className="break-all"><span className="text-gray-400">Proxy URL:</span> {result.proxyUrl}</p>
            <p><span className="text-gray-400">Price:</span> ${result.price} USDC / request</p>
            <p className="break-all"><span className="text-gray-400">Payment wallet:</span> {result.walletAddress}</p>
          </div>
          <button type="button" onClick={() => navigator.clipboard.writeText(result.proxyUrl)}
            className="inline-flex rounded-full border border-purple-400/40 px-5 py-2 text-sm text-purple-100 transition hover:border-purple-300 hover:text-white">
            Copy Proxy URL
          </button>
        </div>
      )}
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = "text", step, error, hint }: {
  label: string; name: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; step?: string; error?: string; hint?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-200">{label}</label>
      <input id={name} name={name} type={type} step={step} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : hint ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}
