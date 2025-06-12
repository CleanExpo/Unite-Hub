import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import PWAInitializer from '@/lib/pwa/PWAInitializer';
import dynamic from 'next/dynamic';
import { defaultMetadata, viewport } from '@/lib/metadata';
import type { Metadata } from 'next';

// Import client components dynamically (Next.js 15 compatible)
const ClientWrapper = dynamic(() => import('../components/ClientWrapper'));

// Import the Navigation component dynamically
const Navigation = dynamic(() => import('../components/Navigation'));
// Import the Footer component dynamically
const Footer = dynamic(() => import('../components/Footer'));
// Import ChatWidget wrapper for client-side rendering
import ChatWidgetWrapper from '../components/chat/ChatWidgetWrapper';

const inter = Inter({ subsets: ['latin'] });

// Export metadata and viewport for this layout to fix Next.js 14 warnings
export const metadata: Metadata = defaultMetadata;
export { viewport };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Set the HTML lang attribute to English
  return (
    <html lang="en" suppressHydrationWarning>
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
            <Footer />
            <ChatWidgetWrapper />
          </ClientWrapper>
        </ThemeProvider>
        <PWAInitializer />
      </body>
    </html>
  );
}
