"use client"

import { useState } from "react"

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
  walletAddress?: string
  originHeaders?: string
  general?: string
}

const initialValues = {
  originUrl: "",
  price: "",
  walletAddress: "",
  pathPattern: "/*",
  originHeaders: ""
}

export default function RegisterForm() {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<RegisterResponse | null>(null)

  function validate(): { valid: boolean; parsedHeaders?: Record<string, string> } {
    const nextErrors: FormErrors = {}

    if (!values.originUrl) {
      nextErrors.originUrl = "Origin URL is required."
    } else {
      try {
        new URL(values.originUrl)
      } catch {
        nextErrors.originUrl = "Enter a valid URL."
      }
    }

    if (!values.price) {
      nextErrors.price = "Price is required."
    } else if (Number.isNaN(Number(values.price)) || Number(values.price) <= 0) {
      nextErrors.price = "Enter a positive number."
    }

    if (!values.walletAddress) {
      nextErrors.walletAddress = "Wallet address is required."
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(values.walletAddress)) {
      nextErrors.walletAddress = "Enter a valid Ethereum address."
    }

    let parsedHeaders: Record<string, string> | undefined
    if (values.originHeaders.trim()) {
      try {
        const parsed = JSON.parse(values.originHeaders) as unknown
        if (
          !parsed ||
          typeof parsed !== "object" ||
          Array.isArray(parsed) ||
          !Object.values(parsed as Record<string, unknown>).every((value) => typeof value === "string")
        ) {
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

    const { valid, parsedHeaders } = validate()
    if (!valid) {
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch("/api/endpoints/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          originUrl: values.originUrl,
          price: values.price,
          walletAddress: values.walletAddress,
          pathPattern: values.pathPattern || "/*",
          originHeaders: parsedHeaders
        })
      })

      const data = (await res.json()) as RegisterResponse | { error: string }

      if (!res.ok) {
        setErrors({ general: "error" in data ? data.error : "Registration failed." })
        return
      }

      setErrors({})
      setResult(data as RegisterResponse)
    } catch (error) {
      setErrors({
        general: error instanceof Error ? error.message : "Registration failed."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function copyProxyUrl() {
    if (result?.proxyUrl) {
      await navigator.clipboard.writeText(result.proxyUrl)
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-gray-800 bg-gray-900/70 p-6 sm:p-8"
      >
        <div className="grid gap-6">
          <Field
            label="Origin URL"
            name="originUrl"
            placeholder="https://api.example.com"
            value={values.originUrl}
            onChange={(value) => setValues((current) => ({ ...current, originUrl: value }))}
            error={errors.originUrl}
          />

          <div className="grid gap-6 md:grid-cols-2">
            <Field
              label="Price (USDC)"
              name="price"
              type="number"
              placeholder="0.01"
              step="0.01"
              value={values.price}
              onChange={(value) => setValues((current) => ({ ...current, price: value }))}
              error={errors.price}
            />
            <Field
              label="Wallet Address"
              name="walletAddress"
              placeholder="0x..."
              value={values.walletAddress}
              onChange={(value) => setValues((current) => ({ ...current, walletAddress: value }))}
              error={errors.walletAddress}
            />
          </div>

          <Field
            label="Path Pattern"
            name="pathPattern"
            placeholder="/*"
            value={values.pathPattern}
            onChange={(value) => setValues((current) => ({ ...current, pathPattern: value }))}
          />

          <div className="space-y-2">
            <label htmlFor="originHeaders" className="text-sm font-medium text-gray-200">
              Origin Headers
            </label>
            <textarea
              id="originHeaders"
              rows={6}
              placeholder='{"Authorization":"Bearer secret"}'
              value={values.originHeaders}
              onChange={(event) =>
                setValues((current) => ({ ...current, originHeaders: event.target.value }))
              }
              className="w-full rounded-2xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
            />
            {errors.originHeaders ? (
              <p className="text-sm text-red-400">{errors.originHeaders}</p>
            ) : (
              <p className="text-xs text-gray-500">Optional JSON object forwarded as origin headers.</p>
            )}
          </div>
        </div>

        {errors.general ? <p className="mt-6 text-sm text-red-400">{errors.general}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 inline-flex rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Registering..." : "Register Endpoint"}
        </button>
      </form>

      {result ? (
        <div className="rounded-3xl border border-purple-500/30 bg-purple-500/10 p-6">
          <p className="text-sm font-medium text-purple-200">Endpoint registered successfully</p>
          <div className="mt-4 space-y-2 text-sm text-gray-200">
            <p>
              <span className="text-gray-400">Endpoint ID:</span> {result.endpointId}
            </p>
            <p className="break-all">
              <span className="text-gray-400">Proxy URL:</span> {result.proxyUrl}
            </p>
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
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  step,
  error
}: FieldProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="text-sm font-medium text-gray-200">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-gray-700 bg-gray-950 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-500"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  )
}
