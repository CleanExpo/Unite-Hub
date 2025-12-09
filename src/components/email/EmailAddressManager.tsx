"use client";

import React, { useState } from "react";
import { Plus, Mail, Check, X, Trash2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    if (!newEmail) {
return;
}
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Email Addresses</h3>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Email
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Email Address</DialogTitle>
              <DialogDescription>
                Add an additional email address to link with your account.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Label (Optional)
                </label>
                <Input
                  placeholder="e.g., Work, Personal, Partnership"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>
              <Button
                onClick={handleAddEmail}
                disabled={isLoading || !newEmail}
                className="w-full"
              >
                {isLoading ? "Adding..." : "Add Email"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {emails.map((email) => (
          <div
            key={email._id}
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="h-4 w-4 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {email.emailAddress}
                  </p>
                  {email.isPrimary && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3" />
                      Primary
                    </Badge>
                  )}
                  {email.verified ? (
                    <Badge variant="outline" className="gap-1 text-green-700 border-green-200">
                      <Check className="h-3 w-3" />
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-orange-700 border-orange-200">
                      Pending
                    </Badge>
                  )}
                </div>
                {email.label && (
                  <p className="text-xs text-gray-600">{email.label}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!email.isPrimary && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onSetPrimary(email._id)}
                  className="text-xs"
                >
                  Set Primary
                </Button>
              )}
              {!email.isPrimary && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveEmail(email._id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
