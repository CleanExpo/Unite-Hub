import { Metadata } from 'next';
import { ExperimentsDashboard } from '@/components/experiments/ExperimentsDashboard';

export const metadata: Metadata = {
  title: 'A/B Testing Dashboard | Unite Group',
  description: 'Manage and analyze A/B testing experiments',
};

export default function ExperimentsPage() {
  return <ExperimentsDashboard />;
}
