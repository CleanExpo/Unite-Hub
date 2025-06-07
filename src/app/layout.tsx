import { defaultMetadata, viewport } from "@/lib/metadata"
import type { Metadata } from "next"

export const metadata: Metadata = defaultMetadata;
export { viewport };

// Root layout - minimal wrapper that allows middleware to handle locale routing
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
