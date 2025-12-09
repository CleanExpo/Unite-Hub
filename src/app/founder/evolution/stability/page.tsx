'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, AlertOctagon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SystemStabilityMode, StabilityEnforcementRecord } from '@/lib/evolution/stability';

export default function StabilityEnforcementPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<SystemStabilityMode | null>(null);
  const [records, setRecords] = useState<StabilityEnforcementRecord[]>([]);

  useEffect(() => {
    if (currentOrganization?.org_id) {
fetchData();
}
  }, [currentOrganization]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !currentOrganization) {
return;
}
      const response = await fetch(`/api/evolution/stability/overview?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMode(data.mode);
        setRecords(data.records || []);
      }
    } catch (error) {
 console.error('Failed:', error); 
} finally {
 setLoading(false); 
}
  };

  if (loading) {
return <div className="container mx-auto p-6"><div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div></div>;
}

  const getModeColor = (m: string) => {
    switch (m) {
      case 'normal': return 'default';
      case 'cooling': return 'secondary';
      case 'safe': return 'outline';
      case 'emergency': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Shield className="h-8 w-8" />Stability Enforcement (SEP-1)</h1>
        <p className="text-muted-foreground mt-1">Hard boundary preventing runaway evolution</p>
      </div>
      {mode && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Current System Mode</CardTitle>
              <Badge variant={getModeColor(mode.currentMode)} className="text-lg px-3 py-1">{mode.currentMode.toUpperCase()}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><span className="text-muted-foreground">Oscillations:</span> {mode.oscillationCount}</div>
              <div><span className="text-muted-foreground">Frozen Regions:</span> {mode.frozenRegions.length}</div>
              <div><span className="text-muted-foreground">Active Safeguards:</span> {mode.safeguardsActive.length}</div>
            </div>
            {mode.modeReason && <p className="text-sm text-muted-foreground mt-2">{mode.modeReason}</p>}
          </CardContent>
        </Card>
      )}
      {records.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Shield className="h-12 w-12 mx-auto text-green-500 mb-4" /><h3 className="text-lg font-medium mb-2">No Enforcement Events</h3><p className="text-muted-foreground">System stability has not required intervention.</p></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {records.map(record => (
            <Card key={record.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4" />
                    {record.enforcementType.replace('_', ' ')}
                  </CardTitle>
                  <Badge variant={record.status === 'active' ? 'destructive' : record.status === 'resolved' ? 'default' : 'secondary'}>{record.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{record.triggerReason}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>Affected: {record.affectedSystems.join(', ')}</span>
                  <span>Confidence: {(record.confidence * 100).toFixed(0)}%</span>
                  {record.founderAcknowledgementRequired && <Badge variant="outline" className="text-xs">Founder Ack Required</Badge>}
                </div>
                {record.uncertaintyNotes && <p className="text-xs text-muted-foreground italic mt-2 border-l-2 border-muted pl-2">{record.uncertaintyNotes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" /><div className="text-sm text-amber-800 dark:text-amber-200"><div className="font-medium mb-1">Stability Protocol</div><p>No oscillation tolerance. Cooling and safe modes supported. Founder lock required on high-risk actions. Region freeze capability active.</p></div></div></CardContent></Card>
    </div>
  );
}
