import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { UniteHubStructuredData } from "@/components/StructuredData";
import { CookieConsent } from "@/components/CookieConsent";

// Force all pages to be dynamically rendered at request time
// This is required because many pages use getSupabaseServer() which calls cookies()
export const dynamic = 'force-dynamic';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

// Optimized font loading with display swap
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const dmSans = DM_Sans({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Synthex - AI Marketing Platform for Small Businesses",
    template: "%s | Synthex"
  },
  description: "AI-powered marketing without the agency bill. Get website optimization, SEO, social media, and content creation automated for your small business. No retainer. No complexity.",
  keywords: ["AI marketing platform", "small business marketing", "AI SEO tools", "marketing automation", "local SEO", "social media automation", "AI copywriting", "affordable marketing"],
  authors: [{ name: "Synthex" }],
  creator: "Synthex",
  publisher: "Synthex",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://synthex.social'),
  openGraph: {
    title: "Synthex - AI Marketing Without the Agency Bill",
    description: "Finally, an AI platform built for REAL small businesses. Marketing, SEO, branding, and social media handled by AI.",
    url: 'https://synthex.social',
    siteName: 'Synthex',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Synthex - AI Marketing Platform',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synthex - AI Marketing for Small Businesses',
    description: 'Marketing automation without the complexity or agency costs',
    images: ['/og-image.png'],
    creator: '@synthexsocial',
    site: '@synthexsocial',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'android-chrome-192x192',
        url: '/android-chrome-192x192.png',
      },
      {
        rel: 'android-chrome-512x512',
        url: '/android-chrome-512x512.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <UniteHubStructuredData />
      </head>
      <body className={`${inter.variable} ${dmSans.variable} antialiased`}>
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
