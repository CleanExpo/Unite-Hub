"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Video,
  Users,
  Search,
  Plus,
  Loader2,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorState } from "@/components/ErrorState";
import { MeetingSkeleton } from "@/components/skeletons/MeetingSkeleton";
import { supabaseBrowser } from "@/lib/supabase";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  hangoutLink?: string;
  attendees?: Array<{ email: string; displayName?: string }>;
  location?: string;
}

export default function MeetingsPage() {
  const { currentOrganization } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"upcoming" | "all">("upcoming");
  const [error, setError] = useState<string | null>(null);

  const workspaceId = currentOrganization?.id || "";

  const [newMeeting, setNewMeeting] = useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    attendees: "",
    withMeet: true,
  });

  useEffect(() => {
    if (workspaceId) {
      fetchEvents();
    }
  }, [workspaceId, viewMode]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const now = new Date();
      const timeMin =
        viewMode === "upcoming" ? now.toISOString() : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const timeMax = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const response = await fetch(
        `/api/calendar/events?workspaceId=${workspaceId}&timeMin=${timeMin}&timeMax=${timeMax}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          setEvents([]);
          return;
        }
        throw new Error("Failed to fetch calendar events");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setError(error instanceof Error ? error.message : "Failed to load meetings");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async () => {
    try {
      setCreating(true);

      // Get session for auth
      const { data: { session } } = await supabaseBrowser.auth.getSession();

      if (!session) {
        alert("Not authenticated");
        setCreating(false);
        return;
      }

      const attendeesList = newMeeting.attendees
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      const response = await fetch("/api/calendar/create-meeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workspaceId,
          summary: newMeeting.summary,
          description: newMeeting.description,
          start: new Date(newMeeting.start).toISOString(),
          end: new Date(newMeeting.end).toISOString(),
          attendees: attendeesList,
          withMeet: newMeeting.withMeet,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      setNewMeeting({
        summary: "",
        description: "",
        start: "",
        end: "",
        attendees: "",
        withMeet: true,
      });

      setShowCreateDialog(false);
      fetchEvents();
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const filteredEvents = events.filter((event) =>
    event.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupEventsByDate = (events: CalendarEvent[]) => {
    const grouped: { [key: string]: CalendarEvent[] } = {};

    events.forEach((event) => {
      const date = new Date(event.start.dateTime).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Meetings" }]} />
        <ErrorState
          title="Failed to Load Meetings"
          message={error}
          onRetry={fetchEvents}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Meetings" }]} />

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Calendar className="h-10 w-10 text-[#00F5FF]" />
              <div className="text-4xl font-bold text-white/90">Meetings Calendar</div>
            </div>
            <div className="text-white/50">AI-powered meeting management and scheduling</div>
          </div>
        </div>

        <MeetingSkeleton count={2} />
      </div>
    );
  }

  if (events.length === 0 && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="bg-white/[0.02] rounded-sm border-2 border-dashed border-white/[0.06] p-12">
            <Calendar className="h-24 w-24 text-white/30 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white/90 mb-2">Google Calendar Not Connected</h2>
            <p className="text-white/50 mb-6 max-w-md">
              Connect your Google Calendar to view and manage your meetings with AI-powered scheduling assistance.
            </p>
            <a
              href="/dashboard/settings/integrations"
              className="inline-flex items-center bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2"
            >
              Connect Google Calendar
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Meetings" }]} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white/90 mb-2 flex items-center gap-3">
            <Calendar className="h-10 w-10 text-[#00F5FF]" />
            Meetings Calendar
          </h1>
          <p className="text-white/50">
            AI-powered meeting management and scheduling
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-[#050505] border border-white/[0.06]">
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Create a calendar event with optional Google Meet link
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="summary">Meeting Title</Label>
                <Input
                  id="summary"
                  placeholder="Team Sync"
                  value={newMeeting.summary}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, summary: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Discuss Q1 planning..."
                  value={newMeeting.description}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start Time</Label>
                  <Input
                    id="start"
                    type="datetime-local"
                    value={newMeeting.start}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, start: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End Time</Label>
                  <Input
                    id="end"
                    type="datetime-local"
                    value={newMeeting.end}
                    onChange={(e) =>
                      setNewMeeting({ ...newMeeting, end: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="attendees">Attendees (comma-separated)</Label>
                <Input
                  id="attendees"
                  placeholder="john@example.com, jane@example.com"
                  value={newMeeting.attendees}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, attendees: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="withMeet"
                  checked={newMeeting.withMeet}
                  onChange={(e) =>
                    setNewMeeting({ ...newMeeting, withMeet: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                <Label htmlFor="withMeet" className="cursor-pointer">
                  Add Google Meet link
                </Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCreateDialog(false)}
                className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={createMeeting}
                disabled={creating}
                className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Meeting"
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
            <Input
              placeholder="Search meetings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-[#050505] border-white/[0.06] text-white/90 placeholder:text-white/30"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode("upcoming")}
              className={`px-4 py-2 rounded-sm font-mono text-sm font-semibold ${
                viewMode === "upcoming"
                  ? "bg-[#00F5FF] text-[#050505]"
                  : "bg-white/[0.02] border border-white/[0.06] text-white/50 hover:bg-white/[0.04]"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => setViewMode("all")}
              className={`px-4 py-2 rounded-sm font-mono text-sm font-semibold ${
                viewMode === "all"
                  ? "bg-[#00F5FF] text-[#050505]"
                  : "bg-white/[0.02] border border-white/[0.06] text-white/50 hover:bg-white/[0.04]"
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="bg-white/[0.02] rounded-sm border-2 border-dashed border-white/[0.06] p-12 text-center">
            <Calendar className="h-12 w-12 text-white/30 mx-auto mb-2" />
            <p className="text-white/40">No meetings found</p>
          </div>
        ) : (
          Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold text-white/90 mb-3">{date}</h2>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <div key={event.id} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 hover:border-[#00F5FF]/30">

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white/90">{event.summary}</h3>
                          {event.hangoutLink && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-mono bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/20">
                              <Video className="h-3 w-3" />
                              Meet
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-white/40 mb-2">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {new Date(event.start.dateTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(event.end.dateTime).toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </div>
                          {event.attendees && event.attendees.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {event.attendees.length} attendee{event.attendees.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>

                        {event.description && (
                          <p className="text-sm text-white/40 mb-2">{event.description}</p>
                        )}

                        {event.location && (
                          <p className="text-sm text-white/40">Location: {event.location}</p>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {event.hangoutLink && (
                          <a
                            href={event.hangoutLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2"
                          >
                            <Video className="h-4 w-4" />
                            Join
                          </a>
                        )}
                        <a
                          href={`https://calendar.google.com/calendar/r/eventedit/${event.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
