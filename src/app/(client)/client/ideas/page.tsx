'use client';

/**
 * Client Ideas Page - Phase 2 Step 6
 *
 * Idea submission and management interface
 * Wired to /api/client/ideas
 */

import { useState, useEffect } from 'react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
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
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      submitted: 'warning',
      under_review: 'info',
      approved: 'success',
      rejected: 'error',
    };
    return variants[status] || 'default';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Loading ideas...</p>
      </div>
    );
  }

  return (
    <PageContainer>
      <Section>
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">
              My Ideas
            </h1>
            <p className="text-gray-400 mt-2">
              Submit and track your project ideas
            </p>
          </div>

          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowRecorder(!showRecorder)}
          >
            Submit New Idea
          </Button>
        </div>
      </Section>

      <Section>

      {/* Idea recorder */}
      {showRecorder && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-100 mb-4">
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
        </Card>
      )}

      {/* Ideas list */}
      <div className="space-y-4">
        {ideas.map((idea) => (
          <Card key={idea.id} variant="glass">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={getStatusVariant(idea.status)}>
                        {idea.status}
                      </Badge>
                      {idea.category && (
                        <Badge variant="default">{idea.category}</Badge>
                      )}
                    </div>
                    {idea.created_at && (
                      <div className="flex items-center text-xs text-gray-400">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDate(idea.created_at)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {idea.title}
              </h3>
              <p className="text-gray-300 mb-4">
                {idea.description}
              </p>

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty state */}
      {ideas.length === 0 && !loading && (
        <Card>
          <div className="p-12 text-center">
            <Lightbulb className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No ideas submitted yet. Share your first project idea to get started.
            </p>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setShowRecorder(true)}
            >
              Submit Your First Idea
            </Button>
          </div>
        </Card>
      )}
      </Section>
    </PageContainer>
  );
}
