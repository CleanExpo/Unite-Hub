import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ThemeProvider } from "@/components/theme-provider"
import { CookieConsent } from "@/components/cookie-consent"
import { AuthProvider } from "@/contexts/auth-context"

const inter = Inter({ subsets: ["latin"] })

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "UNITE Group - United in vision. Independent in spirit.",
  description:
    "UNITE Group provides expert-led online education, IICRC continuing education credits, innovative software development, and SEO services.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: siteUrl,
    siteName: "UNITE Group",
    title: "UNITE Group - United in vision. Independent in spirit.",
    description: "Expert-led education, software development, and digital services for businesses in Australia.",
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "UNITE Group - United in vision. Independent in spirit.",
    description: "Expert-led education, software development, and digital services for businesses in Australia.",
    images: [`${siteUrl}/og-image.png`],
    creator: "@unitegroup",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: siteUrl,
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#001428] text-white`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              {children}
              <Footer />
              <CookieConsent />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
