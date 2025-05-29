import { Metadata } from 'next';
import CognitiveBusinessIntelligenceDashboard from '@/components/cognitive/CognitiveBusinessIntelligenceDashboard';

export const metadata: Metadata = {
  title: 'Cognitive Business Intelligence | Unite Group Dashboard',
  description: 'Version 14.0 AI-powered predictive analytics with 95%+ accuracy revenue forecasting',
};

export default function CognitiveIntelligencePage() {
  return (
    <div className="container mx-auto p-6">
      <CognitiveBusinessIntelligenceDashboard />
    </div>
  );
}
