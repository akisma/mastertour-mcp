import type { MasterTourClient, TourHotelsResponse, HotelDayInfo } from '../api/client.js';
import { format, parseISO } from 'date-fns';
import type { ToolResult, TourHotelsOutput, HotelOutput } from '../types/outputs.js';
import { validateTourId } from '../utils/validation.js';

export interface GetTourHotelsParams {
  tourId?: string;
}

/**
 * Formats a date string for display
 */
function formatDateStr(dateStr: string): string {
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
  const dateStr = formatDateStr(day.dayDate);
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
): Promise<ToolResult<TourHotelsOutput>> {
  const tourId = validateTourId(params.tourId);

  const response = await client.getTourHotels(tourId);
  const { tour, days } = response;

  // Filter to days with hotel info
  const daysWithHotelInfo = days.filter(
    (d) => (d.hotels && d.hotels.length > 0) || (d.hotelNotes && d.hotelNotes.trim())
  );

  // Build structured data
  const hotels: HotelOutput[] = [];
  for (const day of daysWithHotelInfo) {
    if (day.hotels && day.hotels.length > 0) {
      for (const hotel of day.hotels) {
        hotels.push({
          dayId: day.dayId || '',
          date: day.dayDate.split(' ')[0],
          city: day.city || '',
          hotelName: hotel.name,
          address: hotel.address || undefined,
          phone: hotel.phone || undefined,
          confirmation: hotel.confirmationNumber || undefined,
          checkIn: hotel.checkIn || undefined,
          checkOut: hotel.checkOut || undefined,
          notes: day.hotelNotes || undefined,
        });
      }
    } else if (day.hotelNotes) {
      // Day with only notes
      hotels.push({
        dayId: day.dayId || '',
        date: day.dayDate.split(' ')[0],
        city: day.city || '',
        hotelName: 'See Notes',
        notes: day.hotelNotes,
      });
    }
  }

  const data: TourHotelsOutput = {
    tourId,
    hotels,
    totalCount: hotels.length,
  };

  // Build formatted text
  const text = formatHotelsText(tour, daysWithHotelInfo);

  return { data, text };
}

function formatHotelsText(
  tour: TourHotelsResponse['tour'],
  daysWithHotelInfo: HotelDayInfo[]
): string {
  const lines: string[] = [
    `🏨 Hotel Information`,
    `🎸 ${tour.artistName} - ${tour.legName}`,
    '─'.repeat(50),
    '',
  ];

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
