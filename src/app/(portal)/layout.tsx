import { ClientPortalLayout } from "@/components/layout/ClientPortalLayout";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary>
      <ClientPortalLayout>{children}</ClientPortalLayout>
    </ErrorBoundary>
  );
}
