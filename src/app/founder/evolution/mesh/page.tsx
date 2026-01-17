'use client';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, AlertTriangle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { MeshNode, MeshEdge, MeshSnapshot } from '@/lib/evolution/mesh';

export default function EvolutionMeshPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<MeshNode[]>([]);
  const [edges, setEdges] = useState<MeshEdge[]>([]);
  const [snapshot, setSnapshot] = useState<MeshSnapshot | null>(null);

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
      const response = await fetch(`/api/evolution/mesh/overview?tenantId=${currentOrganization.org_id}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setSnapshot(data.snapshot);
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2"><Network className="h-8 w-8" />Global Evolution Mesh</h1>
        <p className="text-muted-foreground mt-1">Dynamic graph linking engines, regions, tasks, and signals</p>
      </div>
      {snapshot && (
        <div className="grid grid-cols-4 gap-4">
          <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{snapshot.nodeCount}</div><div className="text-sm text-muted-foreground">Nodes</div></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{snapshot.edgeCount}</div><div className="text-sm text-muted-foreground">Edges</div></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{snapshot.feedbackLoopsDetected}</div><div className="text-sm text-muted-foreground">Feedback Loops</div></CardContent></Card>
          <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{snapshot.meshHealthScore?.toFixed(0) || 'N/A'}</div><div className="text-sm text-muted-foreground">Health Score</div></CardContent></Card>
        </div>
      )}
      {nodes.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Network className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-medium mb-2">No Mesh Data</h3><p className="text-muted-foreground">The evolution mesh has no nodes yet.</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Top Nodes by Influence</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {nodes.slice(0, 10).map(node => (
                <div key={node.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{node.nodeType}</Badge>
                    <span>{node.nodeLabel}</span>
                  </div>
                  <span className="text-muted-foreground">{(node.influenceWeight * 100).toFixed(0)}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Edges</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {edges.slice(0, 10).map(edge => (
                <div key={edge.id} className="flex items-center gap-2 text-sm">
                  <Badge variant={edge.isFeedbackLoop ? 'destructive' : 'outline'}>{edge.edgeType}</Badge>
                  <ArrowRight className="h-3 w-3" />
                  <span className="text-muted-foreground">{(edge.confidence * 100).toFixed(0)}% conf</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-950/20"><CardContent className="py-4"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" /><div className="text-sm text-warning-800 dark:text-warning-200"><div className="font-medium mb-1">Mesh Transparency</div><p>Influence weights disclosed. Impact confidence links shown. Temporal decay factors applied. Feedback loops detected and flagged.</p></div></div></CardContent></Card>
    </div>
  );
}
