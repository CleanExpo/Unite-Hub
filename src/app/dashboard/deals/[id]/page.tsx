"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
          <div className="h-8 bg-slate-800 rounded w-48" />
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-64 bg-slate-800 rounded" />
            <div className="h-64 bg-slate-800 rounded" />
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
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Pipeline
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStage = stages.find((s) => s.id === deal.stage_id);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      {/* Back button & header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/deals">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            {isEditing ? (
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white text-xl font-bold h-10"
              />
            ) : (
              <h1 className="text-2xl font-bold text-white">{deal.title}</h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={`text-xs ${
                  deal.status === "won"
                    ? "text-emerald-400 border-emerald-500/30"
                    : deal.status === "lost"
                    ? "text-red-400 border-red-500/30"
                    : "text-blue-400 border-blue-500/30"
                }`}
              >
                {deal.status.toUpperCase()}
              </Badge>
              {deal.source && (
                <span className="text-xs text-slate-500">via {deal.source}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={() => setIsEditing(false)}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-1" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-slate-400 hover:text-white"
                onClick={handleEdit}
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
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
                      : "text-slate-500 bg-slate-800/30"
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
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="activity" className="data-[state=active]:bg-slate-700 text-slate-300">Activity</TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-slate-700 text-slate-300">Details</TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-slate-700 text-slate-300">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-4">
              {/* Add activity form */}
              <Card className="bg-slate-800/50 border-slate-700 mb-4">
                <CardContent className="p-4">
                  <div className="flex gap-2 mb-2">
                    <Select value={newActivityType} onValueChange={setNewActivityType}>
                      <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        {["note", "call", "meeting", "email", "task"].map((type) => (
                          <SelectItem key={type} value={type} className="text-white hover:bg-slate-700">
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Activity title..."
                      value={newActivityTitle}
                      onChange={(e) => setNewActivityTitle(e.target.value)}
                      className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleAddActivity()}
                    />
                    <Button
                      onClick={handleAddActivity}
                      disabled={addingActivity || !newActivityTitle.trim()}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Description (optional)..."
                    value={newActivityDescription}
                    onChange={(e) => setNewActivityDescription(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm min-h-[40px]"
                    rows={1}
                  />
                </CardContent>
              </Card>

              <DealActivityTimeline activities={activities} />
            </TabsContent>

            <TabsContent value="details" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Value</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editForm.value}
                          onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      ) : (
                        <div className="text-lg font-bold text-emerald-400">
                          {formatCurrency(deal.value, deal.currency)}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Probability</label>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={editForm.probability}
                          onChange={(e) => setEditForm({ ...editForm, probability: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      ) : (
                        <div className="text-lg font-bold text-white">{deal.probability}%</div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Expected Close</label>
                      {isEditing ? (
                        <Input
                          type="date"
                          value={editForm.expected_close_date}
                          onChange={(e) => setEditForm({ ...editForm, expected_close_date: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      ) : (
                        <div className="text-sm text-slate-300">
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
                      <label className="text-xs text-slate-500 mb-1 block">Source</label>
                      {isEditing ? (
                        <Input
                          value={editForm.source}
                          onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                          className="bg-slate-800 border-slate-700 text-white"
                        />
                      ) : (
                        <div className="text-sm text-slate-300">
                          {deal.source || "Not specified"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Created</label>
                    <div className="text-sm text-slate-400">
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
                      <label className="text-xs text-slate-500 mb-1 block">Tags</label>
                      <div className="flex gap-1 flex-wrap">
                        {deal.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardContent className="p-4">
                  {isEditing ? (
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white min-h-[200px]"
                      placeholder="Add notes about this deal..."
                    />
                  ) : (
                    <div className="text-sm text-slate-300 whitespace-pre-wrap min-h-[100px]">
                      {deal.notes || (
                        <span className="text-slate-500 italic">No notes yet. Click Edit to add notes.</span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right sidebar: Contact info */}
        <div className="space-y-4">
          {/* Contact Card */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {deal.contacts ? (
                <div className="space-y-2">
                  <Link
                    href={`/dashboard/contacts/${deal.contacts.id}`}
                    className="text-white font-medium hover:text-blue-400 flex items-center gap-1"
                  >
                    {deal.contacts.name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  {deal.contacts.company && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Building2 className="w-3.5 h-3.5" />
                      {deal.contacts.company}
                    </div>
                  )}
                  {deal.contacts.email && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      {deal.contacts.email}
                    </div>
                  )}
                  {(deal.contacts as any).phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                      {(deal.contacts as any).phone}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-slate-500 italic">No contact linked</div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Deal Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Value</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {formatCurrency(deal.value, deal.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Weighted Value</span>
                <span className="text-sm text-slate-300">
                  {formatCurrency(deal.value * (deal.probability / 100), deal.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Stage</span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: currentStage?.color || "#3B82F6" }}
                  />
                  <span className="text-sm text-slate-300">{currentStage?.name}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Days Open</span>
                <span className="text-sm text-slate-300">
                  {Math.floor(
                    (new Date().getTime() - new Date(deal.created_at).getTime()) / 86400000
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Activities</span>
                <span className="text-sm text-slate-300">{activities.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
