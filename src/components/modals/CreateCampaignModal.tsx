"use client";

import { useState } from "react";
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
import { supabaseBrowser } from "@/lib/supabase";
import { Mail, FileText, Calendar, Target } from "lucide-react";

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onCampaignCreated?: () => void;
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  workspaceId,
  onCampaignCreated,
}: CreateCampaignModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    content: "",
    status: "draft",
    scheduled_at: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.subject) {
        setError("Campaign name and subject are required");
        setLoading(false);
        return;
      }

      // Create campaign
      const { data: campaign, error: insertError } = await supabaseBrowser
        .from("campaigns")
        .insert({
          workspace_id: workspaceId,
          name: formData.name,
          subject: formData.subject,
          content: formData.content || "",
          status: formData.status,
          scheduled_at: formData.scheduled_at || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating campaign:", insertError);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Success! Reset form and close modal
      setFormData({
        name: "",
        subject: "",
        content: "",
        status: "draft",
        scheduled_at: "",
      });
      setLoading(false);

      // Notify parent component
      if (onCampaignCreated) {
        onCampaignCreated();
      }

      onClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Create New Campaign
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Create a new email campaign to reach your contacts.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Campaign Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              Campaign Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="Q1 2025 Newsletter"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Email Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              Email Subject <span className="text-red-400">*</span>
            </Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="Your exclusive offer is waiting..."
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Email Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              Email Content
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Write your email content here..."
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 min-h-[150px]"
              rows={6}
            />
            <p className="text-xs text-slate-500">
              You can edit and personalize this later with AI assistance
            </p>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-slate-300">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="active">Active</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled Date (optional) */}
          {formData.status === "scheduled" && (
            <div className="space-y-2">
              <Label htmlFor="scheduled_at" className="text-slate-300 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-400" />
                Schedule For
              </Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => handleChange("scheduled_at", e.target.value)}
                className="bg-slate-800/50 border-slate-700/50 text-white"
              />
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-slate-700/50 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
