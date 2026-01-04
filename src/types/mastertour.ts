/**
 * Master Tour API type definitions
 *
 * Types for Master Tour REST API responses and data structures.
 * These will be refined as we inspect real API responses.
 */

/**
 * Standard Master Tour API response wrapper.
 * All API responses follow this structure.
 */
export interface MasterTourResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Tour information from GET /tours or GET /tour/{tourId}
 */
export interface Tour {
  id: string;
  name: string;
  // Additional fields to be added based on API response inspection
}

/**
 * Day information from daily summary endpoint
 */
export interface DayInfo {
  id: number;
  date: string;
  city: string;
  state: string;
  country: string;
  notes: string;
  travelNotes: string;
  hotelNotes: string;
}

/**
 * Itinerary item from daily summary
 */
export interface ItineraryItem {
  id: number;
  time: string;
  title: string;
  details: string;
  location: string;
  isConfirmed: boolean;
  isComplete: boolean;
}

/**
 * Event information from daily summary
 */
export interface Event {
  id: number;
  name: string;
  venue: string;
  doorsTime: string;
  showTime: string;
  curfew: string;
}

/**
 * Hotel information from daily summary
 */
export interface Hotel {
  id: number;
  name: string;
  address: string;
  phone: string;
  checkIn: string;
  checkOut: string;
}

/**
 * Complete daily summary response data
 */
export interface DailySummary {
  day: DayInfo;
  itinerary: ItineraryItem[];
  events: Event[];
  hotels: Hotel[];
}
