/**
 * Mastertour MCP Server
 *
 * An MCP server enabling AI assistants to interact with Master Tour,
 * the industry-standard tour management software by Eventric.
 *
 * @module mastertour-mcp
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { createOAuthClient } from './auth/oauth.js';
import { createMasterTourClient } from './api/client.js';
import { getTodaySchedule } from './tools/getTodaySchedule.js';
import { addScheduleItem } from './tools/addScheduleItem.js';
import { updateScheduleItem } from './tools/updateScheduleItem.js';
import { deleteScheduleItem } from './tools/deleteScheduleItem.js';
import { updateDayNotes } from './tools/updateDayNotes.js';
import { listTours } from './tools/listTours.js';
import { getTourHotels } from './tools/getTourHotels.js';
import { getTourCrew } from './tools/getTourCrew.js';
import { getTourEvents } from './tools/getTourEvents.js';

/**
 * Creates and configures the MCP server instance.
 * Exported for testing purposes.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: 'mastertour',
    version: '1.0.0',
  });

  // Register get_today_schedule tool
  server.tool(
    'get_today_schedule',
    "Get today's tour schedule including itinerary, events, and times",
    {
      tourId: z.string().optional().describe('Tour ID (optional if MASTERTOUR_DEFAULT_TOUR_ID is set)'),
      date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)'),
    },
    async ({ tourId, date }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await getTodaySchedule(client, { tourId, date });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Register add_schedule_item tool
  server.tool(
    'add_schedule_item',
    'Add a new item to a day\'s schedule (e.g., meetings, soundcheck, lobby call)',
    {
      dayId: z.string().describe('The day ID to add the schedule item to'),
      title: z.string().describe('Title of the schedule item (e.g., "Production meeting", "Soundcheck")'),
      startTime: z.string().describe('Start time in HH:MM format (24-hour, local venue time, e.g., "14:00")'),
      endTime: z.string().optional().describe('End time in HH:MM format (defaults to start time)'),
      details: z.string().optional().describe('Additional details or notes'),
    },
    async ({ dayId, title, startTime, endTime, details }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await addScheduleItem(client, { dayId, title, startTime, endTime, details });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Tool: update_schedule_item
  server.tool(
    'update_schedule_item',
    'Update an existing schedule item (change title, time, or details)',
    {
      itemId: z.string().describe('The ID of the schedule item to update'),
      dayId: z.string().describe('The day ID containing the schedule item'),
      title: z.string().optional().describe('New title for the item'),
      startTime: z.string().optional().describe('New start time in HH:MM format (24-hour, local venue time)'),
      endTime: z.string().optional().describe('New end time in HH:MM format'),
      details: z.string().optional().describe('New details/notes'),
    },
    async ({ itemId, dayId, title, startTime, endTime, details }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await updateScheduleItem(client, { itemId, dayId, title, startTime, endTime, details });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Tool: delete_schedule_item
  server.tool(
    'delete_schedule_item',
    'Delete a schedule item from a day',
    {
      itemId: z.string().describe('The ID of the schedule item to delete'),
      dayId: z.string().describe('The day ID containing the schedule item'),
    },
    async ({ itemId, dayId }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await deleteScheduleItem(client, { itemId, dayId });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Tool: update_day_notes
  server.tool(
    'update_day_notes',
    'Update the notes for a day (general notes, hotel notes, travel notes)',
    {
      dayId: z.string().describe('The day ID to update notes for'),
      generalNotes: z.string().optional().describe('General notes for the day'),
      hotelNotes: z.string().optional().describe('Hotel-related notes'),
      travelNotes: z.string().optional().describe('Travel-related notes'),
    },
    async ({ dayId, generalNotes, hotelNotes, travelNotes }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await updateDayNotes(client, { dayId, generalNotes, hotelNotes, travelNotes });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Tool: list_tours
  server.tool(
    'list_tours',
    'List all tours you have access to, including tour IDs and permission levels',
    {},
    async () => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await listTours(client);
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Tool: get_tour_hotels
  server.tool(
    'get_tour_hotels',
    'Get hotel information for a tour including hotel names, addresses, and notes',
    {
      tourId: z.string().optional().describe('Tour ID (optional if MASTERTOUR_DEFAULT_TOUR_ID is set)'),
    },
    async ({ tourId }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await getTourHotels(client, { tourId });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Tool: get_tour_crew
  server.tool(
    'get_tour_crew',
    'Get tour crew members with contact info, grouped by role',
    {
      tourId: z.string().optional().describe('Tour ID (optional if MASTERTOUR_DEFAULT_TOUR_ID is set)'),
    },
    async ({ tourId }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await getTourCrew(client, { tourId });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  // Tool: get_tour_events
  server.tool(
    'get_tour_events',
    'Get tour dates and events with venues, cities, and day types',
    {
      tourId: z.string().optional().describe('Tour ID (optional if MASTERTOUR_DEFAULT_TOUR_ID is set)'),
      showsOnly: z.boolean().optional().describe('If true, only show "Show Day" events (excludes travel days, days off)'),
    },
    async ({ tourId, showsOnly }) => {
      const oauth = createOAuthClient();
      const client = createMasterTourClient(oauth);
      
      const result = await getTourEvents(client, { tourId, showsOnly });
      
      return {
        content: [{ type: 'text', text: result }],
      };
    }
  );

  return server;
}

/**
 * Main entry point - starts the MCP server with stdio transport.
 */
async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);
}

// Only run main when executed directly (not imported for tests)
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
