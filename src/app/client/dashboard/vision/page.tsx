"use client";

/**
 * Client Vision Dashboard
 * Phase 36: MVP Client Truth Layer
 *
 * Client persona summary and knowledge feed
 */

import { useState } from "react";
import { User, Target, Users, Palette, Mail, FileText, Calendar, AlertTriangle, RefreshCw } from "lucide-react";

interface PersonaProfile {
  persona_summary: string | null;
  goals: string | null;
  constraints: string | null;
  audience: string | null;
  brand_notes: string | null;
  updated_at: string;
}

interface KnowledgeItem {
  id: string;
  source_type: string;
  title: string | null;
  content: string | null;
  created_at: string;
}

export default function VisionPage() {
  const [updating, setUpdating] = useState(false);

  // Mock data - would fetch from API
  const persona: PersonaProfile = {
    persona_summary: "Service-based business owner focused on local market growth through digital presence.",
    goals: "Increase local visibility, generate qualified leads, establish authority in Brisbane market.",
    constraints: "Limited time for content creation, budget-conscious, needs hands-off approach.",
    audience: "Commercial builders, architects, and property developers in South East Queensland.",
    brand_notes: "Professional but approachable tone. Emphasis on quality and Australian standards compliance.",
    updated_at: new Date().toISOString(),
  };

  const knowledgeItems: KnowledgeItem[] = [
    { id: "1", source_type: "note", title: "Initial consultation notes", content: "Client wants to focus on local SEO...", created_at: new Date().toISOString() },
    { id: "2", source_type: "email", title: "Project requirements", content: "Attached brief for review...", created_at: new Date(Date.now() - 86400000).toISOString() },
    { id: "3", source_type: "upload", title: "Brand guidelines.pdf", content: "Logo usage, colors, fonts...", created_at: new Date(Date.now() - 172800000).toISOString() },
  ];

  const handleUpdatePersona = async () => {
    setUpdating(true);
    await new Promise((r) => setTimeout(r, 2000));
    setUpdating(false);
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case "email": return <Mail className="w-4 h-4" />;
      case "upload": return <FileText className="w-4 h-4" />;
      case "meeting": return <Calendar className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-bg-raised">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="w-8 h-8 text-accent-600" />
            <h1 className="text-2xl font-bold text-text-primary">
              Your Vision & Persona
            </h1>
          </div>
          <p className="text-text-secondary">
            AI-generated summary of your business context and goals
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-6 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-warning-700 dark:text-warning-300">
              This is an AI-generated summary based on your inputs. Please review for accuracy and let us know if anything needs updating.
            </p>
          </div>
        </div>

        {/* Persona Card */}
        <div className="bg-bg-card rounded-lg border border-border-subtle p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-text-primary">
              Client Persona
            </h2>
            <button
              onClick={handleUpdatePersona}
              disabled={updating}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? "animate-spin" : ""}`} />
              {updating ? "Updating..." : "Update Persona"}
            </button>
          </div>

          {persona.persona_summary && (
            <p className="text-text-secondary mb-4">
              {persona.persona_summary}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {persona.goals && (
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Goals</p>
                  <p className="text-sm text-text-secondary">{persona.goals}</p>
                </div>
              </div>
            )}
            {persona.audience && (
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Audience</p>
                  <p className="text-sm text-text-secondary">{persona.audience}</p>
                </div>
              </div>
            )}
            {persona.brand_notes && (
              <div className="flex items-start gap-3 md:col-span-2">
                <Palette className="w-5 h-5 text-accent-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-text-primary">Brand Notes</p>
                  <p className="text-sm text-text-secondary">{persona.brand_notes}</p>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-text-muted mt-4">
            Last updated: {new Date(persona.updated_at).toLocaleDateString()}
          </p>
        </div>

        {/* Knowledge Feed */}
        <div>
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Knowledge Feed
          </h2>
          <div className="space-y-3">
            {knowledgeItems.map((item) => (
              <div
                key={item.id}
                className="bg-bg-card rounded-lg border border-border-subtle p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-bg-hover rounded text-text-secondary">
                    {getSourceIcon(item.source_type)}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">
                      {item.title}
                    </p>
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {item.content}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
