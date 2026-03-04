"use client";

import React, { useState, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { DateSelectArg, EventClickArg, DatesSetArg, EventInput } from "@fullcalendar/core";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, MapPin, FileText, Clock, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarEventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  colour: string;
}

interface AddEventForm {
  title: string;
  start: string;
  end: string;
  description: string;
}

// ─── Scientific Luxury CSS ────────────────────────────────────────────────────

const calendarCss = `
  .fc {
    --fc-border-color: rgba(0, 245, 255, 0.15);
    --fc-button-bg-color: transparent;
    --fc-button-border-color: rgba(0, 245, 255, 0.3);
    --fc-button-text-color: #00F5FF;
    --fc-button-active-bg-color: rgba(0, 245, 255, 0.1);
    --fc-button-active-border-color: rgba(0, 245, 255, 0.6);
    --fc-button-hover-bg-color: rgba(0, 245, 255, 0.08);
    --fc-button-hover-border-color: rgba(0, 245, 255, 0.5);
    --fc-today-bg-color: rgba(0, 245, 255, 0.05);
    --fc-event-border-color: transparent;
    --fc-page-bg-color: #050505;
    --fc-neutral-bg-color: #0a0a0a;
    --fc-list-event-hover-bg-color: rgba(0, 245, 255, 0.05);
    background: #050505;
    color: white;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
  }
  .fc .fc-toolbar-title {
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .fc .fc-button {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 0.35rem 0.75rem;
    border-radius: 2px;
    transition: all 0.15s ease;
  }
  .fc .fc-button:hover {
    background: rgba(0, 245, 255, 0.1) !important;
    color: #00F5FF !important;
  }
  .fc .fc-button-primary:not(:disabled).fc-button-active {
    background: rgba(0, 245, 255, 0.12) !important;
    border-color: rgba(0, 245, 255, 0.5) !important;
    color: #00F5FF !important;
  }
  .fc .fc-daygrid-day-number {
    color: rgba(255, 255, 255, 0.5);
    font-size: 0.75rem;
    padding: 6px 8px;
  }
  .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
    color: #00F5FF;
    font-weight: 700;
  }
  .fc .fc-col-header-cell-cushion {
    color: rgba(255, 255, 255, 0.35);
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-weight: 600;
    padding: 8px 4px;
  }
  .fc .fc-scrollgrid {
    border-color: rgba(0, 245, 255, 0.12);
  }
  .fc .fc-scrollgrid-section > * {
    border-color: rgba(0, 245, 255, 0.12);
  }
  .fc td, .fc th {
    border-color: rgba(0, 245, 255, 0.08) !important;
  }
  .fc .fc-event {
    border-radius: 2px;
    font-size: 0.72rem;
    font-weight: 500;
    border: none !important;
    cursor: pointer;
    transition: opacity 0.15s ease;
  }
  .fc .fc-event:hover {
    opacity: 0.85;
  }
  .fc .fc-event-title {
    padding: 1px 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .fc .fc-timegrid-slot {
    height: 2rem;
  }
  .fc .fc-timegrid-slot-label-cushion {
    color: rgba(255, 255, 255, 0.3);
    font-size: 0.65rem;
  }
  .fc .fc-daygrid-more-link {
    color: #00F5FF;
    font-size: 0.7rem;
  }
  .fc .fc-popover {
    background: #0f0f0f;
    border: 1px solid rgba(0, 245, 255, 0.2);
    border-radius: 2px;
  }
  .fc .fc-popover-title {
    color: white;
    background: #0a0a0a;
    padding: 6px 10px;
    font-size: 0.75rem;
  }
  .fc .fc-popover-close {
    color: rgba(255,255,255,0.5);
  }
`;

// ─── Add Event Modal ──────────────────────────────────────────────────────────

function AddEventModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Partial<AddEventForm>;
  onClose: () => void;
  onSave: (form: AddEventForm) => Promise<void>;
}) {
  const [form, setForm] = useState<AddEventForm>({
    title: initial.title ?? "",
    start: initial.start ?? "",
    end: initial.end ?? "",
    description: initial.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start || !form.end) return;
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full bg-[#0d0d0d] border border-[rgba(0,245,255,0.2)] text-white text-sm px-3 py-2 outline-none focus:border-[rgba(0,245,255,0.5)] transition-colors placeholder:text-zinc-600 rounded-sm";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 8 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 8 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-[#0a0a0a] border border-[rgba(0,245,255,0.2)] rounded-sm w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,245,255,0.1)]">
          <h2 className="text-sm font-semibold text-[#00F5FF] uppercase tracking-widest">
            Add Event
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
              Title *
            </label>
            <input
              className={inputCls}
              placeholder="Event title"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                Start *
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.start}
                onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                End *
              </label>
              <input
                type="datetime-local"
                className={inputCls}
                value={form.end}
                onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Optional notes..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !form.title.trim() || !form.start || !form.end}
              className="flex-1 bg-[rgba(0,245,255,0.1)] border border-[rgba(0,245,255,0.3)] text-[#00F5FF] text-sm font-semibold uppercase tracking-wider py-2 rounded-sm hover:bg-[rgba(0,245,255,0.15)] disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? "Saving..." : "Create Event"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 text-sm text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Event Detail Panel ───────────────────────────────────────────────────────

function EventDetailPanel({
  event,
  onClose,
}: {
  event: CalendarEventItem;
  onClose: () => void;
}) {
  const formatTime = (iso: string) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Australia/Sydney",
      });
    } catch {
      return iso;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="absolute right-4 top-16 z-40 w-72 bg-[#0a0a0a] border border-[rgba(0,245,255,0.2)] rounded-sm shadow-2xl overflow-hidden"
    >
      {/* Colour bar */}
      <div className="h-1" style={{ background: event.colour }} />

      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-3 pb-2">
        <h3 className="text-sm font-semibold text-white leading-tight pr-2 flex-1">
          {event.title}
        </h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0 mt-0.5">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-4 pb-4 space-y-2.5">
        {/* Time */}
        <div className="flex items-start gap-2 text-xs text-zinc-400">
          <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-zinc-600" />
          <div>
            <p>{formatTime(event.start)}</p>
            {event.end && event.end !== event.start && (
              <p className="text-zinc-600">→ {formatTime(event.end)}</p>
            )}
            {event.allDay && <p className="text-[#00F5FF] text-[10px]">All day</p>}
          </div>
        </div>

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-2 text-xs text-zinc-400">
            <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-zinc-600" />
            <p className="leading-relaxed">{event.location}</p>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="flex items-start gap-2 text-xs text-zinc-400">
            <FileText className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-zinc-600" />
            <p className="leading-relaxed line-clamp-4">{event.description}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function FounderCalendarPage() {
  const calendarRef = useRef<InstanceType<typeof FullCalendar>>(null);

  const [events, setEvents] = useState<EventInput[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addInitial, setAddInitial] = useState<Partial<AddEventForm>>({});

  // Detail panel
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventItem | null>(null);

  // ─── Fetch events for current view range ────────────────────────────────────
  const fetchEvents = useCallback(async (start: string, end: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ start, end, maxResults: "100" });
      const res = await fetch(`/api/founder/calendar?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConnected(data.connected ?? false);

      const fcEvents: EventInput[] = (data.events ?? []).map((e: CalendarEventItem) => ({
        id: e.id,
        title: e.title,
        start: e.start,
        end: e.end,
        allDay: e.allDay,
        backgroundColor: e.colour,
        borderColor: "transparent",
        extendedProps: {
          location: e.location,
          description: e.description,
          colour: e.colour,
        },
      }));
      setEvents(fcEvents);
    } catch (err) {
      console.error("Failed to load calendar events:", err);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── FullCalendar date range changed ────────────────────────────────────────
  const handleDatesSet = useCallback(
    (arg: DatesSetArg) => {
      fetchEvents(arg.startStr, arg.endStr);
    },
    [fetchEvents]
  );

  // ─── Date selection for quick add ────────────────────────────────────────────
  const handleSelect = useCallback((arg: DateSelectArg) => {
    const toLocal = (d: Date) =>
      new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setAddInitial({ start: toLocal(arg.start), end: toLocal(arg.end) });
    setShowAddModal(true);
  }, []);

  // ─── Event click ─────────────────────────────────────────────────────────────
  const handleEventClick = useCallback((arg: EventClickArg) => {
    const e = arg.event;
    setSelectedEvent({
      id: e.id,
      title: e.title,
      start: e.startStr,
      end: e.endStr,
      allDay: e.allDay,
      location: e.extendedProps.location ?? null,
      description: e.extendedProps.description ?? null,
      colour: e.extendedProps.colour ?? "#6366f1",
    });
  }, []);

  // ─── Save new event via API ───────────────────────────────────────────────────
  const handleSaveEvent = useCallback(async (form: AddEventForm) => {
    const toIso = (localDt: string) => new Date(localDt).toISOString();
    const res = await fetch("/api/founder/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        start: toIso(form.start),
        end: toIso(form.end),
        description: form.description || undefined,
      }),
    });
    if (!res.ok) throw new Error("Failed to create event");

    // Refresh current view
    const api = calendarRef.current?.getApi();
    if (api) {
      const view = api.view;
      fetchEvents(view.currentStart.toISOString(), view.currentEnd.toISOString());
    }
  }, [fetchEvents]);

  return (
    <div className="relative min-h-screen bg-[#050505] text-white p-4 sm:p-6">
      <style>{calendarCss}</style>

      {/* ─── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-widest text-white">
            Calendar
          </h1>
          <p className="text-xs text-zinc-600 mt-0.5 tracking-wide">Australia/Sydney</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Loading indicator */}
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Loading...</span>
            </div>
          )}

          {/* Add event button */}
          <button
            onClick={() => { setAddInitial({}); setShowAddModal(true); }}
            className="flex items-center gap-2 bg-[rgba(0,245,255,0.08)] border border-[rgba(0,245,255,0.25)] text-[#00F5FF] text-xs font-semibold uppercase tracking-wider px-4 py-2 rounded-sm hover:bg-[rgba(0,245,255,0.14)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Event
          </button>
        </div>
      </div>

      {/* ─── Not connected banner ─────────────────────────────────────────── */}
      <AnimatePresence>
        {connected === false && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 mb-4 px-4 py-3 bg-[rgba(255,180,0,0.08)] border border-[rgba(255,180,0,0.25)] rounded-sm"
          >
            <AlertTriangle className="w-4 h-4 text-[#FFB800] flex-shrink-0" />
            <p className="text-sm text-[#FFB800]">
              Google Calendar not connected.
            </p>
            <a
              href="/settings/integrations"
              className="ml-auto flex items-center gap-1 text-xs text-[#FFB800] hover:text-white underline underline-offset-2 transition-colors"
            >
              Integrations <ExternalLink className="w-3 h-3" />
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Calendar ─────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* Overlay while loading (first load) */}
        <AnimatePresence>
          {loading && events.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-[#050505]/80 rounded-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#00F5FF] animate-spin" />
                <p className="text-xs text-zinc-500 uppercase tracking-widest">Fetching events...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          height="auto"
          events={events}
          selectable
          selectMirror
          dayMaxEvents={3}
          weekends
          nowIndicator
          timeZone="Australia/Sydney"
          datesSet={handleDatesSet}
          select={handleSelect}
          eventClick={handleEventClick}
          buttonText={{
            today: "Today",
            month: "Month",
            week: "Week",
            day: "Day",
          }}
        />
      </div>

      {/* ─── Event Detail Panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailPanel
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Add Event Modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showAddModal && (
          <AddEventModal
            initial={addInitial}
            onClose={() => setShowAddModal(false)}
            onSave={handleSaveEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
