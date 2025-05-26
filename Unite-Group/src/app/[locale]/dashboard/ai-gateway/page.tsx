/**
 * AI Gateway Dashboard Page
 * Unite Group - AI Gateway Management Interface
 */

import { Metadata } from 'next';
import AIGatewayDashboard from '@/components/ai/AIGatewayDashboard';

export const metadata: Metadata = {
  title: 'AI Gateway Dashboard | Unite Group',
  description: 'Monitor and manage your AI provider infrastructure with real-time metrics, performance analytics, and intelligent routing controls.',
  keywords: [
    'AI Gateway',
    'AI Monitoring',
    'Provider Management',
    'Performance Analytics',
    'AI Infrastructure',
    'Route Management',
    'AI Security',
    'Cost Optimization'
  ]
};

export default function AIGatewayPage() {
  return (
    <div className="container mx-auto py-6">
      <AIGatewayDashboard />
    </div>
  );
}
