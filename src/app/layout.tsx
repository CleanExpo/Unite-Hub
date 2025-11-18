import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { UniteHubStructuredData } from "@/components/StructuredData";

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
    default: "Unite-Hub | AI-Powered CRM & Marketing Automation",
    template: "%s | Unite-Hub"
  },
  description: "AI-first customer relationship and marketing automation platform. Manage contacts, automate campaigns, and grow your business with intelligent AI agents.",
  keywords: ["CRM", "AI", "Marketing Automation", "Contact Management", "Email Campaigns", "Lead Scoring", "Business Growth"],
  authors: [{ name: "Unite-Hub" }],
  creator: "Unite-Hub",
  publisher: "Unite-Hub",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://unite-hub.com'),
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  openGraph: {
    title: "Unite-Hub - AI-Powered CRM & Marketing Automation",
    description: "Transform your customer relationships with AI-powered automation, intelligent lead scoring, and personalized campaigns.",
    url: 'https://unite-hub.com',
    siteName: 'Unite-Hub',
    images: [
      {
        url: '/logos/unite-hub-logo.png',
        width: 1200,
        height: 630,
        alt: 'Unite-Hub Logo',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Unite-Hub - AI-Powered CRM',
    description: 'Transform your customer relationships with AI-powered automation',
    images: ['/logos/unite-hub-logo.png'],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
