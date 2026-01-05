/**
 * Structured output types for MCP tools
 *
 * Each tool returns a ToolResult<T> containing both structured data
 * and a human-readable text representation.
 */

// ============================================================================
// Core Result Type
// ============================================================================

export interface ToolResult<T> {
  /** Structured data for programmatic consumption */
  data: T;
  /** Human-readable formatted text */
  text: string;
}

// ============================================================================
// Schedule Types
// ============================================================================

export interface ScheduleItemOutput {
  id: string;
  syncId: string;
  title: string;
  startTime: string; // HH:MM format in local time
  endTime: string;
  details?: string;
}

export interface DayScheduleOutput {
  dayId: string;
  tourId: string;
  date: string; // YYYY-MM-DD
  name: string;
  dayType: string;
  city: string;
  state: string;
  country: string;
  timezone: string;
  items: ScheduleItemOutput[];
}

export interface ScheduleMutationOutput {
  success: boolean;
  itemId: string;
  syncId: string;
  action: 'created' | 'updated' | 'deleted';
  dayId: string;
  title?: string;
}

// ============================================================================
// Tour Types
// ============================================================================

export interface TourOutput {
  tourId: string;
  legName: string;
  artistName: string;
  organizationName: string;
  accessLevel: 'edit' | 'read-only';
}

export interface TourListOutput {
  tours: TourOutput[];
  totalCount: number;
  byOrganization: Record<string, TourOutput[]>;
}

// ============================================================================
// Upcoming Shows
// ============================================================================

export interface UpcomingShowOutput {
  dayId: string;
  tourLabel: string;
  date: string; // YYYY-MM-DD
  dayType: string;
  venueName: string;
  city: string;
  state: string;
  country: string;
}

export interface UpcomingShowsOutput {
  shows: UpcomingShowOutput[];
  totalFound: number;
  limit: number;
  toursSearched: number;
}

// ============================================================================
// Venue Types
// ============================================================================

export interface VenueSearchResultOutput {
  dayId: string;
  tourLabel: string;
  date: string;
  venueName: string;
  city: string;
  state: string;
  country: string;
  matchedOn: string;
}

export interface VenueSearchOutput {
  query: string;
  results: VenueSearchResultOutput[];
  totalFound: number;
  toursSearched: number;
}

export interface VenueContactOutput {
  name: string;
  title?: string;
  email?: string;
  phone?: string;
}

export interface VenueDetailsOutput {
  dayId: string;
  venueName: string;
  date: string;
  tourLabel: string;
  address?: string;
  city: string;
  state: string;
  country: string;
  capacity?: number;
  contacts: VenueContactOutput[];
  notes?: string;
}

// ============================================================================
// Crew Types
// ============================================================================

export interface CrewMemberOutput {
  id: string;
  name: string;
  title: string;
  department: string;
  email?: string;
  phone?: string;
}

export interface TourCrewOutput {
  tourId: string;
  tourName: string;
  crew: CrewMemberOutput[];
  totalCount: number;
  byDepartment: Record<string, CrewMemberOutput[]>;
}

// ============================================================================
// Hotel Types
// ============================================================================

export interface HotelOutput {
  dayId: string;
  date: string;
  city: string;
  hotelName: string;
  address?: string;
  phone?: string;
  confirmation?: string;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
}

export interface TourHotelsOutput {
  tourId: string;
  hotels: HotelOutput[];
  totalCount: number;
}

// ============================================================================
// Event Types
// ============================================================================

export interface TourEventOutput {
  dayId: string;
  date: string;
  venueName: string;
  city: string;
  state: string;
  dayType: string;
  promoter?: string;
  ticketCount?: number;
  capacity?: number;
}

export interface TourEventsOutput {
  tourId: string;
  events: TourEventOutput[];
  totalCount: number;
  showDays: number;
  travelDays: number;
  offDays: number;
}

// ============================================================================
// Day Notes
// ============================================================================

export interface DayNotesOutput {
  success: boolean;
  dayId: string;
  notes: string;
  previousNotes?: string;
}
