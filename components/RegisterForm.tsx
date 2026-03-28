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

const initialValues = {
  originUrl: "",
  price: "",
  paymentWallet: "",
  pathPattern: "/*",
  originHeaders: ""
}

// x402 EIP-712 domain + types for exact scheme
const X402_DOMAIN = {
  name: "x402",
  version: "1",
}

const X402_TYPES = {
  Payment: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
}

export default function RegisterForm() {
  const { address, isConnected } = useAccount()
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<RegisterResponse | null>(null)
  const [step, setStep] = useState<"idle" | "fetching-challenge" | "awaiting-signature" | "registering">("idle")

  const { signTypedDataAsync } = useSignTypedData()

  // Pre-fill payment wallet from connected account
  useEffect(() => {
    if (address && !values.paymentWallet) {
      setValues((v) => ({ ...v, paymentWallet: address }))
    }
  }, [address])

  function validate(): { valid: boolean; parsedHeaders?: Record<string, string> } {
    const nextErrors: FormErrors = {}

    if (!values.originUrl) {
      nextErrors.originUrl = "Origin URL is required."
    } else {
      try { new URL(values.originUrl) } catch {
        nextErrors.originUrl = "Enter a valid URL."
      }
    }

    if (!values.price) {
      nextErrors.price = "Price is required."
    } else if (Number.isNaN(Number(values.price)) || Number(values.price) <= 0) {
      nextErrors.price = "Enter a positive number."
    }

    if (!values.paymentWallet) {
      nextErrors.paymentWallet = "Payment wallet is required."
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(values.paymentWallet)) {
      nextErrors.paymentWallet = "Enter a valid Ethereum address."
    }

    let parsedHeaders: Record<string, string> | undefined
    if (values.originHeaders.trim()) {
      try {
        const parsed = JSON.parse(values.originHeaders) as unknown
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) ||
          !Object.values(parsed as Record<string, unknown>).every((v) => typeof v === "string")) {
          throw new Error()
        }
        parsedHeaders = parsed as Record<string, string>
      } catch {
        nextErrors.originHeaders = "Headers must be valid JSON with string values."
      }
    }

    setErrors(nextErrors)
    return { valid: Object.keys(nextErrors).length === 0, parsedHeaders }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
      const payload = {
        originUrl: values.originUrl,
        price: values.price,
        walletAddress: values.paymentWallet,
        pathPattern: values.pathPattern || "/*",
        originHeaders: parsedHeaders
      }

      // Step 1: Fetch the 402 challenge from the proxy
      setStep("fetching-challenge")
      const proxyUrl = process.env.NEXT_PUBLIC_PROXY_API_URL || "https://x402-wrap.fly.dev"
      const challengeRes = await fetch(`${proxyUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (challengeRes.status !== 402) {
        throw new Error(`Expected 402 challenge, got ${challengeRes.status}`)
      }

      const challenge = await challengeRes.json()
      const req = challenge.accepts?.[0]
      if (!req) throw new Error("Invalid challenge response from proxy")

      // Step 2: Build EIP-3009 transferWithAuthorization payload
      setStep("awaiting-signature")
      const now = Math.floor(Date.now() / 1000)
      const validAfter = BigInt(now - 60)  // 1 min grace
      const validBefore = BigInt(now + req.maxTimeoutSeconds)
      const nonce = crypto.getRandomValues(new Uint8Array(32))
      const nonceHex = `0x${Array.from(nonce).map(b => b.toString(16).padStart(2, "0")).join("")}` as `0x${string}`

      const domain = {
        name: req.extra?.name ?? "USD Coin",
        version: req.extra?.version ?? "2",
        chainId: req.network === "base" ? 8453 : 84532,
        verifyingContract: req.asset as `0x${string}`,
      }

      const typedDataTypes = {
        TransferWithAuthorization: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "validAfter", type: "uint256" },
          { name: "validBefore", type: "uint256" },
          { name: "nonce", type: "bytes32" },
        ]
      }

      const typedDataMessage = {
        from: address,
        to: req.payTo as `0x${string}`,
        value: BigInt(req.maxAmountRequired),
        validAfter,
        validBefore,
        nonce: nonceHex,
      }

      const signature = await signTypedDataAsync({
        domain,
        types: typedDataTypes,
        primaryType: "TransferWithAuthorization",
        message: typedDataMessage,
      })

      // Step 3: Encode x402 payment header
      const paymentPayload = {
        x402Version: 1,
        scheme: "exact",
        network: req.network,
        payload: {
          signature,
          authorization: {
            from: address,
            to: req.payTo,
            value: req.maxAmountRequired,
            validAfter: validAfter.toString(),
            validBefore: validBefore.toString(),
            nonce: nonceHex,
          }
        }
      }
      const paymentHeader = btoa(JSON.stringify(paymentPayload))

      // Step 4: Submit registration with payment
      setStep("registering")
      const res = await fetch("/api/endpoints/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Payment-Header": paymentHeader,
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json() as RegisterResponse | { error: string }

      if (!res.ok) {
        setErrors({ general: "error" in data ? data.error : "Registration failed." })
        return
      }

      setErrors({})
      setResult(data as RegisterResponse)
    } catch (error) {
      if (error instanceof Error && error.message.includes("User rejected")) {
        setErrors({ general: "Signature rejected — payment cancelled." })
      } else {
        setErrors({ general: error instanceof Error ? error.message : "Registration failed." })
      }
    } finally {
      setIsSubmitting(false)
      setStep("idle")
    }
  }

  async function copyProxyUrl() {
    if (result?.proxyUrl) await navigator.clipboard.writeText(result.proxyUrl)
  }

  const stepLabel = {
    idle: "Register Endpoint",
    "fetching-challenge": "Fetching payment details…",
    "awaiting-signature": "Sign payment in wallet…",
    "registering": "Registering…",
  }[step]

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-yellow-500/20 bg-yellow-500/5 px-5 py-3 text-sm text-yellow-300">
        Registration costs <strong>$1 USDC</strong> on Base — paid directly from your connected wallet.
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 sm:p-8">
        <div className="grid gap-6">
          <Field
            label="Origin URL"
            name="originUrl"
            placeholder="https://api.example.com"
            value={values.originUrl}
            onChange={(value) => setValues((c) => ({ ...c, originUrl: value }))}
            error={errors.originUrl}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Per-request price (USDC)"
              name="price"
              type="number"
              placeholder="0.01"
              step="0.001"
              value={values.price}
              onChange={(value) => setValues((c) => ({ ...c, price: value }))}
              error={errors.price}
            />
            <Field
              label="Payment wallet (receives USDC)"
              name="paymentWallet"
              placeholder="0x..."
              value={values.paymentWallet}
              onChange={(value) => setValues((c) => ({ ...c, paymentWallet: value }))}
              error={errors.paymentWallet}
              hint="Where your per-request earnings go. Defaults to connected wallet."
            />
          </div>

          <Field
            label="Path Pattern"
            name="pathPattern"
            placeholder="/*"
            value={values.pathPattern}
            onChange={(value) => setValues((c) => ({ ...c, pathPattern: value }))}
          />

          <div className="space-y-2">
            <label htmlFor="originHeaders" className="text-sm font-medium text-gray-200">
              Origin Headers <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="originHeaders"
              rows={4}
              placeholder='{"Authorization":"Bearer secret"}'
              value={values.originHeaders}
              onChange={(e) => setValues((c) => ({ ...c, originHeaders: e.target.value }))}
              className="w-full rounded-2xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
            />
            {errors.originHeaders
              ? <p className="text-sm text-red-400">{errors.originHeaders}</p>
              : <p className="text-xs text-gray-500">Forwarded to your origin on every request.</p>
            }
          </div>
        </div>

        {errors.general ? <p className="mt-6 text-sm text-red-400">{errors.general}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? stepLabel : "Register Endpoint ($1 USDC)"}
        </button>
      </form>

      {result ? (
        <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6">
          <p className="text-sm font-medium text-purple-200">✅ Endpoint registered</p>
          <div className="mt-4 space-y-2 text-sm text-gray-200">
            <p><span className="text-gray-400">Endpoint ID:</span> {result.endpointId}</p>
            <p className="break-all"><span className="text-gray-400">Proxy URL:</span> {result.proxyUrl}</p>
            <p><span className="text-gray-400">Price:</span> ${result.price} USDC per request</p>
            <p className="break-all"><span className="text-gray-400">Payment wallet:</span> {result.walletAddress}</p>
          </div>
          <button
            type="button"
            onClick={copyProxyUrl}
            className="mt-5 inline-flex rounded-full border border-purple-400/40 px-5 py-2 text-sm text-purple-100 transition hover:border-purple-300 hover:text-white"
          >
            Copy Proxy URL
          </button>
        </div>
      ) : null}
    </div>
  )
}

interface FieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  step?: string
  error?: string
  hint?: string
}

function Field({ label, name, value, onChange, placeholder, type = "text", step, error, hint }: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-200">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
      />
      {error
        ? <p className="text-sm text-red-400">{error}</p>
        : hint ? <p className="text-xs text-gray-500">{hint}</p> : null
      }
    </div>
  )
}
