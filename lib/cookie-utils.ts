// Define the consent expiration period (6 months in milliseconds)
export const CONSENT_EXPIRATION_MS = 6 * 30 * 24 * 60 * 60 * 1000 // ~6 months

/**
 * Checks if the cookie consent has expired
 * @returns {boolean} True if consent has expired or doesn't exist, false otherwise
 */
export function hasConsentExpired(): boolean {
  if (typeof window === "undefined") return true

  const consentData = localStorage.getItem("cookie-consent-data")

  if (!consentData) return true

  try {
    const { timestamp } = JSON.parse(consentData)
    const currentTime = new Date().getTime()

    // Check if consent has expired
    return currentTime - timestamp > CONSENT_EXPIRATION_MS
  } catch (error) {
    console.error("Error parsing cookie consent data:", error)
    return true
  }
}

/**
 * Gets the expiration date of the current cookie consent
 * @returns {Date | null} The expiration date or null if no consent exists
 */
export function getConsentExpirationDate(): Date | null {
  if (typeof window === "undefined") return null

  const consentData = localStorage.getItem("cookie-consent-data")

  if (!consentData) return null

  try {
    const { timestamp } = JSON.parse(consentData)
    return new Date(timestamp + CONSENT_EXPIRATION_MS)
  } catch (error) {
    console.error("Error parsing cookie consent data:", error)
    return null
  }
}

/**
 * Saves cookie consent with expiration timestamp
 * @param {string} consentType - The type of consent ("true" for all, "essential" for essential only)
 */
export function saveConsentWithExpiration(consentType: string): void {
  if (typeof window === "undefined") return

  const timestamp = new Date().getTime()

  const consentData = {
    consent: consentType,
    timestamp: timestamp,
  }

  localStorage.setItem("cookie-consent-data", JSON.stringify(consentData))
  localStorage.setItem("cookie-consent", consentType) // For backward compatibility
}
