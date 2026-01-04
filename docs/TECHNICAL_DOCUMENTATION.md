# Mastertour MCP - Technical Documentation

> This is the living technical documentation for the Mastertour MCP server project.
> Updated as implementation progresses.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Reference](#api-reference)
4. [Authentication](#authentication)
5. [MCP Tools](#mcp-tools)
6. [Testing](#testing)
7. [Configuration](#configuration)
8. [Deployment](#deployment)

---

## Overview

### Purpose
An MCP (Model Context Protocol) server that enables AI assistants to interact with Master Tour, the industry-standard tour management software by Eventric.

### Target Users
- Tour managers using AI assistants (Claude, etc.)
- Production coordinators needing quick schedule access
- Anyone managing tours in Master Tour who wants AI integration

### Tech Stack
- **Runtime:** Node.js
- **Language:** TypeScript
- **MCP SDK:** @modelcontextprotocol/sdk
- **HTTP Client:** axios
- **Date Handling:** date-fns
- **Auth:** oauth-1.0a
- **Testing:** Vitest

---

## Architecture

### High-Level Components
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude/AI      │────▶│  MCP Server     │────▶│  Master Tour    │
│  Assistant      │◀────│  (This Project) │◀────│  REST API       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Project Structure
```
src/
├── index.ts              # MCP server entry, tool registration
├── config.ts             # Environment config, validation
├── api/
│   └── client.ts         # Master Tour HTTP client
├── auth/
│   └── oauth.ts          # OAuth 1.0 signing
├── tools/
│   ├── getTodaySchedule.ts
│   ├── addScheduleItem.ts
│   ├── updateScheduleItem.ts
│   ├── deleteScheduleItem.ts
│   ├── updateDayNotes.ts
│   ├── listTours.ts
│   ├── getTourHotels.ts
│   ├── getTourCrew.ts
│   ├── getTourEvents.ts
│   ├── searchPastVenues.ts
│   ├── getVenueDetails.ts
│   └── getUpcomingShows.ts
└── utils/
    ├── formatters.ts     # Shared output formatting
    └── tourIterator.ts   # Tour/day iteration utilities
```

### Dependency Injection Pattern
The server uses dependency injection for testability:

```typescript
// index.ts
export interface ServerDependencies {
  client: MasterTourClient;
  config: Config;
}

export function createServer(deps?: ServerDependencies): McpServer {
  const dependencies = deps ?? createDefaultDependencies();
  registerTools(server, dependencies);
  return server;
}
```

**Benefits:**
- Single client instance shared across all tools
- Config resolved once at startup (fail-fast validation)
- Easy to inject mock dependencies for testing

### Shared Utilities

**Tour Iterator (`utils/tourIterator.ts`)**
Async generator for iterating over tours and days, used by venue research tools:
```typescript
for await (const ctx of iterateTourDays(client, { onlyShowDays: true })) {
  // ctx contains tour, tourData, tourLabel, day
}
```

**Formatters (`utils/formatters.ts`)**
Consistent output formatting across tools:
- `formatDate()` - Human-readable dates
- `formatField()` - Label-value pairs with HTML entity decoding
- `formatContacts()` - Contact info with phone/fax icons
- `separator()` - Visual separators
- `normalizeForSearch()` - Fuzzy search normalization

### Structured Output Pattern

All tools return a `ToolResult<T>` containing both structured data and human-readable text:

```typescript
// src/types/outputs.ts
export interface ToolResult<T> {
  data: T;      // Structured data for programmatic access
  text: string; // Human-readable formatted text
}

// Example usage in tests:
const result = await getTodaySchedule(client, { tourId: 'tour-123' });
expect(result.data.dayId).toBe('day-abc');
expect(result.text).toContain('Los Angeles');
```

**Output Types (`src/types/outputs.ts`):**
- `DayScheduleOutput` - Schedule with items, timezone, location
- `ScheduleMutationOutput` - CRUD operation results
- `TourListOutput` - Tours grouped by organization
- `UpcomingShowsOutput` - Shows with venue/date info
- `VenueSearchOutput`, `VenueDetailsOutput` - Venue research results
- `TourCrewOutput`, `TourHotelsOutput`, `TourEventsOutput` - Reference data
- `DayNotesOutput` - Notes update results

### Timezone Handling (spike completed Jan 3, 2026)

The API uses **naive datetime strings** in `YYYY-MM-DD HH:MM:SS` format with timezone context provided separately.

**Key Discovery:** The API provides **dual time representations**:

| Field | Example | Meaning |
|-------|---------|--------|
| `startDatetime` | `"2026-02-06 20:00:00"` | **UTC time** |
| `paulStartTime` | `"2026-02-06 12:00:00"` | **Local time** (venue timezone) |
| `dayTimeZone` | `"America/Los_Angeles"` | IANA timezone identifier |

**Implementation approach:**
- Use `paulStartTime` / `paulEndTime` for display (already in local time)
- Use `dayTimeZone` for timezone context if needed
- No complex timezone conversion required for MVP
- `date-fns` sufficient for parsing; `date-fns-tz` not needed initially

---

## API Reference

### Master Tour API

**Base URL:** `https://my.eventric.com/portal/api/v5/` *(Note: `/portal/` prefix required)*

**Required Parameter:** `version=7` (prevents HTTP 426 errors)

**Response Format:**
```json
{
  "success": true|false,
  "message": "string",
  "data": { ... }
}
```

### Endpoints Used (MVP)

#### GET /tour/{tourId}/summary/{date}
Returns daily summary for a specific date.

**Parameters:**
- `tourId` (path) - Tour identifier
- `date` (path) - Date in YYYY-MM-DD format
- `version=7` (query) - Required API version

**Response:** Daily itinerary and summary data

*Full endpoint documentation to be added during implementation*

#### GET /tours (future utility)
Returns all tours accessible to the authenticated user. Useful for tour selection UX and validating default tour configuration.

---

## Authentication

### OAuth 1.0 Overview
Master Tour uses OAuth 1.0 signature authentication (not OAuth 2.0).

**Required Credentials:**
- API Key (consumer key)
- API Secret (consumer secret)

**Signing Process:**
1. Generate timestamp and nonce
2. Build signature base string (must include query params!)
3. Sign with HMAC-SHA1
4. Add signature to request headers

**Critical:** Query parameters must be included in the signature calculation via the `data` property:
```javascript
const requestData = { 
  url: baseUrl, 
  method: 'GET', 
  data: params  // params included here for signing!
};
const authHeader = oauth.toHeader(oauth.authorize(requestData));
await axios.get(baseUrl, { params, headers: { ...authHeader } });
```

---

## MCP Tools

### Discovery Tools

#### list_tours
List all tours accessible to the authenticated user with IDs and permission levels.

**Input:** None required

**Output:** Tours grouped by organization, showing edit vs read-only access.

#### get_tour_events
Get tour dates with venues, cities, and day types.

**Input:**
```typescript
{
  tourId?: string,   // Optional if default tour configured
  showsOnly?: boolean // Filter to show days only
}
```

### Schedule Tools

#### get_today_schedule
Retrieve today's itinerary and schedule summary.

**Input:**
```typescript
{
  tourId?: string,  // Optional if default tour configured
  date?: string     // YYYY-MM-DD, defaults to today
}
```

**Output:** Day's schedule with item IDs, times, and details.

#### add_schedule_item
Add a new item to a day's schedule.

**Input:**
```typescript
{
  dayId: string,      // Required day ID
  title: string,      // Item title
  startTime: string,  // HH:MM local venue time
  endTime?: string,   // HH:MM, defaults to startTime
  details?: string    // Optional notes
}
```

**Note:** Times are entered in local venue timezone and converted to UTC for API.

#### update_schedule_item
Modify an existing schedule item.

**Input:**
```typescript
{
  itemId: string,     // Required item ID
  dayId: string,      // Required day ID (for timezone)
  title?: string,
  startTime?: string, // HH:MM local venue time
  endTime?: string,
  details?: string
}
```

#### delete_schedule_item
Remove a schedule item.

**Input:**
```typescript
{
  itemId: string,  // Required item ID
  dayId: string    // Required day ID
}
```

#### update_day_notes
Update notes for a day.

**Input:**
```typescript
{
  dayId: string,
  generalNotes?: string,
  hotelNotes?: string,
  travelNotes?: string
}
```

### Reference Tools

#### get_tour_hotels
Get hotel information for tour days.

**Input:**
```typescript
{
  tourId?: string  // Optional if default tour configured
}
```

#### get_tour_crew
Get tour crew members with contact info, grouped by role.

**Input:**
```typescript
{
  tourId?: string  // Optional if default tour configured
}
```

### Venue Research Tools

#### search_past_venues
Search venues from your historical tours by name, city, or state.

**Input:**
```typescript
{
  query: string,     // Search query (e.g., "palladium", "los angeles")
  tourId?: string,   // Optional: limit to specific tour
  limit?: number     // Max results (default 10)
}
```

**Output:** Matching venues with IDs, capacities, and which tours used them.

**Note:** Since Master Tour API doesn't provide global venue search, this searches within venues you've used on past tours.

#### get_venue_details
Get complete venue information by venue ID.

**Input:**
```typescript
{
  venueId: string   // Venue ID from search_past_venues or other tools
}
```

**Output:** Complete venue data including:
- Location (address, coordinates, timezone)
- Contacts (main, box office, production, catering)
- Production (stage dimensions, load-in, power, rigging)
- Facilities (dressing rooms, showers, parking)
- Equipment (audio, lighting, video, backline)
- Local crew (union, minimums, penalties)
- Logistics (directions, airports, nearby hotels/restaurants)
- Promoter info (if assigned)

#### get_upcoming_shows
Get upcoming shows across all your tours, sorted by date.

**Input:**
```typescript
{
  tourId?: string,   // Optional: limit to specific tour
  limit?: number,    // Max shows (default 10)
  daysAhead?: number // Only shows within N days
}
```

**Output:** Upcoming show days with venue, city, tour name, and day IDs.

---

## Testing

### Strategy
- **Unit Tests:** Mock API responses, test business logic
- **Integration Tests:** Real Master Tour account, test actual API calls

### Test Coverage
- 17 test files
- 127 tests passing
- All tools have dedicated test suites
- Coverage: config module, formatters, DI patterns, structured outputs

### Running Tests
```bash
npm test           # Run all tests
npm run build      # Compile TypeScript
npm run lint       # Lint code
```

### CI/CD
GitHub Actions workflow (`.github/workflows/ci.yml`):
- Runs on PR and push to main
- Node.js matrix: 20.x, 22.x
- Runs lint and tests

---

## Configuration

### Environment Variables
```bash
MASTERTOUR_KEY=your-api-key
MASTERTOUR_SECRET=your-api-secret
MASTERTOUR_DEFAULT_TOUR_ID=optional-default-tour

# Integration test variables (not committed)
TEST_TOUR_ID=optional-tour-for-integration
```

### Claude Desktop Configuration
```json
{
  "mcpServers": {
    "mastertour": {
      "command": "node",
      "args": ["/path/to/build/index.js"],
      "env": {
        "MASTERTOUR_KEY": "your-api-key",
        "MASTERTOUR_SECRET": "your-api-secret"
      }
    }
  }
}
```

---

## Deployment

### Local Development
*To be added*

### Production
*To be added*

### MCP Registry Publishing
*To be added*

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| Jan 3, 2026 | Initial document creation | - |
| Jan 3, 2026 | Recorded stack choices (axios, date-fns, Vitest) and added tours endpoint note | - |
| Jan 3, 2026 | Timezone spike completed - documented dual time fields (UTC + local), corrected base URL | - |
| Jan 4, 2026 | Phase 2 complete - added schedule CRUD tools with timezone handling | - |
| Jan 4, 2026 | Phase 3 complete - added list_tours, get_tour_hotels, get_tour_crew, get_tour_events | - |
| Jan 4, 2026 | Phase 4 complete - added venue research tools (search_past_venues, get_venue_details, get_upcoming_shows) | - |
| Jan 4, 2026 | **Architecture refactor**: Singleton client with DI, config module, shared formatters, tour iterator utility | - |
| Jan 4, 2026 | **Structured outputs**: All tools now return `ToolResult<T>` with typed data + formatted text | - |
| Jan 4, 2026 | **CI/CD**: GitHub Actions workflow with Node 20.x/22.x matrix | - |
| Jan 4, 2026 | **Tests**: 127 tests passing across 17 files | - |
