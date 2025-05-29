import { Inter } from 'next/font/google';
import '../globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import PWAInitializer from '@/lib/pwa/PWAInitializer';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import { defaultMetadata, viewport } from '@/lib/metadata';
import type { Metadata } from 'next';

// Import client components dynamically
const ClientWrapper = dynamic(() => import('../../components/ClientWrapper'), {
  ssr: false
});

// Import the Navigation component dynamically with SSR disabled to avoid client/server mismatch issues
const Navigation = dynamic(() => import('../../components/Navigation'), { 
  ssr: false 
});

const inter = Inter({ subsets: ['latin'] });

// Export metadata and viewport for this layout to fix Next.js 14 warnings
export const metadata: Metadata = defaultMetadata;
export { viewport };

export async function generateStaticParams() {
  return [
    { locale: 'en' },
    { locale: 'es' },
    { locale: 'fr' }
  ];
}

export default function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Validate that the locale is supported
  const supportedLocales = ['en', 'es', 'fr'];
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  // Set the HTML lang attribute for accessibility
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientWrapper>
            <Navigation />
            <main>{children}</main>
          </ClientWrapper>
        </ThemeProvider>
        <PWAInitializer />
      </body>
    </html>
  );
}
