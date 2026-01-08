import type { MasterTourClient } from '../api/client.js';
import type { ToolResult, RoomListOutput, RoomAssignmentOutput } from '../types/outputs.js';
import { separator } from '../utils/formatters.js';

export interface GetHotelRoomlistParams {
  hotelId: string;
}

/**
 * Gets the room list (room assignments) for a specific hotel.
 */
export async function getHotelRoomlist(
  client: MasterTourClient,
  params: GetHotelRoomlistParams
): Promise<ToolResult<RoomListOutput>> {
  if (!params.hotelId) {
    throw new Error('Hotel ID is required');
  }

  const response = await client.getHotelRoomlist(params.hotelId);

  // Build structured data
  const rooms: RoomAssignmentOutput[] = response.rooms.map((r) => ({
    roomNumber: r.roomNumber,
    roomType: r.roomType,
    guestName: r.guestName,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    confirmationNumber: r.confirmationNumber,
    notes: r.notes,
  }));

  const data: RoomListOutput = {
    hotelId: params.hotelId,
    hotelName: response.hotelName,
    rooms,
    totalRooms: rooms.length,
  };

  const text = formatRoomListText(data);

  return { data, text };
}

function formatRoomListText(data: RoomListOutput): string {
  const lines: string[] = [
    '🏨 Room List',
  ];

  if (data.hotelName) {
    lines.push(`📍 ${data.hotelName}`);
  }
  lines.push(separator());
  lines.push('');

  if (data.rooms.length === 0) {
    lines.push('ℹ️ No room assignments for this hotel.');
  } else {
    // Group by room type if available
    const byType: Record<string, RoomAssignmentOutput[]> = {};
    for (const room of data.rooms) {
      const type = room.roomType || 'Standard';
      if (!byType[type]) byType[type] = [];
      byType[type].push(room);
    }

    for (const [type, typeRooms] of Object.entries(byType)) {
      lines.push(`🛏️ ${type}:`);
      for (const room of typeRooms) {
        let line = `  • ${room.guestName}`;
        if (room.roomNumber) line += ` - Room ${room.roomNumber}`;
        lines.push(line);

        const details: string[] = [];
        if (room.checkIn) details.push(`Check-in: ${room.checkIn}`);
        if (room.checkOut) details.push(`Check-out: ${room.checkOut}`);
        if (details.length > 0) {
          lines.push(`    📅 ${details.join(' | ')}`);
        }

        if (room.confirmationNumber) {
          lines.push(`    🔢 Confirmation: ${room.confirmationNumber}`);
        }
        if (room.notes) {
          lines.push(`    📝 ${room.notes}`);
        }
      }
      lines.push('');
    }

    lines.push(separator());
    lines.push(`Total: ${data.totalRooms} room${data.totalRooms !== 1 ? 's' : ''}`);
  }

  return lines.join('\n');
}
