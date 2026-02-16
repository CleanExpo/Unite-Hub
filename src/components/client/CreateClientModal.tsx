"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useClientContext } from "@/contexts/ClientContext";
import { useAuth } from "@/contexts/AuthContext";
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
import { Loader2 } from "lucide-react";

interface CreateClientModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateClientModal({ open, onClose }: CreateClientModalProps) {
  const [businessName, setBusinessName] = useState("");
  const [clientName, setClientName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [primaryEmail, setPrimaryEmail] = useState("");
  const [packageTier, setPackageTier] = useState<"starter" | "professional">("starter");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { currentOrganization } = useAuth();
  const { selectClient } = useClientContext();

  const resetForm = () => {
    setBusinessName("");
    setClientName("");
    setBusinessDescription("");
    setPrimaryEmail("");
    setPackageTier("starter");
    setWebsiteUrl("");
    setPhone("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!businessName.trim() || !clientName.trim() || !businessDescription.trim() || !primaryEmail.trim()) {
      setError("Please fill in all required fields");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(primaryEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);

    try {
      // Get workspace ID from current organization
      const workspaceId = currentOrganization?.org_id;
      if (!workspaceId) {
        setError("Organization not found. Please refresh and try again.");
        setIsSubmitting(false);
        return;
      }

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Not authenticated. Please sign in again.");
        setIsSubmitting(false);
        return;
      }

      // Create client via API
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          name: clientName.trim(),
          email: primaryEmail.trim(),
          company: businessName.trim(),
          notes: businessDescription.trim(),
          phone: phone.trim() || undefined,
          website: websiteUrl.trim() || undefined,
          tags: [packageTier],
          status: "active",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create client");
      }

      const { contact } = await response.json();

      // Auto-select the newly created client
      if (contact?.id) {
        selectClient(contact.id);
      }

      handleClose();
    } catch (err: unknown) {
      console.error("Error creating client:", err);
      setError(err.message || "Failed to create client. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Client</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a new client to your organization
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-white">
                  Business Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="businessName"
                  placeholder="e.g., Acme Corporation"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-white">
                  Contact Name <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="clientName"
                  placeholder="e.g., John Smith"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription" className="text-white">
                Business Description <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="businessDescription"
                placeholder="Describe what the business does..."
                value={businessDescription}
                onChange={(e) => setBusinessDescription(e.target.value)}
                className="min-h-[80px]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryEmail" className="text-white">
                  Primary Email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="primaryEmail"
                  type="email"
                  placeholder="email@example.com"
                  value={primaryEmail}
                  onChange={(e) => setPrimaryEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="websiteUrl" className="text-white">
                  Website URL
                </Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  placeholder="https://example.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="packageTier" className="text-white">
                  Package Tier <span className="text-red-400">*</span>
                </Label>
                <Select value={packageTier} onValueChange={(value: any) => setPackageTier(value)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="starter" className="text-slate-300 hover:text-white focus:text-white">
                      Starter
                    </SelectItem>
                    <SelectItem value="professional" className="text-slate-300 hover:text-white focus:text-white">
                      Professional
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 text-red-400 px-4 py-3 rounded">
                {error}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Client"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
