'use client';

/**
 * Synthex Digital Vault Page
 *
 * Secure storage for brand assets, credentials, and documents:
 * - Brand kits (colors, fonts, logos)
 * - Templates
 * - Generated content archive
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  Palette,
  Film,
  FileText,
  Plus,
  Loader2,
} from 'lucide-react';

interface BrandKit {
  id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  font_primary: string;
  guidelines: string;
  created_at: string;
}

interface VideoTemplate {
  id: string;
  name: string;
  description: string;
  template_type: string;
  created_at: string;
}

export default function VaultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [templates, setTemplates] = useState<VideoTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchVaultData();
  }, [tenantId]);

  const fetchVaultData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [bkRes, tplRes] = await Promise.all([
        fetch(`/api/synthex/visual/brand-kits?tenantId=${tenantId}`, { headers }),
        fetch(`/api/synthex/video/templates?tenantId=${tenantId}`, { headers }),
      ]);

      if (bkRes.ok) {
        const { brandKits: data } = await bkRes.json();
        setBrandKits(data || []);
      }
      if (tplRes.ok) {
        const { templates: data } = await tplRes.json();
        setTemplates(data || []);
      }
    } catch (err) {
      console.error('Failed to fetch vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Digital Vault</h1>
        <p className="text-gray-400 mt-1">
          Brand assets, templates, and secure storage
        </p>
      </div>

      {/* Brand Kits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-400" />
            Brand Kits
          </h2>
        </div>

        {brandKits.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-8 pb-8 text-center">
              <Palette className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 mb-4">No brand kits yet</p>
              <p className="text-sm text-gray-500">
                Brand kits are created when you generate visual content
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {brandKits.map(kit => (
              <Card key={kit.id} className="bg-gray-900 border-gray-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-gray-100 text-base">{kit.name}</CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Created {new Date(kit.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <div
                      className="h-8 w-8 rounded border border-gray-700"
                      style={{ backgroundColor: kit.primary_color }}
                      title={`Primary: ${kit.primary_color}`}
                    />
                    <div
                      className="h-8 w-8 rounded border border-gray-700"
                      style={{ backgroundColor: kit.secondary_color }}
                      title={`Secondary: ${kit.secondary_color}`}
                    />
                    <div
                      className="h-8 w-8 rounded border border-gray-700"
                      style={{ backgroundColor: kit.accent_color }}
                      title={`Accent: ${kit.accent_color}`}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Font: {kit.font_primary}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Video Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Film className="h-5 w-5 text-purple-400" />
            Video Templates
          </h2>
        </div>

        {templates.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-8 pb-8 text-center">
              <Film className="h-10 w-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No video templates yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(tpl => (
              <Card key={tpl.id} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-gray-100 text-base">{tpl.name}</CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    {tpl.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="text-gray-400 border-gray-700 capitalize">
                    {tpl.template_type}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
