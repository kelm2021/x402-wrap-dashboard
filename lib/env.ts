function isProductionRuntime(): boolean {
  return process.env.VERCEL_ENV === "production" || (process.env.NODE_ENV === "production" && process.env.VERCEL === "1")
}

export function getRequiredServerEnv(
  name: string,
  options?: {
    developmentFallback?: string
    aliases?: string[]
  }
): string {
  const names = [name, ...(options?.aliases ?? [])]
  for (const candidate of names) {
    const value = process.env[candidate]?.trim()
    if (value) return value
  }

  if (!isProductionRuntime() && options?.developmentFallback) {
    return options.developmentFallback
  }

  throw new Error(`Missing required environment variable: ${names.join(" or ")}`)
}

export function getOptionalServerEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value || undefined
}
