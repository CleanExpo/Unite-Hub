import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ContractorAvailability } from "@/components/contractor-availability";

/**
 * Tests for Australian Contractor Availability Calendar
 *
 * Verifies:
 * - Australian context (DD/MM/YYYY dates, en-AU spelling, AEST, Brisbane)
 * - Design system (2025-2026 aesthetic, Bento grid, glassmorphism)
 * - Accessibility (WCAG 2.1 AA compliance)
 * - Component behavior (date selection, slot filtering)
 */

describe("ContractorAvailability", () => {
  // Test data with Australian context
  const mockContractorName = "John Smith";
  const mockContractorMobile = "0412 345 678"; // Australian mobile format
  const mockContractorABN = "12 345 678 901"; // Australian Business Number

  const today = new Date("2026-01-06T09:00:00+10:00"); // AEST
  const tomorrow = new Date("2026-01-07T09:00:00+10:00");

  const mockSlots = [
    {
      date: today,
      startTime: "09:00",
      endTime: "12:00",
      location: "Indooroopilly, QLD", // Brisbane suburb
      status: "available" as const,
    },
    {
      date: today,
      startTime: "14:00",
      endTime: "17:00",
      location: "Toowong, QLD", // Brisbane suburb
      status: "booked" as const,
    },
    {
      date: tomorrow,
      startTime: "08:00",
      endTime: "10:00",
      location: "West End, QLD", // Brisbane suburb
      status: "available" as const,
    },
  ];

  beforeEach(() => {
    // Mock current date to ensure consistent test results
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-06T09:00:00+10:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Rendering", () => {
    it("renders contractor name", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      expect(screen.getByText(mockContractorName)).toBeInTheDocument();
    });

    it("renders contractor mobile in Australian format", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Should display: "Mobile: 0412 345 678"
      expect(screen.getByText(/0412 345 678/i)).toBeInTheDocument();
    });

    it("renders ABN when provided", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          contractorABN={mockContractorABN}
          availabilitySlots={mockSlots}
        />
      );

      // Should display: "ABN: 12 345 678 901"
      expect(screen.getByText(/12 345 678 901/i)).toBeInTheDocument();
    });

    it("does not render ABN section when not provided", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Should not show ABN label if ABN not provided
      expect(screen.queryByText(/ABN:/i)).not.toBeInTheDocument();
    });

    it("renders AEST timezone reference", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      expect(
        screen.getByText(/All times in AEST \(Australian Eastern Standard Time\)/i)
      ).toBeInTheDocument();
    });

    it("renders Brisbane area footer", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      expect(screen.getByText(/Serving Greater Brisbane area/i)).toBeInTheDocument();
      expect(screen.getByText(/All prices in AUD \(GST incl\.\)/i)).toBeInTheDocument();
    });
  });

  describe("Australian Date Formatting", () => {
    it("formats dates in DD/MM/YYYY format", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // 2026-01-06 should display as 06/01/2026 (DD/MM/YYYY)
      expect(screen.getByText("06/01/2026")).toBeInTheDocument();

      // 2026-01-07 should display as 07/01/2026
      expect(screen.getByText("07/01/2026")).toBeInTheDocument();
    });

    it("displays day of week in Australian format", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Should show abbreviated day names
      // 2026-01-06 is a Tuesday
      const tuesdayElement = screen.getByText(/Tue/i);
      expect(tuesdayElement).toBeInTheDocument();
    });

    it("marks today with (Today) label", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Today's date should have "(Today)" label
      const todayCard = screen.getByText("06/01/2026").closest("button");
      expect(todayCard).toHaveTextContent("(Today)");
    });
  });

  describe("Australian Time Formatting", () => {
    it("formats times in 12-hour format with am/pm", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Click on today's date to show slots
      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // 09:00 should display as 9:00am - 12:00pm
      expect(screen.getByText(/9:00am - 12:00pm/i)).toBeInTheDocument();

      // 14:00 should display as 2:00pm - 5:00pm
      expect(screen.getByText(/2:00pm - 5:00pm/i)).toBeInTheDocument();
    });

    it("uses lowercase am/pm (Australian standard)", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Should be "am" not "AM"
      const amTime = screen.getByText(/9:00am - 12:00pm/i);
      expect(amTime.textContent).toContain("am");
      expect(amTime.textContent).toContain("pm");

      // Should be lowercase
      expect(amTime.textContent).not.toContain("AM");
      expect(amTime.textContent).not.toContain("PM");
    });
  });

  describe("Brisbane Locations", () => {
    it("displays Brisbane suburbs correctly", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Click on today to show slots
      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Should show Indooroopilly, QLD
      expect(screen.getByText("Indooroopilly, QLD")).toBeInTheDocument();

      // Should show Toowong, QLD
      expect(screen.getByText("Toowong, QLD")).toBeInTheDocument();
    });

    it("displays Queensland state abbreviation", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // All locations should include ", QLD"
      const locations = screen.getAllByText(/QLD/i);
      expect(locations.length).toBeGreaterThan(0);
    });
  });

  describe("Date Selection & Slot Filtering", () => {
    it("allows selecting a date", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Should show "Available Times" heading after selection
      expect(screen.getByText(/Available Times - 06\/01\/2026/i)).toBeInTheDocument();
    });

    it("displays correct slots for selected date", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Click on today (has 2 slots)
      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Should show both slots for today
      expect(screen.getByText(/9:00am - 12:00pm/i)).toBeInTheDocument();
      expect(screen.getByText(/2:00pm - 5:00pm/i)).toBeInTheDocument();
    });

    it("filters slots when changing date selection", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Click on today
      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Should show 2 slots
      expect(screen.getByText(/9:00am - 12:00pm/i)).toBeInTheDocument();

      // Click on tomorrow (has 1 slot)
      const tomorrowButton = screen.getByText("07/01/2026").closest("button");
      fireEvent.click(tomorrowButton!);

      // Should now show tomorrow's slot instead
      expect(screen.getByText(/8:00am - 10:00am/i)).toBeInTheDocument();

      // Today's afternoon slot should not be visible
      expect(screen.queryByText(/2:00pm - 5:00pm/i)).not.toBeInTheDocument();
    });

    it("shows availability count on date cards", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Today has 1 available slot (9am-12pm is available, 2pm-5pm is booked)
      const todayCard = screen.getByText("06/01/2026").closest("button");
      expect(todayCard).toHaveTextContent("1 available");

      // Tomorrow has 1 available slot
      const tomorrowCard = screen.getByText("07/01/2026").closest("button");
      expect(tomorrowCard).toHaveTextContent("1 available");
    });

    it("shows 'No slots' for dates without availability", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Find a date card that has no slots (day after tomorrow)
      const emptyDateCards = screen.getAllByText("No slots");
      expect(emptyDateCards.length).toBeGreaterThan(0);
    });
  });

  describe("Slot Status Display", () => {
    it("displays 'available' status correctly", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Should show "Available" status
      expect(screen.getByText("available")).toBeInTheDocument();
    });

    it("displays 'booked' status correctly", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Should show "Booked" status
      expect(screen.getByText("booked")).toBeInTheDocument();
    });

    it("applies correct styling for available slots", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const todayButton = screen.getByText("06/01/2026").closest("button");
      fireEvent.click(todayButton!);

      // Available slot container should have success colour styling
      const availableSlot = screen.getByText("available");
      const slotContainer = availableSlot.closest(".text-success");
      expect(slotContainer).toBeInTheDocument();
      expect(slotContainer).toHaveClass("bg-success/10");
      expect(slotContainer).toHaveClass("border-success/20");
    });
  });

  describe("Accessibility (WCAG 2.1 AA)", () => {
    it("date cards are keyboard accessible buttons", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const dateButtons = screen.getAllByRole("button");
      // Should have multiple date buttons (7 days in calendar)
      expect(dateButtons.length).toBeGreaterThanOrEqual(7);
    });

    it("maintains heading hierarchy", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // h2 for contractor name
      const contractorHeading = screen.getByRole("heading", { level: 2 });
      expect(contractorHeading).toHaveTextContent(mockContractorName);

      // h3 for section headings
      const sectionHeadings = screen.getAllByRole("heading", { level: 3 });
      expect(sectionHeadings.length).toBeGreaterThan(0);
    });

    it("provides text content for screen readers", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // All important info should be in text, not just visual
      expect(screen.getByText(mockContractorMobile)).toBeInTheDocument();
      expect(screen.getByText(/AEST/i)).toBeInTheDocument();
      expect(screen.getByText(/Brisbane/i)).toBeInTheDocument();
    });

    it("highlights today's date visually", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const todayCard = screen.getByText("06/01/2026").closest("button");
      // Today should have special ring styling
      expect(todayCard).toHaveClass("ring-2");
      expect(todayCard).toHaveClass("ring-primary");
    });
  });

  describe("Design System (2025-2026)", () => {
    it("applies glassmorphism styling", () => {
      const { container } = render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Main container should have glassmorphism classes
      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("bg-white/70");
      expect(mainContainer).toHaveClass("backdrop-blur-md");
      expect(mainContainer).toHaveClass("border-white/20");
    });

    it("applies Bento grid layout", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Calendar grid should use responsive grid columns
      const calendarSection = screen.getByText("Next 7 Days").parentElement;
      const gridContainer = calendarSection?.querySelector(".grid");
      expect(gridContainer).toHaveClass("grid-cols-1");
      expect(gridContainer).toHaveClass("md:grid-cols-2");
      expect(gridContainer).toHaveClass("lg:grid-cols-3");
    });

    it("applies correct border radius", () => {
      const { container } = render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const mainContainer = container.firstChild as HTMLElement;
      // Should use rounded-lg (12px from design tokens)
      expect(mainContainer).toHaveClass("rounded-lg");
    });

    it("uses font-heading for headings", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Contractor name should use Cal Sans (font-heading)
      const heading = screen.getByText(mockContractorName);
      expect(heading).toHaveClass("font-heading");
    });

    it("applies hover micro-interactions", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      const dateButton = screen.getByText("06/01/2026").closest("button");
      // Should have hover scale and backdrop blur
      expect(dateButton).toHaveClass("hover:scale-[1.02]");
      expect(dateButton).toHaveClass("hover:backdrop-blur-lg");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty availability slots", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={[]}
        />
      );

      // Should still render calendar
      expect(screen.getByText("Next 7 Days")).toBeInTheDocument();

      // All days should show "No slots"
      const noSlotsTexts = screen.getAllByText("No slots");
      expect(noSlotsTexts.length).toBe(7); // 7 days
    });

    it("handles selecting date with no slots", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Find a date with no slots and click it
      const emptyDateButton = screen.getAllByText("No slots")[0].closest("button");
      fireEvent.click(emptyDateButton!);

      // Should show "No availability" message
      expect(screen.getByText(/No availability for this date/i)).toBeInTheDocument();
    });

    it("handles contractor without ABN", () => {
      render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
        />
      );

      // Should not crash or show ABN section
      expect(screen.queryByText(/ABN:/i)).not.toBeInTheDocument();
    });

    it("handles custom className prop", () => {
      const { container } = render(
        <ContractorAvailability
          contractorName={mockContractorName}
          contractorMobile={mockContractorMobile}
          availabilitySlots={mockSlots}
          className="custom-test-class"
        />
      );

      const mainContainer = container.firstChild as HTMLElement;
      expect(mainContainer).toHaveClass("custom-test-class");
    });
  });
});
