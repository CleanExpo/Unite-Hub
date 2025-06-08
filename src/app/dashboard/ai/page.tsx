/**
 * AI Dashboard Page
 * Route: /dashboard/ai
 */

import { AIDashboard } from '@/components/ai/Dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Dashboard | Unite Group',
  description: 'Real-time monitoring and control center for AI systems',
};

export default function AIDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <AIDashboard />
    </div>
  );
}
