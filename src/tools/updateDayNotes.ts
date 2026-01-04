import type { MasterTourClient } from '../api/client.js';

export interface UpdateDayNotesInput {
  dayId?: string;
  generalNotes?: string;
  hotelNotes?: string;
  travelNotes?: string;
}

export async function updateDayNotes(
  client: MasterTourClient,
  input: UpdateDayNotesInput
): Promise<string> {
  // Validate required fields
  if (!input.dayId) {
    throw new Error('dayId is required');
  }

  // At least one note field must be provided
  const hasNoteField = input.generalNotes !== undefined ||
    input.hotelNotes !== undefined ||
    input.travelNotes !== undefined;

  if (!hasNoteField) {
    throw new Error('At least one note field must be provided (generalNotes, hotelNotes, travelNotes)');
  }

  // Fetch the day to get current values and city name
  const dayResponse = await client.getDay(input.dayId);
  const day = dayResponse.day;

  // Merge input with existing values
  const params = {
    generalNotes: input.generalNotes ?? (day.generalNotes as string) ?? '',
    hotelNotes: input.hotelNotes ?? (day.hotelNotes as string) ?? '',
    travelNotes: input.travelNotes ?? (day.travelNotes as string) ?? '',
    syncId: String(day.syncId), // Required by API
  };

  await client.updateDayNotes(input.dayId, params);

  return `📝 Notes updated for ${day.city}`;
}
