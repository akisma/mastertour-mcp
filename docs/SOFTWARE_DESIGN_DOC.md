# Mastertour MCP - Software Design Document

> **Status:** PHASE 4 COMPLETE - 12 MCP Tools Implemented  
> **Author:** Engineering Team  
> **Last Updated:** January 2026  
> **Reviewers:** Principal Engineer

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Goals & Non-Goals](#2-goals--non-goals)
3. [Background](#3-background)
4. [System Architecture](#4-system-architecture)
5. [Detailed Design](#5-detailed-design)
6. [API Specifications](#6-api-specifications)
7. [Data Models](#7-data-models)
8. [Error Handling](#8-error-handling)
9. [Testing Strategy](#9-testing-strategy)
10. [Security Considerations](#10-security-considerations)
11. [Implementation Plan](#11-implementation-plan)
12. [Open Questions](#12-open-questions)
13. [Appendix](#13-appendix)

---

## 1. Executive Summary

### What
An MCP server enabling AI assistants to manage tour schedules, crew, hotels, venues, and production information from Master Tour (Eventric).

### Why
- No existing MCP integration for Master Tour
- Tour managers need AI-assisted access to schedules and venue research
- Demonstrate end-to-end MCP + external API integration

### Current State
**12 MCP tools implemented across 4 phases:**
- Phase 1: MVP (`get_today_schedule`)
- Phase 2: CRUD Operations (schedule items, day notes)
- Phase 3: Reference Tools (tours, hotels, crew, events)
- Phase 4: Venue Research (venue search, details, upcoming shows)

---

## 2. Goals & Non-Goals

### Goals (Phases 1-4) - ALL COMPLETE ✅
- ✅ Authenticate with Master Tour API using OAuth 1.0
- ✅ Implement 12 MCP tools across 4 phases
- ✅ Return formatted schedule data to AI assistant
- ✅ Complete test coverage (100 tests passing)
- ✅ Production-ready error handling
- ✅ Clean, documented code
- ✅ Confirm timezone handling via spike before deep build

### Non-Goals
- ❌ MCP Resources or Prompts (not planned)
- ❌ Caching layer (not planned)
- ❌ Rate limiting (monitor, implement if needed)
- ❌ Venue/event creation (API limitation - desktop client only)

### Phase 1: MVP ✅ COMPLETE
| Tool | Method | Purpose |
|------|--------|--------|
| `get_today_schedule` | GET | Today's schedule with itinerary, events, hotels |

### Phase 2: Schedule Management ✅ COMPLETE
| Tool | Method | Purpose |
|------|--------|--------|
| `add_schedule_item` | POST | Add items to day schedule |
| `update_schedule_item` | PUT | Modify existing schedule items |
| `delete_schedule_item` | DELETE | Remove schedule items |
| `update_day_notes` | PUT | Update general/travel/hotel notes |

### Phase 3: Context/Reference Tools ✅ COMPLETE
| Tool | Method | Purpose |
|------|--------|--------|
| `list_tours` | GET | Show all accessible tours |
| `get_tour_hotels` | GET | Hotel info for tour |
| `get_tour_crew` | GET | Crew/personnel for tour |
| `get_tour_events` | GET | Venue/event details for tour |

### Phase 4: Venue Research Tools ✅ COMPLETE
| Tool | Method | Purpose |
|------|--------|--------|
| `search_past_venues` | GET | Search venues from user's historical tours |
| `get_venue_details` | GET | Complete venue info (production, contacts, facilities) |
| `get_upcoming_shows` | GET | Upcoming shows across all tours |

### Future Roadmap (Phase 5+)
| Priority | Tool | Description |
|----------|------|-------------|
| P3 | `get_promoter_details` | Promoter info for settlements |
| P3 | `search_contacts` | Search contacts across tours |
| P4 | `get_tour_production_summary` | Production overview for advance |

---

## 3. Background

### Master Tour
- Industry-standard tour management software by Eventric
- Used by major tours: Beyoncé, Metallica, Linkin Park
- Manages schedules, hotels, guest lists, crew, venues

### Master Tour API
- REST API at `https://my.eventric.com/portal/api/v5/` *(Note: `/portal/` prefix required)*
- OAuth 1.0 authentication (key/secret signing)
- JSON responses with `{success, message, data}` structure
- Requires `version=7` query parameter
- **Datetime handling:** API provides dual times - `startDatetime` (UTC) and `paulStartTime` (local venue time)

### MCP (Model Context Protocol)
- Protocol for AI assistants to interact with external tools
- TypeScript SDK: `@modelcontextprotocol/sdk`
- Tools expose functionality; Resources expose data; Prompts provide templates

---

## 4. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Claude Desktop                             │
│                                                                  │
│  ┌────────────┐    stdio     ┌────────────────────────────────┐ │
│  │   Claude   │◀────────────▶│      Mastertour MCP Server     │ │
│  │   Model    │              │                                │ │
│  └────────────┘              │  ┌──────────┐  ┌────────────┐  │ │
│                              │  │   MCP    │  │   Master   │  │ │
│                              │  │  Tools   │──│   Tour     │──┼─┼──▶ Master Tour API
│                              │  │          │  │   Client   │  │ │
│                              │  └──────────┘  └────────────┘  │ │
│                              │                                │ │
│                              │  ┌────────────────────────────┐│ │
│                              │  │     OAuth 1.0 Auth         ││ │
│                              │  └────────────────────────────┘│ │
│                              └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Component | Responsibility |
|-----------|----------------|
| MCP Server (index.ts) | Entry point, transport setup, tool registration |
| OAuth Auth (auth.ts) | Sign requests with OAuth 1.0 |
| API Client (api/client.ts) | HTTP requests to Master Tour (axios) |
| Tools (tools/*.ts) | MCP tool implementations |

### Project Structure

```
mastertour-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── auth.ts               # OAuth 1.0 signing
│   ├── api/
│   │   └── client.ts         # Master Tour HTTP client
│   ├── tools/
│   │   └── getTodaySchedule.ts
│   └── types/
│       └── mastertour.ts     # Type definitions
├── tests/
│   ├── unit/
│   │   ├── auth.test.ts
│   │   ├── client.test.ts
│   │   └── getTodaySchedule.test.ts
│   └── integration/
│       └── getTodaySchedule.integration.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

---

## 5. Detailed Design

### 5.1 MCP Server Initialization

```typescript
// src/index.ts - Conceptual design
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerGetTodaySchedule } from './tools/getTodaySchedule.js';

const server = new McpServer({
  name: 'mastertour',
  version: '1.0.0',
});

// Register tools
registerGetTodaySchedule(server);

// Connect via stdio
const transport = new StdioServerTransport();
await server.connect(transport);
```

### 5.2 OAuth 1.0 Authentication

**Signing Flow:**
1. Collect request parameters (method, URL, params)
2. Generate OAuth parameters (timestamp, nonce, signature method)
3. Create signature base string
4. Generate HMAC-SHA1 signature
5. Add Authorization header to request

**Design Decision:** Use `oauth-1.0a` npm package for signing logic.

### 5.3 API Client

**Responsibilities:**
- Build request URLs with required `version=7` param
- Apply OAuth signature to all requests
- Parse JSON responses
- Handle HTTP errors
- Transform API responses to typed objects

**Choices:**
- HTTP client: `axios` (consistent interceptors, typed responses)
- Date handling: `date-fns` for formatting/parsing
- Default tour: optional env `MASTERTOUR_DEFAULT_TOUR_ID` with tool override
- Tours listing: `GET /api/v5/tours` available for future selection UX

### 5.4 get_today_schedule Tool

**Flow:**
```
User asks about today's schedule
         │
         ▼
┌─────────────────────┐
│ MCP receives tool   │
│ call with tourId    │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Determine today's   │
│ date (input or now) │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Call Master Tour    │
│ /tour/{id}/summary/ │
│ {YYYY-MM-DD}        │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Parse and format    │
│ response            │
└─────────────────────┘
         │
         ▼
┌─────────────────────┐
│ Return structured   │
│ content to Claude   │
└─────────────────────┘
```

---

## 6. API Specifications

### 6.1 MCP Tool: get_today_schedule

**Name:** `get_today_schedule`

**Description:** Get today's tour schedule including itinerary, events, and notes.

**Input Schema:**
```typescript
{
  tourId?: string  // Tour ID. Uses default if not provided.
}
```

**Output:** Text content with formatted schedule

**Example Output:**
```
📅 Today's Schedule - January 3, 2026

🏨 Hotel: The Ritz-Carlton, Los Angeles
   Check-in: 3:00 PM

📋 Itinerary:
- 10:00 AM - Production meeting
- 2:00 PM - Load-in begins
- 4:00 PM - Soundcheck
- 8:00 PM - Doors
- 9:00 PM - Show

📝 Notes:
- VIP meet & greet at 7:30 PM
- Curfew: 11:00 PM
```

### 6.2 Master Tour Endpoints Used

**GET /tour/{tourId}/summary/{date}**

Request:
```
GET /api/v5/tour/12345/summary/2026-01-03?version=7
Authorization: OAuth oauth_consumer_key="...", ...
```

Response:
```json
{
  "success": true,
  "message": "",
  "data": {
    "day": { ... },
    "itinerary": [ ... ],
    "events": [ ... ],
    "hotels": [ ... ]
  }
}
```

---

## 7. Data Models

### 7.1 TypeScript Types

```typescript
// src/types/mastertour.ts

/** Master Tour API response wrapper */
interface MasterTourResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/** Daily summary from /tour/{id}/summary/{date} */
interface DailySummary {
  day: DayInfo;
  itinerary: ItineraryItem[];
  events: Event[];
  hotels: Hotel[];
}

interface DayInfo {
  id: number;
  date: string;
  city: string;
  state: string;
  country: string;
  notes: string;
  travel_notes: string;
  hotel_notes: string;
}

interface ItineraryItem {
  id: number;
  time: string;
  description: string;
  location: string;
  notes: string;
}

interface Event {
  id: number;
  name: string;
  venue: string;
  doors_time: string;
  show_time: string;
  curfew: string;
}

interface Hotel {
  id: number;
  name: string;
  address: string;
  phone: string;
  check_in: string;
  check_out: string;
}
```

*Note: Actual types will be refined based on real API responses during implementation.*

---

## 8. Error Handling

### 8.1 Error Categories

| Category | Example | Handling |
|----------|---------|----------|
| Auth Errors | Invalid credentials | Return clear error message, don't retry |
| API Errors | 500 from Master Tour | Retry once, then return error |
| Network Errors | Timeout, DNS failure | Retry with backoff, then error |
| Validation Errors | Missing tourId, no default | Return helpful message |
| Not Found | Invalid tourId | Return clear "not found" message |

### 8.2 Error Response Format

```typescript
// Tool execution errors (not protocol errors)
return {
  content: [{ 
    type: 'text', 
    text: '❌ Error: Could not retrieve schedule. Invalid tour ID.' 
  }],
  isError: true
};
```

### 8.3 Specific Error Handling

**HTTP 426 (Upgrade Required):**
- Cause: Missing `version=7` parameter
- Prevention: Always include in client

**HTTP 401 (Unauthorized):**
- Cause: Invalid OAuth signature
- Action: Log details, return auth error message

**HTTP 500 (Server Error):**
- Cause: Master Tour API issue
- Action: Retry once, then return graceful error

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
        ┌─────────────┐
        │ Integration │  ← Real API calls (few, slow)
        │    Tests    │
        └─────────────┘
       ┌───────────────┐
       │   Unit Tests  │  ← Mocked dependencies (many, fast)
       │               │
       └───────────────┘
```

### 9.2 Unit Tests

**What to test:**
- OAuth signature generation
- API client request building
- Response parsing
- Error handling logic
- Tool input validation
- Output formatting

**Mocking Strategy:**
- Mock HTTP layer (fetch/axios)
- Provide fixture responses from Master Tour API
- Test error conditions with mock failures

**Example:**
```typescript
// tests/unit/auth.test.ts
describe('OAuth Signing', () => {
  it('should generate valid signature for GET request', () => {
    const signed = signRequest('GET', 'https://my.eventric.com/api/v5/tours', {});
    expect(signed.headers.Authorization).toMatch(/^OAuth /);
    expect(signed.headers.Authorization).toContain('oauth_signature=');
  });
});
```

### 9.3 Integration Tests

**What to test:**
- Real authentication flow
- Actual API responses
- End-to-end tool execution

**Requirements:**
- Valid Master Tour API credentials
- Test tour with known data
- Run separately from unit tests (slower, requires network)

**Example:**
```typescript
// tests/integration/getTodaySchedule.integration.test.ts
describe('get_today_schedule (integration)', () => {
  it('should retrieve schedule from real API', async () => {
    const result = await getTodaySchedule({ tourId: process.env.TEST_TOUR_ID });
    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toContain('Schedule');
  });
});
```

### 9.4 Test Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      threshold: { lines: 80 }
    }
  }
});

// vitest.config.integration.ts
export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    testTimeout: 30000
  }
});
```

### 9.5 Test Commands

```bash
npm test              # Unit tests only
npm run test:int      # Integration tests only  
npm run test:all      # All tests
npm run test:coverage # Coverage report
```

---

## 10. Security Considerations

### 10.1 Credential Management

- **NEVER** hardcode API keys/secrets
- Store in environment variables
- Document required env vars clearly
- Use `.env.example` without real values

### 10.2 OAuth Security

- Generate unique nonce per request
- Use current timestamp
- Never log full Authorization header in production
- Validate signature algorithm is HMAC-SHA1

### 10.3 Input Validation

- Validate tourId format before API call
- Sanitize any user input
- Don't expose internal error details to users

### 10.4 Logging

- Log request metadata (method, endpoint, duration)
- Never log credentials or full auth headers
- Mask sensitive data in error logs

---

## 11. Implementation Plan

### Phase -1: Pre-Work Spike (Timezone Handling) ✅ COMPLETE
- [x] Call real API (authorized creds) to inspect datetime fields for timezone/storage semantics
- [x] Document findings and adjust parsing/formatting strategy
- [x] Update TECHNICAL_DOCUMENTATION.md accordingly

**Findings:** API provides `paulStartTime`/`paulEndTime` in local venue time and `dayTimeZone` (IANA format). Use local times directly for display - no conversion needed.

### Phase 0: Project Setup ✅ COMPLETE
- [x] Initialize npm project
- [x] Configure TypeScript
- [x] Set up Vitest
- [x] Configure ESLint/Prettier
- [x] Create project structure

### Phase 1: MVP - get_today_schedule ✅ COMPLETE
- [x] OAuth 1.0 signing module
- [x] API client with error handling
- [x] `get_today_schedule` tool implementation
- [x] Unit and integration tests

### Phase 2: CRUD Operations ✅ COMPLETE
- [x] `add_schedule_item` - POST to day schedule
- [x] `update_schedule_item` - PUT to modify items
- [x] `delete_schedule_item` - DELETE to remove items
- [x] `update_day_notes` - PUT for general/travel/hotel notes

### Phase 3: Reference Tools ✅ COMPLETE
- [x] `list_tours` - All accessible tours
- [x] `get_tour_hotels` - Hotel info by tour
- [x] `get_tour_crew` - Crew/personnel
- [x] `get_tour_events` - Venue/event details

### Phase 4: Venue Research Tools ✅ COMPLETE
- [x] `search_past_venues` - Search venues from historical tours
- [x] `get_venue_details` - Complete venue info (production, contacts, facilities, equipment, logistics)
- [x] `get_upcoming_shows` - Upcoming shows across all tours
- [x] API exploration documented (no global venue search, no event creation API)

### Test Coverage
- 15 test files
- 100 tests passing
- All tools have dedicated unit tests
- Integration tests for real API verification

---

## 12. Open Questions

> Questions requiring decision before/during implementation

| # | Question | Options | Decision | Date |
|---|----------|---------|----------|------|
| 1 | HTTP client library? | fetch (native) vs axios | **axios** | Jan 3, 2026 |
| 2 | Date handling library? | Native Date vs date-fns vs dayjs | **date-fns** | Jan 3, 2026 |
| 3 | Timezone handling? | Server timezone vs UTC vs configurable | **Use `paulStartTime` (local venue time) from API** | Jan 3, 2026 |
| 4 | Default tour ID behavior? | Required vs optional with env default | **Optional with env default + tool override** | Jan 3, 2026 |
| 5 | Test framework? | Vitest vs Jest | **Vitest** | Jan 3, 2026 |

---

## 13. Appendix

### A. Master Tour API Documentation
Full API docs: `https://my.eventric.com/portal/apidocs`

### B. MCP SDK References
- MCP Docs: https://modelcontextprotocol.io/
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk

### C. OAuth 1.0a Package
- npm: https://www.npmjs.com/package/oauth-1.0a

### D. Related Documents
- [PROJECT_STATUS_EXPANDED.md](./PROJECT_STATUS_EXPANDED.md)
- [TECHNICAL_DOCUMENTATION.md](./TECHNICAL_DOCUMENTATION.md)

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | Jan 3, 2026 | Initial draft | Engineering Team |
| 0.2 | Jan 3, 2026 | Timezone spike complete, Phase 0 complete, corrected base URL | Engineering Team |
| 0.3 | Jan 2026 | Phase 1-3 complete (9 tools, 73 tests) | Engineering Team |
| 1.0 | Jan 2026 | Phase 4 complete (12 tools, 100 tests) - venue research tools | Engineering Team |
