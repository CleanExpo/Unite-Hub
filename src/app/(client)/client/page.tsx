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
      description: 'Share your project ideas through voice, text, or video. Our AI will analyse and create detailed proposals.',
      icon: Lightbulb,
      href: '/client/ideas',
      iconColor: 'text-[#FFB800]',
    },
    {
      title: 'Track Projects',
      description: 'Monitor your project progress in real-time with detailed timelines and milestone tracking.',
      icon: FolderKanban,
      href: '/client/projects',
      iconColor: 'text-[#00F5FF]',
    },
    {
      title: 'Digital Vault',
      description: 'Securely store API keys, credentials, and sensitive information for your projects.',
      icon: Lock,
      href: '/client/vault',
      iconColor: 'text-[#00FF88]',
    },
    {
      title: 'AI Assistant',
      description: 'Get instant answers about your projects, ideas, and proposals from our AI assistant.',
      icon: Bot,
      href: '/client/assistant',
      iconColor: 'text-[#FF00FF]',
    },
  ];

  return (
    <PageContainer>
      <Section>
        {/* Hero section */}
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold text-white mb-4 font-mono">
            Welcome to Unite-Group
          </h1>
          <p className="text-xl text-white/40 max-w-2xl mx-auto font-mono">
            Transform your ideas into reality with AI-powered project management and intelligent assistance.
          </p>
        </div>
      </Section>

      <Section>

      {/* Feature cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;

          return (
            <Card key={feature.href} variant="glass">
              <Link href={feature.href}>
                <div className="p-6 hover:bg-white/[0.02] transition-colors cursor-pointer">
                  {/* Icon */}
                  <div className="inline-flex p-3 bg-white/[0.04] border border-white/[0.06] rounded-sm mb-4">
                    <Icon className={`h-6 w-6 ${feature.iconColor}`} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-2 font-mono">
                    {feature.title}
                  </h3>
                  <p className="text-white/40 mb-4 font-mono text-sm">
                    {feature.description}
                  </p>

                  {/* Action link */}
                  <div className="flex items-center text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors">
                    <span className="text-sm font-medium font-mono">Get started</span>
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
          <h2 className="text-xl font-semibold text-white mb-6 font-mono">
            Your Activity
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-white/40 mb-1 font-mono">Ideas Submitted</p>
              <p className="text-3xl font-bold text-white font-mono">0</p>
            </div>
            <div>
              <p className="text-sm text-white/40 mb-1 font-mono">Active Projects</p>
              <p className="text-3xl font-bold text-white font-mono">0</p>
            </div>
            <div>
              <p className="text-sm text-white/40 mb-1 font-mono">Vault Entries</p>
              <p className="text-3xl font-bold text-white font-mono">0</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Getting started */}
      <div className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-sm">
        <h2 className="text-xl font-semibold text-white mb-4 font-mono">
          Getting Started
        </h2>
        <p className="text-white/60 mb-6 font-mono text-sm">
          Ready to bring your ideas to life? Start by submitting your first project idea and let our AI create a detailed proposal for you.
        </p>
        <Link href="/client/ideas">
          <Button leftIcon={<Lightbulb className="h-4 w-4" />}>
            Submit Your First Idea
          </Button>
        </Link>
      </div>
      </Section>
    </PageContainer>
  );
}
