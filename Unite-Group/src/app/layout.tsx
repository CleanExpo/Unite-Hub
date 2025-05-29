import { defaultMetadata, viewport } from "@/lib/metadata"
import type { Metadata } from "next"
import { redirect } from 'next/navigation';
import { defaultLocale } from '@/i18n';

export const metadata: Metadata = defaultMetadata;
export { viewport };

// Root layout redirects to the default locale
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  redirect(`/${defaultLocale}`);
  
  // This return is necessary for TypeScript, but it will never be rendered
  return <>{children}</>;
}
