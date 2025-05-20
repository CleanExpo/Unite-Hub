import { CookiePreferences } from "@/components/cookie-preferences"
import type { Metadata } from "next"

// Get the site URL from environment variable
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://unitegroup.com.au"

export const metadata: Metadata = {
  title: "Cookie Preferences | UNITE Group",
  description: "Manage your cookie preferences for the UNITE Group website.",
  openGraph: {
    type: "website",
    url: `${siteUrl}/cookie-preferences`,
    title: "Cookie Preferences | UNITE Group",
    description: "Manage your cookie preferences for the UNITE Group website.",
    images: [
      {
        url: `${siteUrl}/og-cookies.png`,
        width: 1200,
        height: 630,
        alt: "UNITE Group Cookie Preferences",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Preferences | UNITE Group",
    description: "Manage your cookie preferences for the UNITE Group website.",
    images: [`${siteUrl}/og-cookies.png`],
  },
}

export default function CookiePreferencesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[#001428] to-[#00253e] py-16 md:py-24">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-6">Cookie Preferences</h1>
              <p className="text-xl text-[#4ecdc4]/90 mb-6">Manage how we use cookies on our website</p>
            </div>
          </div>
        </section>

        {/* Cookie Preferences Content */}
        <section className="py-16 md:py-24 bg-[#001428]">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="max-w-4xl mx-auto">
              <CookiePreferences />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
