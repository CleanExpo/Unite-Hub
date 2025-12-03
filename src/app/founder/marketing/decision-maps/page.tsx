/**
 * Decision Moment Maps List Page
 * Map customer journey touchpoints with objection handling
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardContent } from "@/ui/components/Card";
import {
  Map,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Loader2,
  ArrowRight,
  Eye,
  Target,
  Users,
  ShoppingCart,
  Heart,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface DecisionMap {
  id: string;
  name: string;
  description: string | null;
  funnel_stage: "full" | "awareness" | "consideration" | "conversion" | "retention";
  client_id: string | null;
  created_at: string;
  updated_at: string;
  asset_count?: number;
}

const STAGE_CONFIG = {
  full: { icon: Target, color: "text-purple-600 bg-purple-100", label: "Full Funnel" },
  awareness: { icon: Eye, color: "text-blue-600 bg-blue-100", label: "Awareness" },
  consideration: { icon: Users, color: "text-amber-600 bg-amber-100", label: "Consideration" },
  conversion: { icon: ShoppingCart, color: "text-green-600 bg-green-100", label: "Conversion" },
  retention: { icon: Heart, color: "text-pink-600 bg-pink-100", label: "Retention" },
};

export default function DecisionMapsPage() {
  const searchParams = useSearchParams();
  const [maps, setMaps] = useState<DecisionMap[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get("new") === "true");

  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/marketing/decision-maps");
      if (res.ok) {
        const data = await res.json();
        setMaps(data.maps || []);
      } else {
        // Mock data
        setMaps([
          {
            id: "1",
            name: "SaaS Free Trial Journey",
            description: "Converting free trial users to paid subscribers",
            funnel_stage: "conversion",
            client_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            asset_count: 8,
          },
          {
            id: "2",
            name: "Enterprise Awareness Campaign",
            description: "Building brand recognition in enterprise market",
            funnel_stage: "awareness",
            client_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            asset_count: 12,
          },
          {
            id: "3",
            name: "Customer Success Retention",
            description: "Reducing churn and building loyalty",
            funnel_stage: "retention",
            client_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            asset_count: 6,
          },
          {
            id: "4",
            name: "Complete Buyer Journey",
            description: "Full funnel mapping from awareness to advocacy",
            funnel_stage: "full",
            client_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            asset_count: 24,
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch decision maps:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/founder/marketing/decision-maps/${id}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        fetchMaps();
      }
    } catch (err) {
      console.error("Failed to duplicate map:", err);
    }
  };

  const filteredMaps = maps.filter((map) => {
    const matchesSearch =
      map.name.toLowerCase().includes(search.toLowerCase()) ||
      map.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStage = stageFilter === "all" || map.funnel_stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={Map}
          title="Decision Moment Maps"
          description="Map customer journey touchpoints with objection handling and proof assets"
        />

        {/* Toolbar */}
        <Section className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search maps..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border-subtle rounded-lg bg-bg-card focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
              </div>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-border-subtle rounded-lg bg-bg-card"
              >
                <option value="all">All Stages</option>
                <option value="full">Full Funnel</option>
                <option value="awareness">Awareness</option>
                <option value="consideration">Consideration</option>
                <option value="conversion">Conversion</option>
                <option value="retention">Retention</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Map
            </button>
          </div>
        </Section>

        {/* Funnel Stage Overview */}
        <Section className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            {Object.entries(STAGE_CONFIG).map(([stage, config]) => {
              const count = maps.filter((m) => m.funnel_stage === stage).length;
              return (
                <button
                  key={stage}
                  onClick={() => setStageFilter(stageFilter === stage ? "all" : stage)}
                  className={`p-4 rounded-lg border transition-all ${
                    stageFilter === stage
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                      : "border-border-subtle hover:border-gray-300"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center mx-auto mb-2`}>
                    <config.icon className="w-5 h-5" />
                  </div>
                  <p className="text-lg font-bold text-text-primary">{count}</p>
                  <p className="text-xs text-gray-500">{config.label}</p>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Maps Grid */}
        <Section className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            </div>
          ) : filteredMaps.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Map className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No decision maps found
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Create your first decision moment map to start mapping customer journeys.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Map
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredMaps.map((map) => (
                <DecisionMapCard key={map.id} map={map} onDuplicate={handleDuplicate} />
              ))}
            </div>
          )}
        </Section>

        {/* Create Modal */}
        {showCreateModal && (
          <CreateMapModal onClose={() => setShowCreateModal(false)} onCreated={fetchMaps} />
        )}
      </ChatbotSafeZone>
    </PageContainer>
  );
}

interface DecisionMapCardProps {
  map: DecisionMap;
  onDuplicate: (id: string) => void;
}

function DecisionMapCard({ map, onDuplicate }: DecisionMapCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const stageConfig = STAGE_CONFIG[map.funnel_stage];

  return (
    <Card className="group hover:border-teal-500 transition-colors">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 rounded-lg ${stageConfig.color} flex items-center justify-center`}>
            <stageConfig.icon className="w-5 h-5" />
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-bg-hover"
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-40 bg-bg-card rounded-lg shadow-lg border border-border-subtle py-1 z-10">
                <Link
                  href={`/founder/marketing/decision-maps/${map.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                <button
                  onClick={() => onDuplicate(map.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
                >
                  <Copy className="w-4 h-4" /> Duplicate
                </button>
                <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-bg-hover">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <Link href={`/founder/marketing/decision-maps/${map.id}`}>
          <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-teal-600 transition-colors">
            {map.name}
          </h3>
        </Link>
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {map.description || "No description"}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
          <div className="flex items-center gap-3">
            <span className={`px-2 py-1 text-xs font-medium rounded ${stageConfig.color}`}>
              {stageConfig.label}
            </span>
            {map.asset_count !== undefined && (
              <span className="text-xs text-gray-400">{map.asset_count} assets</span>
            )}
          </div>
          <Link
            href={`/founder/marketing/decision-maps/${map.id}`}
            className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            View <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateMapModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateMapModal({ onClose, onCreated }: CreateMapModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [funnelStage, setFunnelStage] = useState<DecisionMap["funnel_stage"]>("full");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/founder/marketing/decision-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          funnel_stage: funnelStage,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create map:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-xl font-semibold text-text-primary">
            Create Decision Map
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Map customer decision moments across the funnel
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Map Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
              placeholder="SaaS Trial Conversion Journey"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
              placeholder="Describe the journey being mapped..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Funnel Stage
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STAGE_CONFIG).map(([stage, config]) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setFunnelStage(stage as DecisionMap["funnel_stage"])}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    funnelStage === stage
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-900/30"
                      : "border-border-subtle"
                  }`}
                >
                  <div className={`p-1 rounded ${config.color}`}>
                    <config.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm">{config.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-secondary hover:bg-bg-hover rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Map"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
