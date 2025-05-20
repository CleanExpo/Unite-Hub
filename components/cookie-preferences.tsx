"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { Info, Check, Calendar } from "lucide-react"
import Link from "next/link"

// Define the consent expiration period (6 months in milliseconds)
const CONSENT_EXPIRATION_MS = 6 * 30 * 24 * 60 * 60 * 1000 // ~6 months

type CookiePreferences = {
  essential: boolean
  analytics: boolean
  marketing: boolean
  functional: boolean
}

export function CookiePreferences() {
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Essential cookies are always enabled
    analytics: false,
    marketing: false,
    functional: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [expirationDate, setExpirationDate] = useState<string>("")

  // Load saved preferences from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check for detailed preferences
      const savedPreferences = localStorage.getItem("cookie-preferences")

      // Check for consent data with timestamp
      const consentData = localStorage.getItem("cookie-consent-data")

      if (consentData) {
        try {
          const { timestamp } = JSON.parse(consentData)
          const expirationTimestamp = timestamp + CONSENT_EXPIRATION_MS
          const expirationDateObj = new Date(expirationTimestamp)

          // Format the expiration date
          setExpirationDate(
            expirationDateObj.toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          )
        } catch (error) {
          console.error("Error parsing consent data:", error)
        }
      }

      if (savedPreferences) {
        try {
          const parsedPreferences = JSON.parse(savedPreferences)
          setPreferences({
            ...preferences,
            ...parsedPreferences,
            essential: true, // Essential cookies are always enabled
          })
        } catch (error) {
          console.error("Error parsing cookie preferences:", error)
        }
      } else {
        // If no preferences are saved, check if consent was given
        const consent = localStorage.getItem("cookie-consent")
        if (consent === "true") {
          // If user accepted all cookies previously
          setPreferences({
            essential: true,
            analytics: true,
            marketing: true,
            functional: true,
          })
        } else if (consent === "essential") {
          // If user only accepted essential cookies
          setPreferences({
            essential: true,
            analytics: false,
            marketing: false,
            functional: false,
          })
        }
      }
    }
  }, [])

  const handleToggle = (type: keyof CookiePreferences) => {
    if (type === "essential") return // Essential cookies cannot be disabled

    setPreferences((prev) => ({
      ...prev,
      [type]: !prev[type],
    }))
  }

  const handleAcceptAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    })
  }

  const handleEssentialOnly = () => {
    setPreferences({
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    })
  }

  const savePreferences = () => {
    setIsSaving(true)

    try {
      // Save detailed preferences
      localStorage.setItem("cookie-preferences", JSON.stringify(preferences))

      // Get current timestamp for expiration calculation
      const timestamp = new Date().getTime()

      // Update the main consent flag based on preferences
      const consentValue =
        preferences.analytics || preferences.marketing || preferences.functional ? "true" : "essential"

      // Save consent data with timestamp
      const consentData = {
        consent: consentValue,
        timestamp: timestamp,
      }
      localStorage.setItem("cookie-consent-data", JSON.stringify(consentData))

      // Update legacy consent value for backward compatibility
      localStorage.setItem("cookie-consent", consentValue)

      // Update expiration date display
      const expirationTimestamp = timestamp + CONSENT_EXPIRATION_MS
      const expirationDateObj = new Date(expirationTimestamp)
      setExpirationDate(
        expirationDateObj.toLocaleDateString(undefined, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      )

      toast({
        title: "Preferences Saved",
        description: "Your cookie preferences have been updated successfully.",
      })
    } catch (error) {
      console.error("Error saving cookie preferences:", error)
      toast({
        title: "Error",
        description: "Failed to save your cookie preferences.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Cookie Preferences</h2>
        <p className="text-gray-300">
          Manage how we use cookies on this website. Essential cookies are always enabled as they are necessary for the
          website to function properly.
        </p>
        <p className="text-gray-400 text-sm">
          Learn more about how we use cookies in our{" "}
          <Link href="/cookies" className="text-[#4ecdc4] hover:underline">
            Cookie Policy
          </Link>
          .
        </p>

        {expirationDate && (
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
            <Calendar className="h-4 w-4" />
            <span>Your preferences will expire on {expirationDate}</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Essential Cookies */}
        <div className="flex items-start justify-between p-4 rounded-lg bg-gradient-to-r from-[#002a42] to-[#00395d] border border-[#4ecdc4]/20">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">Essential Cookies</h3>
              <span className="px-2 py-0.5 text-xs rounded-full bg-[#4ecdc4]/20 text-[#4ecdc4] border border-[#4ecdc4]/30">
                Required
              </span>
            </div>
            <p className="text-sm text-gray-300">
              These cookies are necessary for the website to function and cannot be switched off.
            </p>
          </div>
          <Switch checked={preferences.essential} disabled className="data-[state=checked]:bg-[#4ecdc4]" />
        </div>

        {/* Analytics Cookies */}
        <div className="flex items-start justify-between p-4 rounded-lg bg-[#001428] border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="space-y-1">
            <h3 className="font-medium text-white">Analytics Cookies</h3>
            <p className="text-sm text-gray-300">
              These cookies allow us to count visits and traffic sources so we can measure and improve the performance
              of our site.
            </p>
          </div>
          <Switch
            checked={preferences.analytics}
            onCheckedChange={() => handleToggle("analytics")}
            className="data-[state=checked]:bg-[#4ecdc4]"
          />
        </div>

        {/* Marketing Cookies */}
        <div className="flex items-start justify-between p-4 rounded-lg bg-[#001428] border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="space-y-1">
            <h3 className="font-medium text-white">Marketing Cookies</h3>
            <p className="text-sm text-gray-300">
              These cookies help us show you relevant advertisements and may be used to limit the number of times you
              see an advertisement.
            </p>
          </div>
          <Switch
            checked={preferences.marketing}
            onCheckedChange={() => handleToggle("marketing")}
            className="data-[state=checked]:bg-[#4ecdc4]"
          />
        </div>

        {/* Functional Cookies */}
        <div className="flex items-start justify-between p-4 rounded-lg bg-[#001428] border border-gray-700 hover:border-gray-600 transition-colors">
          <div className="space-y-1">
            <h3 className="font-medium text-white">Functional Cookies</h3>
            <p className="text-sm text-gray-300">
              These cookies enable personalized features and functionality, such as remembering your preferences and
              settings.
            </p>
          </div>
          <Switch
            checked={preferences.functional}
            onCheckedChange={() => handleToggle("functional")}
            className="data-[state=checked]:bg-[#4ecdc4]"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          onClick={savePreferences}
          className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428] font-medium"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <div className="animate-spin mr-2 h-4 w-4 border-2 border-[#001428] border-t-transparent rounded-full" />
              Saving...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" /> Save Preferences
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={handleAcceptAll}
          className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
        >
          Accept All
        </Button>
        <Button
          variant="outline"
          onClick={handleEssentialOnly}
          className="border-gray-600 text-gray-300 hover:bg-gray-800"
        >
          Essential Only
        </Button>
      </div>

      <div className="mt-6 p-4 rounded-lg bg-[#002a42] border border-[#4ecdc4]/20 flex items-start gap-3">
        <Info className="h-5 w-5 text-[#4ecdc4] mt-0.5 flex-shrink-0" />
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            Changes to your cookie preferences will take effect immediately. Some features of the site may not function
            properly if you disable certain cookies.
          </p>
          <p>
            <strong className="text-[#4ecdc4]">Note:</strong> Your cookie preferences will expire after 6 months, at
            which point you'll be asked to confirm them again.
          </p>
        </div>
      </div>
    </div>
  )
}
