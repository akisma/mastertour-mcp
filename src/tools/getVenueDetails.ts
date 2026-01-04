/**
 * Get Venue Details Tool
 *
 * Retrieves detailed venue information including production specs, contacts,
 * facilities, equipment, logistics, and local crew info.
 *
 * Since the Master Tour API doesn't expose a direct venue endpoint, this tool
 * searches through the user's tours to find a day that used this venue and
 * extracts the complete venue data from the event.
 */

import type { MasterTourClient, DayEvent } from '../api/client.js';
import { iterateTourDays, getDayEventsSafe } from '../utils/tourIterator.js';
import { formatField, formatContacts, separator } from '../utils/formatters.js';

export interface GetVenueDetailsParams {
  venueId: string;
}

/**
 * Finds a venue event by ID across all accessible tours.
 */
async function findVenueEvent(
  client: MasterTourClient,
  venueId: string
): Promise<{ event: DayEvent; tourLabel: string; dayDate: string } | null> {
  for await (const ctx of iterateTourDays(client, { onlyDaysWithVenues: true })) {
    const events = await getDayEventsSafe(client, ctx.day.id);
    const matchingEvent = events.find((e) => e.venueId === venueId);

    if (matchingEvent) {
      return {
        event: matchingEvent,
        tourLabel: ctx.tourLabel,
        dayDate: ctx.day.dayDate?.split(' ')[0] || '',
      };
    }
  }
  return null;
}

/**
 * Formats production section
 */
function formatProduction(prod: DayEvent['venueProduction']): string[] {
  if (!prod) return [];

  const lines: string[] = ['🎬 PRODUCTION'];

  // Stage dimensions
  const stageDims = [
    prod.dimensionsW ? `W: ${prod.dimensionsW}` : '',
    prod.dimensionsD ? `D: ${prod.dimensionsD}` : '',
    prod.dimensionsH ? `H: ${prod.dimensionsH}` : '',
  ]
    .filter(Boolean)
    .join(' × ');
  if (stageDims) lines.push(`  • Stage Dimensions: ${stageDims}`);

  const fields = [
    formatField('Deck to Grid', prod.deckToGrid),
    formatField('Trim Height', prod.trimHeight),
    formatField('Load-In Access', prod.access),
    formatField('Dock Type', prod.dockType),
    formatField('Rigging Notes', prod.riggingComments),
    formatField('Power Notes', prod.powerComments),
  ].filter(Boolean);

  lines.push(...fields);
  lines.push('');
  return lines.length > 2 ? lines : []; // Only return if has content beyond header
}

/**
 * Formats facilities section
 */
function formatFacilities(fac: DayEvent['venueFacilities']): string[] {
  if (!fac) return [];

  const lines: string[] = ['🚿 FACILITIES'];

  const fields = [
    formatField('Dressing Rooms', fac.dressingRooms),
    formatField('Showers', fac.showers),
    formatField('Truck Parking', fac.truckParking),
    formatField('Bus Parking', fac.busParking),
    formatField('Guest Parking', fac.guestParking),
    formatField('Parking Notes', fac.parkingComments),
  ].filter(Boolean);

  lines.push(...fields);
  lines.push('');
  return fields.length > 0 ? lines : [];
}

/**
 * Formats equipment section
 */
function formatEquipment(eq: DayEvent['venueEquipment']): string[] {
  if (!eq) return [];

  const lines: string[] = ['🔊 EQUIPMENT'];

  const fields = [
    formatField('Audio', eq.audio),
    formatField('Lighting', eq.lighting),
    formatField('Video', eq.video),
    formatField('Backline', eq.backline),
    formatField('Staging', eq.staging),
  ].filter(Boolean);

  lines.push(...fields);
  lines.push('');
  return fields.length > 0 ? lines : [];
}

/**
 * Formats local crew section
 */
function formatLocalCrew(lc: DayEvent['venueLocalCrew']): string[] {
  if (!lc) return [];

  const lines: string[] = ['👷 LOCAL CREW'];

  const fields = [
    formatField('Union', lc.localUnion),
    formatField('Minimum IN', lc.minimumIN),
    formatField('Minimum OUT', lc.minimumOUT),
    formatField('Penalties', lc.penalties),
    formatField('Crew Notes', lc.crewComments),
  ].filter(Boolean);

  lines.push(...fields);
  lines.push('');
  return fields.length > 0 ? lines : [];
}

/**
 * Formats logistics section
 */
function formatLogistics(log: DayEvent['venueLogistics']): string[] {
  if (!log) return [];

  const lines: string[] = ['🚗 LOGISTICS'];

  const fields = [
    formatField('Directions', log.directions),
    formatField('Closest City', log.closestCity),
    formatField('Airport Notes', log.airportNotes),
    formatField('Ground Transport', log.groundTransport),
    formatField('Area Hotels', log.areaHotels),
    formatField('Area Restaurants', log.areaRestaurants),
  ].filter(Boolean);

  lines.push(...fields);
  lines.push('');
  return fields.length > 0 ? lines : [];
}

/**
 * Gets detailed venue information by venue ID.
 */
export async function getVenueDetails(
  client: MasterTourClient,
  params: GetVenueDetailsParams
): Promise<string> {
  const { venueId } = params;

  if (!venueId) {
    throw new Error('Venue ID is required');
  }

  // Search for the venue
  const found = await findVenueEvent(client, venueId);

  if (!found) {
    return [
      '❌ Venue Not Found',
      separator(),
      '',
      `Could not find venue with ID: ${venueId}`,
      '',
      'This venue may not exist in any of your accessible tours.',
      'Use search_past_venues to find venues you have access to.',
    ].join('\n');
  }

  const { event: venueEvent, tourLabel: foundOnTour, dayDate: foundOnDate } = found;

  // Build the detailed output
  const lines: string[] = [
    `🏟️ ${venueEvent.venueName}`,
    separator(),
    '',
  ];

  // Basic Info - Location
  lines.push('📍 LOCATION');
  if (venueEvent.venueAddressLine1) lines.push(`  ${venueEvent.venueAddressLine1}`);
  if (venueEvent.venueAddressLine2) lines.push(`  ${venueEvent.venueAddressLine2}`);
  lines.push(
    `  ${venueEvent.venueCity}, ${venueEvent.venueState} ${venueEvent.venueZip}`
  );
  lines.push(`  ${venueEvent.venueCountry}`);
  if (venueEvent.venueLatitude && venueEvent.venueLongitude) {
    lines.push(`  📌 Coordinates: ${venueEvent.venueLatitude}, ${venueEvent.venueLongitude}`);
  }
  if (venueEvent.venueTimeZone) lines.push(`  🕐 Timezone: ${venueEvent.venueTimeZone}`);
  lines.push('');

  // Venue Info
  lines.push('🎭 VENUE INFO');
  if (venueEvent.venueCapacity && venueEvent.venueCapacity !== '0') {
    lines.push(`  • Capacity: ${venueEvent.venueCapacity}`);
  }
  if (venueEvent.venueType) lines.push(`  • Type: ${venueEvent.venueType}`);
  if (venueEvent.venueAgeRequirement)
    lines.push(`  • Age Requirement: ${venueEvent.venueAgeRequirement}`);
  if (venueEvent.venuePrimaryUrl) lines.push(`  • Website: ${venueEvent.venuePrimaryUrl}`);
  if (venueEvent.venuePrimaryEmail) lines.push(`  • Email: ${venueEvent.venuePrimaryEmail}`);
  lines.push(`  • Venue ID: ${venueEvent.venueId}`);
  lines.push('');

  // Contacts
  lines.push('📞 CONTACTS');
  lines.push(...formatContacts(venueEvent.venueContacts));
  lines.push('');

  // Production, Facilities, Equipment, Local Crew, Logistics
  lines.push(...formatProduction(venueEvent.venueProduction));
  lines.push(...formatFacilities(venueEvent.venueFacilities));
  lines.push(...formatEquipment(venueEvent.venueEquipment));
  lines.push(...formatLocalCrew(venueEvent.venueLocalCrew));
  lines.push(...formatLogistics(venueEvent.venueLogistics));

  // Promoter (if present)
  if (venueEvent.promoterName && venueEvent.promoterName !== 'No Company Selected') {
    lines.push('📋 PROMOTER');
    lines.push(`  • ${venueEvent.promoterName}`);
    if (venueEvent.promoterCity && venueEvent.promoterState) {
      lines.push(`  • Location: ${venueEvent.promoterCity}, ${venueEvent.promoterState}`);
    }
    lines.push(...formatContacts(venueEvent.promoterContacts));
    lines.push('');
  }

  // Footer
  lines.push(separator());
  lines.push(`📊 Data from: ${foundOnTour} (${foundOnDate})`);

  return lines.join('\n');
}
