/**
 * Live Contractor Availability Component (API-Connected)
 *
 * This component fetches real data from the FastAPI backend.
 * Features:
 * - Real-time data from backend API
 * - Loading and error states
 * - Australian context (DD/MM/YYYY, AEST, Brisbane)
 * - Bento grid + glassmorphism design
 */

"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { contractorAPI } from "@/lib/api/contractors";
import type { Contractor, AvailabilitySlot } from "@/types/contractor";

interface ContractorAvailabilityLiveProps {
  contractorId: string;
  className?: string;
}

export const ContractorAvailabilityLive = React.forwardRef<
  HTMLDivElement,
  ContractorAvailabilityLiveProps
>(({ contractorId, className }, ref) => {
  const [contractor, setContractor] = useState<Contractor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Fetch contractor data from API
  useEffect(() => {
    let mounted = true;

    async function fetchContractor() {
      try {
        setLoading(true);
        setError(null);
        const data = await contractorAPI.get(contractorId);
        if (mounted) {
          setContractor(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load contractor");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchContractor();

    return () => {
      mounted = false;
    };
  }, [contractorId]);

  // Format date to Australian standard (DD/MM/YYYY)
  const formatAustralianDate = (date: Date): string => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format time to Australian standard (12-hour with am/pm)
  const formatAustralianTime = (time: string): string => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const period = hour >= 12 ? "pm" : "am";
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes}${period}`;
  };

  // Convert API date string (ISO 8601) to Date object
  const parseAPIDate = (dateString: string): Date => {
    return new Date(dateString);
  };

  // Get status colour (using Australian spelling!)
  const getStatusColour = (status: AvailabilitySlot["status"]) => {
    switch (status) {
      case "available":
        return "bg-success/10 border-success/20 text-success";
      case "booked":
        return "bg-gray-100 border-gray-200 text-gray-500";
      case "tentative":
        return "bg-warning/10 border-warning/20 text-warning";
      case "unavailable":
        return "bg-error/10 border-error/20 text-error";
    }
  };

  // Get next 7 days
  const getNextWeek = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get slots for a specific date
  const getSlotsForDate = (date: Date): AvailabilitySlot[] => {
    if (!contractor?.availabilitySlots) return [];

    return contractor.availabilitySlots.filter((slot) => {
      const slotDate = parseAPIDate(slot.date);
      return slotDate.toDateString() === date.toDateString();
    });
  };

  // Loading state
  if (loading) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg",
          "bg-white/70 backdrop-blur-md",
          "border border-white/20",
          "shadow-[0_10px_15px_rgba(13,148,136,0.1)]",
          "p-6",
          className
        )}
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-500 text-center mt-6">
          Loading contractor availability...
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-lg",
          "bg-white/70 backdrop-blur-md",
          "border border-error/20",
          "shadow-[0_10px_15px_rgba(239,68,68,0.1)]",
          "p-6",
          className
        )}
      >
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="font-heading text-lg font-semibold text-error mb-2">
            Failed to Load Contractor
          </h3>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No contractor found
  if (!contractor) {
    return null;
  }

  const nextWeek = getNextWeek();

  return (
    <div
      ref={ref}
      className={cn(
        // Bento grid card - 2025-2026 aesthetic
        "relative overflow-hidden rounded-lg",
        // Glassmorphism effect
        "bg-white/70 backdrop-blur-md",
        "border border-white/20",
        // Soft coloured shadow (NEVER pure black)
        "shadow-[0_10px_15px_rgba(13,148,136,0.1)]",
        "p-6",
        className
      )}
    >
      {/* Header with contractor details */}
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold text-gray-900 mb-2">
          {contractor.name}
        </h2>
        <div className="flex flex-col gap-1 text-sm text-gray-600">
          <p>
            <span className="font-medium">Mobile:</span> {contractor.mobile}
          </p>
          {contractor.abn && (
            <p>
              <span className="font-medium">ABN:</span> {contractor.abn}
            </p>
          )}
          {contractor.email && (
            <p>
              <span className="font-medium">Email:</span> {contractor.email}
            </p>
          )}
          {contractor.specialisation && (
            <p className="text-primary font-medium mt-1">
              {contractor.specialisation}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            All times in AEST (Australian Eastern Standard Time)
          </p>
        </div>
      </div>

      {/* Calendar Grid - Bento style */}
      <div className="space-y-4">
        <h3 className="font-heading text-lg font-semibold text-gray-800">
          Next 7 Days
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {nextWeek.map((date, index) => {
            const slots = getSlotsForDate(date);
            const hasAvailability = slots.some((s) => s.status === "available");
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  // Bento card
                  "relative p-4 rounded-lg border transition-all",
                  "hover:scale-[1.02] hover:shadow-md",
                  // Glassmorphism on hover
                  "hover:bg-white/80 hover:backdrop-blur-lg",
                  isToday && "ring-2 ring-primary ring-offset-2",
                  selectedDate?.toDateString() === date.toDateString()
                    ? "bg-primary/5 border-primary"
                    : "bg-white/50 border-gray-200",
                  !hasAvailability && "opacity-60"
                )}
              >
                <div className="text-left">
                  {/* Australian date format */}
                  <div className="font-heading font-semibold text-gray-900">
                    {formatAustralianDate(date)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {date.toLocaleDateString("en-AU", { weekday: "short" })}
                    {isToday && " (Today)"}
                  </div>

                  {/* Availability count */}
                  <div className="mt-3">
                    {slots.length === 0 ? (
                      <span className="text-xs text-gray-400">No slots</span>
                    ) : (
                      <span className="text-xs font-medium text-primary">
                        {slots.filter((s) => s.status === "available").length} available
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected date slots */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h3 className="font-heading text-lg font-semibold text-gray-800 mb-4">
            Available Times - {formatAustralianDate(selectedDate)}
          </h3>

          <div className="space-y-3">
            {getSlotsForDate(selectedDate).map((slot) => (
              <div
                key={slot.id}
                className={cn(
                  "p-4 rounded-lg border",
                  "flex justify-between items-center",
                  getStatusColour(slot.status)
                )}
              >
                <div>
                  <div className="font-medium">
                    {formatAustralianTime(slot.startTime)} -{" "}
                    {formatAustralianTime(slot.endTime)}
                  </div>
                  <div className="text-sm mt-1">
                    {slot.location.suburb}, {slot.location.state}
                    {slot.location.postcode && ` ${slot.location.postcode}`}
                  </div>
                  {slot.notes && (
                    <div className="text-xs mt-1 text-gray-500">{slot.notes}</div>
                  )}
                </div>
                <div className="text-sm font-medium capitalize">
                  {slot.status}
                </div>
              </div>
            ))}

            {getSlotsForDate(selectedDate).length === 0 && (
              <p className="text-sm text-gray-500 text-center py-8">
                No availability for this date
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer with Australian context */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          📍 Serving Greater Brisbane area • All prices in AUD (GST incl.)
        </p>
      </div>
    </div>
  );
});

ContractorAvailabilityLive.displayName = "ContractorAvailabilityLive";
