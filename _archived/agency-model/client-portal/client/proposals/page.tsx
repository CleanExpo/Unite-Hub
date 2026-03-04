'use client';

/**
 * Client Proposals Page - Phase 3 Step 5
 *
 * Client-facing proposal selection interface where clients can:
 * 1. View AI-generated Good/Better/Best proposal packages
 * 2. Compare features, deliverables, and pricing
 * 3. Select a package to proceed with
 *
 * Following CLAUDE.md patterns:
 * - Client component with 'use client'
 * - Bearer token authentication
 * - Toast notifications for feedback
 * - Loading states and error handling
 * - Responsive design with shadcn/ui
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Check, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { ProposalComparison } from '@/components/client/ProposalComparison';
import { ProposalTierCard } from '@/components/client/ProposalTierCard';
import { getClientProposal, selectProposal } from '@/lib/services/client/proposalService';
import { useToast } from '@/contexts/ToastContext';
import type { ProposalScope } from '@/lib/projects/scope-planner';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default function ClientProposalsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Get ideaId from query params (e.g., /client/proposals?ideaId=uuid)
  const ideaId = searchParams.get('ideaId');

  // State
  const [proposal, setProposal] = useState<ProposalScope | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<'good' | 'better' | 'best' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'comparison'>('cards');

  // Load proposal on mount
  useEffect(() => {
    if (!ideaId) {
      setError('No idea selected. Please return to My Ideas and select a proposal to review.');
      setLoading(false);
      return;
    }

    loadProposal();
  }, [ideaId]);

  async function loadProposal() {
    if (!ideaId) return;

    try {
      setLoading(true);
      setError(null);

      const result = await getClientProposal(ideaId);

      if (!result.success) {
        setError(result.error || 'Failed to load proposal');
        return;
      }

      if (!result.proposal) {
        setError('No proposal found for this idea. Please contact support.');
        return;
      }

      setProposal(result.proposal);
    } catch (err) {
      console.error('Failed to load proposal:', err);
      setError('Failed to load proposal. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPackage(tier: 'good' | 'better' | 'best') {
    if (!ideaId || !proposal) return;

    try {
      setSubmitting(true);

      const selectedPackage = proposal.packages.find(pkg => pkg.tier === tier);
      if (!selectedPackage) {
        toast.error('Invalid package selection');
        return;
      }

      const result = await selectProposal({
        ideaId,
        tier,
        packageId: selectedPackage.id,
      });

      if (!result.success) {
        toast.error(result.error || 'Failed to select package');
        return;
      }

      toast.success('Package selected! Redirecting to next steps...');

      // Redirect to payment/project creation flow (Phase 3 Step 6+)
      setTimeout(() => {
        router.push(`/client/projects?new=true&tier=${tier}`);
      }, 1500);
    } catch (err) {
      console.error('Failed to select package:', err);
      toast.error('Failed to select package. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-gray-400">Loading your proposal...</p>
      </div>
    );
  }

  // Error state
  if (error || !proposal) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Proposal not found'}
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button
            onClick={() => router.push('/client/ideas')}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Return to My Ideas
          </Button>
        </div>
      </div>
    );
  }

  const isAIGenerated = proposal.metadata?.aiModel?.includes('Hybrid');
  const hasPackages = proposal.packages && proposal.packages.length > 0;

  return (
    <PageContainer>
      <Section>
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-gray-100">
              {proposal.idea.title}
            </h1>
          {isAIGenerated && (
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Generated
            </Badge>
          )}
        </div>
        <p className="text-gray-400">
          Review your proposal packages and select the best fit for your project
        </p>
      </div>
      </Section>

      <Section>

      {/* Proposal Overview */}
      {proposal.sections && proposal.sections.length > 0 && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardHeader>
            <CardTitle className="text-gray-100">Project Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {proposal.sections.map((section) => (
              <div key={section.id}>
                <h3 className="text-sm font-semibold text-gray-300 mb-1">
                  {section.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {section.description}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* View Mode Toggle */}
      {hasPackages && (
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-100">
            Choose Your Package
          </h2>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className={viewMode === 'cards' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
            >
              Cards View
            </Button>
            <Button
              variant={viewMode === 'comparison' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('comparison')}
              className={viewMode === 'comparison' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-700 text-gray-300 hover:bg-gray-800'}
            >
              Compare View
            </Button>
          </div>
        </div>
      )}

      {/* Package Cards View */}
      {viewMode === 'cards' && hasPackages && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {proposal.packages
            .sort((a, b) => {
              const order = { good: 1, better: 2, best: 3 };
              return order[a.tier] - order[b.tier];
            })
            .map((pkg) => (
              <ProposalTierCard
                key={pkg.id}
                package={pkg}
                selected={selectedTier === pkg.tier}
                onSelect={() => setSelectedTier(pkg.tier)}
                submitting={submitting}
                onConfirm={() => handleSelectPackage(pkg.tier)}
              />
            ))}
        </div>
      )}

      {/* Comparison Table View */}
      {viewMode === 'comparison' && hasPackages && (
        <ProposalComparison
          packages={proposal.packages}
          selectedTier={selectedTier}
          onSelectTier={setSelectedTier}
          submitting={submitting}
          onConfirm={handleSelectPackage}
        />
      )}

      {/* No Packages State */}
      {!hasPackages && (
        <Card className="bg-gray-900/50 border-gray-800">
          <CardContent className="pt-12 pb-12 text-center">
            <div className="text-gray-500 text-lg mb-4">
              No packages available for this proposal
            </div>
            <Button
              onClick={() => router.push('/client/ideas')}
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Return to My Ideas
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help Text */}
      {hasPackages && (
        <Card className="bg-blue-900/10 border-blue-800/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-300 mb-1">
                  Need help choosing?
                </h3>
                <p className="text-sm text-blue-200/70">
                  Each package builds on the previous one. <strong>Good</strong> covers essentials,
                  <strong> Better</strong> adds professional refinements, and <strong>Best</strong> includes
                  premium features. You can always upgrade later.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metadata Footer */}
      {proposal.metadata && (
        <div className="text-center text-xs text-gray-500">
          Generated {new Date(proposal.metadata.generatedAt).toLocaleDateString()}
          {proposal.metadata.aiModel && ` • ${proposal.metadata.aiModel}`}
        </div>
      )}
      </Section>
    </PageContainer>
  );
}
