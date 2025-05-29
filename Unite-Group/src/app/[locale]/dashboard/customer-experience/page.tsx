import { Metadata } from 'next';
import AutonomousCustomerExperienceDashboard from '@/components/cognitive/AutonomousCustomerExperienceDashboard';

export const metadata: Metadata = {
  title: 'Autonomous Customer Experience | Unite Group Dashboard',
  description: 'AI-powered journey optimization, predictive support, and dynamic pricing engine',
};

export default function CustomerExperiencePage() {
  return (
    <div className="container mx-auto p-6">
      <AutonomousCustomerExperienceDashboard />
    </div>
  );
}
