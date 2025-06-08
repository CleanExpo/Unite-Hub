import { Metadata } from 'next';
import InnovationFrameworkDashboard from '@/components/innovation/InnovationFrameworkDashboard';

export const metadata: Metadata = {
  title: 'Innovation Framework | Unite Group',
  description: 'AI-powered innovation management and market validation dashboard',
};

export default function InnovationPage() {
  return <InnovationFrameworkDashboard />;
}
