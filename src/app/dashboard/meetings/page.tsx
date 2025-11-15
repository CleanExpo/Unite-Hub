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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

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
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async () => {
    try {
      setCreating(true);

      const attendeesList = newMeeting.attendees
        .split(",")
        .map((email) => email.trim())
        .filter(Boolean);

      const response = await fetch("/api/calendar/create-meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0 && !loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Calendar className="h-24 w-24 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Google Calendar Not Connected</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Connect your Google Calendar to view and manage your meetings with AI-powered scheduling assistance.
          </p>
          <Button asChild>
            <a href="/dashboard/settings/integrations">
              Connect Google Calendar
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Meetings Calendar
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered meeting management and scheduling
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
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
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createMeeting} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Meeting"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No meetings found</p>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold mb-3">{date}</h2>
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <Card key={event.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{event.summary}</h3>
                            {event.hangoutLink && (
                              <Badge variant="secondary" className="gap-1">
                                <Video className="h-3 w-3" />
                                Meet
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                            <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          )}

                          {event.location && (
                            <p className="text-sm text-muted-foreground">Location: {event.location}</p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {event.hangoutLink && (
                            <Button size="sm" asChild>
                              <a
                                href={event.hangoutLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="gap-2"
                              >
                                <Video className="h-4 w-4" />
                                Join
                              </a>
                            </Button>
                          )}
                          <Button size="sm" variant="outline" asChild>
                            <a
                              href={`https://calendar.google.com/calendar/r/eventedit/${event.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
