import { Metadata } from 'next';
import AdvancedFinancialIntelligenceDashboard from '@/components/cognitive/AdvancedFinancialIntelligenceDashboard';

export const metadata: Metadata = {
  title: 'Advanced Financial Intelligence | Unite Group Dashboard',
  description: 'AI-powered budget planning, cash flow prediction, cost optimization, and investment analysis',
};

export default function FinancialIntelligencePage() {
  return (
    <div className="container mx-auto p-6">
      <AdvancedFinancialIntelligenceDashboard />
    </div>
  );
}
