import RegisterForm from "@/components/RegisterForm"

export default function RegisterPage() {
  return (
    <section className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Register endpoint</h1>
        <p className="mt-2 text-sm text-gray-400">
          Connect an existing API, define your path pattern, and configure USDC pricing.
        </p>
      </div>
      <RegisterForm />
    </section>
  )
}
