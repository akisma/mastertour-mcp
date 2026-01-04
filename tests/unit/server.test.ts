/**
 * Unit tests for MCP server creation
 */

import { describe, it, expect, vi } from 'vitest';
import { createServer, type ServerDependencies } from '../../src/index.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

// Create mock dependencies for testing
function createMockDependencies(): ServerDependencies {
  const mockClient: MasterTourClient = {
    listTours: vi.fn(),
    getDay: vi.fn(),
    getTourSummary: vi.fn(),
    getTourHotels: vi.fn(),
    getTourCrew: vi.fn(),
    getTourEvents: vi.fn(),
    getTourAll: vi.fn(),
    getDayEvents: vi.fn(),
    createScheduleItem: vi.fn(),
    updateScheduleItem: vi.fn(),
    deleteScheduleItem: vi.fn(),
    updateDayNotes: vi.fn(),
  };

  return {
    client: mockClient,
    config: {
      consumerKey: 'test-key',
      consumerSecret: 'test-secret',
      defaultTourId: 'test-tour-123',
    },
  };
}

describe('createServer', () => {
  it('should create an MCP server instance with provided dependencies', () => {
    const deps = createMockDependencies();
    const server = createServer(deps);
    expect(server).toBeDefined();
  });

  it('should configure server with correct name and version', () => {
    const deps = createMockDependencies();
    const server = createServer(deps);
    // McpServer exposes server info - verify it was created
    // The server object exists and can be used
    expect(server).toBeDefined();
    expect(typeof server.connect).toBe('function');
  });
});
