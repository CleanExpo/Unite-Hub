"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PipelineStage } from "./PipelineBoard";

interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
}

interface CreateDealModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stages: PipelineStage[];
  defaultStageId?: string;
  workspaceId: string;
  onDealCreated: () => void;
}

export function CreateDealModal({
  open,
  onOpenChange,
  stages,
  defaultStageId,
  workspaceId,
  onDealCreated,
}: CreateDealModalProps) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState(defaultStageId || "");
  const [contactId, setContactId] = useState("");
  const [probability, setProbability] = useState("50");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [source, setSource] = useState("");
  const [notes, setNotes] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactSearch, setContactSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Set default stage when it changes
  useEffect(() => {
    if (defaultStageId) setStageId(defaultStageId);
  }, [defaultStageId]);

  // Fetch contacts for the workspace
  useEffect(() => {
    if (!open || !workspaceId) return;

    const fetchContacts = async () => {
      try {
        const res = await fetch(`/api/contacts?workspaceId=${workspaceId}&pageSize=100`);
        if (res.ok) {
          const data = await res.json();
          setContacts(data.data?.contacts || []);
        }
      } catch (err) {
        console.error("Failed to fetch contacts:", err);
      }
    };

    fetchContacts();
  }, [open, workspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Deal title is required");
      return;
    }
    if (!stageId) {
      setError("Please select a pipeline stage");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: title.trim(),
          stage_id: stageId,
          contact_id: contactId || null,
          value: parseFloat(value) || 0,
          probability: parseInt(probability) || 50,
          expected_close_date: expectedCloseDate || null,
          source: source || null,
          notes: notes || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create deal");
        return;
      }

      // Reset form
      setTitle("");
      setValue("");
      setStageId(defaultStageId || "");
      setContactId("");
      setProbability("50");
      setExpectedCloseDate("");
      setSource("");
      setNotes("");
      onOpenChange(false);
      onDealCreated();
    } catch (err) {
      setError("Failed to create deal");
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contactSearch
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
          c.email.toLowerCase().includes(contactSearch.toLowerCase()) ||
          c.company?.toLowerCase().includes(contactSearch.toLowerCase())
      )
    : contacts;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#050505] border border-white/[0.08] text-white sm:max-w-[500px] rounded-sm">
        <DialogHeader>
          <DialogTitle className="font-mono">Create New Deal</DialogTitle>
          <DialogDescription className="text-white/40">
            Add a new deal to your pipeline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm font-mono px-3 py-2 rounded-sm border"
              style={{ color: "#FF4444", backgroundColor: "rgba(255,68,68,0.08)", borderColor: "rgba(255,68,68,0.2)" }}>
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-white/60 font-mono text-xs">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Website redesign for ACME Corp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-sm font-mono"
            />
          </div>

          {/* Value and Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value" className="text-white/60 font-mono text-xs">Value (AUD)</Label>
              <Input
                id="value"
                type="number"
                placeholder="0"
                min="0"
                step="100"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 font-mono text-xs">Stage *</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white rounded-sm font-mono">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent className="bg-[#0a0a0a] border-white/[0.08] rounded-sm">
                  {stages
                    .filter((s) => !s.is_won && !s.is_lost)
                    .sort((a, b) => a.position - b.position)
                    .map((stage) => (
                      <SelectItem
                        key={stage.id}
                        value={stage.id}
                        className="text-white hover:bg-white/[0.04] font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: stage.color }}
                          />
                          {stage.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-1.5">
            <Label className="text-white/60 font-mono text-xs">Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white rounded-sm font-mono">
                <SelectValue placeholder="Link to a contact (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/[0.08] max-h-48 rounded-sm">
                <div className="p-2">
                  <Input
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="bg-white/[0.04] border-white/[0.08] text-white text-sm placeholder:text-white/20 rounded-sm font-mono"
                  />
                </div>
                {filteredContacts.slice(0, 20).map((contact) => (
                  <SelectItem
                    key={contact.id}
                    value={contact.id}
                    className="text-white hover:bg-white/[0.04] font-mono"
                  >
                    <div>
                      <span className="font-medium">{contact.name}</span>
                      {contact.company && (
                        <span className="text-white/40 ml-1">· {contact.company}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="text-sm text-white/30 text-center py-2 font-mono">No contacts found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Probability and Expected Close */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="probability" className="text-white/60 font-mono text-xs">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white rounded-sm font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closeDate" className="text-white/60 font-mono text-xs">Expected Close</Label>
              <Input
                id="closeDate"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="bg-white/[0.03] border-white/[0.08] text-white rounded-sm font-mono"
              />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label className="text-white/60 font-mono text-xs">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="bg-white/[0.03] border-white/[0.08] text-white rounded-sm font-mono">
                <SelectValue placeholder="How did this deal come in?" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0a] border-white/[0.08] rounded-sm">
                {["referral", "inbound", "outbound", "website", "social", "event", "cold_call", "partner", "other"].map(
                  (s) => (
                    <SelectItem key={s} value={s} className="text-white hover:bg-white/[0.04] font-mono">
                      {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-white/60 font-mono text-xs">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this deal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 min-h-[60px] rounded-sm font-mono"
            />
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-mono text-white/40 hover:text-white/70 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-mono rounded-sm border transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: "rgba(0,245,255,0.1)",
                borderColor: "rgba(0,245,255,0.3)",
                color: "#00F5FF",
              }}
            >
              {loading ? "Creating..." : "Create Deal"}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
