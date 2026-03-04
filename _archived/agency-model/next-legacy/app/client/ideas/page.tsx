/**
 * Client Ideas Page - Phase 2 Step 3
 *
 * Idea submission and management interface
 * Will be wired to /api/client/ideas in Phase 2 Step 4
 */

import { Card } from '@/next/components/ui/Card';
import { Button } from '@/next/components/ui/Button';
import { Badge } from '@/next/components/ui/Badge';
import { IdeaRecorder } from '@/next/components/client/IdeaRecorder';
import { Lightbulb, Plus, Clock } from 'lucide-react';

export default function ClientIdeasPage() {
  // TODO: Fetch real ideas from /api/client/ideas in Phase 2 Step 4
  const mockIdeas = [
    {
      id: '1',
      content: 'Build a mobile app for restaurant management with real-time inventory tracking',
      type: 'text' as const,
      status: 'pending' as const,
      ai_interpretation: {
        core_objective: 'Restaurant management mobile application',
        suggested_approach: 'React Native cross-platform app',
        complexity: 'medium',
      },
      created_at: '2025-11-19T10:00:00Z',
    },
    {
      id: '2',
      content: 'E-commerce platform with AI-powered product recommendations',
      type: 'voice' as const,
      status: 'approved' as const,
      ai_interpretation: null,
      created_at: '2025-11-18T15:30:00Z',
    },
  ];

  const [showRecorder, setShowRecorder] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
    };
    return variants[status] || 'default';
  };

  return (
    <div className="space-y-6">
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
                setShowRecorder(false);
              }}
            />
          </div>
        </Card>
      )}

      {/* Ideas list */}
      <div className="space-y-4">
        {mockIdeas.map((idea) => (
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
                      <Badge variant="default">{idea.type}</Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(idea.created_at)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="text-gray-300 mb-4">
                {idea.content}
              </p>

              {/* AI Interpretation */}
              {idea.ai_interpretation && (
                <div className="p-4 bg-gray-800/50 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-300 mb-2">
                    AI Analysis
                  </p>
                  <div className="space-y-1 text-sm text-gray-400">
                    <p>
                      <span className="font-medium">Objective:</span>{' '}
                      {idea.ai_interpretation.core_objective}
                    </p>
                    <p>
                      <span className="font-medium">Approach:</span>{' '}
                      {idea.ai_interpretation.suggested_approach}
                    </p>
                    <p>
                      <span className="font-medium">Complexity:</span>{' '}
                      <Badge variant="info" className="ml-1">
                        {idea.ai_interpretation.complexity}
                      </Badge>
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  View Proposal
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
      {mockIdeas.length === 0 && (
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
    </div>
  );
}

// Client component wrapper for state management
'use client';

import { useState } from 'react';
