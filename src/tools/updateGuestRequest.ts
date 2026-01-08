import type { MasterTourClient, UpdateGuestRequestParams as ApiUpdateParams } from '../api/client.js';
import type { ToolResult, GuestMutationOutput } from '../types/outputs.js';

export interface UpdateGuestRequestParams {
  guestListId: string;
  name?: string;
  tickets?: number;
  status?: string;
  notes?: string;
  willCall?: boolean;
}

/**
 * Updates an existing guest list request.
 */
export async function updateGuestRequest(
  client: MasterTourClient,
  params: UpdateGuestRequestParams
): Promise<ToolResult<GuestMutationOutput>> {
  if (!params.guestListId) {
    throw new Error('Guest list ID is required');
  }

  // Build update payload with only provided fields
  const updatePayload: ApiUpdateParams = {};
  if (params.name !== undefined) updatePayload.name = params.name.trim();
  if (params.tickets !== undefined) {
    if (params.tickets < 1) {
      throw new Error('Ticket count must be at least 1');
    }
    updatePayload.tickets = params.tickets;
  }
  if (params.status !== undefined) updatePayload.status = params.status;
  if (params.notes !== undefined) updatePayload.notes = params.notes;
  if (params.willCall !== undefined) updatePayload.willCall = params.willCall;

  if (Object.keys(updatePayload).length === 0) {
    throw new Error('At least one field to update is required');
  }

  await client.updateGuestRequest(params.guestListId, updatePayload);

  const data: GuestMutationOutput = {
    success: true,
    guestListId: params.guestListId,
    action: 'updated',
    name: params.name || '',
    tickets: params.tickets || 0,
  };

  const text = formatUpdateGuestText(params);

  return { data, text };
}

function formatUpdateGuestText(params: UpdateGuestRequestParams): string {
  const lines: string[] = [
    '✅ Guest Request Updated',
    '',
    `🆔 Guest List ID: ${params.guestListId}`,
  ];

  const updates: string[] = [];
  if (params.name !== undefined) updates.push(`Name: ${params.name}`);
  if (params.tickets !== undefined) updates.push(`Tickets: ${params.tickets}`);
  if (params.status !== undefined) updates.push(`Status: ${params.status}`);
  if (params.willCall !== undefined) updates.push(`Will Call: ${params.willCall ? 'Yes' : 'No'}`);
  if (params.notes !== undefined) updates.push(`Notes: ${params.notes}`);

  if (updates.length > 0) {
    lines.push('');
    lines.push('📝 Updated fields:');
    for (const update of updates) {
      lines.push(`  • ${update}`);
    }
  }

  return lines.join('\n');
}
