import { RecoveryForm } from "@/components/auth/recovery-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Account Recovery | UNITE Group",
  description: "Recover access to your UNITE Group account",
}

export default function RecoverPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-b from-[#001428] to-[#00253e]" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img src="/logo.png" alt="UNITE Group" className="h-8 mr-2" />
          UNITE Group
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "UNITE Group has transformed our business with their innovative solutions and exceptional service."
            </p>
            <footer className="text-sm">Sarah Johnson, CEO of TechForward</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Account Recovery</h1>
            <p className="text-sm text-muted-foreground">Choose a method to recover your account</p>
          </div>
          <RecoveryForm />
        </div>
      </div>
    </div>
  )
}
