"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, FileText, Shield, Hash, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EvidencePackageViewerProps {
  taskId: string;
}

export function EvidencePackageViewer({ taskId }: EvidencePackageViewerProps) {
  const { currentOrganization } = useAuth();
  const [evidence, setEvidence] = useState<any>(null);
  const [proof, setProof] = useState<any>(null);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvidence();
  }, [taskId]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = currentOrganization?.org_id;
      if (!workspaceId) {
        setError('No workspace selected');
        return;
      }

      const response = await fetch(
        `/api/orchestrator/dashboard/tasks/${taskId}/evidence?workspaceId=${workspaceId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch evidence: ${response.statusText}`);
      }

      const data = await response.json();
      setEvidence(data.evidence);
      setProof(data.proof);
      setMetadata(data.metadata);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    } finally {
      setLoading(false);
    }
  };

  const downloadAsJSON = () => {
    const dataStr = JSON.stringify(
      {
        taskId,
        evidence,
        proof,
        metadata,
      },
      null,
      2
    );
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evidence-${taskId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Loading evidence package...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          Error: {error}
        </CardContent>
      </Card>
    );
  }

  if (!evidence) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No evidence package available for this task
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Package Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Evidence Package
              </CardTitle>
              <CardDescription>
                Cryptographically verified proof of task execution
              </CardDescription>
            </div>
            <Button variant="outline" onClick={downloadAsJSON}>
              <Download className="mr-2 h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Collection Time</p>
              <p className="text-sm font-mono">
                {evidence.collectionTime
                  ? new Date(evidence.collectionTime).toLocaleString()
                  : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Storage Path</p>
              <p className="text-sm font-mono truncate" title={evidence.storagePath}>
                {evidence.storagePath || 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Verification Status</p>
              <Badge variant={metadata?.verificationStatus ? 'default' : 'destructive'}>
                {metadata?.verificationStatus ? 'Verified' : 'Not Verified'}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Verifier ID</p>
              <p className="text-sm font-mono truncate" title={metadata?.verifierId}>
                {metadata?.verifierId || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cryptographic Proof */}
      {proof && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              Cryptographic Proof
            </CardTitle>
            <CardDescription>
              Checksums, HMAC, and Merkle tree for tamper-proof verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* HMAC */}
            {proof.hmac && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">HMAC (Message Authentication)</p>
                </div>
                <code className="block bg-muted p-3 rounded text-xs font-mono break-all">
                  {proof.hmac}
                </code>
              </div>
            )}

            {/* Merkle Root */}
            {proof.merkleRoot && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <p className="text-sm font-semibold">Merkle Root (Tree Hash)</p>
                </div>
                <code className="block bg-muted p-3 rounded text-xs font-mono break-all">
                  {proof.merkleRoot}
                </code>
              </div>
            )}

            {/* File Checksums */}
            {proof.checksums && Object.keys(proof.checksums).length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">File Checksums (SHA-256)</p>
                <div className="space-y-1">
                  {Object.entries(proof.checksums).map(([file, checksum]) => (
                    <div key={file} className="text-xs">
                      <p className="text-muted-foreground">{file}</p>
                      <code className="block bg-muted p-2 rounded font-mono break-all">
                        {checksum as string}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Merkle Tree */}
            {proof.merkleTree && proof.merkleTree.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">Merkle Tree Structure</p>
                <div className="space-y-1 text-xs">
                  {proof.merkleTree.map((node: any, idx: number) => (
                    <code
                      key={idx}
                      className="block bg-muted p-2 rounded font-mono break-all"
                    >
                      Level {node.level}: {node.hash}
                    </code>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Execution Log */}
      {evidence.executionLog && (
        <Card>
          <CardHeader>
            <CardTitle>Execution Log</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded text-xs font-mono overflow-auto max-h-96">
              {JSON.stringify(evidence.executionLog, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* State Snapshots */}
      {evidence.stateSnapshots && evidence.stateSnapshots.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>State Snapshots ({evidence.stateSnapshots.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {evidence.stateSnapshots.map((snapshot: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="outline">{snapshot.phase || `Snapshot ${idx + 1}`}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {snapshot.timestamp
                      ? new Date(snapshot.timestamp).toLocaleString()
                      : 'N/A'}
                  </span>
                </div>
                <pre className="bg-muted p-2 rounded text-xs font-mono overflow-auto max-h-48">
                  {JSON.stringify(snapshot.state, null, 2)}
                </pre>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Verification Evidence */}
      {evidence.verificationEvidence && evidence.verificationEvidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Verification Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {evidence.verificationEvidence.map((item: any, idx: number) => (
              <div key={idx} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge
                    variant={item.result === 'pass' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {item.result === 'pass' ? '✓' : '✗'} {item.criterion}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.checked_at ? new Date(item.checked_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-1">Method: {item.method}</p>
                <code className="block bg-muted p-2 rounded text-xs break-all">
                  {item.proof}
                </code>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
