import type { Metadata } from "next";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: "Nexus — Unite Group",
  description: "Private founder CRM",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nonce = (await headers()).get('x-nonce') ?? '';

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body nonce={nonce}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
