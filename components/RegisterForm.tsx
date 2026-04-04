"use client"

import { useEffect, useMemo, useState } from "react"
import { useAccount, useSignTypedData } from "wagmi"

import { endpointPayoutPercent, proxyFeePercent, registrationFeeUsdc } from "@/lib/fees"

interface EndpointState {
  endpointId: string
  proxyUrl: string
  status: string
  visibility: "private" | "public"
  verificationToken?: string
  verificationPath?: string
  verificationUrl?: string
  activatedAt?: string | null
  paymentTxHash?: string | null
  activationTxHash?: string | null
}

interface FormErrors {
  originUrl?: string
  price?: string
  paymentWallet?: string
  originHeaders?: string
  general?: string
}

const statusLabels: Record<string, string> = {
  pending_verification: "Pending verification",
  failed_verification: "Verification failed",
  pending_payment: "Ready for payment",
  active: "Active",
}

export default function RegisterForm() {
  const { address, isConnected } = useAccount()
  const { signTypedDataAsync } = useSignTypedData()

  const [originUrl, setOriginUrl] = useState("")
  const [price, setPrice] = useState("")
  const [paymentWallet, setPaymentWallet] = useState("")
  const [pathPattern, setPathPattern] = useState("/*")
  const [originHeaders, setOriginHeaders] = useState("")
  const [visibility, setVisibility] = useState<"private" | "public">("private")
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState("")
  const [result, setResult] = useState<EndpointState | null>(null)

  useEffect(() => {
    if (address && !paymentWallet) setPaymentWallet(address)
  }, [address, paymentWallet])

  const verificationFileContents = useMemo(() => result?.verificationToken ?? "", [result?.verificationToken])

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
        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed) ||
          !Object.values(parsed as Record<string, unknown>).every((v) => typeof v === "string")
        ) {
          throw new Error()
        }
        parsedHeaders = parsed as Record<string, string>
      } catch {
        next.originHeaders = "Must be valid JSON with string values."
      }
    }
    setErrors(next)
    return { valid: Object.keys(next).length === 0, parsedHeaders }
  }

  async function createIntent(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)
    setErrors({})

    const { valid, parsedHeaders } = validate()
    if (!valid) return
    if (!isConnected || !address) {
      setErrors({ general: "Connect your wallet first." })
      return
    }

    setIsSubmitting(true)
    try {
      setStep("Creating registration intent...")
      const res = await fetch("/api/endpoints/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originUrl,
          price,
          pathPattern: pathPattern || "/*",
          originHeaders: parsedHeaders,
          visibility,
        })
      })

      const data = await res.json()
      if (!res.ok) {
        setErrors({ general: data.error || "Failed to create registration intent." })
        return
      }

      setResult(data as EndpointState)
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Registration failed." })
    } finally {
      setIsSubmitting(false)
      setStep("")
    }
  }

  async function verifyOwnership() {
    if (!result) return
    setErrors({})
    setIsSubmitting(true)

    try {
      setStep("Checking your verification file...")
      const res = await fetch("/api/endpoints/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId: result.endpointId })
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ general: data.error || "Verification failed." })
        return
      }

      setResult((current) => current ? { ...current, status: data.status } : current)
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : "Verification failed." })
    } finally {
      setIsSubmitting(false)
      setStep("")
    }
  }

  async function activate() {
    if (!result) return
    if (!isConnected || !address) {
      setErrors({ general: "Connect your wallet first." })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      setStep("Preparing payment...")
      const challengeRes = await fetch(`/api/endpoints/challenge?endpointId=${encodeURIComponent(result.endpointId)}`)
      const challenge = await challengeRes.json()
      if (!challengeRes.ok) {
        throw new Error(challenge.error || "Failed to fetch payment details.")
      }

      if (challenge.free) {
        throw new Error("Registration fee is unexpectedly free. Activation route needs review.")
      }

      setStep("Sign in your wallet...")
      const signature = await signTypedDataAsync({
        domain: challenge.typedData.domain,
        types: challenge.typedData.types,
        primaryType: "TransferWithAuthorization",
        message: {
          ...challenge.typedData.message,
          from: paymentWallet,
        },
      })

      setStep("Activating endpoint...")
      const activateRes = await fetch("/api/endpoints/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpointId: result.endpointId,
          signature,
          authorization: {
            ...challenge.authorization,
            from: paymentWallet,
          },
          paymentRequirements: challenge.paymentRequirements,
        })
      })

      const activated = await activateRes.json()
      if (!activateRes.ok) {
        setErrors({ general: activated.error || "Activation failed." })
        return
      }

      setResult((current) => current ? {
        ...current,
        status: activated.status,
        proxyUrl: activated.proxyUrl,
        paymentTxHash: activated.paymentTxHash ?? null,
        activationTxHash: activated.activationTxHash ?? null,
        activatedAt: new Date().toISOString(),
      } : current)
    } catch (err) {
      if (err instanceof Error && (err.message.includes("User rejected") || err.message.includes("denied"))) {
        setErrors({ general: "Payment cancelled." })
      } else {
        setErrors({ general: err instanceof Error ? err.message : "Activation failed." })
      }
    } finally {
      setIsSubmitting(false)
      setStep("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#8C857A]/50 bg-[#1A1A1A]/95 px-5 py-3 text-sm text-[#F5F0E8]">
        Registration costs <strong className="text-[#D4A84B]">${registrationFeeUsdc} USDC</strong> on Base after ownership is verified.
        {" "}AurelianFlo Wrapped keeps <strong className="text-[#D4A84B]">{proxyFeePercent}%</strong> of each paid request, and endpoint owners receive <strong className="text-[#D4A84B]">{endpointPayoutPercent}%</strong>.
      </div>

      <form onSubmit={createIntent} className="space-y-6 rounded-3xl border border-[#4A4A4A] bg-[#1A1A1A]/85 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] sm:p-8">
        <Field
          label="Origin URL"
          name="originUrl"
          placeholder="https://api.example.com"
          value={originUrl}
          onChange={setOriginUrl}
          error={errors.originUrl}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <Field
            label="Per-request price (USDC)"
            name="price"
            type="number"
            placeholder="0.01"
            step="0.001"
            value={price}
            onChange={setPrice}
            error={errors.price}
          />
          <Field
            label="Payment wallet"
            name="paymentWallet"
            placeholder="0x..."
            value={paymentWallet}
            onChange={setPaymentWallet}
            error={errors.paymentWallet}
            hint={`Receives ${endpointPayoutPercent}% of each paid request. Pays the $${registrationFeeUsdc} activation fee.`}
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Field
            label="Path Pattern"
            name="pathPattern"
            placeholder="/*"
            value={pathPattern}
            onChange={setPathPattern}
          />
          <div className="space-y-2">
            <label htmlFor="visibility" className="text-sm font-medium text-[#F5F0E8]">Discovery visibility</label>
            <select
              id="visibility"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as "private" | "public")}
              className="w-full rounded-2xl border border-[#4A4A4A] bg-[#121210] px-4 py-3 text-sm text-[#F5F0E8] outline-none transition focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20"
            >
              <option value="private">Private / unlisted</option>
              <option value="public">Public discovery</option>
            </select>
            <p className="text-xs text-[#A8A29E]">Private keeps the endpoint out of the public discovery catalog until you change it later.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="originHeaders" className="text-sm font-medium text-[#F5F0E8]">
            Origin Headers <span className="font-normal text-[#A8A29E]">(optional)</span>
          </label>
          <textarea
            id="originHeaders"
            rows={4}
            placeholder='{"Authorization":"Bearer secret"}'
            value={originHeaders}
            onChange={(e) => setOriginHeaders(e.target.value)}
            className="w-full rounded-2xl border border-[#4A4A4A] bg-[#121210] px-4 py-3 text-sm text-[#F5F0E8] outline-none transition placeholder:text-[#8C857A] focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20"
          />
          {errors.originHeaders
            ? <p className="text-sm text-red-400">{errors.originHeaders}</p>
            : <p className="text-xs text-[#A8A29E]">Forwarded to your origin on every request after activation.</p>}
        </div>

        {errors.general && <p className="text-sm text-red-400">{errors.general}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex rounded-full bg-[#C8942A] px-6 py-3 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#D4A84B] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? step || "Processing..." : "Start Registration"}
        </button>
      </form>

      {result && (
        <div className="space-y-4 rounded-3xl border border-[#C8942A]/35 bg-[#1A1A1A]/90 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-[#F5F0E8]">Endpoint {result.endpointId}</p>
              <p className="text-sm text-[#A8A29E]">{statusLabels[result.status] ?? result.status}</p>
            </div>
            <div className="rounded-full border border-[#C8942A]/35 bg-[#C8942A]/10 px-3 py-1 text-xs text-[#D4A84B]">
              {result.visibility === "private" ? "Private" : "Public"}
            </div>
          </div>

          {(result.status === "pending_verification" || result.status === "failed_verification") && (
            <div className="space-y-3 rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
              <p className="text-sm font-medium text-[#F5F0E8]">Step 1: publish the verification file</p>
              <p className="text-sm text-[#A8A29E]">Create this file on the same origin you entered above, then click Verify Ownership.</p>
              <div className="rounded-2xl border border-[#4A4A4A] bg-[#0F0F0E] p-3 text-xs text-[#F5F0E8]">
                <p className="text-[#A8A29E]">Path</p>
                <p className="break-all">{result.verificationPath}</p>
                <p className="mt-3 text-[#A8A29E]">Contents</p>
                <p className="break-all">{verificationFileContents}</p>
              </div>
              <button
                type="button"
                onClick={verifyOwnership}
                disabled={isSubmitting}
                className="inline-flex rounded-full bg-[#C8942A] px-5 py-2 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#D4A84B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? step || "Checking..." : "Verify Ownership"}
              </button>
            </div>
          )}

          {result.status === "pending_payment" && (
            <div className="space-y-3 rounded-2xl border border-[#4A4A4A] bg-[#121210] p-4">
              <p className="text-sm font-medium text-[#F5F0E8]">Step 2: pay to activate</p>
              <p className="text-sm text-[#A8A29E]">Ownership is verified. The final step is the one-time ${registrationFeeUsdc} USDC activation payment.</p>
              <button
                type="button"
                onClick={activate}
                disabled={isSubmitting}
                className="inline-flex rounded-full bg-[#C8942A] px-5 py-2 text-sm font-semibold text-[#1A1A1A] transition hover:bg-[#D4A84B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? step || "Activating..." : `Pay & Activate ($${registrationFeeUsdc} USDC)`}
              </button>
            </div>
          )}

          {result.status === "active" && (
            <div className="space-y-2 text-sm text-[#F5F0E8]">
              <p className="font-medium">Endpoint is live.</p>
              <p className="break-all"><span className="text-[#A8A29E]">Proxy URL:</span> {result.proxyUrl}</p>
              {result.paymentTxHash && <p className="break-all"><span className="text-[#A8A29E]">Payment tx:</span> {result.paymentTxHash}</p>}
              {result.activationTxHash && <p className="break-all"><span className="text-[#A8A29E]">Activation tx:</span> {result.activationTxHash}</p>}
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(result.proxyUrl)}
                className="inline-flex rounded-full border border-[#C8942A]/50 px-5 py-2 text-sm text-[#F5F0E8] transition hover:border-[#D4A84B] hover:text-[#F5F0E8]"
              >
                Copy Proxy URL
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Field({ label, name, value, onChange, placeholder, type = "text", step, error, hint }: {
  label: string
  name: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  step?: string
  error?: string
  hint?: string
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-[#F5F0E8]">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-[#4A4A4A] bg-[#121210] px-4 py-3 text-sm text-[#F5F0E8] outline-none transition placeholder:text-[#8C857A] focus:border-[#D4A84B] focus:ring-2 focus:ring-[#D4A84B]/20"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : hint ? <p className="text-xs text-[#A8A29E]">{hint}</p> : null}
    </div>
  )
}
