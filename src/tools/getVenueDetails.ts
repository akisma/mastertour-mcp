import type { MasterTourClient, DayEvent, TourInfo } from '../api/client.js';

export interface GetVenueDetailsParams {
  venueId: string;
}

/**
 * Formats contact information
 */
function formatContacts(contacts: DayEvent['venueContacts']): string[] {
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
 * Formats a value if it exists, or returns empty string
 */
function formatField(label: string, value: string | undefined): string {
  if (!value || value.trim() === '') return '';
  // Decode HTML entities
  const decoded = value.replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return `  • ${label}: ${decoded}`;
}

/**
 * Gets detailed venue information by venue ID.
 * 
 * Since the Master Tour API doesn't expose a direct venue endpoint,
 * this tool searches through the user's tours to find a day that used
 * this venue and extracts the complete venue data from the event.
 */
export async function getVenueDetails(
  client: MasterTourClient,
  params: GetVenueDetailsParams
): Promise<string> {
  const { venueId } = params;

  if (!venueId) {
    throw new Error('Venue ID is required');
  }

  // Search all tours to find this venue
  const tours: TourInfo[] = await client.listTours();
  let venueEvent: DayEvent | null = null;
  let foundOnTour: string = '';
  let foundOnDate: string = '';

  for (const tour of tours) {
    if (venueEvent) break;
    
    try {
      const tourData = await client.getTourAll(tour.tourId);
      const tourLabel = `${tourData.tour.artistName} - ${tourData.tour.legName}`.trim();
      
      // Check days with venues
      const daysWithVenues = tourData.tour.days.filter(d => d.name && d.name.trim());
      
      for (const day of daysWithVenues) {
        if (venueEvent) break;
        
        try {
          const events = await client.getDayEvents(day.id);
          const matchingEvent = events.find(e => e.venueId === venueId);
          
          if (matchingEvent) {
            venueEvent = matchingEvent;
            foundOnTour = tourLabel;
            foundOnDate = day.dayDate?.split(' ')[0] || '';
            break;
          }
        } catch {
          // Skip days that fail
        }
      }
    } catch {
      // Skip tours that fail
    }
  }

  if (!venueEvent) {
    return [
      `❌ Venue Not Found`,
      '─'.repeat(50),
      '',
      `Could not find venue with ID: ${venueId}`,
      '',
      'This venue may not exist in any of your accessible tours.',
      'Use search_past_venues to find venues you have access to.',
    ].join('\n');
  }

  // Build the detailed output
  const lines: string[] = [
    `🏟️ ${venueEvent.venueName}`,
    '─'.repeat(50),
    '',
  ];

  // Basic Info
  lines.push('📍 LOCATION');
  if (venueEvent.venueAddressLine1) lines.push(`  ${venueEvent.venueAddressLine1}`);
  if (venueEvent.venueAddressLine2) lines.push(`  ${venueEvent.venueAddressLine2}`);
  lines.push(`  ${venueEvent.venueCity}, ${venueEvent.venueState} ${venueEvent.venueZip}`);
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
  if (venueEvent.venueAgeRequirement) lines.push(`  • Age Requirement: ${venueEvent.venueAgeRequirement}`);
  if (venueEvent.venuePrimaryUrl) lines.push(`  • Website: ${venueEvent.venuePrimaryUrl}`);
  if (venueEvent.venuePrimaryEmail) lines.push(`  • Email: ${venueEvent.venuePrimaryEmail}`);
  lines.push(`  • Venue ID: ${venueEvent.venueId}`);
  lines.push('');

  // Contacts
  lines.push('📞 CONTACTS');
  lines.push(...formatContacts(venueEvent.venueContacts));
  lines.push('');

  // Production
  if (venueEvent.venueProduction) {
    const prod = venueEvent.venueProduction;
    lines.push('🎬 PRODUCTION');
    
    // Stage dimensions
    const stageDims = [
      prod.dimensionsW ? `W: ${prod.dimensionsW}` : '',
      prod.dimensionsD ? `D: ${prod.dimensionsD}` : '',
      prod.dimensionsH ? `H: ${prod.dimensionsH}` : '',
    ].filter(Boolean).join(' × ');
    if (stageDims) lines.push(`  • Stage Dimensions: ${stageDims}`);
    
    const deckToGrid = formatField('Deck to Grid', prod.deckToGrid);
    if (deckToGrid) lines.push(deckToGrid);
    
    const trimHeight = formatField('Trim Height', prod.trimHeight);
    if (trimHeight) lines.push(trimHeight);
    
    const access = formatField('Load-In Access', prod.access);
    if (access) lines.push(access);
    
    const dockType = formatField('Dock Type', prod.dockType);
    if (dockType) lines.push(dockType);
    
    const rigging = formatField('Rigging Notes', prod.riggingComments);
    if (rigging) lines.push(rigging);
    
    const power = formatField('Power Notes', prod.powerComments);
    if (power) lines.push(power);
    
    lines.push('');
  }

  // Facilities
  if (venueEvent.venueFacilities) {
    const fac = venueEvent.venueFacilities;
    lines.push('🚿 FACILITIES');
    
    const dressingRooms = formatField('Dressing Rooms', fac.dressingRooms);
    if (dressingRooms) lines.push(dressingRooms);
    
    const showers = formatField('Showers', fac.showers);
    if (showers) lines.push(showers);
    
    const truckParking = formatField('Truck Parking', fac.truckParking);
    if (truckParking) lines.push(truckParking);
    
    const busParking = formatField('Bus Parking', fac.busParking);
    if (busParking) lines.push(busParking);
    
    const guestParking = formatField('Guest Parking', fac.guestParking);
    if (guestParking) lines.push(guestParking);
    
    const parkingComments = formatField('Parking Notes', fac.parkingComments);
    if (parkingComments) lines.push(parkingComments);
    
    lines.push('');
  }

  // Equipment
  if (venueEvent.venueEquipment) {
    const eq = venueEvent.venueEquipment;
    lines.push('🔊 EQUIPMENT');
    
    const audio = formatField('Audio', eq.audio);
    if (audio) lines.push(audio);
    
    const lighting = formatField('Lighting', eq.lighting);
    if (lighting) lines.push(lighting);
    
    const video = formatField('Video', eq.video);
    if (video) lines.push(video);
    
    const backline = formatField('Backline', eq.backline);
    if (backline) lines.push(backline);
    
    const staging = formatField('Staging', eq.staging);
    if (staging) lines.push(staging);
    
    lines.push('');
  }

  // Local Crew
  if (venueEvent.venueLocalCrew) {
    const lc = venueEvent.venueLocalCrew;
    lines.push('👷 LOCAL CREW');
    
    const union = formatField('Union', lc.localUnion);
    if (union) lines.push(union);
    
    const minIn = formatField('Minimum IN', lc.minimumIN);
    if (minIn) lines.push(minIn);
    
    const minOut = formatField('Minimum OUT', lc.minimumOUT);
    if (minOut) lines.push(minOut);
    
    const penalties = formatField('Penalties', lc.penalties);
    if (penalties) lines.push(penalties);
    
    const crewComments = formatField('Crew Notes', lc.crewComments);
    if (crewComments) lines.push(crewComments);
    
    lines.push('');
  }

  // Logistics
  if (venueEvent.venueLogistics) {
    const log = venueEvent.venueLogistics;
    lines.push('🚗 LOGISTICS');
    
    const directions = formatField('Directions', log.directions);
    if (directions) lines.push(directions);
    
    const closestCity = formatField('Closest City', log.closestCity);
    if (closestCity) lines.push(closestCity);
    
    const airport = formatField('Airport Notes', log.airportNotes);
    if (airport) lines.push(airport);
    
    const ground = formatField('Ground Transport', log.groundTransport);
    if (ground) lines.push(ground);
    
    const hotels = formatField('Area Hotels', log.areaHotels);
    if (hotels) lines.push(hotels);
    
    const restaurants = formatField('Area Restaurants', log.areaRestaurants);
    if (restaurants) lines.push(restaurants);
    
    lines.push('');
  }

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
  lines.push('─'.repeat(50));
  lines.push(`📊 Data from: ${foundOnTour} (${foundOnDate})`);

  return lines.join('\n');
}
