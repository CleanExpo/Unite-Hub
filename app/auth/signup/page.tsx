import type { Metadata } from "next"
import { SignUpForm } from "@/components/auth/signup-form"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sign Up | UNITE Group",
  description: "Create a UNITE Group account to access exclusive content and features.",
}

export default function SignUpPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold tracking-tighter text-white mb-2">Create an Account</h1>
                <p className="text-[#4ecdc4]/90">Join UNITE Group to access exclusive content and features.</p>
              </div>

              <div className="bg-gradient-to-br from-[#002a42] to-[#00395d] rounded-lg p-6 border border-[#4ecdc4]/20">
                <SignUpForm />

                <div className="mt-6 text-center">
                  <p className="text-gray-300">
                    Already have an account?{" "}
                    <Link href="/auth/signin" className="text-[#4ecdc4] hover:underline">
                      Sign in
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
