import type { MasterTourClient, TourHotelsResponse, HotelDayInfo } from '../api/client.js';
import { format, parseISO } from 'date-fns';

export interface GetTourHotelsParams {
  tourId?: string;
}

/**
 * Formats a date string for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr.split(' ')[0]);
    return format(date, 'EEE, MMM d');
  } catch {
    return dateStr;
  }
}

/**
 * Formats hotel data for a single day
 */
function formatDayHotels(day: HotelDayInfo): string[] {
  const lines: string[] = [];
  const dateStr = formatDate(day.dayDate);
  const location = [day.city, day.state].filter(Boolean).join(', ');

  lines.push(`📅 ${dateStr} - ${day.name}`);
  lines.push(`   📍 ${location}`);

  // If we have structured hotel data
  if (day.hotels && day.hotels.length > 0) {
    for (const hotel of day.hotels) {
      lines.push(`   🏨 ${hotel.name}`);
      if (hotel.address) {
        lines.push(`      ${hotel.address}, ${hotel.city || ''}`);
      }
      if (hotel.checkIn || hotel.checkOut) {
        lines.push(`      Check-in: ${hotel.checkIn || 'N/A'} | Check-out: ${hotel.checkOut || 'N/A'}`);
      }
      if (hotel.confirmationNumber) {
        lines.push(`      Confirmation: ${hotel.confirmationNumber}`);
      }
    }
  } else if (day.hotelNotes && day.hotelNotes.trim()) {
    // Fall back to hotel notes
    lines.push(`   📝 ${day.hotelNotes}`);
  } else {
    lines.push(`   ℹ️ No hotel information for this day`);
  }

  return lines;
}

/**
 * Gets hotel information for a tour.
 * Caller should resolve tourId from config if not provided.
 */
export async function getTourHotels(
  client: MasterTourClient,
  params: GetTourHotelsParams
): Promise<string> {
  const { tourId } = params;

  if (!tourId) {
    throw new Error(
      'Tour ID is required. Provide tourId parameter or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  }

  const data = await client.getTourHotels(tourId);
  const { tour, days } = data;

  const lines: string[] = [
    `🏨 Hotel Information`,
    `🎸 ${tour.artistName} - ${tour.legName}`,
    '─'.repeat(50),
    '',
  ];

  // Filter to days with hotel info
  const daysWithHotelInfo = days.filter(
    (d) => (d.hotels && d.hotels.length > 0) || (d.hotelNotes && d.hotelNotes.trim())
  );

  if (daysWithHotelInfo.length === 0) {
    lines.push('ℹ️ No hotel information found for this tour.');
    lines.push('');
    lines.push('💡 Hotel notes can be added to individual days in Master Tour.');
  } else {
    for (const day of daysWithHotelInfo) {
      lines.push(...formatDayHotels(day));
      lines.push('');
    }

    lines.push('─'.repeat(50));
    lines.push(`Total: ${daysWithHotelInfo.length} day(s) with hotel info`);
  }

  return lines.join('\n');
}
