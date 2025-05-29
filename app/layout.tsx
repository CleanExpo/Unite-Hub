export const metadata = {
  title: "Auto AGI Builder",
  description: "Auto AGI Builder",
  generator: "v0.dev",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import "./globals.css";
