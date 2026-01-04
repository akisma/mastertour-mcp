import type { MasterTourClient } from '../api/client.js';

export interface DeleteScheduleItemInput {
  itemId?: string;
  dayId?: string; // Needed to verify item exists and get title for confirmation
}

export async function deleteScheduleItem(
  client: MasterTourClient,
  input: DeleteScheduleItemInput
): Promise<string> {
  // Validate required fields
  if (!input.itemId) {
    throw new Error('itemId is required');
  }
  if (!input.dayId) {
    throw new Error('dayId is required');
  }

  // Fetch the day to verify item exists and get its title
  const dayResponse = await client.getDay(input.dayId);
  const items = dayResponse.day.scheduleItems || [];

  const existingItem = items.find(item => item.id === input.itemId);
  if (!existingItem) {
    throw new Error(`Schedule item ${input.itemId} not found in day ${input.dayId}`);
  }

  const title = existingItem.title;

  await client.deleteScheduleItem(input.itemId);

  return `🗑️ "${title}" deleted`;
}
