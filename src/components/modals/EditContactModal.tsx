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
import { supabaseBrowser } from "@/lib/supabase";
import { User, Mail, Building, Briefcase, Phone, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  workspaceId: string;
  initialData: {
    name: string;
    email: string;
    company?: string;
    job_title?: string;
    phone?: string;
    status?: string;
    tags?: string[];
  };
  onContactUpdated?: () => void;
}

export function EditContactModal({
  isOpen,
  onClose,
  contactId,
  workspaceId,
  initialData,
  onContactUpdated,
}: EditContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: initialData.name || "",
    email: initialData.email || "",
    company: initialData.company || "",
    job_title: initialData.job_title || "",
    phone: initialData.phone || "",
    status: initialData.status || "new",
    tags: initialData.tags ? initialData.tags.join(", ") : "",
  });

  // Update form when initialData changes
  useEffect(() => {
    setFormData({
      name: initialData.name || "",
      email: initialData.email || "",
      company: initialData.company || "",
      job_title: initialData.job_title || "",
      phone: initialData.phone || "",
      status: initialData.status || "new",
      tags: initialData.tags ? initialData.tags.join(", ") : "",
    });
  }, [initialData]);

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

      // Check if email changed and if it already exists
      if (formData.email !== initialData.email) {
        const { data: existing } = await supabaseBrowser
          .from("contacts")
          .select("id")
          .eq("workspace_id", workspaceId)
          .eq("email", formData.email)
          .neq("id", contactId)
          .single();

        if (existing) {
          setError("A contact with this email already exists");
          setLoading(false);
          return;
        }
      }

      // Parse tags
      const tagsArray = formData.tags
        ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

      // Update contact
      const { error: updateError } = await supabaseBrowser
        .from("contacts")
        .update({
          name: formData.name,
          email: formData.email,
          company: formData.company || null,
          job_title: formData.job_title || null,
          phone: formData.phone || null,
          status: formData.status,
          tags: tagsArray,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contactId)
        .eq("workspace_id", workspaceId); // Security check

      if (updateError) {
        console.error("Error updating contact:", updateError);
        setError(updateError.message);
        setLoading(false);
        return;
      }

      // Success! Close modal
      setLoading(false);

      // Notify parent component
      if (onContactUpdated) {
        onContactUpdated();
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
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Edit Contact
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Update contact information. Changes will be saved immediately.
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
            <Label htmlFor="edit-name" className="text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-400" />
              Full Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="John Doe"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email" className="text-slate-300 flex items-center gap-2">
              <Mail className="w-4 h-4 text-purple-400" />
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="john@example.com"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
              required
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="edit-status" className="text-slate-300">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="new" className="text-slate-300">New</SelectItem>
                <SelectItem value="prospect" className="text-slate-300">Prospect</SelectItem>
                <SelectItem value="lead" className="text-slate-300">Lead</SelectItem>
                <SelectItem value="customer" className="text-slate-300">Customer</SelectItem>
                <SelectItem value="contact" className="text-slate-300">Contact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Company */}
          <div className="space-y-2">
            <Label htmlFor="edit-company" className="text-slate-300 flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Company
            </Label>
            <Input
              id="edit-company"
              value={formData.company}
              onChange={(e) => handleChange("company", e.target.value)}
              placeholder="Acme Corporation"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="edit-job-title" className="text-slate-300 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-green-400" />
              Job Title
            </Label>
            <Input
              id="edit-job-title"
              value={formData.job_title}
              onChange={(e) => handleChange("job_title", e.target.value)}
              placeholder="Marketing Manager"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone" className="text-slate-300 flex items-center gap-2">
              <Phone className="w-4 h-4 text-orange-400" />
              Phone
            </Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="edit-tags" className="text-slate-300 flex items-center gap-2">
              <Tag className="w-4 h-4 text-pink-400" />
              Tags
            </Label>
            <Input
              id="edit-tags"
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
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
