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
import { Button } from "@/components/ui/button";
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
      <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Deal</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a new deal to your pipeline
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-slate-300">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Website redesign for ACME Corp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Value and Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="value" className="text-slate-300">Value (AUD)</Label>
              <Input
                id="value"
                type="number"
                placeholder="0"
                min="0"
                step="100"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">Stage *</Label>
              <Select value={stageId} onValueChange={setStageId}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {stages
                    .filter((s) => !s.is_won && !s.is_lost)
                    .sort((a, b) => a.position - b.position)
                    .map((stage) => (
                      <SelectItem
                        key={stage.id}
                        value={stage.id}
                        className="text-white hover:bg-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
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
            <Label className="text-slate-300">Contact</Label>
            <Select value={contactId} onValueChange={setContactId}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="Link to a contact (optional)" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 max-h-48">
                <div className="p-2">
                  <Input
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white text-sm placeholder:text-slate-500"
                  />
                </div>
                {filteredContacts.slice(0, 20).map((contact) => (
                  <SelectItem
                    key={contact.id}
                    value={contact.id}
                    className="text-white hover:bg-slate-700"
                  >
                    <div>
                      <span className="font-medium">{contact.name}</span>
                      {contact.company && (
                        <span className="text-slate-400 ml-1">· {contact.company}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {filteredContacts.length === 0 && (
                  <div className="text-sm text-slate-500 text-center py-2">No contacts found</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Probability and Expected Close */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="probability" className="text-slate-300">Probability (%)</Label>
              <Input
                id="probability"
                type="number"
                min="0"
                max="100"
                value={probability}
                onChange={(e) => setProbability(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="closeDate" className="text-slate-300">Expected Close</Label>
              <Input
                id="closeDate"
                type="date"
                value={expectedCloseDate}
                onChange={(e) => setExpectedCloseDate(e.target.value)}
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label className="text-slate-300">Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder="How did this deal come in?" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {["referral", "inbound", "outbound", "website", "social", "event", "cold_call", "partner", "other"].map(
                  (s) => (
                    <SelectItem key={s} value={s} className="text-white hover:bg-slate-700">
                      {s.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-slate-300">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about this deal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 min-h-[60px]"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? "Creating..." : "Create Deal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
