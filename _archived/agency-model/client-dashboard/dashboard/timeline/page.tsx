"use client";

/**
 * AI Event Timeline Dashboard
 * Phase 35: Integrity Framework
 *
 * Full transparency view of all AI-generated events
 */

import { useState, useEffect } from "react";
import { Clock, Filter, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import AIModelBadge from "@/components/ui/visual/AIModelBadge";
import type { AIModel } from "@/components/ui/visual/AIModelBadge";

interface TimelineEvent {
  id: string;
  model_used: string;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  concept_generated: "Concept Generated",
  video_generated: "Video Generated",
  audio_generated: "Audio Generated",
  copy_generated: "Copy Generated",
  image_generated: "Image Generated",
  approval_requested: "Approval Requested",
  item_approved: "Item Approved",
  item_rejected: "Item Rejected",
};

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterModel, setFilterModel] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    // Mock data - would call API
    setEvents([
      {
        id: "1",
        model_used: "openai",
        event_type: "concept_generated",
        description: "Homepage wireframe concept generated",
        metadata: { pillar: "web_experience", subPillar: "homepage_wireframes" },
        created_at: new Date().toISOString(),
      },
      {
        id: "2",
        model_used: "veo3",
        event_type: "video_generated",
        description: "Product showcase video concept created",
        metadata: { duration: 15, style: "professional" },
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "3",
        model_used: "elevenlabs",
        event_type: "audio_generated",
        description: "Voiceover demo for landing page",
        metadata: { duration: 30, voiceStyle: "professional" },
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "4",
        model_used: "gemini",
        event_type: "copy_generated",
        description: "SEO content outline drafted",
        metadata: { wordCount: 500, topic: "local SEO" },
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ]);
    setLoading(false);
  };

  const uniqueModels = [...new Set(events.map((e) => e.model_used))];
  const uniqueTypes = [...new Set(events.map((e) => e.event_type))];

  const filteredEvents = events.filter((event) => {
    if (filterModel !== "all" && event.model_used !== filterModel) return false;
    if (filterType !== "all" && event.event_type !== filterType) return false;
    return true;
  });

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              AI Event Timeline
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Complete transparency of all AI-generated content and actions
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterModel}
              onChange={(e) => setFilterModel(e.target.value)}
              className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Models</option>
              {uniqueModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            <option value="all">All Events</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {EVENT_TYPE_LABELS[type] || type}
              </option>
            ))}
          </select>
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading timeline...</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Cpu className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No events found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div
                  className="p-4 cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === event.id ? null : event.id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                          {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(event.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {event.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <AIModelBadge model={event.model_used as AIModel} />
                      {expandedId === event.id ? (
                        <ChevronUp className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded metadata */}
                {expandedId === event.id && (
                  <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700 pt-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Event Details
                    </p>
                    <pre className="text-xs bg-gray-50 dark:bg-gray-700/50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
