'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings2, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { GovernanceProfile } from '@/lib/governance/meta';

export default function GovernancePage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<GovernanceProfile[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) fetchData();
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) return;
      const response = await fetch(`/api/governance/meta/profiles?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
      }
    } catch (error) { console.error('Failed:', error); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Settings2 className="h-8 w-8" />Meta-Governance Console</h1>
        <p className="text-muted-foreground mt-1">Central console for governance parameters</p>
      </div>
      {profiles.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">Default Governance</h3><p className="text-muted-foreground">Using default governance profile.</p></CardContent></Card>
      ) : (
        <div className="space-y-4">
          {profiles.map(profile => (
            <Card key={profile.id} className={profile.isActive ? 'border-primary' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{profile.name}</CardTitle>
                  {profile.isActive && <Badge variant="default">Active</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                {profile.description && <p className="text-sm text-muted-foreground mb-3">{profile.description}</p>}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Truth Layer:</span>
                    <Badge variant="secondary" className="ml-2">{profile.truthLayerStrictness}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Evolution:</span>
                    <Badge variant="secondary" className="ml-2">{profile.evolutionAggressiveness}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Automation:</span>
                    <Badge variant="secondary" className="ml-2">{profile.automationLevel}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Safety:</span>
                    <Badge variant="secondary" className="ml-2">{(profile.safetyThreshold * 100).toFixed(0)}%</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Governance Constraints</div><p>Changes require high-level auth. All changes logged. Cannot disable core truth layer. Safety thresholds have minimum floors (50%).</p></div></div></CardContent></Card>
    </div>
  );
}
