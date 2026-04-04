"use client"

import { useEffect, useState } from "react"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useSignMessage } from "wagmi"

interface WalletAuthProps {
  onAuth: (address: string) => void
  onSignOut: () => void
  isAuthenticated: boolean
}

export default function WalletAuth({ onAuth, onSignOut, isAuthenticated }: WalletAuthProps) {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [signing, setSigning] = useState(false)

  useEffect(() => {
    if (isConnected && address && !isAuthenticated) {
      handleSignIn()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address])

  async function handleSignIn() {
    if (!address) return
    setSigning(true)
    try {
      const { nonce } = await fetch("/api/auth/nonce").then((r) => r.json())
      const message = `Sign in to AurelianFlo Wrapped: ${nonce}`
      const signature = await signMessageAsync({ message })
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, signature, nonce })
      })
      if (res.ok) {
        onAuth(address)
      }
    } catch {
      // user rejected or error - stay unauthenticated
    } finally {
      setSigning(false)
    }
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    onSignOut()
  }

  return (
    <div className="flex items-center gap-3">
      {signing && <span className="text-sm text-[#A8A29E]">Signing in...</span>}
      <ConnectButton
        showBalance={false}
        accountStatus="address"
        chainStatus="none"
      />
      {isAuthenticated && !signing && (
        <button
          onClick={handleSignOut}
          className="rounded-full border border-[#4A4A4A] px-3 py-1.5 text-xs text-[#A8A29E] transition hover:border-[#8C857A] hover:text-[#F5F0E8]"
        >
          Sign out
        </button>
      )}
    </div>
  )
}
