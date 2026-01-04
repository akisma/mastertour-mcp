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

export interface MasterTourClient {
  listTours(): Promise<TourInfo[]>;
  getDay(dayId: string): Promise<DayResponse>;
  getTourSummary(tourId: string, date: string): Promise<DaySummaryResponse[]>;
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
}export interface DayResponse {
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
  };
}
