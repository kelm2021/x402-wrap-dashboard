import { getDefaultConfig } from "@rainbow-me/rainbowkit"
import { base, baseSepolia } from "wagmi/chains"

export const wagmiConfig = getDefaultConfig({
  appName: "x402-wrap",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "x402wrap",
  chains: [base, baseSepolia],
  ssr: true
})
