import type { MasterTourClient } from '../api/client.js';
import type { ToolResult, GuestListOutput, GuestRequestOutput } from '../types/outputs.js';
import { separator } from '../utils/formatters.js';

export interface GetEventGuestlistParams {
  eventId: string;
}

/**
 * Gets the guest list for a specific event.
 */
export async function getEventGuestlist(
  client: MasterTourClient,
  params: GetEventGuestlistParams
): Promise<ToolResult<GuestListOutput>> {
  if (!params.eventId) {
    throw new Error('Event ID is required');
  }

  const response = await client.getEventGuestlist(params.eventId);

  // Build structured data
  const guests: GuestRequestOutput[] = response.guests.map((g) => ({
    id: g.id,
    name: g.name,
    tickets: g.tickets,
    status: g.status,
    requestedBy: g.requestedBy,
    notes: g.notes,
    willCall: g.willCall,
  }));

  const totalTickets = guests.reduce((sum, g) => sum + g.tickets, 0);

  const data: GuestListOutput = {
    eventId: params.eventId,
    eventName: response.eventName,
    date: response.date,
    guests,
    totalGuests: guests.length,
    totalTickets,
  };

  const text = formatGuestListText(data);

  return { data, text };
}

function formatGuestListText(data: GuestListOutput): string {
  const lines: string[] = [
    '🎫 Guest List',
  ];

  if (data.eventName) {
    lines.push(`📍 ${data.eventName}`);
  }
  if (data.date) {
    lines.push(`📅 ${data.date}`);
  }
  lines.push(separator());
  lines.push('');

  if (data.guests.length === 0) {
    lines.push('ℹ️ No guests on the list for this event.');
    lines.push('');
    lines.push('💡 Use add_guest_request to add guests.');
  } else {
    // Group by status
    const byStatus: Record<string, GuestRequestOutput[]> = {};
    for (const guest of data.guests) {
      const status = guest.status || 'Pending';
      if (!byStatus[status]) byStatus[status] = [];
      byStatus[status].push(guest);
    }

    for (const [status, statusGuests] of Object.entries(byStatus)) {
      lines.push(`📋 ${status}:`);
      for (const guest of statusGuests) {
        let line = `  • ${guest.name} (${guest.tickets} ticket${guest.tickets !== 1 ? 's' : ''})`;
        if (guest.willCall) line += ' [Will Call]';
        if (guest.requestedBy) line += ` - Requested by: ${guest.requestedBy}`;
        lines.push(line);
        if (guest.notes) {
          lines.push(`    📝 ${guest.notes}`);
        }
      }
      lines.push('');
    }

    lines.push(separator());
    lines.push(`Total: ${data.totalGuests} guest${data.totalGuests !== 1 ? 's' : ''}, ${data.totalTickets} ticket${data.totalTickets !== 1 ? 's' : ''}`);
  }

  return lines.join('\n');
}
