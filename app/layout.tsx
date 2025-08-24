import type React from "react"
import type { Metadata } from "next"
import { Titillium_Web } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import SiteHeader from "@/components/layout/site-header"
import SiteFooter from "@/components/layout/site-footer"
import ScrollToTop from "@/components/utils/scroll-to-top" // Import ScrollToTop
import { ChatbotProvider } from "@/components/chatbot"
import GoogleAnalytics from "@/components/GoogleAnalytics"
import { UniteGroupOrganizationSchema, UniteGroupLocalBusinessSchema } from "@/components/seo/AdvancedSchema"

const titilliumWeb = Titillium_Web({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "900"],
  variable: "--font-titillium-web",
})

export const metadata: Metadata = {
  title: "Unite Group - Transform Your Business",
  description: "Expert consultation, cutting-edge software development, strategic SEO, and professional training.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={cn(
          "min-h-screen bg-slate-950 text-slate-200 font-sans antialiased flex flex-col",
          titilliumWeb.className,
        )}
      >
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
        <UniteGroupOrganizationSchema />
        <UniteGroupLocalBusinessSchema />
        <ChatbotProvider>
          <ScrollToTop />
          <SiteHeader />
          <main className="flex-grow">{children}</main>
          <SiteFooter />
        </ChatbotProvider>
      </body>
    </html>
  )
}
