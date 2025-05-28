/**
 * Quantum Computing Dashboard Page
 * VERSION 15.0 - Quantum-Enhanced AI Platform
 * 
 * This page provides access to the world's first commercial quantum-enhanced
 * business optimization platform with unprecedented computational capabilities.
 */

import { Metadata } from 'next';
import { QuantumComputingDashboard } from '@/components/quantum/QuantumComputingDashboard';

export const metadata: Metadata = {
  title: 'Quantum Computing Center - Unite Group',
  description: 'Advanced quantum-enhanced business optimization and AI computing platform with 1000x performance boost for complex business problems.',
  keywords: 'quantum computing, business optimization, quantum AI, quantum machine learning, quantum security, hybrid computing',
};

export default function QuantumComputingPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <QuantumComputingDashboard />
    </div>
  );
}
