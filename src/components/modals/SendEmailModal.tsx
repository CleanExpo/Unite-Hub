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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  contactEmail: string;
  workspaceId: string;
  onEmailSent?: () => void;
}

export function SendEmailModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  contactEmail,
  workspaceId,
  onEmailSent,
}: SendEmailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleSendEmail = async () => {
    setLoading(true);
    setError(null);

    // Validation
    if (!subject.trim()) {
      setError("Subject is required");
      setLoading(false);
      return;
    }

    if (!body.trim()) {
      setError("Email body is required");
      setLoading(false);
      return;
    }

    try {
      // Get session token for authentication
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Call API to send email
      const response = await fetch("/api/emails/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          contactId,
          to: contactEmail,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send email");
      }

      // Success! Close modal and notify parent
      setLoading(false);
      setSubject("");
      setBody("");

      if (onEmailSent) {
        onEmailSent();
      }

      onClose();
    } catch (err) {
      console.error("Error sending email:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSubject("");
      setBody("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-white">
                Send Email
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-sm">
                Compose and send an email to {contactName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* To Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="to" className="text-slate-300 font-medium">
              To
            </Label>
            <Input
              id="to"
              value={contactEmail}
              disabled
              className="bg-slate-800/50 border-slate-700/50 text-slate-400 cursor-not-allowed"
            />
          </div>

          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-slate-300 font-medium">
              Subject <span className="text-red-400">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              disabled={loading}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
            />
          </div>

          {/* Body Field */}
          <div className="space-y-2">
            <Label htmlFor="body" className="text-slate-300 font-medium">
              Message <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your email message here..."
              disabled={loading}
              rows={10}
              className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-blue-400 font-semibold text-sm">Email will be sent via Gmail</p>
                <p className="text-blue-400/80 text-sm mt-1">
                  This email will be sent from your connected Gmail account and tracked for opens and clicks.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="border-slate-700/50 text-slate-300 hover:bg-slate-800/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendEmail}
            disabled={loading || !subject.trim() || !body.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Email
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
