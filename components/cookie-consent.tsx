"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

// Define the consent expiration period (6 months in milliseconds)
const CONSENT_EXPIRATION_MS = 6 * 30 * 24 * 60 * 60 * 1000 // ~6 months

export function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)

  useEffect(() => {
    // Only run on client-side to avoid hydration issues
    if (typeof window !== "undefined") {
      // Check if user has already consented
      const consentData = localStorage.getItem("cookie-consent-data")

      if (consentData) {
        try {
          const { consent, timestamp } = JSON.parse(consentData)
          const currentTime = new Date().getTime()

          // Check if consent has expired
          if (currentTime - timestamp > CONSENT_EXPIRATION_MS) {
            // Consent has expired, show the banner again
            setShowConsent(true)
          } else {
            // Consent is still valid
            setShowConsent(false)
          }
        } catch (error) {
          console.error("Error parsing cookie consent data:", error)
          setShowConsent(true)
        }
      } else {
        // No consent data found, show the banner
        setShowConsent(true)
      }
    }
  }, [])

  // Update the acceptCookies function to store timestamp
  const acceptCookies = () => {
    const consentData = {
      consent: "true",
      timestamp: new Date().getTime(),
    }
    localStorage.setItem("cookie-consent-data", JSON.stringify(consentData))
    localStorage.setItem("cookie-consent", "true") // Keep for backward compatibility
    setShowConsent(false)
  }

  // Update the declineCookies function to store timestamp
  const declineCookies = () => {
    const consentData = {
      consent: "essential",
      timestamp: new Date().getTime(),
    }
    localStorage.setItem("cookie-consent-data", JSON.stringify(consentData))
    localStorage.setItem("cookie-consent", "essential") // Keep for backward compatibility
    setShowConsent(false)
  }

  if (!showConsent) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#001428] border-t border-[#4ecdc4]/30 shadow-lg">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1 pr-8">
            <h3 className="text-lg font-semibold text-white mb-2">We use cookies</h3>
            <p className="text-gray-300 text-sm">
              We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our
              traffic. By clicking "Accept All", you consent to our use of cookies. Read our{" "}
              <Link href="/cookies" className="text-[#4ecdc4] hover:underline">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#4ecdc4] hover:underline">
                Privacy Policy
              </Link>{" "}
              to learn more.
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Your cookie preferences will expire after 6 months, at which point you'll be asked to confirm them again.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10 whitespace-nowrap"
              onClick={declineCookies}
            >
              Essential Only
            </Button>
            <Link href="/cookie-preferences">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 whitespace-nowrap">
                Customize
              </Button>
            </Link>
            <Button
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium whitespace-nowrap"
              onClick={acceptCookies}
            >
              Accept All
            </Button>
          </div>
          <button
            onClick={() => setShowConsent(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  )
}
