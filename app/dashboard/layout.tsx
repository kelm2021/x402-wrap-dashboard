import Link from "next/link"
import DashboardHeader from "@/components/DashboardHeader"

export default function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-surface">
      <DashboardHeader />
      <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
    </div>
  )
}
