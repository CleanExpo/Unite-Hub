'use client';

import { ContractorAvailability } from '@/components/contractor-availability';

/**
 * Demo page for Contractor Availability Calendar
 * Demonstrates Australian context enforcement
 */

export default function ContractorAvailabilityDemo() {
  // Generate demo data with Australian context
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);

  const demoSlots = [
    // Today's availability
    {
      date: today,
      startTime: '09:00',
      endTime: '12:00',
      location: 'Indooroopilly, QLD',
      status: 'available' as const,
    },
    {
      date: today,
      startTime: '14:00',
      endTime: '17:00',
      location: 'Toowong, QLD',
      status: 'booked' as const,
    },
    // Tomorrow's availability
    {
      date: tomorrow,
      startTime: '08:00',
      endTime: '10:00',
      location: 'West End, QLD',
      status: 'available' as const,
    },
    {
      date: tomorrow,
      startTime: '10:30',
      endTime: '12:30',
      location: 'South Brisbane, QLD',
      status: 'available' as const,
    },
    {
      date: tomorrow,
      startTime: '13:00',
      endTime: '15:00',
      location: 'Woolloongabba, QLD',
      status: 'tentative' as const,
    },
    // Day after tomorrow
    {
      date: dayAfter,
      startTime: '09:00',
      endTime: '17:00',
      location: 'Brisbane CBD, QLD',
      status: 'available' as const,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-heading mb-2 text-4xl font-bold text-gray-900">
            Contractor Availability Demo
          </h1>
          <p className="text-gray-600">
            Testing Unite-Group AI Architecture with Australian context
          </p>
        </div>

        {/* Component showcase */}
        <div className="grid grid-cols-1 gap-8">
          {/* Main contractor */}
          <ContractorAvailability
            contractorName="John Smith"
            contractorMobile="0412 345 678"
            contractorABN="12 345 678 901"
            availabilitySlots={demoSlots}
          />

          {/* Second contractor example */}
          <ContractorAvailability
            contractorName="Sarah Johnson"
            contractorMobile="0423 456 789"
            contractorABN="23 456 789 012"
            availabilitySlots={[
              {
                date: today,
                startTime: '08:00',
                endTime: '16:00',
                location: 'Ashgrove, QLD',
                status: 'available',
              },
              {
                date: tomorrow,
                startTime: '09:00',
                endTime: '12:00',
                location: 'Paddington, QLD',
                status: 'available',
              },
            ]}
          />
        </div>

        {/* Testing checklist */}
        <div className="rounded-lg border border-white/20 bg-white/70 p-6 shadow-[0_10px_15px_rgba(13,148,136,0.1)] backdrop-blur-md">
          <h2 className="font-heading mb-4 text-2xl font-bold">Architecture Testing Checklist</h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-success text-xl">✓</span>
              <div>
                <div className="font-medium">Australian Context (en-AU)</div>
                <div className="text-sm text-gray-600">
                  DD/MM/YYYY dates, AEST timezone, Brisbane locations, &quot;colour&quot; spelling,
                  04XX XXX XXX mobile format
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-success text-xl">✓</span>
              <div>
                <div className="font-medium">2025-2026 Design System</div>
                <div className="text-sm text-gray-600">
                  Bento grid cards, glassmorphism (bg-white/70 backdrop-blur), soft coloured shadows
                  (NEVER pure black), primary #0D9488
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-success text-xl">✓</span>
              <div>
                <div className="font-medium">Next.js 15 Patterns</div>
                <div className="text-sm text-gray-600">
                  &quot;use client&quot; directive, React 19, TypeScript, forwardRef, proper
                  component structure
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-success text-xl">✓</span>
              <div>
                <div className="font-medium">NO Lucide Icons</div>
                <div className="text-sm text-gray-600">
                  Using emoji (📍) and custom UI elements only - Lucide is deprecated in 2025-2026
                  aesthetic
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-success text-xl">✓</span>
              <div>
                <div className="font-medium">Accessibility</div>
                <div className="text-sm text-gray-600">
                  WCAG 2.1 AA compliant, semantic HTML, keyboard navigation, screen reader friendly
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-success text-xl">✓</span>
              <div>
                <div className="font-medium">Australian Business Context</div>
                <div className="text-sm text-gray-600">
                  ABN (Australian Business Number), GST inclusive pricing, Queensland suburbs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Code example */}
        <div className="rounded-lg bg-gray-900 p-6 text-sm">
          <div className="mb-2 font-mono text-gray-400">Usage Example:</div>
          <pre className="overflow-x-auto text-gray-300">
            {`<ContractorAvailability
  contractorName="John Smith"
  contractorMobile="0412 345 678"  {/* Australian format */}
  contractorABN="12 345 678 901"   {/* Optional ABN */}
  availabilitySlots={[
    {
      date: new Date("2026-01-07"),
      startTime: "09:00",           {/* 24-hour format */}
      endTime: "12:00",
      location: "Indooroopilly, QLD", {/* Brisbane suburb */}
      status: "available"
    }
  ]}
/>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
