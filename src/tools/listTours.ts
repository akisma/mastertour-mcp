import type { MasterTourClient, TourInfo } from '../api/client.js';

/**
 * Determines access level based on permission level
 * 255 = full admin, 148+ = edit access, below = read only
 */
function getAccessLabel(permissionLevel: string): string {
  const level = parseInt(permissionLevel, 10);
  if (level >= 148) {
    return '✏️ Edit Access';
  }
  return '👁️ Read Only';
}

/**
 * Formats the list of tours into a readable string, grouped by organization
 */
function formatTours(tours: TourInfo[]): string {
  if (tours.length === 0) {
    return '📋 No tours available for your account.';
  }

  // Group tours by organization
  const byOrg = new Map<string, TourInfo[]>();
  for (const tour of tours) {
    const org = tour.organizationName || tour.artistName;
    if (!byOrg.has(org)) {
      byOrg.set(org, []);
    }
    byOrg.get(org)!.push(tour);
  }

  const lines: string[] = ['🎸 Available Tours', ''];

  for (const [org, orgTours] of byOrg.entries()) {
    lines.push(`📁 ${org}`);
    lines.push('─'.repeat(40));
    
    for (const tour of orgTours) {
      const legName = tour.legName || 'Untitled Leg';
      const access = getAccessLabel(tour.organizationPermissionLevel);
      lines.push(`  🎤 ${legName}`);
      lines.push(`     ID: ${tour.tourId}`);
      lines.push(`     ${access}`);
      lines.push('');
    }
  }

  lines.push('─'.repeat(40));
  lines.push(`Total: ${tours.length} tour(s)`);
  lines.push('');
  lines.push('💡 Tip: Use a Tour ID with get_today_schedule to view a specific tour.');

  return lines.join('\n');
}

/**
 * Lists all tours the user has access to
 */
export async function listTours(client: MasterTourClient): Promise<string> {
  const tours = await client.listTours();
  return formatTours(tours);
}
