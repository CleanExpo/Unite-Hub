'use client';

/**
 * Client Ideas Page - Phase 2 Step 6
 *
 * Idea submission and management interface
 * Wired to /api/client/ideas
 */

import { useState, useEffect } from 'react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { IdeaRecorder } from '@/components/client/IdeaRecorder';
import { Lightbulb, Plus, Clock } from 'lucide-react';
import { getClientIdeas, type ClientIdea } from '@/lib/services/client/clientService';
import { useToast } from '@/contexts/ToastContext';

export default function ClientIdeasPage() {
  const toast = useToast();
  const [ideas, setIdeas] = useState<ClientIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);

  // Fetch ideas on mount
  useEffect(() => {
    loadIdeas();
  }, []);

  async function loadIdeas() {
    setLoading(true);
    try {
      const response = await getClientIdeas();
      setIdeas(response.data || []);
    } catch (error) {
      console.error('Failed to load ideas:', error);
      toast.error('Failed to load ideas. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColour = (status: string): string => {
    const map: Record<string, string> = {
      submitted: '#FFB800',
      under_review: '#00F5FF',
      approved: '#00FF88',
      rejected: '#FF4444',
    };
    return map[status] || '#ffffff';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505]">
        <p className="text-white/40 font-mono">Loading ideas...</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <Section>
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-mono text-white">
              My Ideas
            </h1>
            <p className="text-white/40 mt-2">
              Submit and track your project ideas
            </p>
          </div>

          <button
            onClick={() => setShowRecorder(!showRecorder)}
            className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Submit New Idea
          </button>
        </div>
      </Section>

      <Section>

      {/* Idea recorder */}
      {showRecorder && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-6">
            <h2 className="text-xl font-mono font-semibold text-white mb-4">
              Submit Your Idea
            </h2>
            <IdeaRecorder
              onSubmit={(data) => {
                console.log('Idea submitted:', data);
                toast.success('Idea submitted successfully!');
                setShowRecorder(false);
                loadIdeas(); // Reload ideas after submission
              }}
            />
          </div>
        </div>
      )}

      {/* Ideas list */}
      <div className="space-y-4">
        {ideas.map((idea) => (
          <div key={idea.id} className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[#FFB800]/10 rounded-sm">
                    <Lightbulb className="h-5 w-5 text-[#FFB800]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span
                        className="text-xs font-mono px-2 py-0.5 rounded-sm border"
                        style={{
                          color: getStatusColour(idea.status),
                          borderColor: `${getStatusColour(idea.status)}40`,
                          backgroundColor: `${getStatusColour(idea.status)}10`,
                        }}
                      >
                        {idea.status}
                      </span>
                      {idea.category && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.06] text-white/60 bg-white/[0.02]">
                          {idea.category}
                        </span>
                      )}
                    </div>
                    {idea.created_at && (
                      <div className="flex items-center text-xs text-white/40 font-mono">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(idea.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-mono font-semibold text-white mb-2">
                {idea.title}
              </h3>
              <p className="text-white/60 font-mono text-sm mb-4">
                {idea.description}
              </p>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5">
                  View Details
                </button>
                <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5">
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {ideas.length === 0 && !loading && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
          <div className="p-12 text-center">
            <Lightbulb className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 font-mono mb-4">
              No ideas submitted yet. Share your first project idea to get started.
            </p>
            <button
              onClick={() => setShowRecorder(true)}
              className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 mx-auto"
            >
              <Plus className="h-4 w-4" />
              Submit Your First Idea
            </button>
          </div>
        </div>
      )}
      </Section>
    </PageContainer>
  );
}
