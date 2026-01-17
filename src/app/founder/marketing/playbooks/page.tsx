/**
 * Social Playbooks List Page
 * Manage multi-platform social media strategies
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardContent } from "@/ui/components/Card";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Pause,
  Archive,
  Trash2,
  Edit,
  Loader2,
  Youtube,
  Linkedin,
  Instagram,
  Facebook,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

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

const PLATFORM_ICONS: Record<string, typeof Youtube> = {
  youtube: Youtube,
  linkedin: Linkedin,
  instagram: Instagram,
  facebook: Facebook,
};

export default function PlaybooksListPage() {
  const searchParams = useSearchParams();
  const [playbooks, setPlaybooks] = useState<SocialPlaybook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(searchParams.get("new") === "true");

  useEffect(() => {
    fetchPlaybooks();
  }, []);

  const fetchPlaybooks = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/marketing/playbooks");
      if (res.ok) {
        const data = await res.json();
        setPlaybooks(data.playbooks || []);
      } else {
        // Mock data for development
        setPlaybooks([
          {
            id: "1",
            name: "Q1 LinkedIn B2B Campaign",
            description: "Thought leadership and case study distribution",
            primary_goal: "Lead Generation",
            primary_persona: "Enterprise Decision Makers",
            platforms: ["linkedin", "youtube"],
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "2",
            name: "Product Launch - Instagram",
            description: "Visual storytelling for new product release",
            primary_goal: "Brand Awareness",
            primary_persona: "Creative Professionals",
            platforms: ["instagram", "facebook"],
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error("Failed to fetch playbooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaybooks = playbooks.filter((pb) => {
    const matchesSearch =
      pb.name.toLowerCase().includes(search.toLowerCase()) ||
      pb.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || pb.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, newStatus: "active" | "archived") => {
    try {
      await fetch(`/api/founder/marketing/playbooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      fetchPlaybooks();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={BookOpen}
          title="Social Playbooks"
          description="Create and manage multi-platform content strategies"
        />

        {/* Toolbar */}
        <Section className="mt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex gap-3 flex-1 w-full sm:w-auto">
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search playbooks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-border-subtle rounded-lg bg-bg-card focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-border-subtle rounded-lg bg-bg-card"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Playbook
            </button>
          </div>
        </Section>

        {/* Playbooks Grid */}
        <Section className="mt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
            </div>
          ) : filteredPlaybooks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 mx-auto text-text-secondary mb-4" />
                <h3 className="text-lg font-medium text-text-primary mb-2">
                  No playbooks found
                </h3>
                <p className="text-sm text-text-tertiary mb-4">
                  Create your first social playbook to start planning multi-platform content.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700"
                >
                  <Plus className="w-4 h-4" />
                  Create Playbook
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPlaybooks.map((playbook) => (
                <PlaybookCard
                  key={playbook.id}
                  playbook={playbook}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Create Modal Placeholder */}
        {showCreateModal && (
          <CreatePlaybookModal onClose={() => setShowCreateModal(false)} onCreated={fetchPlaybooks} />
        )}
      </ChatbotSafeZone>
    </PageContainer>
  );
}

interface PlaybookCardProps {
  playbook: SocialPlaybook;
  onStatusChange: (id: string, status: "active" | "archived") => void;
}

function PlaybookCard({ playbook, onStatusChange }: PlaybookCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const statusColors = {
    active: "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400",
    draft: "bg-bg-hover text-text-secondary dark:bg-bg-elevated dark:text-text-secondary",
    archived: "bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400",
  };

  return (
    <Card className="group hover:border-accent-500 transition-colors">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded ${statusColors[playbook.status]}`}>
            {playbook.status.charAt(0).toUpperCase() + playbook.status.slice(1)}
          </span>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded hover:bg-bg-hover"
            >
              <MoreVertical className="w-4 h-4 text-text-muted" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 w-40 bg-bg-card rounded-lg shadow-lg border border-border-subtle py-1 z-10">
                <Link
                  href={`/founder/marketing/playbooks/${playbook.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
                >
                  <Edit className="w-4 h-4" /> Edit
                </Link>
                {playbook.status === "active" ? (
                  <button
                    onClick={() => onStatusChange(playbook.id, "archived")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </button>
                ) : (
                  <button
                    onClick={() => onStatusChange(playbook.id, "active")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-bg-hover"
                  >
                    <Play className="w-4 h-4" /> Activate
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <Link href={`/founder/marketing/playbooks/${playbook.id}`}>
          <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-accent-600 transition-colors">
            {playbook.name}
          </h3>
        </Link>
        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
          {playbook.description || "No description"}
        </p>

        {/* Platforms */}
        <div className="flex items-center gap-2 mb-4">
          {playbook.platforms.map((platform) => {
            const Icon = PLATFORM_ICONS[platform] || BookOpen;
            return (
              <div
                key={platform}
                className="p-1.5 rounded bg-bg-hover"
                title={platform}
              >
                <Icon className="w-4 h-4 text-text-secondary" />
              </div>
            );
          })}
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-text-muted">
          <span>{playbook.primary_goal || "No goal set"}</span>
          <span>{new Date(playbook.updated_at).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface CreatePlaybookModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreatePlaybookModal({ onClose, onCreated }: CreatePlaybookModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const availablePlatforms = [
    { id: "youtube", label: "YouTube", icon: Youtube },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
    { id: "instagram", label: "Instagram", icon: Instagram },
    { id: "facebook", label: "Facebook", icon: Facebook },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/founder/marketing/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          primary_goal: primaryGoal,
          platforms,
        }),
      });
      if (res.ok) {
        onCreated();
        onClose();
      }
    } catch (err) {
      console.error("Failed to create playbook:", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-bg-card rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-xl font-semibold text-text-primary">
            Create Social Playbook
          </h2>
          <p className="text-sm text-text-tertiary mt-1">
            Define your multi-platform content strategy
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Playbook Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
              placeholder="Q1 LinkedIn Campaign"
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
              placeholder="Describe the strategy focus..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">
              Primary Goal
            </label>
            <select
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="w-full px-3 py-2 border border-border-subtle rounded-lg bg-bg-card"
            >
              <option value="">Select a goal</option>
              <option value="Lead Generation">Lead Generation</option>
              <option value="Brand Awareness">Brand Awareness</option>
              <option value="Customer Engagement">Customer Engagement</option>
              <option value="Product Launch">Product Launch</option>
              <option value="Thought Leadership">Thought Leadership</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Platforms
            </label>
            <div className="flex flex-wrap gap-2">
              {availablePlatforms.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    platforms.includes(platform.id)
                      ? "border-accent-500 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400"
                      : "border-border-subtle text-text-secondary"
                  }`}
                >
                  <platform.icon className="w-4 h-4" />
                  {platform.label}
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
              className="px-4 py-2 text-sm bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50"
            >
              {saving ? "Creating..." : "Create Playbook"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
