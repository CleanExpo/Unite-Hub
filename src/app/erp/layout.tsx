import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ERP System | Unite-Hub',
  description: 'Complete business management suite for inventory, sales, and operations',
};

export default function ERPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
