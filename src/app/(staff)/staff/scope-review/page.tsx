'use client';

// Force dynamic
export const dynamic = 'force-dynamic';

/**
 * Staff Scope Review Page
 * Phase 3 Step 2 - Staff Tools
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { ScopeEditor } from '@/components/staff/ScopeEditor';
import { planScopeFromIdea, type ClientIdea, type ProposalScope } from '@/lib/projects/scope-planner';
import { generateAIScope } from '@/lib/services/staff/scopeService';
import { supabase } from '@/lib/supabase';
import { Sparkles, Zap, Loader2 } from 'lucide-react';

export default function ScopeReviewPage() {
  const router = useRouter();
  const toast = useToast();

  const [ideas, setIdeas] = useState<ClientIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string>('');
  const [selectedIdea, setSelectedIdea] = useState<ClientIdea | null>(null);
  const [proposalScope, setProposalScope] = useState<ProposalScope | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generationMetadata, setGenerationMetadata] = useState<{
    totalCost?: number;
    totalTokens?: number;
    generationTime?: number;
  } | null>(null);

  useEffect(() => {
    loadClientIdeas();
  }, []);

  async function loadClientIdeas() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      if (data) {
        const formattedIdeas: ClientIdea[] = data.map((idea: any) => ({
          id: idea.id,
          organizationId: idea.organization_id || '',
          clientId: idea.client_id || '',
          title: idea.title || 'Untitled Idea',
          description: idea.description || '',
          createdAt: idea.created_at,
        }));
        setIdeas(formattedIdeas);
      }
    } catch (error) {
      console.error('Failed to load ideas:', error);
      toast.error('Failed to load client ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleIdeaSelect(ideaId: string) {
    setSelectedIdeaId(ideaId);
    const idea = ideas.find((i) => i.id === ideaId);
    if (!idea) return;
    setSelectedIdea(idea);
    await loadExistingScope(ideaId);
  }

  async function loadExistingScope(ideaId: string) {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      const response = await fetch(`/api/staff/proposal-scope/get?ideaId=${ideaId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.scope) {
          setProposalScope(data.scope);
          toast.info('Loaded existing proposal scope');
          return;
        }
      }
      setProposalScope(null);
    } catch (error) {
      console.error('Failed to load existing scope:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateAIScope() {
    if (!selectedIdea) {
      toast.warning('Please select a client idea first');
      return;
    }

    try {
      setGeneratingAI(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      const organizationId = selectedIdea.organizationId;
      const workspaceId = selectedIdea.organizationId;
      const clientId = selectedIdea.clientId;

      const result = await generateAIScope({
        idea: selectedIdea,
        organizationId,
        workspaceId,
        clientId,
        accessToken: session.access_token,
      });

      if (result.success && result.scope) {
        setProposalScope(result.scope);
        setGenerationMetadata(result.metadata || null);
        const costInfo = result.metadata
          ? ` (Cost: $${result.metadata.totalCost.toFixed(4)}, ${(result.metadata.generationTime / 1000).toFixed(1)}s)`
          : '';
        toast.success(`AI scope generated successfully${costInfo}`);
      } else {
        console.error('AI generation failed:', result.error);
        toast.warning('AI generation unavailable. Using fallback method...');
        await handleQuickGenerate();
      }
    } catch (error) {
      console.error('Failed to generate AI scope:', error);
      toast.error('AI generation failed. Using fallback method...');
      await handleQuickGenerate();
    } finally {
      setGeneratingAI(false);
    }
  }

  async function handleQuickGenerate() {
    if (!selectedIdea) {
      toast.warning('Please select a client idea first');
      return;
    }

    try {
      setLoading(true);
      const generatedScope = planScopeFromIdea(selectedIdea);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        generatedScope.metadata = {
          ...generatedScope.metadata,
          generatedBy: user.email || 'Unknown',
          generatedAt: new Date().toISOString(),
          aiModel: 'Deterministic (Fallback)',
        };
      }
      setProposalScope(generatedScope);
      toast.success('Proposal scope generated (quick mode)');
    } catch (error) {
      console.error('Failed to generate scope:', error);
      toast.error('Failed to generate scope. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveScope(status: 'draft' | 'sent') {
    if (!proposalScope || !selectedIdea) {
      toast.warning('No scope to save');
      return;
    }

    try {
      setSaving(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      const response = await fetch('/api/staff/proposal-scope/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          ideaId: selectedIdea.id,
          scope: proposalScope,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save scope');
      }

      if (status === 'draft') {
        toast.success('Proposal scope saved as draft');
      } else {
        toast.success('Proposal scope sent to client');
      }

      await loadExistingScope(selectedIdea.id);
    } catch (error) {
      console.error('Failed to save scope:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save scope');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono">Scope Review</h1>
            <p className="text-white/40 mt-1 font-mono text-sm">
              Generate and review project scopes for client ideas
            </p>
          </div>
          <button
            onClick={() => router.push('/staff')}
            className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 hover:bg-white/[0.06]"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Idea Selection */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-4 border-b border-white/[0.06]">
            <h2 className="font-mono text-white font-bold">Select Client Idea</h2>
            <p className="text-xs text-white/40 font-mono mt-0.5">Choose a client idea to generate a proposal scope</p>
          </div>
          <div className="p-4 space-y-4">
            <select
              value={selectedIdeaId}
              onChange={(e) => handleIdeaSelect(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-sm px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-[#00F5FF]/40 appearance-none"
            >
              <option value="" className="bg-[#050505]">Select a client idea...</option>
              {ideas.map((idea) => (
                <option key={idea.id} value={idea.id} className="bg-[#050505]">
                  {idea.title}
                </option>
              ))}
            </select>

            {selectedIdea && (
              <div className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-sm">
                <h3 className="text-xs font-mono text-white/60 mb-2 uppercase tracking-wider">Idea Description</h3>
                <p className="text-white/40 text-sm font-mono">{selectedIdea.description}</p>
              </div>
            )}

            {selectedIdea && !proposalScope && (
              <div className="space-y-3">
                <button
                  onClick={handleGenerateAIScope}
                  disabled={generatingAI || loading}
                  className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#00F5FF]/90 disabled:opacity-50"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating with AI (4-stage pipeline)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate with AI (Recommended)
                    </>
                  )}
                </button>
                <button
                  onClick={handleQuickGenerate}
                  disabled={generatingAI || loading}
                  className="w-full bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center justify-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Quick Generate (Fallback)
                    </>
                  )}
                </button>
              </div>
            )}

            {generationMetadata && proposalScope && (
              <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-sm">
                <div className="flex items-center justify-between text-xs text-white/30 font-mono">
                  <span>AI Generation Stats:</span>
                  <div className="flex gap-4">
                    {generationMetadata.totalCost !== undefined && (
                      <span>Cost: ${generationMetadata.totalCost.toFixed(4)}</span>
                    )}
                    {generationMetadata.totalTokens && (
                      <span>Tokens: {generationMetadata.totalTokens.toLocaleString()}</span>
                    )}
                    {generationMetadata.generationTime && (
                      <span>Time: {(generationMetadata.generationTime / 1000).toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scope Editor */}
        {proposalScope && (
          <>
            <ScopeEditor
              scope={proposalScope}
              onChange={setProposalScope}
              loading={loading}
              isAIGenerated={proposalScope.metadata?.aiModel?.includes('Hybrid')}
            />

            {/* Actions */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => handleSaveScope('draft')}
                  disabled={saving}
                  className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 hover:bg-white/[0.06] disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  onClick={() => handleSaveScope('sent')}
                  disabled={saving}
                  className="bg-[#00FF88] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 hover:bg-[#00FF88]/90 disabled:opacity-50"
                >
                  {saving ? 'Sending...' : 'Send to Client'}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!selectedIdea && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-12 text-center">
            <div className="text-white/30 text-lg font-mono">
              Select a client idea above to get started
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
