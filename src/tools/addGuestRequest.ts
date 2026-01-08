import type { MasterTourClient } from '../api/client.js';
import type { ToolResult, GuestMutationOutput } from '../types/outputs.js';

export interface AddGuestRequestParams {
  eventId: string;
  name: string;
  tickets: number;
  notes?: string;
  willCall?: boolean;
}

/**
 * Adds a new guest to an event's guest list.
 */
export async function addGuestRequest(
  client: MasterTourClient,
  params: AddGuestRequestParams
): Promise<ToolResult<GuestMutationOutput>> {
  if (!params.eventId) {
    throw new Error('Event ID is required');
  }
  if (!params.name || params.name.trim() === '') {
    throw new Error('Guest name is required');
  }
  if (params.tickets < 1) {
    throw new Error('Ticket count must be at least 1');
  }

  const response = await client.createGuestRequest({
    eventId: params.eventId,
    name: params.name.trim(),
    tickets: params.tickets,
    notes: params.notes,
    willCall: params.willCall,
  });

  const data: GuestMutationOutput = {
    success: true,
    guestListId: response.id,
    action: 'created',
    name: params.name.trim(),
    tickets: params.tickets,
  };

  const text = formatAddGuestText(data, params);

  return { data, text };
}

function formatAddGuestText(data: GuestMutationOutput, params: AddGuestRequestParams): string {
  const lines: string[] = [
    '✅ Guest Added to List',
    '',
    `👤 Name: ${data.name}`,
    `🎫 Tickets: ${data.tickets}`,
    `🆔 Guest List ID: ${data.guestListId}`,
  ];

  if (params.willCall) {
    lines.push('📋 Will Call: Yes');
  }
  if (params.notes) {
    lines.push(`📝 Notes: ${params.notes}`);
  }

  return lines.join('\n');
}
