import { format, parse } from 'date-fns';
import type { MasterTourClient, DayResponse } from '../api/client.js';

export interface GetTodayScheduleInput {
  tourId?: string;
  date?: string; // YYYY-MM-DD format
}

export async function getTodaySchedule(
  client: MasterTourClient,
  input: GetTodayScheduleInput
): Promise<string> {
  // Resolve tour ID (caller should provide from config if not in input)
  const tourId = input.tourId;
  if (!tourId) {
    throw new Error('tourId is required. Provide it as input or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.');
  }

  // Resolve date (default to today)
  const date = input.date || new Date().toISOString().split('T')[0];

  // Get day summary to find the day ID
  const summary = await client.getTourSummary(tourId, date);
  
  // Handle case where no day exists for that date
  if (!summary || summary.length === 0) {
    return `No schedule found for ${date}. The tour may not have activity on this date.`;
  }

  // Get the day ID from the first summary item
  const dayId = summary[0].id;

  // Get full day details with schedule
  const dayResponse = await client.getDay(dayId);

  return formatSchedule(dayResponse.day, dayId);
}

export function formatSchedule(day: DayResponse['day'], dayId: string): string {
  const lines: string[] = [];

  // Parse the date
  const dayDate = parse(day.dayDate, 'yyyy-MM-dd HH:mm:ss', new Date());
  const formattedDate = format(dayDate, 'MMM d, yyyy');

  // Header with day ID for use with write operations
  lines.push(`📅 ${formattedDate} - ${day.name}`);
  lines.push(`📍 ${day.city}, ${day.state} (${day.timeZone})`);
  if (day.dayType) {
    lines.push(`🎸 ${day.dayType}`);
  }
  lines.push(`🆔 Day ID: ${dayId}`);
  lines.push('');

  // Schedule items
  if (!day.scheduleItems || day.scheduleItems.length === 0) {
    lines.push('No scheduled items for this day.');
  } else {
    lines.push('Schedule:');
    for (const item of day.scheduleItems) {
      const time = formatTime(item.paulStartTime);
      lines.push(`• ${time} - ${item.title}`);
      lines.push(`  ID: ${item.id}`);
    }
  }

  return lines.join('\n');
}

function formatTime(paulTime: string): string {
  // paulTime format: "2026-02-06 12:00:00"
  const dateTime = parse(paulTime, 'yyyy-MM-dd HH:mm:ss', new Date());
  return format(dateTime, 'h:mm a');
}
