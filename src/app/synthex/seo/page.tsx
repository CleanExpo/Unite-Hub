'use client';

/**
 * Synthex SEO Reports Page
 *
 * SEO intelligence dashboard wrapping the SeoAnalysisPanel component.
 * Provides domain analysis, keyword research, and competitor tracking.
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search } from 'lucide-react';
import SeoAnalysisPanel from '@/components/synthex/SeoAnalysisPanel';

export default function SeoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [planCode, setPlanCode] = useState('launch');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) {
      router.push('/synthex/onboarding');
      return;
    }
    fetchPlan();
  }, [tenantId]);

  const fetchPlan = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(`/api/synthex/billing?tenantId=${tenantId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setPlanCode(data.subscription?.planCode || 'launch');
      }
    } catch (err) {
      console.error('Failed to fetch plan:', err);
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

  if (!tenantId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="pt-12 pb-12 text-center">
            <Search className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No tenant selected</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">SEO Intelligence</h1>
        <p className="text-gray-400 mt-1">
          Domain analysis, keyword research, and competitor tracking
        </p>
      </div>

      <SeoAnalysisPanel tenantId={tenantId} planCode={planCode} />
    </div>
  );
}
