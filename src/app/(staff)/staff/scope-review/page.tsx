'use client';

/**
 * Staff Scope Review Page
 * Phase 3 Step 2 - Staff Tools
 *
 * This page allows staff to:
 * 1. Select a client idea to scope
 * 2. Generate a proposal scope using AI (via scope-planner)
 * 3. Review and edit the generated scope
 * 4. Save as draft or send to client
 *
 * Following CLAUDE.md patterns:
 * - Client-side component for interactive UI
 * - Uses fetch with Authorization header for API calls
 * - Toast notifications for user feedback
 * - Error boundaries for graceful error handling
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/contexts/ToastContext';
import { ScopeEditor } from '@/components/staff/ScopeEditor';
import { planScopeFromIdea, type ClientIdea, type ProposalScope } from '@/lib/projects/scope-planner';
import { generateAIScope } from '@/lib/services/staff/scopeService';
import { supabase } from '@/lib/supabase';
import { Sparkles, Zap, Loader2 } from 'lucide-react';

export default function ScopeReviewPage() {
  const router = useRouter();
  const toast = useToast();

  // State
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

  // Load client ideas on mount
  useEffect(() => {
    loadClientIdeas();
  }, []);

  async function loadClientIdeas() {
    try {
      setLoading(true);

      // Fetch ideas from database
      // Note: In production, this would filter by organization_id
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

    // Check if scope already exists for this idea
    await loadExistingScope(ideaId);
  }

  async function loadExistingScope(ideaId: string) {
    try {
      setLoading(true);

      // Try to fetch existing proposal scope from API
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      const response = await fetch(`/api/staff/proposal-scope/get?ideaId=${ideaId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.scope) {
          setProposalScope(data.scope);
          toast.info('Loaded existing proposal scope');
          return;
        }
      }

      // No existing scope found, will generate new one
      setProposalScope(null);
    } catch (error) {
      console.error('Failed to load existing scope:', error);
      // Continue without existing scope
    } finally {
      setLoading(false);
    }
  }

  /**
   * Generate scope using AI (Phase 3 Step 4)
   * Falls back to deterministic generation if AI fails
   */
  async function handleGenerateAIScope() {
    if (!selectedIdea) {
      toast.warning('Please select a client idea first');
      return;
    }

    try {
      setGeneratingAI(true);

      // Get session for API authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to continue');
        return;
      }

      // Get organization and workspace IDs (placeholder - would come from auth context)
      const organizationId = selectedIdea.organizationId;
      const workspaceId = selectedIdea.organizationId; // Using org ID as fallback
      const clientId = selectedIdea.clientId;

      // Call AI generation service
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

        // Show success toast with cost/time info
        const costInfo = result.metadata
          ? ` (Cost: $${result.metadata.totalCost.toFixed(4)}, ${(result.metadata.generationTime / 1000).toFixed(1)}s)`
          : '';
        toast.success(`AI scope generated successfully${costInfo}`);
      } else {
        // AI failed - fall back to deterministic generation
        console.error('AI generation failed:', result.error);
        toast.warning('AI generation unavailable. Using fallback method...');

        await handleQuickGenerate();
      }
    } catch (error) {
      console.error('Failed to generate AI scope:', error);
      toast.error('AI generation failed. Using fallback method...');

      // Fall back to deterministic generation
      await handleQuickGenerate();
    } finally {
      setGeneratingAI(false);
    }
  }

  /**
   * Quick deterministic scope generation (fallback)
   */
  async function handleQuickGenerate() {
    if (!selectedIdea) {
      toast.warning('Please select a client idea first');
      return;
    }

    try {
      setLoading(true);

      // Generate scope using deterministic planner
      const generatedScope = planScopeFromIdea(selectedIdea);

      // Add staff metadata
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

      const data = await response.json();

      if (status === 'draft') {
        toast.success('Proposal scope saved as draft');
      } else {
        toast.success('Proposal scope sent to client');
      }

      // Reload to get saved scope ID
      await loadExistingScope(selectedIdea.id);
    } catch (error) {
      console.error('Failed to save scope:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save scope');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Scope Review</h1>
            <p className="text-slate-400 mt-1">
              Generate and review project scopes for client ideas
            </p>
          </div>
          <Button
            onClick={() => router.push('/staff')}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Idea Selection */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Select Client Idea</CardTitle>
            <CardDescription className="text-slate-400">
              Choose a client idea to generate a proposal scope
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedIdeaId} onValueChange={handleIdeaSelect}>
              <SelectTrigger className="bg-slate-900/50 border-slate-700 text-white">
                <SelectValue placeholder="Select a client idea..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                {ideas.map((idea) => (
                  <SelectItem key={idea.id} value={idea.id} className="text-white">
                    {idea.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedIdea && (
              <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">Idea Description:</h3>
                <p className="text-slate-400 text-sm">{selectedIdea.description}</p>
              </div>
            )}

            {selectedIdea && !proposalScope && (
              <div className="space-y-3">
                <Button
                  onClick={handleGenerateAIScope}
                  disabled={generatingAI || loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {generatingAI ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating with AI (4-stage pipeline)...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI (Recommended)
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleQuickGenerate}
                  disabled={generatingAI || loading}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700/50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Generate (Fallback)
                    </>
                  )}
                </Button>
              </div>
            )}

            {generationMetadata && proposalScope && (
              <div className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
                <div className="flex items-center justify-between text-xs text-slate-400">
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
          </CardContent>
        </Card>

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
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardContent className="pt-6">
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => handleSaveScope('draft')}
                    disabled={saving}
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
                  >
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  <Button
                    onClick={() => handleSaveScope('sent')}
                    disabled={saving}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    {saving ? 'Sending...' : 'Send to Client'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {!selectedIdea && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="text-slate-500 text-lg">
                Select a client idea above to get started
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
