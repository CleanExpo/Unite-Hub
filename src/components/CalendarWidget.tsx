"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, Video, Plus, Loader2 } from "lucide-react";
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

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  hangoutLink?: string;
  attendees?: Array<{ email: string }>;
}

interface CalendarWidgetProps {
  workspaceId: string;
}

export default function CalendarWidget({ workspaceId }: CalendarWidgetProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    summary: "",
    description: "",
    start: "",
    end: "",
    attendees: "",
    withMeet: true,
  });

  useEffect(() => {
    fetchUpcomingEvents();
  }, [workspaceId]);

  const fetchUpcomingEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/calendar/events?workspaceId=${workspaceId}&timeMin=${new Date().toISOString()}`
      );

      const data = await response.json();

      // Handle both success and graceful failure responses
      if (data.events && Array.isArray(data.events)) {
        setEvents(data.events.slice(0, 5)); // Show next 5 events
      } else {
        setEvents([]);
      }
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
          start: newMeeting.start,
          end: newMeeting.end,
          attendees: attendeesList,
          withMeet: newMeeting.withMeet,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      const data = await response.json();

      // Reset form
      setNewMeeting({
        summary: "",
        description: "",
        start: "",
        end: "",
        attendees: "",
        withMeet: true,
      });

      setShowCreateDialog(false);
      fetchUpcomingEvents();
    } catch (error) {
      console.error("Error creating meeting:", error);
      alert("Failed to create meeting. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const formatEventTime = (event: CalendarEvent) => {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let datePrefix = "";
    if (start.toDateString() === today.toDateString()) {
      datePrefix = "Today";
    } else if (start.toDateString() === tomorrow.toDateString()) {
      datePrefix = "Tomorrow";
    } else {
      datePrefix = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }

    const timeRange = `${start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })} - ${end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })}`;

    return { datePrefix, timeRange };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Meetings
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Meetings
          </CardTitle>
          <CardDescription>Next {events.length} scheduled events</CardDescription>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Meeting</DialogTitle>
              <DialogDescription>
                Create a new calendar event with optional Google Meet link
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
                <Label htmlFor="description">Description (Optional)</Label>
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
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
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
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming meetings scheduled
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Click "Schedule" to create one
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const { datePrefix, timeRange } = formatEventTime(event);
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {event.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {datePrefix}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {timeRange}
                      </span>
                    </div>
                    {event.attendees && event.attendees.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.attendees.length} attendee
                        {event.attendees.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </div>
                  {event.hangoutLink && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0"
                      asChild
                    >
                      <a
                        href={event.hangoutLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Video className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
