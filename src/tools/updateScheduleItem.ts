import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import type { MasterTourClient, ScheduleItem } from '../api/client.js';

export interface UpdateScheduleItemInput {
  itemId?: string;
  dayId?: string;      // Needed to get timezone and current item values
  title?: string;
  startTime?: string;  // HH:MM format (24hr), interpreted as venue local time
  endTime?: string;    // HH:MM format (24hr)
  details?: string;
}

/**
 * Convert local venue time to UTC datetime string for API.
 * API expects startDatetime/endDatetime in UTC ("YYYY-MM-DD HH:MM:SS").
 */
function localTimeToUtc(date: string, time: string, timezone: string): string {
  const localDatetime = `${date}T${time}:00`;
  const utcDate = fromZonedTime(localDatetime, timezone);
  return formatInTimeZone(utcDate, 'UTC', 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Extract HH:MM from paulStartTime/paulEndTime format "YYYY-MM-DD HH:MM:SS"
 */
function extractTime(paulTime: string): string {
  return paulTime.split(' ')[1].slice(0, 5); // "HH:MM"
}

export async function updateScheduleItem(
  client: MasterTourClient,
  input: UpdateScheduleItemInput
): Promise<string> {
  // Validate required fields
  if (!input.itemId) {
    throw new Error('itemId is required');
  }
  if (!input.dayId) {
    throw new Error('dayId is required');
  }

  // At least one update field must be provided
  const hasUpdateField = input.title !== undefined ||
    input.startTime !== undefined ||
    input.endTime !== undefined ||
    input.details !== undefined;

  if (!hasUpdateField) {
    throw new Error('At least one update field must be provided (title, startTime, endTime, details)');
  }

  // Fetch the day to get current item values and timezone
  const dayResponse = await client.getDay(input.dayId);
  const date = dayResponse.day.dayDate.split(' ')[0]; // "YYYY-MM-DD"
  const timezone = dayResponse.day.timeZone;
  const items = dayResponse.day.scheduleItems || [];

  // Find the existing item
  const existingItem = items.find(item => item.id === input.itemId);
  if (!existingItem) {
    throw new Error(`Schedule item ${input.itemId} not found in day ${input.dayId}`);
  }

  // Merge input with existing values
  const title = input.title ?? existingItem.title;
  const details = input.details ?? existingItem.details ?? '';

  // For times, use input if provided, otherwise preserve existing
  const startTime = input.startTime ?? extractTime(existingItem.paulStartTime);
  const endTime = input.endTime ?? extractTime(existingItem.paulEndTime);

  // Convert to UTC for API
  const startDatetime = localTimeToUtc(date, startTime, timezone);
  const endDatetime = localTimeToUtc(date, endTime, timezone);

  await client.updateScheduleItem(input.itemId, {
    title,
    details,
    isConfirmed: existingItem.isConfirmed ?? false,
    isComplete: existingItem.isComplete ?? false,
    timePriority: '', // Not used but required by API
    syncId: existingItem.syncId, // Required by API
    startDatetime,
    endDatetime,
  });

  return `✅ "${title}" updated`;
}
