/**
 * Root Layout - Phase 2 Step 3
 *
 * Shared layout wrapper for all routes under next/app/
 * Provides HTML structure, metadata, and global providers
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unite-Hub - AI-First CRM & Marketing Automation',
  description: 'Production-ready CRM with intelligent AI routing, email automation, and client management',
  keywords: ['CRM', 'AI', 'Marketing Automation', 'Email', 'Client Management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
