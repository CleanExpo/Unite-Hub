import { Metadata } from 'next';
import QuantumGenerativeAIDashboard from '@/components/quantum/QuantumGenerativeAIDashboard';

export const metadata: Metadata = {
  title: 'Quantum Generative AI | Unite Group Dashboard',
  description: 'Revolutionary content creation with quantum-enhanced AI capabilities - Generate images, videos, and audio with unprecedented speed and quality.',
  keywords: ['quantum AI', 'generative AI', 'content creation', 'image generation', 'video generation', 'audio generation', 'SaaS platform'],
};

/**
 * Quantum Generative AI Dashboard Page
 * Revolutionary content creation interface with quantum-enhanced capabilities
 */
export default function QuantumGenerativeAIPage() {
  return (
    <div className="container mx-auto py-6 px-4">
      <QuantumGenerativeAIDashboard />
    </div>
  );
}
