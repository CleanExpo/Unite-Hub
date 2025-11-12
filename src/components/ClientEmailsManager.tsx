"use client";

import { useState, useEffect } from "react";
import { Mail, Plus, Trash2, Star, Copy, Check, X } from "lucide-react";

interface ClientEmail {
  id: string;
  contact_id: string;
  email: string;
  email_type: "work" | "personal" | "support" | "billing" | "other";
  label?: string;
  is_primary: boolean;
  is_verified: boolean;
  is_active: boolean;
  bounce_count: number;
  last_contacted?: string;
  verified_at?: string;
  created_at: string;
}

interface ClientEmailsManagerProps {
  contactId: string;
}

export default function ClientEmailsManager({ contactId }: ClientEmailsManagerProps) {
  const [emails, setEmails] = useState<ClientEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New email form
  const [newEmail, setNewEmail] = useState("");
  const [newType, setNewType] = useState<"work" | "personal" | "support" | "billing" | "other">("work");
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    loadEmails();
  }, [contactId]);

  const loadEmails = async () => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/emails`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data.emails || []);
      }
    } catch (error) {
      console.error("Failed to load emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const addEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          email_type: newType,
          label: newLabel || undefined,
          is_primary: emails.length === 0, // First email is primary
        }),
      });

      if (response.ok) {
        setNewEmail("");
        setNewLabel("");
        setAdding(false);
        await loadEmails();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add email");
      }
    } catch (error) {
      console.error("Failed to add email:", error);
      alert("Failed to add email");
    }
  };

  const setPrimary = async (emailId: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}/emails/${emailId}/primary`, {
        method: "PUT",
      });

      if (response.ok) {
        await loadEmails();
      }
    } catch (error) {
      console.error("Failed to set primary:", error);
    }
  };

  const deleteEmail = async (emailId: string) => {
    if (emails.length === 1) {
      alert("Cannot delete the last email. Contact must have at least one email.");
      return;
    }

    if (!confirm("Are you sure you want to delete this email?")) {
      return;
    }

    try {
      const response = await fetch(`/api/contacts/${contactId}/emails/${emailId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadEmails();
      }
    } catch (error) {
      console.error("Failed to delete email:", error);
    }
  };

  const copyToClipboard = async (email: string, id: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      work: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      personal: "bg-green-500/20 text-green-400 border-green-500/30",
      support: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      billing: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      other: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Email Addresses</h3>
        </div>
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Email Addresses</h3>
          <span className="text-sm text-slate-400">({emails.length})</span>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          {adding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {adding ? "Cancel" : "Add Email"}
        </button>
      </div>

      {/* Add Email Form */}
      {adding && (
        <div className="mb-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="john@example.com"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Type *
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="work">Work</option>
                  <option value="personal">Personal</option>
                  <option value="support">Support</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Office"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              onClick={addEmail}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              Add Email
            </button>
          </div>
        </div>
      )}

      {/* Email List */}
      <div className="space-y-2">
        {emails.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            No email addresses yet. Add one to get started.
          </p>
        ) : (
          emails.map((email) => (
            <div
              key={email.id}
              className={`p-3 rounded-lg border transition-colors ${
                email.is_primary
                  ? "bg-blue-500/10 border-blue-500/50"
                  : "bg-slate-700/30 border-slate-600"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-white break-all">
                      {email.email}
                    </span>

                    {email.is_primary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                        Primary
                      </span>
                    )}

                    {email.is_verified && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 border border-green-500/30 text-xs rounded-full">
                        <Check className="w-3 h-3" />
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-block px-2 py-0.5 border text-xs rounded-full ${getTypeBadgeColor(
                        email.email_type
                      )}`}
                    >
                      {email.email_type}
                    </span>

                    {email.label && (
                      <span className="text-xs text-slate-400">
                        {email.label}
                      </span>
                    )}

                    {email.bounce_count > 0 && (
                      <span className="text-xs text-red-400">
                        {email.bounce_count} bounce{email.bounce_count !== 1 ? "s" : ""}
                      </span>
                    )}

                    {email.last_contacted && (
                      <span className="text-xs text-slate-400">
                        Last contacted: {new Date(email.last_contacted).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!email.is_primary && (
                    <button
                      onClick={() => setPrimary(email.id)}
                      className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-yellow-400 transition-colors"
                      title="Set as primary"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => copyToClipboard(email.email, email.id)}
                    className="p-1.5 hover:bg-slate-600 rounded text-slate-400 hover:text-white transition-colors"
                    title="Copy email"
                  >
                    {copiedId === email.id ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => deleteEmail(email.id)}
                    disabled={emails.length === 1}
                    className={`p-1.5 hover:bg-slate-600 rounded transition-colors ${
                      emails.length === 1
                        ? "text-slate-600 cursor-not-allowed"
                        : "text-slate-400 hover:text-red-400"
                    }`}
                    title={emails.length === 1 ? "Cannot delete last email" : "Delete email"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
