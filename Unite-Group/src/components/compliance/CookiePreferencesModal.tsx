"use client";

import { useState, useEffect } from 'react';
import { CookieConsentFormData } from '@/lib/compliance/types';

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consent: CookieConsentFormData) => Promise<void>;
  initialPreferences?: CookieConsentFormData;
}

/**
 * Modal dialog for configuring detailed cookie preferences
 * Provides information about each cookie category and allows selective consent
 */
export default function CookiePreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialPreferences = {
    preferences: false,
    analytics: false,
    marketing: false
  }
}: CookiePreferencesModalProps) {
  const [preferences, setPreferences] = useState<CookieConsentFormData>({
    preferences: initialPreferences.preferences,
    analytics: initialPreferences.analytics,
    marketing: initialPreferences.marketing
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update preferences when initialPreferences changes
  useEffect(() => {
    setPreferences({
      preferences: initialPreferences.preferences,
      analytics: initialPreferences.analytics,
      marketing: initialPreferences.marketing
    });
  }, [initialPreferences]);

  const handleSave = async () => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSave(preferences);
      onClose();
    } catch (err: any) {
      console.error('Error saving cookie preferences:', err);
      setError(err.message || 'Failed to save cookie preferences');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          aria-hidden="true"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div>
            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Cookie Preferences
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure your cookie preferences. Necessary cookies are always enabled as they are essential for the website to function properly.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 space-y-6">
            {/* Necessary cookies - always enabled */}
            <div className="relative flex items-start border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center h-5">
                <input
                  id="necessary"
                  name="necessary"
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="necessary" className="font-medium text-gray-700 dark:text-gray-300">
                  Necessary Cookies
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  These cookies are required for the website to function and cannot be switched off. They are usually only set in response to actions made by you which amount to a request for services, such as setting your privacy preferences, logging in or filling in forms.
                </p>
              </div>
            </div>

            {/* Preferences cookies */}
            <div className="relative flex items-start border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center h-5">
                <input
                  id="preferences"
                  name="preferences"
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="preferences" className="font-medium text-gray-700 dark:text-gray-300">
                  Preferences Cookies
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers whose services we have added to our pages. If you do not allow these cookies, some or all of these services may not function properly.
                </p>
              </div>
            </div>

            {/* Analytics cookies */}
            <div className="relative flex items-start border-b border-gray-200 dark:border-gray-700 pb-4">
              <div className="flex items-center h-5">
                <input
                  id="analytics"
                  name="analytics"
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="analytics" className="font-medium text-gray-700 dark:text-gray-300">
                  Analytics Cookies
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us to know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and anonymous.
                </p>
              </div>
            </div>

            {/* Marketing cookies */}
            <div className="relative flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="marketing"
                  name="marketing"
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="marketing" className="font-medium text-gray-700 dark:text-gray-300">
                  Marketing Cookies
                </label>
                <p className="text-gray-500 dark:text-gray-400">
                  These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites. They do not store directly personal information, but are based on uniquely identifying your browser and internet device.
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:col-start-2 sm:text-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Preferences'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:col-start-1 sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
