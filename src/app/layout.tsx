import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { UniteHubStructuredData } from "@/components/StructuredData";

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
    default: 'Unite-Group — AI-Powered CRM for Australian SMEs',
    template: '%s | Unite-Group',
  },
  description: 'Unite-Group is an AI-powered CRM built for Australian SMEs. Manage contacts, deals, campaigns and analytics across all your businesses in one hub.',
  keywords: [
    'CRM Australia',
    'AI CRM',
    'small business CRM',
    'Australian SME software',
    'business management platform',
    'deal pipeline',
    'contact management',
    'email automation',
    'campaign management',
    'AI business intelligence',
    'multi-business CRM',
    'sales automation Australia',
  ],
  authors: [{ name: 'Unite-Group' }],
  creator: 'Unite-Group',
  publisher: 'Unite-Group',
  metadataBase: new URL('https://unite-group.in'),
  alternates: {
    canonical: 'https://unite-group.in',
    languages: {
      'en-AU': 'https://unite-group.in',
    },
  },
  openGraph: {
    type: 'website',
    title: 'Unite-Group — AI-Powered CRM for Australian SMEs',
    description: 'Manage contacts, deals, campaigns and analytics across all your businesses from one intelligent dashboard. Built for Australian SMEs.',
    url: 'https://unite-group.in',
    siteName: 'Unite-Group',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Unite-Hub — AI-Powered CRM for Australian SMEs',
      },
    ],
    locale: 'en_AU',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@unitegroup',
    title: 'Unite-Group — AI-Powered CRM for Australian SMEs',
    description: 'AI-powered CRM built for Australian SMEs. Manage contacts, deals, campaigns and analytics in one hub.',
    images: ['/og-image.png'],
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
        </Providers>
      </body>
    </html>
  );
}
