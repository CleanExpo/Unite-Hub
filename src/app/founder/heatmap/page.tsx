"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface HeatmapItem {
  event_type: string;
  event_date: string;
  count: number;
}

export default function FounderHeatmapPage() {
  const [items, setItems] = useState<HeatmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  useEffect(() => {
    if (userId) {
      fetch(`/api/founder/heatmap?workspaceId=${userId}`)
        .then((r) => r.json())
        .then((data) => setItems(data.items || []))
        .finally(() => setLoading(false));
    }
  }, [userId]);

  if (loading) return <div className="min-h-screen bg-bg-primary p-6"><div className="text-text-primary">Loading...</div></div>;

  // Group items by event_type
  const grouped = items.reduce((acc: any, item) => {
    const key = item.event_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const getEventTypeLabel = (type: string) => {
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getHeatColor = (count: number, maxCount: number) => {
    const intensity = Math.min(1, count / maxCount);
    const r = 255;
    const g = Math.floor(99 * (1 - intensity));
    const b = Math.floor(71 * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="min-h-screen bg-bg-primary p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Founder Heatmap Dashboard</h1>
          <p className="text-text-secondary mt-1">E37: Temporal heatmaps of governance activity clustering</p>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <Card className="bg-bg-card border-border p-6">
            <p className="text-text-secondary">No heatmap data available. Data is automatically aggregated from E22-E35 events.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([type, data]: any) => {
              const maxCount = Math.max(...data.map((d: HeatmapItem) => d.count));

              return (
                <Card key={type} className="bg-bg-card border-border p-6">
                  <h2 className="text-lg font-semibold text-text-primary mb-4">
                    {getEventTypeLabel(type)}
                  </h2>
                  <div className="grid grid-cols-12 md:grid-cols-15 lg:grid-cols-30 gap-1">
                    {data.map((d: HeatmapItem) => (
                      <div
                        key={d.event_date}
                        className="h-6 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: getHeatColor(d.count, maxCount),
                        }}
                        title={`${d.event_date}: ${d.count} events`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-xs text-text-secondary">
                    <span>Low</span>
                    <div className="flex gap-1">
                      {[0.2, 0.4, 0.6, 0.8, 1.0].map((intensity) => (
                        <div
                          key={intensity}
                          className="w-4 h-4 rounded-sm"
                          style={{
                            backgroundColor: getHeatColor(intensity * maxCount, maxCount),
                          }}
                        />
                      ))}
                    </div>
                    <span>High</span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-bg-card border-border p-6">
          <h2 className="text-xl font-semibold text-text-primary mb-2">About Heatmap</h2>
          <div className="text-sm text-text-secondary space-y-2">
            <p>The heatmap visualizes temporal clustering of governance events:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Audit Logs:</strong> E22 system access and changes</li>
              <li><strong>SLA Incidents:</strong> E31 service level violations</li>
              <li><strong>Risk Events:</strong> E28 security and compliance risks</li>
              <li><strong>Debt Created:</strong> E34 new operational debt items</li>
              <li><strong>Remediation Tasks:</strong> E35 system-generated tasks</li>
            </ul>
            <p className="mt-4">Darker colors indicate higher event frequency. Use this to identify risk hotspots and activity patterns.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
