const DEFAULT_PROXY_FEE_BPS = 100
const DEFAULT_REGISTRATION_FEE_USDC = "2"

function parseBps(value: string | undefined, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, Math.min(10_000, Math.floor(parsed)))
}

function formatPercentFromBps(bps: number): string {
  const value = (bps / 100).toFixed(2)
  return value.replace(/\.?0+$/, "")
}

export const proxyFeeBps = parseBps(process.env.NEXT_PUBLIC_PROXY_FEE_BPS, DEFAULT_PROXY_FEE_BPS)
export const endpointPayoutBps = Math.max(0, 10_000 - proxyFeeBps)

export const proxyFeePercent = formatPercentFromBps(proxyFeeBps)
export const endpointPayoutPercent = formatPercentFromBps(endpointPayoutBps)
export const registrationFeeUsdc = process.env.NEXT_PUBLIC_REGISTRATION_FEE_USDC || DEFAULT_REGISTRATION_FEE_USDC
