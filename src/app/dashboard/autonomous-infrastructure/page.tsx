import { Metadata } from 'next';
import AutonomousInfrastructureDashboard from '@/components/autonomous/AutonomousInfrastructureDashboard';

export const metadata: Metadata = {
  title: 'Autonomous Infrastructure | Unite Group Dashboard',
  description: 'Version 14.0 AI-powered self-healing infrastructure monitoring and management',
};

export default function AutonomousInfrastructurePage() {
  return (
    <div className="container mx-auto p-6">
      <AutonomousInfrastructureDashboard />
    </div>
  );
}
