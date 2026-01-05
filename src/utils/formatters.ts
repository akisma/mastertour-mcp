/**
 * Shared formatting utilities for Mastertour MCP tools
 *
 * These functions provide consistent output formatting across all tools.
 */

/**
 * Formats a date string for human-readable display
 * @param dateStr Date string in "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS" format
 * @returns Formatted date like "Sat, Jan 4, 2026"
 */
export function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats a field with label if value exists, otherwise returns empty string
 * Also decodes common HTML entities
 * @param label The label for the field
 * @param value The value (may be undefined or empty)
 * @param indent Number of spaces to indent (default 2)
 */
export function formatField(label: string, value: string | undefined, indent = 2): string {
  if (!value || value.trim() === '') return '';
  // Decode HTML entities (decode &amp; last to prevent double-unescaping)
  const decoded = value
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
  return `${' '.repeat(indent)}• ${label}: ${decoded}`;
}

/**
 * Creates a horizontal separator line
 * @param width Width in characters (default 50)
 */
export function separator(width = 50): string {
  return '─'.repeat(width);
}

/**
 * Formats a location string from city/state/country components
 * @param city City name
 * @param state State/province
 * @param country Country code or name
 */
export function formatLocation(city?: string, state?: string, country?: string): string {
  const parts: string[] = [];
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (country) parts.push(country);
  return parts.join(', ');
}

/**
 * Formats contact information consistently
 * @param contacts Array of contact objects
 */
export function formatContacts(
  contacts: Array<{
    title?: string;
    contactName?: string;
    phone?: string;
    fax?: string;
  }> | undefined
): string[] {
  if (!contacts || contacts.length === 0) return ['  ℹ️ No contacts listed'];

  const lines: string[] = [];
  for (const contact of contacts) {
    if (!contact.contactName && !contact.phone && !contact.fax) continue;

    let line = `  • ${contact.title || 'Contact'}`;
    if (contact.contactName) line += `: ${contact.contactName}`;
    if (contact.phone) line += ` 📱 ${contact.phone}`;
    if (contact.fax) line += ` 📠 ${contact.fax}`;
    lines.push(line);
  }
  return lines.length > 0 ? lines : ['  ℹ️ No contacts listed'];
}

/**
 * Normalizes a string for fuzzy matching (lowercase, remove special chars)
 */
export function normalizeForSearch(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}
