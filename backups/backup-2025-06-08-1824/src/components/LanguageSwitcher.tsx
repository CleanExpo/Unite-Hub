"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Locale, localeDisplayNames, locales } from '@/i18n';

interface LanguageSwitcherProps {
  currentLocale: Locale;
  className?: string;
}

export default function LanguageSwitcher({ currentLocale, className = '' }: LanguageSwitcherProps) {
  const pathname = usePathname();

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-4 px-2 py-1">
        {locales.map((locale) => (
          <Link 
            key={locale} 
            href={`/${locale}${pathname?.replace(/^\/[^\/]+/, '') || ''}`}
            className={`px-2 py-1 rounded ${
              locale === currentLocale 
                ? 'font-semibold bg-gray-100 dark:bg-gray-800' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-900'
            }`}
            onClick={() => {
              // Store the user's language preference
              if (typeof window !== 'undefined') {
                localStorage.setItem('preferredLanguage', locale);
              }
            }}
          >
            {localeDisplayNames[locale]}
          </Link>
        ))}
      </div>
    </div>
  );
}
