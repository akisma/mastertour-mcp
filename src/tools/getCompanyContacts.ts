import type { MasterTourClient } from '../api/client.js';
import type { ToolResult, CompanyContactsOutput, ContactOutput } from '../types/outputs.js';
import { separator } from '../utils/formatters.js';

export interface GetCompanyContactsParams {
  companyId: string;
}

/**
 * Gets contacts for a specific company (promoter, agency, etc.).
 */
export async function getCompanyContacts(
  client: MasterTourClient,
  params: GetCompanyContactsParams
): Promise<ToolResult<CompanyContactsOutput>> {
  if (!params.companyId) {
    throw new Error('Company ID is required');
  }

  const response = await client.getCompanyContacts(params.companyId);

  // Build structured data
  const contacts: ContactOutput[] = response.contacts.map((c) => ({
    name: c.name,
    title: c.title,
    email: c.email,
    phone: c.phone,
    fax: c.fax,
    department: c.department,
  }));

  const data: CompanyContactsOutput = {
    companyId: params.companyId,
    companyName: response.companyName,
    contacts,
    totalContacts: contacts.length,
  };

  const text = formatCompanyContactsText(data);

  return { data, text };
}

function formatCompanyContactsText(data: CompanyContactsOutput): string {
  const lines: string[] = [
    '🏢 Company Contacts',
  ];

  if (data.companyName) {
    lines.push(`📍 ${data.companyName}`);
  }
  lines.push(separator());
  lines.push('');

  if (data.contacts.length === 0) {
    lines.push('ℹ️ No contacts on file for this company.');
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
