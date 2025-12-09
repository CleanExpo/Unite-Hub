"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface EvidencePack {
  id: string;
  name: string;
  description?: string;
  purpose?: string;
  status: string;
  item_count: number;
  created_at: string;
}

export default function EvidencePacksPage() {
  const [packs, setPacks] = useState<EvidencePack[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      fetch(`/api/founder/evidence-packs?workspaceId=${userId}`)
        .then((res) => res.json())
        .then((data) => setPacks(data.packs || []))
        .finally(() => setLoading(false));
    }
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-bg-primary p-6"><div className="text-text-primary">Loading evidence packs...</div></div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-500";
      case "exported": return "bg-blue-500/10 text-blue-500";
      case "pending_review": return "bg-yellow-500/10 text-yellow-500";
      case "draft": return "bg-bg-primary text-text-secondary";
      default: return "bg-bg-primary text-text-secondary";
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Evidence Pack Builder</h1>
          <p className="text-text-secondary mt-1">E32: Bundle governance artifacts for auditors/insurers</p>
        </div>

        <div className="space-y-4">
          {packs.length === 0 && (
            <Card className="bg-bg-card border-border p-6">
              <p className="text-text-secondary">No evidence packs found.</p>
            </Card>
          )}
          {packs.map((pack) => (
            <Card key={pack.id} className="bg-bg-card border-border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-semibold text-text-primary">{pack.name}</h2>
                    <span className={`px-2 py-1 text-xs rounded font-medium ${getStatusColor(pack.status)}`}>
                      {pack.status.toUpperCase().replace(/_/g, " ")}
                    </span>
                  </div>
                  {pack.description && <p className="text-text-secondary text-sm mb-2">{pack.description}</p>}
                  <div className="text-sm text-text-secondary">
                    {pack.purpose && <span className="mr-4">Purpose: {pack.purpose}</span>}
                    <span>{pack.item_count} items</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
