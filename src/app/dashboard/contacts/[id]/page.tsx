"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  BarChart3
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-96">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
              <p className="text-slate-400">Loading contact...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-600/20 mb-4">
              <User className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Contact Not Found</h3>
            <p className="text-slate-400 mb-4">
              The contact you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/dashboard/contacts">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contacts
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-blue-500 to-cyan-600";
    if (score >= 40) return "from-amber-500 to-yellow-600";
    return "from-red-500 to-rose-600";
  };

  const getStatusBadge = (status?: string) => {
    const statusColors: Record<string, string> = {
      hot: "bg-red-500/20 text-red-400 border-red-500/30",
      warm: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      cold: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      new: "bg-green-500/20 text-green-400 border-green-500/30",
    };
    return statusColors[status || "new"] || statusColors.new;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
              <Button variant="outline" size="icon" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{contact.name}</h1>
              <div className="flex items-center gap-3">
                {contact.title && contact.company && (
                  <p className="text-slate-400">
                    {contact.title} at {contact.company}
                  </p>
                )}
                <Badge className={getStatusBadge(contact.status)}>
                  {contact.status || "new"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
              <Send className="w-4 h-4" />
              Send Email
            </Button>
            <Button variant="outline" className="bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="bg-red-500/10 border-red-500/30 hover:bg-red-500/20 text-red-400 gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* AI Score Card */}
        {typeof contact.ai_score === 'number' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 overflow-hidden">
            <div className={`h-2 bg-gradient-to-r ${getScoreColor(contact.ai_score)}`}></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">AI Lead Score</p>
                    <p className="text-3xl font-bold text-white">{contact.ai_score}/100</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">Priority Level</p>
                  <p className="text-lg font-semibold text-white">
                    {contact.ai_score >= 80 ? "🔥 Hot Lead" : contact.ai_score >= 60 ? "🌟 Warm Lead" : "❄️ Cold Lead"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-slate-800/50 border-slate-700/50">
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
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Email</p>
                        <a href={`mailto:${contact.email}`} className="text-white hover:text-blue-400 transition-colors">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Phone</p>
                        <a href={`tel:${contact.phone}`} className="text-white hover:text-green-400 transition-colors">
                          {contact.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {contact.location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-purple-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Location</p>
                        <p className="text-white">{contact.location}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Company Information */}
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {contact.company && (
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-amber-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Company</p>
                        <p className="text-white">{contact.company}</p>
                      </div>
                    </div>
                  )}
                  {contact.title && (
                    <div className="flex items-start gap-3">
                      <Briefcase className="w-5 h-5 text-cyan-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Job Title</p>
                        <p className="text-white">{contact.title}</p>
                      </div>
                    </div>
                  )}
                  {contact.website && (
                    <div className="flex items-start gap-3">
                      <Globe className="w-5 h-5 text-indigo-400 mt-0.5" />
                      <div>
                        <p className="text-sm text-slate-400">Website</p>
                        <a
                          href={contact.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-indigo-400 transition-colors"
                        >
                          {contact.website}
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Metadata */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Metadata
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Lead Source</p>
                    <p className="text-white">{contact.lead_source || "Unknown"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Created</p>
                    <p className="text-white">
                      {new Date(contact.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Last Updated</p>
                    <p className="text-white">
                      {new Date(contact.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emails Tab */}
          <TabsContent value="emails" className="space-y-4">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Email History</CardTitle>
                <CardDescription className="text-slate-400">
                  {emails.length === 0 ? "No emails found" : `${emails.length} emails`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {emails.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No email history available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emails.map((email) => (
                      <div
                        key={email.id}
                        className="p-4 rounded-lg bg-slate-900/50 border border-slate-700/50 hover:bg-slate-900/70 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={
                              email.direction === 'inbound'
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : "bg-green-500/20 text-green-400 border-green-500/30"
                            }>
                              {email.direction === 'inbound' ? 'Received' : 'Sent'}
                            </Badge>
                            {email.ai_sentiment && (
                              <Badge className={
                                email.ai_sentiment === 'positive'
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : email.ai_sentiment === 'negative'
                                  ? "bg-red-500/20 text-red-400 border-red-500/30"
                                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                              }>
                                {email.ai_sentiment}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">
                            {new Date(email.received_at).toLocaleDateString()}
                          </p>
                        </div>
                        <h4 className="text-white font-semibold mb-1">{email.subject}</h4>
                        <p className="text-slate-400 text-sm">{email.snippet}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Activity Timeline</CardTitle>
                <CardDescription className="text-slate-400">Recent interactions and updates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">Activity tracking coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Notes</CardTitle>
                <CardDescription className="text-slate-400">Internal notes about this contact</CardDescription>
              </CardHeader>
              <CardContent>
                {contact.notes ? (
                  <p className="text-white whitespace-pre-wrap">{contact.notes}</p>
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No notes added yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
