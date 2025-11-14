export default function ModernDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Standalone layout - no authentication wrapper
  return <>{children}</>;
}
