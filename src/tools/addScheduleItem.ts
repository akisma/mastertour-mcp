import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export interface AddScheduleItemInput {
  dayId?: string;
  title?: string;
  startTime?: string; // HH:MM format (24hr), interpreted as venue local time
  endTime?: string;   // HH:MM format (24hr), defaults to startTime
  details?: string;
}

export interface CreateScheduleItemParams {
  parentDayId: string;
  title: string;
  details: string;
  isConfirmed: boolean;
  isComplete: boolean;
  startDatetime: string;
  endDatetime: string;
  timePriority: string;
}

// Client interface for add schedule item operations
export interface AddScheduleItemClient {
  getDay(dayId: string): Promise<{ day: { dayDate: string; timeZone: string } }>;
  createScheduleItem(params: CreateScheduleItemParams): Promise<{ id: string }>;
}

/**
 * Convert local venue time to UTC datetime string for API.
 * API expects startDatetime/endDatetime in UTC ("YYYY-MM-DD HH:MM:SS").
 */
function localTimeToUtc(date: string, time: string, timezone: string): string {
  // Parse as local time in the venue's timezone
  const localDatetime = `${date}T${time}:00`;
  // Convert to UTC
  const utcDate = fromZonedTime(localDatetime, timezone);
  // Format in UTC (not system local time)
  return formatInTimeZone(utcDate, 'UTC', 'yyyy-MM-dd HH:mm:ss');
}

export async function addScheduleItem(
  client: AddScheduleItemClient,
  input: AddScheduleItemInput
): Promise<string> {
  // Validate required fields
  if (!input.dayId) {
    throw new Error('dayId is required');
  }
  if (!input.title) {
    throw new Error('title is required');
  }
  if (!input.startTime) {
    throw new Error('startTime is required');
  }

  // Fetch the day to get date and timezone
  const dayResponse = await client.getDay(input.dayId);
  const date = dayResponse.day.dayDate.split(' ')[0]; // "YYYY-MM-DD"
  const timezone = dayResponse.day.timeZone;

  // Convert local venue times to UTC for API
  const startDatetime = localTimeToUtc(date, input.startTime, timezone);
  const endDatetime = input.endTime 
    ? localTimeToUtc(date, input.endTime, timezone)
    : startDatetime;

  const params: CreateScheduleItemParams = {
    parentDayId: input.dayId,
    title: input.title,
    details: input.details || '',
    isConfirmed: false,
    isComplete: false,
    startDatetime,
    endDatetime,
    timePriority: '',
  };

  await client.createScheduleItem(params);

  return `✅ "${input.title}" added at ${input.startTime}`;
}
