import { Metadata } from 'next';
import QuantumAGIDashboard from '@/components/agi/QuantumAGIDashboard';

export const metadata: Metadata = {
  title: 'Quantum AGI | Unite Group Dashboard',
  description: 'Revolutionary business problem-solving with Artificial General Intelligence - Solve any business challenge with quantum-enhanced AGI capabilities.',
  keywords: ['AGI', 'artificial general intelligence', 'quantum computing', 'business solutions', 'problem solving', 'AI automation', 'SaaS platform'],
};

/**
 * Quantum AGI Dashboard Page
 * Revolutionary interface for Artificial General Intelligence business problem solving
 */
export default function QuantumAGIPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <QuantumAGIDashboard />
    </div>
  );
}
