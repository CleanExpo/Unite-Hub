"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Building, Mail, Phone, Calendar, TrendingUp } from "lucide-react";
import ClientEmailsManager from "@/components/ClientEmailsManager";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: string;
  job_title?: string;
  phone?: string;
  ai_score: number;
  status: string;
  tags: string[];
  email_count?: number;
  last_contact_date?: string;
  created_at: string;
  updated_at: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.contactId as string;

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContact();
  }, [contactId]);

  const loadContact = async () => {
    try {
      // For now, we'll use a placeholder API endpoint
      // You can implement this endpoint at /api/contacts/[contactId]/route.ts
      const response = await fetch(`/api/contacts/${contactId}`);
      if (response.ok) {
        const data = await response.json();
        setContact(data.contact);
      }
    } catch (error) {
      console.error("Failed to load contact:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/20 border-green-500/30";
    if (score >= 60) return "bg-blue-500/20 border-blue-500/30";
    if (score >= 40) return "bg-yellow-500/20 border-yellow-500/30";
    return "bg-red-500/20 border-red-500/30";
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
            <p className="text-slate-400">Loading contact...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 text-center">
          <div className="text-white">Contact not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Contacts", href: "/dashboard/contacts" }, { label: contact.name }]} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/contacts"
          className="flex items-center gap-2 text-slate-400 hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contacts
        </Link>
      </div>

      {/* Contact Info Card */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-1">
                {contact.name}
              </h1>
              {contact.job_title && contact.company && (
                <p className="text-slate-400">
                  {contact.job_title} at {contact.company}
                </p>
              )}
            </div>
          </div>

          {/* AI Score */}
          <div className={`px-4 py-2 rounded-lg border ${getScoreBgColor(contact.ai_score)} backdrop-blur-sm`}>
            <div className="flex items-center gap-2">
              <TrendingUp className={`w-5 h-5 ${getScoreColor(contact.ai_score)}`} />
              <div>
                <div className="text-xs text-slate-400">AI Score</div>
                <div className={`text-xl font-bold ${getScoreColor(contact.ai_score)}`}>
                  {Math.round(contact.ai_score)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contact.email && (
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all">
              <Mail className="w-5 h-5 text-blue-400" />
              <div>
                <div className="text-xs text-slate-400">Primary Email</div>
                <div className="text-white font-mono text-sm">{contact.email}</div>
              </div>
            </div>
          )}

          {contact.phone && (
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all">
              <Phone className="w-5 h-5 text-purple-400" />
              <div>
                <div className="text-xs text-slate-400">Phone</div>
                <div className="text-white">{contact.phone}</div>
              </div>
            </div>
          )}

          {contact.company && (
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all">
              <Building className="w-5 h-5 text-cyan-400" />
              <div>
                <div className="text-xs text-slate-400">Company</div>
                <div className="text-white">{contact.company}</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all">
            <Calendar className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-xs text-slate-400">Added</div>
              <div className="text-white">
                {new Date(contact.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {contact.last_contact_date && (
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all">
              <Calendar className="w-5 h-5 text-orange-400" />
              <div>
                <div className="text-xs text-slate-400">Last Contact</div>
                <div className="text-white">
                  {new Date(contact.last_contact_date).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {contact.email_count !== undefined && (
            <div className="flex items-center gap-3 p-3 bg-slate-900/50 backdrop-blur-sm border border-slate-700/30 rounded-lg hover:border-slate-600/50 transition-all">
              <Mail className="w-5 h-5 text-pink-400" />
              <div>
                <div className="text-xs text-slate-400">Email Addresses</div>
                <div className="text-white font-bold">{contact.email_count}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <div className="text-sm text-slate-400 mb-2">Tags</div>
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Email Manager */}
      <ClientEmailsManager contactId={contactId} />

      {/* Additional sections can be added here */}
      {/* - Email history */}
      {/* - Campaign enrollments */}
      {/* - Interaction timeline */}
      {/* - Notes */}
    </div>
  );
}
