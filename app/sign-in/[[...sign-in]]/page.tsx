import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <SignIn
        afterSignInUrl="/dashboard"
        afterSignUpUrl="/dashboard"
        appearance={{
          elements: {
            card: "bg-gray-900 border border-gray-800 shadow-none",
            headerTitle: "text-white",
            headerSubtitle: "text-gray-400",
            socialButtonsBlockButton:
              "border border-gray-700 bg-transparent text-white hover:bg-gray-800",
            formButtonPrimary: "bg-purple-600 hover:bg-purple-500 text-white",
            formFieldInput:
              "border border-gray-700 bg-gray-950 text-white placeholder:text-gray-500",
            footerActionText: "text-gray-400",
            footerActionLink: "text-purple-400 hover:text-purple-300"
          }
        }}
      />
    </main>
  )
}
