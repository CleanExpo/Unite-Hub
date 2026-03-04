/**
 * Client Home Page - Phase 2 Step 3
 *
 * Landing page for client portal with feature overview
 * Will be enhanced in Phase 2 Step 4
 */

import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, FolderKanban, Lock, Bot, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function ClientHomePage() {
  const features = [
    {
      title: 'Submit Ideas',
      description: 'Share your project ideas through voice, text, or video. Our AI will analyze and create detailed proposals.',
      icon: Lightbulb,
      href: '/client/ideas',
      color: 'yellow',
    },
    {
      title: 'Track Projects',
      description: 'Monitor your project progress in real-time with detailed timelines and milestone tracking.',
      icon: FolderKanban,
      href: '/client/projects',
      color: 'blue',
    },
    {
      title: 'Digital Vault',
      description: 'Securely store API keys, credentials, and sensitive information for your projects.',
      icon: Lock,
      href: '/client/vault',
      color: 'green',
    },
    {
      title: 'AI Assistant',
      description: 'Get instant answers about your projects, ideas, and proposals from our AI assistant.',
      icon: Bot,
      href: '/client/assistant',
      color: 'purple',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string }> = {
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  };

  return (
    <PageContainer>
      <Section>
        {/* Hero section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-gray-100 mb-4">
            Welcome to Unite-Hub
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Transform your ideas into reality with AI-powered project management and intelligent assistance.
          </p>
        </div>
      </Section>

      <Section>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          const colors = colorClasses[feature.color];

          return (
            <Card key={feature.href} variant="glass">
              <Link href={feature.href}>
                <div className="p-6 hover:bg-gray-800/30 transition-colors cursor-pointer">
                  {/* Icon */}
                  <div className={`inline-flex p-3 rounded-lg ${colors.bg} mb-4`}>
                    <Icon className={`h-6 w-6 ${colors.text}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-gray-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {feature.description}
                  </p>

                  {/* Action link */}
                  <div className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                    <span className="text-sm font-medium">Get started</span>
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                </div>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Quick stats */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">
            Your Activity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Ideas Submitted</p>
              <p className="text-3xl font-bold text-gray-100">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Active Projects</p>
              <p className="text-3xl font-bold text-gray-100">0</p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Vault Entries</p>
              <p className="text-3xl font-bold text-gray-100">0</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Getting started */}
      <Card variant="gradient">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
            Getting Started
          </h2>
          <p className="text-gray-300 mb-6">
            Ready to bring your ideas to life? Start by submitting your first project idea and let our AI create a detailed proposal for you.
          </p>
          <Link href="/client/ideas">
            <Button leftIcon={<Lightbulb className="h-4 w-4" />}>
              Submit Your First Idea
            </Button>
          </Link>
        </div>
      </Card>
      </Section>
    </PageContainer>
  );
}
