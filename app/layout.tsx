import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import Navigation from "./components/navigation"
import Footer from "./components/footer"
import { ThemeProvider } from "./components/theme-provider"

export const metadata: Metadata = {
  title: "UNITE Group - Project Management",
  description: "Empowering Your Success Through Innovation",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a192f] text-white">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <Navigation />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
