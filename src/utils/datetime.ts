import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Convert a local date and time in a specific timezone to a UTC datetime string.
 *
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @param timezone - IANA timezone identifier (e.g., 'America/New_York')
 * @returns UTC datetime string in 'YYYY-MM-DD HH:MM:SS' format
 */
export function localTimeToUtc(date: string, time: string, timezone: string): string {
  // Parse as local time in the specified timezone
  const localDatetime = `${date}T${time}:00`;
  // Convert to UTC
  const utcDate = fromZonedTime(localDatetime, timezone);
  // Format in UTC (not system local time)
  return formatInTimeZone(utcDate, 'UTC', 'yyyy-MM-dd HH:mm:ss');
}
