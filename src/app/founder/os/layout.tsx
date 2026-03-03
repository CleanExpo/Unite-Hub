import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  manifest: "/founder-os-manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Phill OS",
  },
};

export const viewport: Viewport = {
  themeColor: "#00d4ff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PhillOSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
