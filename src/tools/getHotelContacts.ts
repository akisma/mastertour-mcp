import type { MasterTourClient } from '../api/client.js';
import type { ToolResult, HotelContactsOutput, ContactOutput } from '../types/outputs.js';
import { separator } from '../utils/formatters.js';

export interface GetHotelContactsParams {
  hotelId: string;
}

/**
 * Gets contacts for a specific hotel.
 */
export async function getHotelContacts(
  client: MasterTourClient,
  params: GetHotelContactsParams
): Promise<ToolResult<HotelContactsOutput>> {
  if (!params.hotelId) {
    throw new Error('Hotel ID is required');
  }

  const response = await client.getHotelContacts(params.hotelId);

  // Build structured data
  const contacts: ContactOutput[] = response.contacts.map((c) => ({
    name: c.name,
    title: c.title,
    email: c.email,
    phone: c.phone,
    fax: c.fax,
    department: c.department,
  }));

  const data: HotelContactsOutput = {
    hotelId: params.hotelId,
    hotelName: response.hotelName,
    contacts,
    totalContacts: contacts.length,
  };

  const text = formatHotelContactsText(data);

  return { data, text };
}

function formatHotelContactsText(data: HotelContactsOutput): string {
  const lines: string[] = [
    '🏨 Hotel Contacts',
  ];

  if (data.hotelName) {
    lines.push(`📍 ${data.hotelName}`);
  }
  lines.push(separator());
  lines.push('');

  if (data.contacts.length === 0) {
    lines.push('ℹ️ No contacts on file for this hotel.');
  } else {
    // Group by department if available
    const byDept: Record<string, ContactOutput[]> = {};
    for (const contact of data.contacts) {
      const dept = contact.department || contact.title || 'General';
      if (!byDept[dept]) byDept[dept] = [];
      byDept[dept].push(contact);
    }

    for (const [dept, deptContacts] of Object.entries(byDept)) {
      lines.push(`👥 ${dept}:`);
      for (const contact of deptContacts) {
        lines.push(`  • ${contact.name}`);
        if (contact.title && contact.title !== dept) {
          lines.push(`    📋 ${contact.title}`);
        }
        if (contact.phone) {
          lines.push(`    📱 ${contact.phone}`);
        }
        if (contact.email) {
          lines.push(`    ✉️ ${contact.email}`);
        }
        if (contact.fax) {
          lines.push(`    📠 ${contact.fax}`);
        }
      }
      lines.push('');
    }

    lines.push(separator());
    lines.push(`Total: ${data.totalContacts} contact${data.totalContacts !== 1 ? 's' : ''}`);
  }

  return lines.join('\n');
}
