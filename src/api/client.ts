import axios from 'axios';
import type { OAuthClient } from '../auth/oauth.js';

const BASE_URL = 'https://my.eventric.com/portal/api/v5';

export interface TourInfo {
  tourId: string;
  organizationName: string;
  artistName: string;
  legName: string;
  organizationPermissionLevel: string;
}

export interface HotelInfo {
  id: string;
  name: string;
  address?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  confirmationNumber?: string;
  [key: string]: unknown;
}

export interface HotelDayInfo {
  id: string;
  name: string;
  dayDate: string;
  city: string;
  state: string;
  hotelNotes: string;
  hotels: HotelInfo[];
  [key: string]: unknown;
}

export interface TourHotelsResponse {
  tour: {
    artistName: string;
    legName: string;
    [key: string]: unknown;
  };
  days: HotelDayInfo[];
}

export interface CrewMember {
  contactId: string;
  firstName: string;
  lastName: string;
  preferredName?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  [key: string]: unknown;
}

export interface EventDayInfo {
  id: string;
  name: string;
  dayDate: string;
  dayType: string;
  city: string;
  state: string;
  country: string;
  [key: string]: unknown;
}

export interface TourEventsResponse {
  tour: {
    artistName: string;
    legName: string;
    [key: string]: unknown;
  };
  days: EventDayInfo[];
}

export interface VenueContact {
  title: string;
  contactName?: string;
  phone?: string;
  fax?: string;
}

export interface VenueProduction {
  stageWings?: string;
  dimensionsW?: string;
  dimensionsD?: string;
  dimensionsH?: string;
  deckToGrid?: string;
  trimHeight?: string;
  access?: string;
  dockType?: string;
  powerComments?: string;
  riggingComments?: string;
  [key: string]: unknown;
}

export interface VenueFacilities {
  dressingRooms?: string;
  showers?: string;
  truckParking?: string;
  busParking?: string;
  guestParking?: string;
  parkingComments?: string;
  [key: string]: unknown;
}

export interface VenueEquipment {
  audio?: string;
  lighting?: string;
  video?: string;
  backline?: string;
  staging?: string;
  [key: string]: unknown;
}

export interface VenueLogistics {
  directions?: string;
  closestCity?: string;
  airportNotes?: string;
  groundTransport?: string;
  areaHotels?: string;
  areaRestaurants?: string;
  [key: string]: unknown;
}

export interface VenueLocalCrew {
  localUnion?: string;
  minimumIN?: string;
  minimumOUT?: string;
  penalties?: string;
  crewComments?: string;
  [key: string]: unknown;
}

export interface DayEvent {
  eventId: string;
  dayId: string;
  venueId: string;
  venueName: string;
  venuePreviousName?: string;
  venueAddressLine1?: string;
  venueAddressLine2?: string;
  venueCity?: string;
  venueState?: string;
  venueZip?: string;
  venueCountry?: string;
  venueLatitude?: string;
  venueLongitude?: string;
  venueTimeZone?: string;
  venuePrimaryUrl?: string;
  venuePrimaryEmail?: string;
  venueCapacity?: string;
  venueType?: string;
  venueAgeRequirement?: string;
  venuePublicNotes?: string;
  venueContacts?: VenueContact[];
  venueProduction?: VenueProduction;
  venueFacilities?: VenueFacilities;
  venueEquipment?: VenueEquipment;
  venueLogistics?: VenueLogistics;
  venueLocalCrew?: VenueLocalCrew;
  promoterId?: string;
  promoterName?: string;
  promoterCity?: string;
  promoterState?: string;
  promoterContacts?: VenueContact[];
  [key: string]: unknown;
}

export interface TourAllResponse {
  tour: {
    id: string;
    artistName: string;
    tourName: string;
    legName: string;
    days: EventDayInfo[];
    [key: string]: unknown;
  };
}

export interface MasterTourClient {
  listTours(): Promise<TourInfo[]>;
  getDay(dayId: string): Promise<DayResponse>;
  getTourSummary(tourId: string, date: string): Promise<DaySummaryResponse[]>;
  getTourHotels(tourId: string): Promise<TourHotelsResponse>;
  getTourCrew(tourId: string): Promise<CrewMember[]>;
  getTourEvents(tourId: string): Promise<TourEventsResponse>;
  getTourAll(tourId: string): Promise<TourAllResponse>;
  getDayEvents(dayId: string): Promise<DayEvent[]>;
  createScheduleItem(params: CreateScheduleItemParams): Promise<{ id: string }>;
  updateScheduleItem(itemId: string, params: UpdateScheduleItemParams): Promise<void>;
  deleteScheduleItem(itemId: string): Promise<void>;
  updateDayNotes(dayId: string, params: UpdateDayNotesParams): Promise<void>;
}

export interface UpdateDayNotesParams {
  generalNotes: string;
  hotelNotes: string;
  travelNotes: string;
  syncId: string;
}
export interface DayResponse {
  day: {
    id: string;
    tourId: string;
    name: string;
    dayDate: string;
    timeZone: string;
    dayType: string;
    city: string;
    state: string;
    country: string;
    scheduleItems?: ScheduleItem[];
    [key: string]: unknown;
  };
}

export interface ScheduleItem {
  id: string;
  title: string;
  startDatetime: string;
  paulStartTime: string;
  endDatetime: string;
  paulEndTime: string;
  dayTimeZone: string;
  syncId: string;
  details?: string;
  isConfirmed?: boolean;
  isComplete?: boolean;
  [key: string]: unknown;
}

export interface DaySummaryResponse {
  id: string;
  dayDate: string;
  timeZone?: string;
  dayType?: string;
  city?: string;
  state?: string;
  country?: string;
  [key: string]: unknown;
}

export interface CreateScheduleItemParams {
  parentDayId: string;
  title: string;
  details: string;
  isConfirmed: boolean;
  isComplete: boolean;
  startDatetime: string;
  endDatetime: string;
  timePriority: string;
}

export interface UpdateScheduleItemParams {
  title: string;
  details: string;
  travelDetail?: string;
  isConfirmed: boolean;
  isComplete: boolean;
  startDatetime: string;
  endDatetime: string;
  timePriority: string;
  syncId: string; // Required by API
}

/**
 * Custom error class for Master Tour API errors with better messages
 */
export class MasterTourApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public originalMessage?: string
  ) {
    super(message);
    this.name = 'MasterTourApiError';
  }
}

/**
 * Parse API error response and return a user-friendly error
 */
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error) && error.response) {
    const status = error.response.status;
    const apiMessage = error.response.data?.message || '';
    
    // Permission errors
    if (apiMessage.includes('do not have the appropriate tour permission')) {
      throw new MasterTourApiError(
        'Permission denied: You do not have write access to this tour. Contact your tour manager to request edit permissions.',
        status,
        apiMessage
      );
    }
    
    // Auth errors
    if (status === 401 || apiMessage.includes('OAuth')) {
      throw new MasterTourApiError(
        'Authentication failed: Check your MASTERTOUR_KEY and MASTERTOUR_SECRET credentials.',
        status,
        apiMessage
      );
    }
    
    // Not found
    if (status === 404) {
      throw new MasterTourApiError(
        'Not found: The requested resource does not exist or you do not have access to it.',
        status,
        apiMessage
      );
    }
    
    // Generic API error with original message
    throw new MasterTourApiError(
      `API error (${status}): ${apiMessage || 'Unknown error'}`,
      status,
      apiMessage
    );
  }
  
  // Re-throw non-Axios errors
  throw error;
}

export function createMasterTourClient(oauthClient: OAuthClient): MasterTourClient {
  async function get<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const params = { version: '7' };
    const headers = oauthClient.signRequest(url, 'GET', params);

    try {
      const response = await axios.get(url, { params, headers });
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  }

  async function post<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const params = { version: '7' };
    const headers = oauthClient.signRequest(url, 'POST', params);

    try {
      const response = await axios.post(url, data, { 
        params, 
        headers: { ...headers, 'Content-Type': 'application/json' } 
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  }

  async function put<T>(endpoint: string, data: unknown): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const params = { version: '7' };
    const headers = oauthClient.signRequest(url, 'PUT', params);

    try {
      const response = await axios.put(url, data, { 
        params, 
        headers: { ...headers, 'Content-Type': 'application/json' } 
      });
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  }

  async function del<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const params = { version: '7' };
    const headers = oauthClient.signRequest(url, 'DELETE', params);

    try {
      const response = await axios.delete(url, { params, headers });
      return response.data.data;
    } catch (error) {
      handleApiError(error);
    }
  }

  return {
    async listTours(): Promise<TourInfo[]> {
      const response = await get<{ tours: TourInfo[] }>('/tours');
      return response.tours;
    },

    async getDay(dayId: string): Promise<DayResponse> {
      return get<DayResponse>(`/day/${dayId}`);
    },

    async getTourSummary(tourId: string, date: string): Promise<DaySummaryResponse[]> {
      return get<DaySummaryResponse[]>(`/tour/${tourId}/summary/${date}`);
    },

    async createScheduleItem(params: CreateScheduleItemParams): Promise<{ id: string }> {
      return post<{ id: string }>('/itinerary', params);
    },

    async updateScheduleItem(itemId: string, params: UpdateScheduleItemParams): Promise<void> {
      await put(`/itinerary/${itemId}`, params);
    },

    async deleteScheduleItem(itemId: string): Promise<void> {
      await del(`/itinerary/${itemId}`);
    },

    async updateDayNotes(dayId: string, params: UpdateDayNotesParams): Promise<void> {
      await put(`/day/${dayId}`, params);
    },

    async getTourHotels(tourId: string): Promise<TourHotelsResponse> {
      const data = await get<{ tour: TourHotelsResponse['tour'] & { days: HotelDayInfo[] } }>(`/tour/${tourId}/hotels`);
      return {
        tour: {
          artistName: data.tour.artistName,
          legName: data.tour.legName,
        },
        days: data.tour.days || [],
      };
    },

    async getTourCrew(tourId: string): Promise<CrewMember[]> {
      const data = await get<{ crew: CrewMember[] }>(`/tour/${tourId}/crew`);
      return data.crew || [];
    },

    async getTourEvents(tourId: string): Promise<TourEventsResponse> {
      const data = await get<{ tour: TourEventsResponse['tour'] & { days: EventDayInfo[] } }>(`/tour/${tourId}/events`);
      return {
        tour: {
          artistName: data.tour.artistName,
          legName: data.tour.legName,
        },
        days: data.tour.days || [],
      };
    },

    async getTourAll(tourId: string): Promise<TourAllResponse> {
      const data = await get<{ tour: TourAllResponse['tour'] }>(`/tour/${tourId}/all`);
      return {
        tour: {
          id: data.tour.id,
          artistName: data.tour.artistName,
          tourName: data.tour.tourName,
          legName: data.tour.legName,
          days: data.tour.days || [],
        },
      };
    },

    async getDayEvents(dayId: string): Promise<DayEvent[]> {
      const data = await get<{ events: DayEvent[] }>(`/day/${dayId}/events`);
      return data.events || [];
    },
  };
}
