"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  DollarSign,
  User,
  Calendar,
  Building2,
  Mail,
  Phone,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DealActivityTimeline } from "@/components/deals/DealActivityTimeline";
import type { Deal } from "@/components/deals/DealCard";

interface PipelineStage {
  id: string;
  name: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
}

interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string | null;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

function formatCurrency(value: number, currency: string = "AUD"): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<Deal | null>(null);
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  // Activity form
  const [newActivityType, setNewActivityType] = useState("note");
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityDescription, setNewActivityDescription] = useState("");
  const [addingActivity, setAddingActivity] = useState(false);

  const fetchDeal = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/deals/${dealId}`);

      if (!res.ok) {
        if (res.status === 404) {
          setError("Deal not found");
          return;
        }
        throw new Error("Failed to fetch deal");
      }

      const data = await res.json();
      setDeal(data.data?.deal || null);
      setActivities(data.data?.activities || []);
      setStages(data.data?.stages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch deal");
    } finally {
      setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    if (dealId) fetchDeal();
  }, [dealId, fetchDeal]);

  const handleEdit = () => {
    if (!deal) return;
    setEditForm({
      title: deal.title,
      value: deal.value,
      probability: deal.probability,
      expected_close_date: deal.expected_close_date || "",
      notes: deal.notes || "",
      source: deal.source || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) throw new Error("Failed to update deal");

      setIsEditing(false);
      fetchDeal();
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleStageChange = async (newStageId: string) => {
    try {
      const res = await fetch(`/api/deals/${dealId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: newStageId }),
      });

      if (!res.ok) throw new Error("Failed to update stage");
      fetchDeal();
    } catch (err) {
      setError("Failed to update stage");
    }
  };

  const handleAddActivity = async () => {
    if (!newActivityTitle.trim()) return;

    setAddingActivity(true);
    try {
      const res = await fetch(`/api/deals/${dealId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity_type: newActivityType,
          title: newActivityTitle.trim(),
          description: newActivityDescription || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to add activity");

      setNewActivityTitle("");
      setNewActivityDescription("");
      fetchDeal();
    } catch (err) {
      setError("Failed to add activity");
    } finally {
      setAddingActivity(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this deal? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/deals/${dealId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete deal");
      router.push("/dashboard/deals");
    } catch (err) {
      setError("Failed to delete deal");
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-white/[0.02] rounded-sm w-48" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-64 bg-white/[0.02] rounded-sm" />
            <div className="h-64 bg-white/[0.02] rounded-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !deal) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20">
          <h2 className="text-xl font-bold text-white mb-2">{error || "Deal not found"}</h2>
          <Link href="/dashboard/deals">
            <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Pipeline
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStage = stages.find((s) => s.id === deal.stage_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
      className="max-w-5xl mx-auto px-4 sm:px-6 py-6"
    >
      {/* Back button & header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/deals">
            <button className="bg-transparent border-0 text-white/40 hover:text-white p-2 rounded-sm transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            {isEditing ? (
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="bg-white/[0.02] border border-white/[0.06] text-white text-xl font-bold h-10 rounded-sm"
              />
            ) : (
              <h1 className="text-2xl font-bold text-white">{deal.title}</h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${
                  deal.status === "won"
                    ? "text-[#00FF88] border-[#00FF88]/30 bg-[#00FF88]/10"
                    : deal.status === "lost"
                    ? "text-[#FF4444] border-[#FF4444]/30 bg-[#FF4444]/10"
                    : "text-[#00F5FF] border-[#00F5FF]/30 bg-[#00F5FF]/10"
                }`}
              >
                {deal.status.toUpperCase()}
              </span>
              {deal.source && (
                <span className="text-xs text-white/40">via {deal.source}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                className="bg-transparent border-0 text-white/40 hover:text-white font-mono text-sm px-3 py-1.5 rounded-sm transition-colors inline-flex items-center gap-1"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          ) : (
            <>
              <button
                className="bg-transparent border-0 text-white/40 hover:text-white font-mono text-sm px-3 py-1.5 rounded-sm transition-colors inline-flex items-center gap-1"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                className="bg-transparent border-0 text-[#FF4444] hover:text-[#FF4444]/70 p-2 rounded-sm transition-colors"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stage progression bar */}
      <div className="mb-6">
        <div className="flex gap-1">
          {stages
            .sort((a, b) => a.position - b.position)
            .map((stage) => {
              const isCurrentOrPast = stage.position <= (currentStage?.position ?? 0);
              const isCurrent = stage.id === deal.stage_id;

              return (
                <button
                  key={stage.id}
                  className={`flex-1 h-8 rounded-sm text-xs font-medium transition-all ${
                    isCurrent
                      ? "ring-2 ring-white/30"
                      : ""
                  } ${
                    isCurrentOrPast
                      ? "text-white"
                      : "text-white/40 bg-white/[0.02]"
                  }`}
                  style={{
                    backgroundColor: isCurrentOrPast
                      ? stage.color
                      : undefined,
                  }}
                  onClick={() => !isEditing && handleStageChange(stage.id)}
                  title={`Move to ${stage.name}`}
                >
                  {stage.name}
                </button>
              );
            })}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Deal details */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="activity">
            <TabsList className="bg-white/[0.02] border border-white/[0.06]">
              <TabsTrigger value="activity" className="data-[state=active]:bg-white/[0.06] text-white/70">Activity</TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-white/[0.06] text-white/70">Details</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-white/[0.06] text-white/70">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              {/* Add activity form */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 mb-4">
                <div className="flex gap-2 mb-2">
                  <Select value={newActivityType} onValueChange={setNewActivityType}>
                    <SelectTrigger className="w-32 bg-white/[0.02] border border-white/[0.06] text-white text-sm rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#050505] border border-white/[0.06] rounded-sm">
                      {["note", "call", "meeting", "email", "task"].map((type) => (
                        <SelectItem key={type} value={type} className="text-white hover:bg-white/[0.06]">
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Activity title..."
                    value={newActivityTitle}
                    onChange={(e) => setNewActivityTitle(e.target.value)}
                    className="flex-1 bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/40 text-sm rounded-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                  />
                  <button
                    onClick={handleAddActivity}
                    disabled={addingActivity || !newActivityTitle.trim()}
                    className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-3 py-1.5 disabled:opacity-50 inline-flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Textarea
                  placeholder="Description (optional)..."
                  value={newActivityDescription}
                  onChange={(e) => setNewActivityDescription(e.target.value)}
                  className="bg-white/[0.02] border border-white/[0.06] text-white placeholder:text-white/40 text-sm min-h-[40px] rounded-sm"
                  rows={1}
                />
              </div>

              <DealActivityTimeline activities={activities} />
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Value</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editForm.value}
                        onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                        className="bg-white/[0.02] border border-white/[0.06] text-white rounded-sm"
                      />
                    ) : (
                      <div className="text-lg font-bold text-[#00FF88]">
                        {formatCurrency(deal.value, deal.currency)}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Probability</label>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.probability}
                        onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
                        className="bg-white/[0.02] border border-white/[0.06] text-white rounded-sm"
                      />
                    ) : (
                      <div className="text-lg font-bold text-white">{deal.probability}%</div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Expected Close</label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editForm.expected_close_date}
                        onChange={(e) => setEditForm({ ...editForm, expected_close_date: e.target.value })}
                        className="bg-white/[0.02] border border-white/[0.06] text-white rounded-sm"
                      />
                    ) : (
                      <div className="text-sm text-white/70">
                        {deal.expected_close_date
                          ? new Date(deal.expected_close_date).toLocaleDateString("en-AU", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })
                          : "Not set"}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Source</label>
                    {isEditing ? (
                      <Input
                        value={editForm.source}
                        onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                        className="bg-white/[0.02] border border-white/[0.06] text-white rounded-sm"
                      />
                    ) : (
                      <div className="text-sm text-white/70">
                        {deal.source || "Not specified"}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 mb-1 block">Created</label>
                  <div className="text-sm text-white/50">
                    {new Date(deal.created_at).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                {deal.tags && deal.tags.length > 0 && (
                  <div>
                    <label className="text-xs text-white/40 mb-1 block">Tags</label>
                    <div className="flex gap-1 flex-wrap">
                      {deal.tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-white/[0.06] text-white/70 text-xs font-mono px-2 py-0.5 rounded-sm border border-white/[0.06]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                {isEditing ? (
                  <Textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="bg-white/[0.02] border border-white/[0.06] text-white min-h-[200px] rounded-sm"
                    placeholder="Add notes about this deal..."
                  />
                ) : (
                  <div className="text-sm text-white/70 whitespace-pre-wrap min-h-[100px]">
                    {deal.notes || (
                      <span className="text-white/40 italic">No notes yet. Click Edit to add notes.</span>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar: Contact info */}
        <div className="space-y-4">
          {/* Contact Card */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
            <div className="text-sm text-white/40 flex items-center gap-2 mb-3">
              <User className="w-4 h-4" />
              Contact
            </div>
            {deal.contacts ? (
              <div className="space-y-2">
                <Link
                  href={`/dashboard/contacts/${deal.contacts.id}`}
                  className="text-white font-medium hover:text-[#00F5FF] flex items-center gap-1 transition-colors"
                >
                  {deal.contacts.name}
                  <ExternalLink className="w-3 h-3" />
                </Link>
                {deal.contacts.company && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Building2 className="w-3.5 h-3.5" />
                    {deal.contacts.company}
                  </div>
                )}
                {deal.contacts.email && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Mail className="w-3.5 h-3.5" />
                    {deal.contacts.email}
                  </div>
                )}
                {(deal.contacts as any).phone && (
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <Phone className="w-3.5 h-3.5" />
                    {(deal.contacts as any).phone}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-white/40 italic">No contact linked</div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 space-y-3">
            <div className="text-sm text-white/40 flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4" />
              Deal Summary
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Value</span>
              <span className="text-sm font-semibold text-[#00FF88]">
                {formatCurrency(deal.value, deal.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Weighted Value</span>
              <span className="text-sm text-white/70">
                {formatCurrency(deal.value * (deal.probability / 100), deal.currency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Stage</span>
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: currentStage?.color || "#3B82F6" }}
                />
                <span className="text-sm text-white/70">{currentStage?.name}</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Days Open</span>
              <span className="text-sm text-white/70">
                {Math.floor(
                  (new Date().getTime() - new Date(deal.created_at).getTime()) / 86400000
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-white/40">Activities</span>
              <span className="text-sm text-white/70">{activities.length}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
