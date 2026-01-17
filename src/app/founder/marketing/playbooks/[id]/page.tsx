/**
 * Playbook Detail Page
 * View and manage social assets within a playbook
 */

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardContent } from "@/ui/components/Card";
import {
  BookOpen,
  ArrowLeft,
  Plus,
  Video,
  Image,
  FileText,
  Layout,
  Calendar,
  Play,
  Pause,
  Clock,
  Loader2,
  Edit,
  Trash2,
  MoreVertical,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface SocialPlaybook {
  id: string;
  name: string;
  description: string | null;
  primary_goal: string | null;
  primary_persona: string | null;
  platforms: string[];
  status: "draft" | "active" | "archived";
  created_at: string;
  updated_at: string;
}

interface SocialAsset {
  id: string;
  platform: string;
  asset_type: string;
  title: string | null;
  hook: string | null;
  script_outline: string | null;
  thumbnail_concept: string | null;
  status: "draft" | "ready" | "scheduled" | "published";
  scheduled_at: string | null;
  created_at: string;
}

const PLATFORM_ICONS: Record<string, typeof Youtube> = {
  youtube: Youtube,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
  shorts: Youtube,
  reels: Instagram,
  tiktok: Video,
};

const ASSET_TYPE_ICONS: Record<string, typeof Video> = {
  video: Video,
  image: Image,
  carousel: Layout,
  script: FileText,
  caption: FileText,
  thumbnail: Image,
};

export default function PlaybookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playbookId = params.id as string;

  const [playbook, setPlaybook] = useState<SocialPlaybook | null>(null);
  const [assets, setAssets] = useState<SocialAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  useEffect(() => {
    fetchPlaybookData();
  }, [playbookId]);

  const fetchPlaybookData = async () => {
    setLoading(true);
    try {
      const [pbRes, assetsRes] = await Promise.all([
        fetch(`/api/founder/marketing/playbooks/${playbookId}`),
        fetch(`/api/founder/marketing/playbooks/${playbookId}/assets`),
      ]);

      if (pbRes.ok) {
        setPlaybook(await pbRes.json());
      } else {
        // Mock data
        setPlaybook({
          id: playbookId,
          name: "Q1 LinkedIn B2B Campaign",
          description: "Thought leadership and case study distribution for enterprise clients",
          primary_goal: "Lead Generation",
          primary_persona: "Enterprise Decision Makers",
          platforms: ["linkedin", "youtube"],
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      if (assetsRes.ok) {
        const data = await assetsRes.json();
        setAssets(data.assets || []);
      } else {
        // Mock assets
        setAssets([
          {
            id: "1",
            platform: "youtube",
            asset_type: "video",
            title: "Why Your CRM Fails (And How to Fix It)",
            hook: "90% of CRMs fail in the first year. Here's why...",
            script_outline: "Hook → Problem → Solution → Case Study → CTA",
            thumbnail_concept: "Split screen: frustrated vs. celebrating",
            status: "ready",
            scheduled_at: null,
            created_at: new Date().toISOString(),
          },
          {
            id: "2",
            platform: "linkedin",
            asset_type: "carousel",
            title: "5 Signs Your Sales Pipeline Needs AI",
            hook: "Your competitors already know this...",
            script_outline: null,
            thumbnail_concept: "Data visualization charts",
            status: "draft",
            scheduled_at: null,
            created_at: new Date().toISOString(),
          },
          {
            id: "3",
            platform: "youtube",
            asset_type: "script",
            title: "Customer Success Story: 300% ROI",
            hook: "From losing $50k/month to profitable in 90 days",
            script_outline: "Intro → Pain points → Implementation → Results → Lessons",
            thumbnail_concept: null,
            status: "scheduled",
            scheduled_at: new Date(Date.now() + 86400000 * 3).toISOString(),
            created_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch playbook:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredAssets = activeTab === "all"
    ? assets
    : assets.filter((a) => a.platform === activeTab || a.asset_type === activeTab);

  const assetStats = {
    total: assets.length,
    draft: assets.filter((a) => a.status === "draft").length,
    ready: assets.filter((a) => a.status === "ready").length,
    scheduled: assets.filter((a) => a.status === "scheduled").length,
    published: assets.filter((a) => a.status === "published").length,
  };

  if (loading) {
    return (
      <PageContainer>
        <ChatbotSafeZone>
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
          </div>
        </ChatbotSafeZone>
      </PageContainer>
    );
  }

  if (!playbook) {
    return (
      <PageContainer>
        <ChatbotSafeZone>
          <div className="text-center py-24">
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Playbook not found
            </h2>
            <Link href="/founder/marketing/playbooks" className="text-accent-600 hover:underline">
              Back to playbooks
            </Link>
          </div>
        </ChatbotSafeZone>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ChatbotSafeZone>
        {/* Back Link */}
        <Link
          href="/founder/marketing/playbooks"
          className="inline-flex items-center gap-2 text-sm text-text-tertiary hover:text-accent-600 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Playbooks
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-text-primary">
                {playbook.name}
              </h1>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  playbook.status === "active"
                    ? "bg-success-100 text-success-700"
                    : playbook.status === "draft"
                    ? "bg-bg-hover text-text-secondary"
                    : "bg-warning-100 text-warning-700"
                }`}
              >
                {playbook.status}
              </span>
            </div>
            <p className="text-text-secondary mb-3">
              {playbook.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-text-tertiary">
              <span>Goal: {playbook.primary_goal}</span>
              <span>Persona: {playbook.primary_persona}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-border-subtle rounded-lg hover:bg-bg-hover">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            <button
              onClick={() => setShowAssetModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
            >
              <Plus className="w-4 h-4" />
              Add Asset
            </button>
          </div>
        </div>

        {/* Platforms */}
        <Section className="mb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-tertiary">Platforms:</span>
            {playbook.platforms.map((platform) => {
              const Icon = PLATFORM_ICONS[platform] || BookOpen;
              return (
                <div
                  key={platform}
                  className="flex items-center gap-1.5 px-2 py-1 bg-bg-hover rounded"
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm capitalize">{platform}</span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Stats */}
        <Section className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatPill label="Total Assets" value={assetStats.total} color="blue" />
            <StatPill label="Draft" value={assetStats.draft} color="gray" />
            <StatPill label="Ready" value={assetStats.ready} color="green" />
            <StatPill label="Scheduled" value={assetStats.scheduled} color="amber" />
            <StatPill label="Published" value={assetStats.published} color="teal" />
          </div>
        </Section>

        {/* Filter Tabs */}
        <Section className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <FilterTab
              active={activeTab === "all"}
              onClick={() => setActiveTab("all")}
              label="All"
            />
            {playbook.platforms.map((platform) => (
              <FilterTab
                key={platform}
                active={activeTab === platform}
                onClick={() => setActiveTab(platform)}
                label={platform}
                icon={PLATFORM_ICONS[platform]}
              />
            ))}
            <FilterTab
              active={activeTab === "video"}
              onClick={() => setActiveTab("video")}
              label="Video"
              icon={Video}
            />
            <FilterTab
              active={activeTab === "script"}
              onClick={() => setActiveTab("script")}
              label="Scripts"
              icon={FileText}
            />
          </div>
        </Section>

        {/* Assets Grid */}
        <Section>
          {filteredAssets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Video className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No assets yet
                </h3>
                <p className="text-sm text-text-tertiary mb-4">
                  Add your first content asset to this playbook.
                </p>
                <button
                  onClick={() => setShowAssetModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
                >
                  <Plus className="w-4 h-4" />
                  Add Asset
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} onUpdate={fetchPlaybookData} />
              ))}
            </div>
          )}
        </Section>

        {/* AI Generate Button */}
        <Section className="mt-8">
          <Card className="border-2 border-dashed border-accent-200 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/10">
            <CardContent className="py-6 text-center">
              <Sparkles className="w-8 h-8 mx-auto text-accent-600 mb-3" />
              <h3 className="text-lg font-medium text-text-primary mb-2">
                AI Asset Generator
              </h3>
              <p className="text-sm text-text-tertiary mb-4">
                Generate hooks, scripts, and thumbnails automatically based on your playbook strategy.
              </p>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700">
                <Sparkles className="w-4 h-4" />
                Generate Content Pack
              </button>
            </CardContent>
          </Card>
        </Section>

        {/* Create Asset Modal */}
        {showAssetModal && (
          <CreateAssetModal
            playbookId={playbookId}
            platforms={playbook.platforms}
            onClose={() => setShowAssetModal(false)}
            onCreated={fetchPlaybookData}
          />
        )}
      </ChatbotSafeZone>
    </PageContainer>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "gray" | "green" | "amber" | "teal";
}) {
  const colors = {
    blue: "bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400",
    gray: "bg-bg-hover text-text-secondary dark:bg-bg-elevated dark:text-text-secondary",
    green: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
    amber: "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400",
    teal: "bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400",
  };

  return (
    <div className={`px-4 py-3 rounded-lg text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}

function FilterTab({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: typeof Video;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? "bg-accent-600 text-white"
          : "bg-bg-hover text-text-muted dark:text-text-secondary hover:bg-bg-hover"
      }`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span className="capitalize">{label}</span>
    </button>
  );
}

function AssetCard({ asset, onUpdate }: { asset: SocialAsset; onUpdate: () => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const PlatformIcon = PLATFORM_ICONS[asset.platform] || Video;
  const TypeIcon = ASSET_TYPE_ICONS[asset.asset_type] || FileText;

  const statusColors = {
    draft: "bg-bg-hover text-text-secondary",
    ready: "bg-success-100 text-success-700",
    scheduled: "bg-warning-100 text-warning-700",
    published: "bg-info-100 text-info-700",
  };

  return (
    <Card className="hover:border-accent-500 transition-colors">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-bg-hover">
              <PlatformIcon className="w-4 h-4" />
            </div>
            <div className="p-1.5 rounded bg-bg-hover">
              <TypeIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusColors[asset.status]}`}>
              {asset.status}
            </span>
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1 rounded hover:bg-bg-hover"
              >
                <MoreVertical className="w-4 h-4 text-text-muted" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-8 w-32 bg-bg-card rounded-lg shadow-lg border border-border-subtle py-1 z-10">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover">
                    <Edit className="w-4 h-4" /> Edit
                  </button>
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error-600 hover:bg-bg-hover">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <h3 className="font-medium text-text-primary mb-2 line-clamp-2">
          {asset.title || "Untitled Asset"}
        </h3>

        {asset.hook && (
          <p className="text-sm text-text-tertiary mb-3 line-clamp-2 italic">"{asset.hook}"</p>
        )}

        {asset.scheduled_at && (
          <div className="flex items-center gap-1.5 text-xs text-warning-600 mb-2">
            <Calendar className="w-3.5 h-3.5" />
            Scheduled: {new Date(asset.scheduled_at).toLocaleDateString()}
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-text-muted mt-3 pt-3 border-t border-border-subtle">
          <span className="capitalize">{asset.platform} / {asset.asset_type}</span>
          <span>{new Date(asset.created_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreateAssetModalProps {
  playbookId: string;
  platforms: string[];
  onClose: () => void;
  onCreated: () => void;
}

function CreateAssetModal({ playbookId, platforms, onClose, onCreated }: CreateAssetModalProps) {
  const [platform, setPlatform] = useState(platforms[0] || "youtube");
  const [assetType, setAssetType] = useState("video");
  const [title, setTitle] = useState("");
  const [hook, setHook] = useState("");
  const [saving, setSaving] = useState(false);

  const assetTypes = ["video", "image", "carousel", "script", "caption", "thumbnail"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/founder/marketing/playbooks/${playbookId}/assets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          asset_type: assetType,
          title,
          hook,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create asset:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-xl font-semibold text-text-primary">Add Social Asset</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
              >
                {platforms.map((p) => (
                  <option key={p} value={p} className="capitalize">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">
                Asset Type
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
              >
                {assetTypes.map((type) => (
                  <option key={type} value={type} className="capitalize">
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
              placeholder="Content title or headline"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Hook / Opening Line
            </label>
            <textarea
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
              placeholder="The attention-grabbing opening..."
            />
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
              disabled={saving || !title}
              className="px-4 py-2 text-sm bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Add Asset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
