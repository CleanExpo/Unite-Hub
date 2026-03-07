"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  TrendingUp,
  Sparkles,
  Edit,
  Trash2,
  Send,
  Globe,
  MapPin,
  Briefcase,
  User,
  Clock,
  MessageCircle,
  BarChart3,
  BookOpen,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  website?: string;
  location?: string;
  ai_score?: number;
  status?: string;
  last_interaction?: string;
  lead_source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface Email {
  id: string;
  subject: string;
  snippet: string;
  direction: 'inbound' | 'outbound';
  received_at: string;
  is_read: boolean;
  ai_sentiment?: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  const { workspaceId, loading: workspaceLoading } = useWorkspace();

  const [contact, setContact] = useState<Contact | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [obsidianSyncing, setObsidianSyncing] = useState(false);
  const [obsidianSyncResult, setObsidianSyncResult] = useState<{ path?: string; error?: string } | null>(null);

  useEffect(() => {
    async function fetchContactData() {
      try {
        if (workspaceLoading || !workspaceId) return;

        // Fetch contact details
        const { data: contactData, error: contactError } = await supabase
          .from("contacts")
          .select("*")
          .eq("id", contactId)
          .eq("workspace_id", workspaceId)
          .maybeSingle(); // ← Graceful handling

        if (contactError) {
          console.error("Error fetching contact:", contactError);
          return;
        }

        if (!contactData) {
          console.error("Contact not found");
          // Optionally redirect to contacts list
          // router.push("/dashboard/contacts");
          return;
        }

        setContact(contactData);

        // Fetch associated emails (if client_emails table exists)
        try {
          const { data: emailsData, error: emailsError } = await supabase
            .from("client_emails")
            .select("id, subject, snippet, direction, received_at, is_read, ai_sentiment")
            .eq("contact_id", contactId)
            .eq("workspace_id", workspaceId)
            .order("received_at", { ascending: false })
            .limit(20);

          if (!emailsError && emailsData) {
            setEmails(emailsData);
          }
        } catch (err) {
          // Table might not exist yet - gracefully handle
          console.warn("client_emails table not available:", err);
        }
      } catch (error) {
        console.error("Error fetching contact data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchContactData();
  }, [contactId, workspaceId, workspaceLoading, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this contact?")) return;

    try {
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", contactId)
        .eq("workspace_id", workspaceId); // Ensure workspace isolation

      if (error) throw error;

      router.push("/dashboard/contacts");
    } catch (error) {
      console.error("Error deleting contact:", error);
      alert("Failed to delete contact");
    }
  };

  const handleObsidianSync = async () => {
    if (!contactId) return;
    setObsidianSyncing(true);
    setObsidianSyncResult(null);
    try {
      const res = await fetch(`/api/founder/obsidian/contacts/${contactId}/sync`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        setObsidianSyncResult({ error: json.error ?? "Sync failed" });
      } else {
        setObsidianSyncResult({ path: json.path });
      }
    } catch (err) {
      setObsidianSyncResult({ error: "Network error — sync failed" });
    } finally {
      setObsidianSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-sm bg-[#00F5FF]/20 animate-pulse"></div>
              <p className="text-white/40 font-mono text-sm">Loading contact...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-[#050505] p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-[#FF4444]/10 border border-[#FF4444]/20 mb-4">
              <User className="h-8 w-8 text-[#FF4444]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Contact Not Found</h3>
            <p className="text-white/40 mb-4">
              The contact you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
            </p>
            <Link href="/dashboard/contacts">
              <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Contacts
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-[#00FF88] to-[#00FF88]/60";
    if (score >= 60) return "from-[#00F5FF] to-[#00F5FF]/60";
    if (score >= 40) return "from-[#FFB800] to-[#FFB800]/60";
    return "from-[#FF4444] to-[#FF4444]/60";
  };

  const getStatusBadge = (status?: string) => {
    const statusColors: Record<string, { bg: string; text: string; border: string }> = {
      hot:  { bg: "bg-[#FF4444]/10",  text: "text-[#FF4444]",  border: "border-[#FF4444]/20" },
      warm: { bg: "bg-[#FFB800]/10",  text: "text-[#FFB800]",  border: "border-[#FFB800]/20" },
      cold: { bg: "bg-[#00F5FF]/10",  text: "text-[#00F5FF]",  border: "border-[#00F5FF]/20" },
      new:  { bg: "bg-[#00FF88]/10",  text: "text-[#00FF88]",  border: "border-[#00FF88]/20" },
    };
    return statusColors[status || "new"] || statusColors.new;
  };

  const statusStyle = getStatusBadge(contact.status);

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.19, 1, 0.22, 1] }}
      >
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: "Dashboard", href: "/dashboard/overview" },
            { label: "Contacts", href: "/dashboard/contacts" },
            { label: contact.name }
          ]}
        />

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <Link href="/dashboard/contacts">
              <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm p-2 hover:bg-white/[0.08] transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{contact.name}</h1>
              <div className="flex items-center gap-3">
                {contact.title && contact.company && (
                  <p className="text-white/40">
                    {contact.title} at {contact.company}
                  </p>
                )}
                <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                  {contact.status || "new"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 inline-flex items-center gap-2 hover:bg-[#00F5FF]/90 transition-colors">
              <Send className="w-4 h-4" />
              Send Email
            </button>
            <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 inline-flex items-center gap-2 hover:bg-white/[0.08] transition-colors">
              <Edit className="w-4 h-4" />
              Edit
            </button>
            {/* Obsidian — open existing note directly in the app */}
            <a
              href={`obsidian://open?vault=Unite-Group+Vault&file=Contacts%2F${encodeURIComponent(contact.name)}`}
              title="Open in Obsidian"
            >
              <button className="bg-[#FF00FF]/10 border border-[#FF00FF]/20 text-[#FF00FF] font-mono text-sm rounded-sm px-3 py-1.5 inline-flex items-center gap-2 hover:bg-[#FF00FF]/20 transition-colors">
                <BookOpen className="w-4 h-4" />
                Open in Obsidian
              </button>
            </a>
            {/* Obsidian — write/update the note in Google Drive */}
            <button
              className="bg-[#00F5FF]/10 border border-[#00F5FF]/20 text-[#00F5FF] font-mono text-sm rounded-sm px-3 py-1.5 inline-flex items-center gap-2 hover:bg-[#00F5FF]/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleObsidianSync}
              disabled={obsidianSyncing}
            >
              <RefreshCw className={`w-4 h-4 ${obsidianSyncing ? "animate-spin" : ""}`} />
              {obsidianSyncing ? "Syncing…" : "Sync to Obsidian"}
            </button>
            <button
              className="bg-[#FF4444]/10 border border-[#FF4444]/20 text-[#FF4444] font-mono text-sm rounded-sm px-3 py-1.5 inline-flex items-center gap-2 hover:bg-[#FF4444]/20 transition-colors"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
          {/* Obsidian sync feedback */}
          {obsidianSyncResult && (
            <p className={`text-sm mt-2 font-mono ${obsidianSyncResult.error ? "text-[#FF4444]" : "text-[#00F5FF]"}`}>
              {obsidianSyncResult.error
                ? `Sync error: ${obsidianSyncResult.error}`
                : `Synced to vault: ${obsidianSyncResult.path}`}
            </p>
          )}
        </div>

        {/* AI Score Card */}
        {typeof contact.ai_score === 'number' && (
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm overflow-hidden">
            <div className={`h-1 bg-gradient-to-r ${getScoreColor(contact.ai_score)}`}></div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-sm bg-[#FF00FF]/10 border border-[#FF00FF]/20">
                    <Sparkles className="w-6 h-6 text-[#FF00FF]" />
                  </div>
                  <div>
                    <p className="text-sm text-white/40 font-mono">AI Lead Score</p>
                    <p className="text-3xl font-bold text-white">{contact.ai_score}/100</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/40 font-mono">Priority Level</p>
                  <p className="text-lg font-semibold text-white">
                    {contact.ai_score >= 80 ? "Hot Lead" : contact.ai_score >= 60 ? "Warm Lead" : "Cold Lead"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white/[0.02] border border-white/[0.06]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="emails">
              Emails {emails.length > 0 && `(${emails.length})`}
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <User className="w-5 h-5 text-white/50" />
                  <h3 className="text-white font-semibold">Contact Information</h3>
                </div>
                <div className="space-y-4">
                  {contact.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-[#00F5FF] mt-0.5" />
                      <div>
                        <p className="text-sm text-white/40 font-mono">Email</p>
                        <a href={`mailto:${contact.email}`} className="text-white hover:text-[#00F5FF] transition-colors">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-[#00FF88] mt-0.5" />
                      <div>
                        <p className="text-sm text-white/40 font-mono">Phone</p>
                        <a href={`tel:${contact.phone}`} className="text-white hover:text-[#00FF88] transition-colors">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-[#FF00FF] mt-0.5" />
                      <div>
                        <p className="text-sm text-white/40 font-mono">Location</p>
                        <p className="text-white">{contact.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Information */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-5 h-5 text-white/50" />
                  <h3 className="text-white font-semibold">Company Information</h3>
                </div>
                <div className="space-y-4">
                  {contact.company && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-[#FFB800] mt-0.5" />
                      <div>
                        <p className="text-sm text-white/40 font-mono">Company</p>
                        <p className="text-white">{contact.company}</p>
                      </div>
                    </div>
                  )}
                  {contact.title && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-[#00F5FF] mt-0.5" />
                      <div>
                        <p className="text-sm text-white/40 font-mono">Job Title</p>
                        <p className="text-white">{contact.title}</p>
                      </div>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-white/50 mt-0.5" />
                      <div>
                        <p className="text-sm text-white/40 font-mono">Website</p>
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#00F5FF] transition-colors"
                        >
                          {contact.website}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-white/50" />
                <h3 className="text-white font-semibold">Metadata</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-white/40 font-mono">Lead Source</p>
                  <p className="text-white">{contact.lead_source || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-white/40 font-mono">Created</p>
                  <p className="text-white">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/40 font-mono">Last Updated</p>
                  <p className="text-white">
                    {new Date(contact.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Emails Tab */}
          <TabsContent value="emails" className="space-y-4">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="mb-4">
                <h3 className="text-white font-semibold">Email History</h3>
                <p className="text-white/40 text-sm font-mono mt-0.5">
                  {emails.length === 0 ? "No emails found" : `${emails.length} emails`}
                </p>
              </div>
              {emails.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No email history available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className="p-4 rounded-sm bg-[#050505] border border-white/[0.06] hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-semibold border ${
                            email.direction === 'inbound'
                              ? "bg-[#00F5FF]/10 text-[#00F5FF] border-[#00F5FF]/20"
                              : "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20"
                          }`}>
                            {email.direction === 'inbound' ? 'Received' : 'Sent'}
                          </span>
                          {email.ai_sentiment && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono font-semibold border ${
                              email.ai_sentiment === 'positive'
                                ? "bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20"
                                : email.ai_sentiment === 'negative'
                                ? "bg-[#FF4444]/10 text-[#FF4444] border-[#FF4444]/20"
                                : "bg-white/[0.04] text-white/40 border-white/[0.06]"
                            }`}>
                              {email.ai_sentiment}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-white/40 font-mono">
                          {new Date(email.received_at).toLocaleDateString()}
                        </p>
                      </div>
                      <h4 className="text-white font-semibold mb-1">{email.subject}</h4>
                      <p className="text-white/40 text-sm">{email.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="mb-4">
                <h3 className="text-white font-semibold">Activity Timeline</h3>
                <p className="text-white/40 text-sm font-mono mt-0.5">Recent interactions and updates</p>
              </div>
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40">Activity tracking coming soon</p>
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="mb-4">
                <h3 className="text-white font-semibold">Notes</h3>
                <p className="text-white/40 text-sm font-mono mt-0.5">Internal notes about this contact</p>
              </div>
              {contact.notes ? (
                <p className="text-white whitespace-pre-wrap">{contact.notes}</p>
              ) : (
                <div className="text-center py-12">
                  <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No notes added yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
