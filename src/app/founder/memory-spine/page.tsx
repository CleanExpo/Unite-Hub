'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GitBranch, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SpineLink } from '@/lib/unifiedMemorySpine';

export default function MemorySpinePage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState<SpineLink[]>([]);

  useEffect(() => { fetchData(); }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const response = await fetch(`/api/memory/spine?tenantId=${currentOrganization?.org_id || ''}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLinks(data.links || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><GitBranch className="h-8 w-8" />Unified Memory Spine</h1>
        <p className="text-muted-foreground mt-1">Connected memory graph for long-term reference</p>
      </div>
      {links.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Memory Links</h3><p className="text-muted-foreground">Memory spine has no links yet.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {links.slice(0, 30).map(link => (
            <Card key={link.id} className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{link.sourceType}</Badge>
                <ArrowRight className="h-3 w-3" />
                <Badge variant="outline">{link.targetType}</Badge>
                <span className="text-xs text-muted-foreground ml-auto">{new Date(link.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Spine Integrity</div><p>Spine never alters linked records. Links discoverable and auditable. Traversal respects tenant and region boundaries.</p></div></div></CardContent></Card>
    </div>
  );
}
