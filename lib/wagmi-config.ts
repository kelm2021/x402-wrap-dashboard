import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { base, baseSepolia } from "wagmi/chains"

export const wagmiConfig = getDefaultConfig({
  appName: "AurelianFlo Wrapped",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "x402wrap",
  chains: [base, baseSepolia],
  ssr: true
})
