// Define the supported locales
export const locales = ['en', 'es', 'fr'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale = 'en';

// Create a function to load messages
export async function getMessages(locale: Locale) {
  try {
    return (await import(`../../public/locales/${locale}/common.json`)).default;
  } catch (error: unknown) {
    console.error(`Could not load messages for locale: ${locale}`, error);
    // Fallback to default locale
    return (await import(`../../public/locales/${defaultLocale}/common.json`)).default;
  }
}

// Helper function to detect browser locale
export function getBrowserLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  
  const browserLocale = navigator.language.split('-')[0];
  return (locales.includes(browserLocale as Locale) ? browserLocale : defaultLocale) as Locale;
}

// Locale display names for the language switcher
export const localeDisplayNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};
