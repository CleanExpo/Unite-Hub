'use client';

/**
 * Engagement Heatmap Component
 * Phase 48: Visual representation of client activity over time
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HeatmapData {
  date: string;
  count: number;
}

interface EngagementHeatmapProps {
  data: HeatmapData[];
  daysToShow?: number;
}

export function EngagementHeatmap({
  data,
  daysToShow = 30,
}: EngagementHeatmapProps) {
  // Create a map of date -> count for quick lookup
  const countMap = new Map(data.map(d => [d.date, d.count]));

  // Generate array of last N days
  const days: Array<{ date: string; count: number; dayOfWeek: number }> = [];
  for (let i = daysToShow - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      count: countMap.get(dateStr) || 0,
      dayOfWeek: date.getDay(),
    });
  }

  // Get max count for scaling
  const maxCount = Math.max(...data.map(d => d.count), 1);

  // Get color based on activity level
  const getColor = (count: number) => {
    if (count === 0) {
return 'bg-bg-hover';
}
    const intensity = count / maxCount;
    if (intensity >= 0.75) {
return 'bg-green-500';
}
    if (intensity >= 0.5) {
return 'bg-green-400';
}
    if (intensity >= 0.25) {
return 'bg-green-300';
}
    return 'bg-green-200';
  };

  // Calculate total activity
  const totalActivity = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter(d => d.count > 0).length;
  const avgPerDay = activeDays > 0 ? (totalActivity / activeDays).toFixed(1) : '0';

  // Get weeks for display
  const weeks: Array<typeof days> = [];
  let currentWeek: typeof days = [];

  // Pad the first week with empty days if needed
  const firstDayOfWeek = days[0]?.dayOfWeek || 0;
  for (let i = 0; i < firstDayOfWeek; i++) {
    currentWeek.push({ date: '', count: 0, dayOfWeek: i });
  }

  days.forEach(day => {
    currentWeek.push(day);
    if (day.dayOfWeek === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{totalActivity}</p>
            <p className="text-xs text-muted-foreground">Total Activities</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{activeDays}</p>
            <p className="text-xs text-muted-foreground">Active Days</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{avgPerDay}</p>
            <p className="text-xs text-muted-foreground">Avg/Day</p>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-1">
            {dayLabels.map((label, i) => (
              <div
                key={i}
                className="w-3 h-3 text-[8px] text-muted-foreground flex items-center justify-center"
              >
                {i % 2 === 1 ? label : ''}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="flex gap-1 overflow-x-auto">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`w-3 h-3 rounded-sm ${
                      day.date ? getColor(day.count) : 'bg-transparent'
                    }`}
                    title={
                      day.date
                        ? `${day.date}: ${day.count} activities`
                        : ''
                    }
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-4">
          <span className="text-xs text-muted-foreground mr-1">Less</span>
          <div className="w-3 h-3 rounded-sm bg-bg-hover" />
          <div className="w-3 h-3 rounded-sm bg-green-200" />
          <div className="w-3 h-3 rounded-sm bg-green-300" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <span className="text-xs text-muted-foreground ml-1">More</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default EngagementHeatmap;
