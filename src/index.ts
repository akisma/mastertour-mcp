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

/**
 * Creates and configures the MCP server instance.
 * Exported for testing purposes.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: 'mastertour',
    version: '1.0.0',
  });

  // Tools will be registered here as we implement them
  // registerGetTodaySchedule(server);

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
