"use client";

/**
 * Cookie Consent Banner
 *
 * P0-005: GDPR/Privacy Compliance
 * Displays cookie consent banner and manages consent state
 */

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, X, Settings, Check } from "lucide-react";
import Link from "next/link";

const COOKIE_CONSENT_KEY = "unite-hub-cookie-consent";
const CONSENT_VERSION = "1.0"; // Increment when privacy policy changes

export type ConsentPreferences = {
  necessary: boolean; // Always true, can't be disabled
  analytics: boolean;
  marketing: boolean;
  version: string;
  timestamp: string;
};

const DEFAULT_PREFERENCES: ConsentPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  version: CONSENT_VERSION,
  timestamp: new Date().toISOString(),
};

/**
 * Get current consent preferences from storage
 */
export function getConsentPreferences(): ConsentPreferences | null {
  if (typeof window === "undefined") {
return null;
}

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
return null;
}

    const preferences = JSON.parse(stored) as ConsentPreferences;

    // Check if consent version is outdated
    if (preferences.version !== CONSENT_VERSION) {
      return null; // Re-request consent for new version
    }

    return preferences;
  } catch {
    return null;
  }
}

/**
 * Save consent preferences to storage
 */
export function saveConsentPreferences(preferences: ConsentPreferences): void {
  if (typeof window === "undefined") {
return;
}

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));

    // Dispatch event so other components can react
    window.dispatchEvent(
      new CustomEvent("cookie-consent-change", { detail: preferences })
    );
  } catch {
    console.error("Failed to save cookie consent preferences");
  }
}

/**
 * Check if analytics consent is given
 */
export function hasAnalyticsConsent(): boolean {
  const preferences = getConsentPreferences();
  return preferences?.analytics ?? false;
}

/**
 * Check if marketing consent is given
 */
export function hasMarketingConsent(): boolean {
  const preferences = getConsentPreferences();
  return preferences?.marketing ?? false;
}

/**
 * Cookie Consent Banner Component
 */
export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(DEFAULT_PREFERENCES);

  // Check for existing consent on mount
  useEffect(() => {
    const existing = getConsentPreferences();
    if (!existing) {
      setShowBanner(true);
    } else {
      setPreferences(existing);
    }
  }, []);

  const handleAcceptAll = () => {
    const newPreferences: ConsentPreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    saveConsentPreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    setShowSettings(false);

    // Initialize analytics after consent
    initializeAnalytics();
  };

  const handleAcceptNecessary = () => {
    const newPreferences: ConsentPreferences = {
      necessary: true,
      analytics: false,
      marketing: false,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    saveConsentPreferences(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    setShowSettings(false);
  };

  const handleSavePreferences = () => {
    const newPreferences: ConsentPreferences = {
      ...preferences,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };
    saveConsentPreferences(newPreferences);
    setShowBanner(false);
    setShowSettings(false);

    // Initialize analytics if consented
    if (newPreferences.analytics) {
      initializeAnalytics();
    }
  };

  const initializeAnalytics = () => {
    // Load Google Analytics or other analytics scripts here
    // Only called after user consents to analytics cookies
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_GA_ID) {
      // GA4 initialization would go here
      console.log("[Analytics] Initializing after consent");
    }
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="max-w-2xl mx-auto shadow-lg border-2">
        <CardContent className="p-4">
          {!showSettings ? (
            // Main Banner
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-start gap-3 flex-1">
                <Cookie className="w-6 h-6 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Cookie Preferences</p>
                  <p className="text-sm text-muted-foreground">
                    We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{" "}
                    <Link href="/privacy" className="underline hover:text-foreground">
                      Learn more
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Customize
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAcceptNecessary}
                >
                  Necessary Only
                </Button>
                <Button size="sm" onClick={handleAcceptAll}>
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cookie className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-medium">Cookie Settings</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-3">
                {/* Necessary Cookies */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium text-sm">Necessary Cookies</p>
                    <p className="text-xs text-muted-foreground">
                      Required for the website to function properly
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-muted-foreground">Always on</span>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="flex items-center justify-between py-2 border-b">
                  <div>
                    <p className="font-medium text-sm">Analytics Cookies</p>
                    <p className="text-xs text-muted-foreground">
                      Help us understand how visitors interact with our website
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.analytics}
                      onChange={(e) =>
                        setPreferences({ ...preferences, analytics: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          preferences.analytics ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </div>
                  </label>
                </div>

                {/* Marketing Cookies */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-sm">Marketing Cookies</p>
                    <p className="text-xs text-muted-foreground">
                      Used to deliver relevant advertisements
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={preferences.marketing}
                      onChange={(e) =>
                        setPreferences({ ...preferences, marketing: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary transition-colors">
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                          preferences.marketing ? "translate-x-5" : "translate-x-0.5"
                        } mt-0.5`}
                      />
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={handleAcceptNecessary}>
                  Reject All
                </Button>
                <Button size="sm" onClick={handleSavePreferences}>
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default CookieConsent;
