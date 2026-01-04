import axios from 'axios';
import type { OAuthClient } from '../auth/oauth.js';

const BASE_URL = 'https://my.eventric.com/portal/api/v5';

export interface MasterTourClient {
  getDay(dayId: string): Promise<DayResponse>;
  getTourSummary(tourId: string, date: string): Promise<DaySummaryResponse>;
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

export function createMasterTourClient(oauthClient: OAuthClient): MasterTourClient {
  async function request<T>(endpoint: string): Promise<T> {
    const url = `${BASE_URL}${endpoint}`;
    const params = { version: '7' };
    const headers = oauthClient.signRequest(url, 'GET', params);

    const response = await axios.get(url, { params, headers });
    return response.data.data;
  }

  return {
    async getDay(dayId: string): Promise<DayResponse> {
      return request<DayResponse>(`/day/${dayId}`);
    },

    async getTourSummary(tourId: string, date: string): Promise<DaySummaryResponse> {
      return request<DaySummaryResponse>(`/tour/${tourId}/summary/${date}`);
    },
  };
}
