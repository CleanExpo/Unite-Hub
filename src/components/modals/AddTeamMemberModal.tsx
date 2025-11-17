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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

interface AddTeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  organizationId: string;
  onMemberAdded?: () => void;
}

export function AddTeamMemberModal({
  isOpen,
  onClose,
  workspaceId,
  organizationId,
  onMemberAdded,
}: AddTeamMemberModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "member",
    capacityHours: "40",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.name.trim()) {
      setError("Name is required");
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("Email is required");
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    const capacityHours = parseInt(formData.capacityHours);
    if (isNaN(capacityHours) || capacityHours <= 0) {
      setError("Capacity hours must be a positive number");
      setLoading(false);
      return;
    }

    try {
      // Check if team member already exists in this workspace
      const { data: existing } = await supabaseBrowser
        .from("team_members")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("email", formData.email.toLowerCase())
        .single();

      if (existing) {
        setError("A team member with this email already exists in this workspace");
        setLoading(false);
        return;
      }

      // Generate initials
      const nameParts = formData.name.trim().split(" ");
      const initials = nameParts.length >= 2
        ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
        : formData.name.substring(0, 2).toUpperCase();

      // Insert team member
      const { error: insertError } = await supabaseBrowser
        .from("team_members")
        .insert({
          workspace_id: workspaceId,
          name: formData.name.trim(),
          email: formData.email.toLowerCase().trim(),
          role: formData.role,
          initials,
          capacity_hours: capacityHours,
          hours_allocated: 0,
          current_projects: 0,
          status: "available",
        });

      if (insertError) {
        console.error("Error adding team member:", insertError);
        setError(insertError.message);
        setLoading(false);
        return;
      }

      // Success! Reset form and notify parent
      setFormData({
        name: "",
        email: "",
        role: "member",
        capacityHours: "40",
      });
      setLoading(false);

      if (onMemberAdded) {
        onMemberAdded();
      }

      onClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: "",
        email: "",
        role: "member",
        capacityHours: "40",
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                Add Team Member
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Add a new member to your team
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-slate-300 font-medium">
              Name <span className="text-red-400">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              disabled={loading}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300 font-medium">
              Email <span className="text-red-400">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              disabled={loading}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
            />
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-slate-300 font-medium">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData({ ...formData, role: value })}
              disabled={loading}
            >
              <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white focus:border-blue-500/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Capacity Hours Field */}
          <div className="space-y-2">
            <Label htmlFor="capacityHours" className="text-slate-300 font-medium">
              Weekly Capacity (hours)
            </Label>
            <Input
              id="capacityHours"
              type="number"
              min="1"
              max="168"
              value={formData.capacityHours}
              onChange={(e) => setFormData({ ...formData, capacityHours: e.target.value })}
              placeholder="40"
              disabled={loading}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="border-slate-700/50 text-slate-300 hover:bg-slate-800/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Add Member
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
