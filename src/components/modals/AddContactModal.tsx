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
import { supabaseBrowser } from "@/lib/supabase";
import { User, Mail, Building, Briefcase, Phone, Tag } from "lucide-react";

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onContactAdded?: () => void;
}

export function AddContactModal({
  isOpen,
  onClose,
  workspaceId,
  onContactAdded,
}: AddContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    job_title: "",
    phone: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.name || !formData.email) {
        setError("Name and email are required");
        setLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError("Please enter a valid email address");
        setLoading(false);
        return;
      }

      // Check if contact already exists
      const { data: existing } = await supabaseBrowser
        .from("contacts")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("email", formData.email)
        .single();

      if (existing) {
        setError("A contact with this email already exists");
        setLoading(false);
        return;
      }

      // Parse tags
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Create contact
      const { data: contact, error: insertError } = await supabaseBrowser
        .from("contacts")
        .insert({
          workspace_id: workspaceId,
          name: formData.name,
          email: formData.email,
          company: formData.company || null,
          job_title: formData.job_title || null,
          phone: formData.phone || null,
          tags: tagsArray,
          status: "new",
          ai_score: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating contact:", insertError);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Success! Reset form and close modal
      setFormData({
        name: "",
        email: "",
        company: "",
        job_title: "",
        phone: "",
        tags: "",
      });
      setLoading(false);

      // Notify parent component
      if (onContactAdded) {
        onContactAdded();
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
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Add New Contact
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a new contact to your CRM. They'll be automatically scored by AI.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Full Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="John Doe"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="company" className="text-slate-300 flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Company
            </Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Acme Corporation"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="job_title" className="text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-400" />
              Job Title
            </Label>
            <Input
              id="job_title"
              value={formData.job_title}
              onChange={(e) => handleChange("job_title", e.target.value)}
              placeholder="Marketing Manager"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-slate-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-400" />
              Phone
            </Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-slate-300 flex items-center gap-2">
              <Tag className="w-4 h-4 text-pink-400" />
              Tags
            </Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleChange("tags", e.target.value)}
              placeholder="lead, prospect, hot (comma-separated)"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Separate multiple tags with commas
            </p>
          </div>

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
              {loading ? "Adding..." : "Add Contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
