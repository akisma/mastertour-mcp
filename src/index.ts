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
