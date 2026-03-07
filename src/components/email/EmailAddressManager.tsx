"use client";

import React, { useState } from "react";
import { Plus, Mail, Check, Trash2, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface EmailAddress {
  _id: string;
  emailAddress: string;
  isPrimary: boolean;
  verified: boolean;
  label?: string;
  linkedAt: number;
}

interface EmailAddressManagerProps {
  emails: EmailAddress[];
  onAddEmail: (email: string, label: string) => Promise<void>;
  onRemoveEmail: (emailId: string) => Promise<void>;
  onSetPrimary: (emailId: string) => Promise<void>;
}

export function EmailAddressManager({
  emails,
  onAddEmail,
  onRemoveEmail,
  onSetPrimary,
}: EmailAddressManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddEmail = async () => {
    if (!newEmail) return;
    setIsLoading(true);
    try {
      await onAddEmail(newEmail, newLabel);
      setNewEmail("");
      setNewLabel("");
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono font-semibold text-white">Email Addresses</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm border border-white/[0.08] font-mono text-sm text-white hover:bg-white/[0.04] transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Email
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0a0a] border border-white/[0.08] rounded-sm text-white">
            <DialogHeader>
              <DialogTitle className="font-mono text-white">Add Email Address</DialogTitle>
              <DialogDescription className="font-mono text-white/40">
                Add an additional email address to link with your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="font-mono text-sm font-medium text-white/60 mb-1.5 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] rounded-sm text-white font-mono placeholder:text-white/20"
                />
              </div>
              <div>
                <label className="font-mono text-sm font-medium text-white/60 mb-1.5 block">
                  Label (Optional)
                </label>
                <Input
                  placeholder="e.g., Work, Personal, Partnership"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="bg-white/[0.04] border-white/[0.08] rounded-sm text-white font-mono placeholder:text-white/20"
                />
              </div>
              <button
                onClick={handleAddEmail}
                disabled={isLoading || !newEmail}
                className="w-full px-4 py-2 rounded-sm font-mono text-sm font-medium text-[#050505] disabled:opacity-50 transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#00F5FF' }}
              >
                {isLoading ? "Adding..." : "Add Email"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {emails.map((email) => (
          <div
            key={email._id}
            className="flex items-center justify-between p-3 border border-white/[0.06] rounded-sm hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div
                className="p-2 rounded-sm"
                style={{ backgroundColor: '#00F5FF15' }}
              >
                <Mail className="h-4 w-4" style={{ color: '#00F5FF' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-mono text-sm font-medium text-white truncate">
                    {email.emailAddress}
                  </p>
                  {email.isPrimary && (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-medium border"
                      style={{ color: '#FFB800', borderColor: '#FFB80040', backgroundColor: '#FFB80010' }}
                    >
                      <Star className="h-3 w-3" />
                      Primary
                    </span>
                  )}
                  {email.verified ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-medium border"
                      style={{ color: '#00FF88', borderColor: '#00FF8840', backgroundColor: '#00FF8810' }}
                    >
                      <Check className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-mono font-medium border"
                      style={{ color: '#FFB800', borderColor: '#FFB80040', backgroundColor: '#FFB80010' }}
                    >
                      Pending
                    </span>
                  )}
                </div>
                {email.label && (
                  <p className="font-mono text-xs text-white/40">{email.label}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!email.isPrimary && (
                <button
                  onClick={() => onSetPrimary(email._id)}
                  className="px-2 py-1 rounded-sm font-mono text-xs text-white/50 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  Set Primary
                </button>
              )}
              {!email.isPrimary && (
                <button
                  onClick={() => onRemoveEmail(email._id)}
                  className="p-1.5 rounded-sm font-mono text-xs hover:bg-white/[0.04] transition-colors"
                  style={{ color: '#FF4444' }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
