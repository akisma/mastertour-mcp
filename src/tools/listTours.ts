import type { MasterTourClient, TourInfo } from '../api/client.js';
import type { ToolResult, TourListOutput, TourOutput } from '../types/outputs.js';

/**
 * Determines access level based on permission level
 * 255 = full admin, 148+ = edit access, below = read only
 */
function getAccessLevel(permissionLevel: string): 'edit' | 'read-only' {
  const level = parseInt(permissionLevel, 10);
  return level >= 148 ? 'edit' : 'read-only';
}

function getAccessLabel(accessLevel: 'edit' | 'read-only'): string {
  return accessLevel === 'edit' ? '✏️ Edit Access' : '👁️ Read Only';
}

/**
 * Builds structured output from tour list
 */
function buildTourListResult(tours: TourInfo[]): ToolResult<TourListOutput> {
  // Build structured data
  const tourOutputs: TourOutput[] = tours.map((tour) => ({
    tourId: tour.tourId,
    legName: tour.legName || 'Untitled Leg',
    artistName: tour.artistName,
    organizationName: tour.organizationName,
    accessLevel: getAccessLevel(tour.organizationPermissionLevel),
  }));

  // Group by organization
  const byOrganization: Record<string, TourOutput[]> = {};
  for (const tour of tourOutputs) {
    const org = tour.organizationName || tour.artistName;
    if (!byOrganization[org]) {
      byOrganization[org] = [];
    }
    byOrganization[org].push(tour);
  }

  const data: TourListOutput = {
    tours: tourOutputs,
    totalCount: tours.length,
    byOrganization,
  };

  // Build formatted text
  const text = formatTours(tourOutputs, byOrganization);

  return { data, text };
}

/**
 * Formats the list of tours into a readable string, grouped by organization
 */
function formatTours(
  tours: TourOutput[],
  byOrganization: Record<string, TourOutput[]>
): string {
  if (tours.length === 0) {
    return '📋 No tours available for your account.';
  }

  const lines: string[] = ['🎸 Available Tours', ''];

  for (const [org, orgTours] of Object.entries(byOrganization)) {
    lines.push(`📁 ${org}`);
    lines.push('─'.repeat(40));
    
    for (const tour of orgTours) {
      const access = getAccessLabel(tour.accessLevel);
      lines.push(`  🎤 ${tour.legName}`);
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
export async function listTours(client: MasterTourClient): Promise<ToolResult<TourListOutput>> {
  const tours = await client.listTours();
  return buildTourListResult(tours);
}
