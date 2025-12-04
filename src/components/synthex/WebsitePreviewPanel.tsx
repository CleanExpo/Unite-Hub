'use client';

/**
 * Website Preview Panel
 *
 * Displays AI-generated website preview for Synthex clients.
 * Allows clients to:
 * - View generated landing page preview
 * - Approve the preview
 * - Request revisions with notes
 * - Regenerate with custom prompts
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  RefreshCw,
  Check,
  MessageSquare,
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Download,
  Shield,
  Clock,
  Award,
  Wrench,
  Sparkles,
  Users,
  Star,
  Quote,
} from 'lucide-react';
import type { WebsitePreview, LandingPageCopy } from '@/lib/synthex/preview-generator';

// ============================================================================
// Types
// ============================================================================

interface WebsitePreviewPanelProps {
  tenantId: string;
  onApprove?: (preview: WebsitePreview) => void;
  onRevisionRequested?: (preview: WebsitePreview) => void;
}

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

// Icon mapping for features
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  Clock,
  Award,
  Wrench,
  Sparkles,
  Users,
  Star,
  Check,
};

// ============================================================================
// Component
// ============================================================================

export function WebsitePreviewPanel({ tenantId, onApprove, onRevisionRequested }: WebsitePreviewPanelProps) {
  const [preview, setPreview] = useState<WebsitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewport, setViewport] = useState<ViewportSize>('desktop');
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch existing preview
  const fetchPreview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/synthex/preview?tenantId=${tenantId}`);
      const data = await res.json();

      if (res.ok) {
        setPreview(data.preview);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview]);

  // Generate new preview
  const handleGenerate = async (forceRegenerate = false) => {
    try {
      setGenerating(true);
      setError(null);

      const res = await fetch('/api/synthex/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, forceRegenerate }),
      });

      const data = await res.json();

      if (res.ok) {
        setPreview(data.preview);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to generate preview');
    } finally {
      setGenerating(false);
    }
  };

  // Approve preview
  const handleApprove = async () => {
    if (!preview) {
return;
}

    try {
      setSubmitting(true);
      const res = await fetch('/api/synthex/preview', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previewId: preview.id, action: 'approve' }),
      });

      const data = await res.json();

      if (res.ok) {
        setPreview(data.preview);
        onApprove?.(data.preview);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to approve preview');
    } finally {
      setSubmitting(false);
    }
  };

  // Request revision
  const handleRequestRevision = async () => {
    if (!preview || !revisionNotes.trim()) {
return;
}

    try {
      setSubmitting(true);
      const res = await fetch('/api/synthex/preview', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previewId: preview.id,
          action: 'request_revision',
          revisionNotes,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setPreview(data.preview);
        setShowRevisionDialog(false);
        setRevisionNotes('');
        onRevisionRequested?.(data.preview);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  // Viewport widths
  const viewportWidths: Record<ViewportSize, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  // Status badge
  const getStatusBadge = (status: WebsitePreview['status']) => {
    const variants: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      generating: { label: 'Generating...', variant: 'secondary' },
      ready: { label: 'Ready for Review', variant: 'default' },
      approved: { label: 'Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      revision_requested: { label: 'Revision Requested', variant: 'outline' },
    };

    const config = variants[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          <span className="ml-3 text-text-secondary">Loading preview...</span>
        </CardContent>
      </Card>
    );
  }

  // No preview yet
  if (!preview) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Your Website
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="mb-6">
            <Monitor className="h-16 w-16 mx-auto text-text-tertiary mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">No Preview Generated Yet</h3>
            <p className="text-text-secondary mt-2">
              Click below to generate an AI-powered preview of your website based on your business profile.
            </p>
          </div>

          <Button
            onClick={() => handleGenerate(false)}
            disabled={generating}
            size="lg"
            className="bg-primary-500 hover:bg-primary-600"
          >
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Preview...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Website Preview
              </>
            )}
          </Button>

          {error && <p className="mt-4 text-sm text-error-DEFAULT">{error}</p>}
        </CardContent>
      </Card>
    );
  }

  // Render the preview
  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">Website Preview</h2>
              {getStatusBadge(preview.status)}
            </div>

            <div className="flex items-center gap-2">
              {/* Viewport toggles */}
              <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg p-1">
                <Button
                  variant={viewport === 'desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('desktop')}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'tablet' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('tablet')}
                >
                  <Tablet className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewport === 'mobile' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewport('mobile')}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              {preview.status === 'ready' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowRevisionDialog(true)}
                    disabled={submitting}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Request Changes
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="bg-success-DEFAULT hover:bg-success-dark"
                  >
                    {submitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Approve
                  </Button>
                </>
              )}

              {preview.status === 'revision_requested' && (
                <Button onClick={() => handleGenerate(true)} disabled={generating}>
                  {generating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Regenerate
                </Button>
              )}

              {preview.status === 'approved' && (
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              )}
            </div>
          </div>

          {preview.revisionNotes && (
            <div className="mt-4 p-3 bg-warning-light rounded-lg">
              <p className="text-sm font-medium text-warning-dark">Revision Notes:</p>
              <p className="text-sm text-warning-dark mt-1">{preview.revisionNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Frame */}
      <Card className="overflow-hidden">
        <div
          className="mx-auto transition-all duration-300 overflow-hidden"
          style={{
            maxWidth: viewportWidths[viewport],
            boxShadow: viewport !== 'desktop' ? '0 0 20px rgba(0,0,0,0.1)' : 'none',
          }}
        >
          <PreviewRenderer copy={preview.copy} heroImage={preview.heroImage} colorScheme={preview.colorScheme} />
        </div>
      </Card>

      {/* Revision Dialog */}
      {showRevisionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Request Changes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Describe what changes you&apos;d like to see in your website preview.
              </p>
              <Textarea
                placeholder="e.g., Make the headline more action-oriented, use warmer colors, emphasize our 24/7 service..."
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowRevisionDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleRequestRevision} disabled={submitting || !revisionNotes.trim()}>
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {error && (
        <div className="p-4 bg-error-light text-error-dark rounded-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Preview Renderer Component
// ============================================================================

interface PreviewRendererProps {
  copy: LandingPageCopy;
  heroImage: WebsitePreview['heroImage'];
  colorScheme: WebsitePreview['colorScheme'];
}

function PreviewRenderer({ copy, heroImage, colorScheme }: PreviewRendererProps) {
  return (
    <div
      className="min-h-screen"
      style={{
        '--preview-primary': colorScheme.primary,
        '--preview-secondary': colorScheme.secondary,
        '--preview-accent': colorScheme.accent,
        '--preview-bg': colorScheme.background,
        '--preview-text': colorScheme.text,
      } as React.CSSProperties}
    >
      {/* Hero Section */}
      <section
        className="relative py-20 px-6"
        style={{
          background: heroImage
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(data:${heroImage.mimeType};base64,${heroImage.base64})`
            : `linear-gradient(135deg, ${colorScheme.primary}, ${colorScheme.secondary})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">{copy.headline}</h1>
          <p className="text-xl md:text-2xl mb-6 opacity-90">{copy.subheadline}</p>
          <p className="text-lg mb-8 opacity-80 max-w-2xl mx-auto">{copy.heroDescription}</p>
          <button
            className="px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: colorScheme.accent, color: '#fff' }}
          >
            {copy.ctaButton}
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6" style={{ backgroundColor: colorScheme.background }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ color: colorScheme.text }}
          >
            Why Choose Us
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {copy.features.map((feature, idx) => {
              const IconComponent = iconMap[feature.icon] || Shield;
              return (
                <div
                  key={idx}
                  className="text-center p-6 rounded-xl shadow-md"
                  style={{ backgroundColor: '#fff' }}
                >
                  <div
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${colorScheme.primary}20` }}
                  >
                    <IconComponent
                      className="w-8 h-8"
                      style={{ color: colorScheme.primary }}
                    />
                  </div>
                  <h3
                    className="text-xl font-semibold mb-2"
                    style={{ color: colorScheme.text }}
                  >
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section
        className="py-16 px-6"
        style={{ backgroundColor: `${colorScheme.primary}10` }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <Quote
            className="w-12 h-12 mx-auto mb-6 opacity-30"
            style={{ color: colorScheme.primary }}
          />
          <blockquote
            className="text-2xl italic mb-6"
            style={{ color: colorScheme.text }}
          >
            &ldquo;{copy.testimonialPlaceholder.quote}&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: colorScheme.secondary }}
            >
              {copy.testimonialPlaceholder.author[0]}
            </div>
            <div className="text-left">
              <p className="font-semibold" style={{ color: colorScheme.text }}>
                {copy.testimonialPlaceholder.author}
              </p>
              <p className="text-sm text-gray-500">{copy.testimonialPlaceholder.role}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6" style={{ backgroundColor: colorScheme.primary }}>
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">{copy.footerTagline}</p>
          <button
            className="px-8 py-4 text-lg font-semibold rounded-lg shadow-lg transition-transform hover:scale-105"
            style={{ backgroundColor: '#fff', color: colorScheme.primary }}
          >
            {copy.ctaButton}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-6 text-center"
        style={{ backgroundColor: colorScheme.text, color: colorScheme.background }}
      >
        <p className="opacity-80">{copy.footerTagline}</p>
        <p className="text-sm mt-2 opacity-60">Preview generated by Synthex</p>
      </footer>
    </div>
  );
}

export default WebsitePreviewPanel;
