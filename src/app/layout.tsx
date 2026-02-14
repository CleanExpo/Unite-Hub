import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Unite-Hub | Business Hub - AI-Powered Business Management",
    template: "%s | Unite-Hub"
  },
  description: "Unite-Hub is your AI-powered Business Hub. Manage contacts, deals, campaigns, and operations across all your businesses from one intelligent dashboard.",
  keywords: ["business hub", "CRM", "AI business management", "contact management", "deal pipeline", "business operations"],
  authors: [{ name: "Unite-Hub" }],
  creator: "Unite-Hub",
  publisher: "Unite-Hub",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com'),
  openGraph: {
    title: "Unite-Hub | Your AI-Powered Business Hub",
    description: "Manage contacts, deals, campaigns, and operations across all your businesses from one intelligent dashboard.",
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com',
    siteName: 'Unite-Hub',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Unite-Hub - AI-Powered Business Hub',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unite-Hub | AI-Powered Business Hub',
    description: 'Manage your businesses from one intelligent dashboard',
    images: ['/og-image.png'],
    creator: '@unitehub',
    site: '@unitehub',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          {children}
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
