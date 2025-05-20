import type { Metadata } from "next"
import { SignInForm } from "@/components/auth/signin-form"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sign In | UNITE Group",
  description: "Sign in to your UNITE Group account to access exclusive content and features.",
}

export default function SignInPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tighter text-white mb-2">Sign In</h1>
                <p className="text-[#4ecdc4]/90">Sign in to your account to access exclusive content and features.</p>
              </div>

              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <SignInForm />

                <div className="mt-6 text-center">
                  <p className="text-gray-300">
                    Don't have an account?{" "}
                    <Link href="/auth/signup" className="text-[#4ecdc4] hover:underline">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
