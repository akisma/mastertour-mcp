import type { MasterTourClient } from '../api/client.js';
import type { ToolResult, SetlistOutput, SetlistItemOutput } from '../types/outputs.js';
import { separator } from '../utils/formatters.js';

export interface GetEventSetlistParams {
  eventId: string;
}

/**
 * Gets the setlist for a specific event.
 */
export async function getEventSetlist(
  client: MasterTourClient,
  params: GetEventSetlistParams
): Promise<ToolResult<SetlistOutput>> {
  if (!params.eventId) {
    throw new Error('Event ID is required');
  }

  const response = await client.getEventSetlist(params.eventId);

  // Build structured data
  const songs: SetlistItemOutput[] = response.songs.map((s) => ({
    position: s.position,
    songTitle: s.songTitle,
    duration: s.duration,
    notes: s.notes,
    isEncore: s.isEncore,
  }));

  // Calculate total duration if available
  let estimatedDuration: string | undefined;
  const durations = songs.map((s) => parseDuration(s.duration)).filter((d) => d > 0);
  if (durations.length > 0) {
    const totalMinutes = durations.reduce((sum, d) => sum + d, 0);
    estimatedDuration = formatDuration(totalMinutes);
  }

  const data: SetlistOutput = {
    eventId: params.eventId,
    eventName: response.eventName,
    date: response.date,
    songs,
    totalSongs: songs.length,
    estimatedDuration,
  };

  const text = formatSetlistText(data);

  return { data, text };
}

function parseDuration(duration?: string): number {
  if (!duration) return 0;
  const match = duration.match(/^(\d+):(\d+)$/);
  if (match) {
    return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
  }
  const minutesMatch = duration.match(/^(\d+)/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10);
  }
  return 0;
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

function formatSetlistText(data: SetlistOutput): string {
  const lines: string[] = [
    '🎵 Setlist',
  ];

  if (data.eventName) {
    lines.push(`📍 ${data.eventName}`);
  }
  if (data.date) {
    lines.push(`📅 ${data.date}`);
  }
  lines.push(separator());
  lines.push('');

  if (data.songs.length === 0) {
    lines.push('ℹ️ No setlist available for this event.');
  } else {
    // Separate main set and encore
    const mainSet = data.songs.filter((s) => !s.isEncore);
    const encore = data.songs.filter((s) => s.isEncore);

    if (mainSet.length > 0) {
      lines.push('🎸 Main Set:');
      for (const song of mainSet) {
        let line = `  ${song.position}. ${song.songTitle}`;
        if (song.duration) line += ` (${song.duration})`;
        lines.push(line);
        if (song.notes) {
          lines.push(`     📝 ${song.notes}`);
        }
      }
      lines.push('');
    }

    if (encore.length > 0) {
      lines.push('🌟 Encore:');
      for (const song of encore) {
        let line = `  ${song.position}. ${song.songTitle}`;
        if (song.duration) line += ` (${song.duration})`;
        lines.push(line);
        if (song.notes) {
          lines.push(`     📝 ${song.notes}`);
        }
      }
      lines.push('');
    }

    lines.push(separator());
    lines.push(`Total: ${data.totalSongs} song${data.totalSongs !== 1 ? 's' : ''}`);
    if (data.estimatedDuration) {
      lines.push(`Estimated duration: ${data.estimatedDuration}`);
    }
  }

  return lines.join('\n');
}
