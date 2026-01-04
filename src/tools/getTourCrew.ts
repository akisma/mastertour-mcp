import type { MasterTourClient, CrewMember } from '../api/client.js';

export interface GetTourCrewParams {
  tourId?: string;
}

/**
 * Gets display name for a crew member
 */
function getDisplayName(member: CrewMember): string {
  if (member.preferredName && member.preferredName.trim()) {
    return member.preferredName;
  }
  return `${member.firstName} ${member.lastName}`.trim();
}

/**
 * Formats a single crew member for display
 */
function formatCrewMember(member: CrewMember): string[] {
  const lines: string[] = [];
  const name = getDisplayName(member);
  
  lines.push(`  👤 ${name}`);
  
  if (member.company) {
    lines.push(`     🏢 ${member.company}`);
  }
  
  if (member.email) {
    lines.push(`     ✉️ ${member.email}`);
  }
  
  if (member.phone) {
    lines.push(`     📱 ${member.phone}`);
  }
  
  return lines;
}

/**
 * Gets tour crew information.
 * Caller should resolve tourId from config if not provided.
 */
export async function getTourCrew(
  client: MasterTourClient,
  params: GetTourCrewParams
): Promise<string> {
  const { tourId } = params;

  if (!tourId) {
    throw new Error(
      'Tour ID is required. Provide tourId parameter or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  }

  const crew = await client.getTourCrew(tourId);

  const lines: string[] = [
    `👥 Tour Crew`,
    '─'.repeat(50),
    '',
  ];

  if (crew.length === 0) {
    lines.push('ℹ️ No crew members found for this tour.');
    return lines.join('\n');
  }

  // Group crew by title
  const byTitle = new Map<string, CrewMember[]>();
  for (const member of crew) {
    const title = member.title || 'Other';
    if (!byTitle.has(title)) {
      byTitle.set(title, []);
    }
    byTitle.get(title)!.push(member);
  }

  // Sort titles, putting common ones first
  const titleOrder = ['Tour Manager', 'Production Manager', 'Musician', 'FOH Engineer', 'Monitor Engineer'];
  const sortedTitles = [...byTitle.keys()].sort((a, b) => {
    const aIndex = titleOrder.indexOf(a);
    const bIndex = titleOrder.indexOf(b);
    if (aIndex >= 0 && bIndex >= 0) return aIndex - bIndex;
    if (aIndex >= 0) return -1;
    if (bIndex >= 0) return 1;
    return a.localeCompare(b);
  });

  for (const title of sortedTitles) {
    const members = byTitle.get(title)!;
    lines.push(`🎭 ${title}`);
    
    for (const member of members) {
      lines.push(...formatCrewMember(member));
      lines.push('');
    }
  }

  lines.push('─'.repeat(50));
  lines.push(`Total: ${crew.length} crew member(s)`);

  return lines.join('\n');
}
