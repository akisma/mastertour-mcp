# TODO: Complete API Coverage

> **Branch:** `feature/complete-api`
> **Created:** January 2026
> **Goal:** Implement remaining Master Tour API endpoints as MCP tools

---

## Current State

The MCP server currently implements **12 tools** covering the core tour management, scheduling, and venue research workflows. This document outlines the remaining API endpoints that should be implemented to achieve full API coverage.

---

## API Coverage Summary

### Implemented (12 tools)

| Endpoint | MCP Tool | Status |
|----------|----------|--------|
| `GET /tours` | `list_tours` | ✅ |
| `GET /tour/{id}` | `get_tour_events` | ✅ |
| `GET /tour/{id}/crew` | `get_tour_crew` | ✅ |
| `GET /tour/{id}/summary/{date}` | `get_today_schedule` | ✅ |
| `PUT /day/{id}` | `update_day_notes` | ✅ |
| `POST /itinerary` | `add_schedule_item` | ✅ |
| `PUT /itinerary/{id}` | `update_schedule_item` | ✅ |
| `DELETE /itinerary/{id}` | `delete_schedule_item` | ✅ |
| `GET /day/{id}/events` | `get_venue_details` (via events) | ✅ |
| `GET /day/{id}/hotels` | `get_tour_hotels` | ✅ |
| (cross-tour search) | `search_past_venues` | ✅ |
| (cross-tour search) | `get_upcoming_shows` | ✅ |

### Not Yet Implemented

| Endpoint | Proposed Tool | Priority | Description |
|----------|---------------|----------|-------------|
| `GET /event/{id}/guestlist` | `get_event_guestlist` | **P1** | Retrieve guest list requests for an event |
| `POST /guestlist` | `add_guest_request` | **P1** | Add a new guest list request |
| `PUT /guestlist/{id}` | `update_guest_request` | **P1** | Update an existing guest list request |
| `GET /event/{id}/setlist` | `get_event_setlist` | **P2** | Retrieve performance setlist for an event |
| `GET /hotel/{id}/roomlist` | `get_hotel_roomlist` | **P2** | Get room assignments for a hotel |
| `GET /hotel/{id}/contacts` | `get_hotel_contacts` | **P3** | Get detailed hotel contact info |
| `GET /company/{id}/contacts` | `get_company_contacts` | **P3** | Get contacts for a company/promoter |
| `GET /push/history` | `get_push_notifications` | **P4** | Access push notification history |

---

## Implementation Plan

### Phase 5: Guest List Management (P1)

Guest lists are critical for tour managers. Implement full CRUD:

1. **`get_event_guestlist`**
   - Input: `eventId: string`
   - Output: List of guest requests with names, ticket counts, status
   - Endpoint: `GET /api/v5/event/{eventId}/guestlist`

2. **`add_guest_request`**
   - Input: `eventId: string`, `name: string`, `tickets: number`, `notes?: string`
   - Output: Created guest request with ID
   - Endpoint: `POST /api/v5/guestlist`

3. **`update_guest_request`**
   - Input: `guestListId: string`, fields to update
   - Output: Updated guest request
   - Endpoint: `PUT /api/v5/guestlist/{guestListId}`

### Phase 6: Set Lists & Room Lists (P2)

1. **`get_event_setlist`**
   - Input: `eventId: string`
   - Output: Ordered list of songs/performances
   - Endpoint: `GET /api/v5/event/{eventId}/setlist`

2. **`get_hotel_roomlist`**
   - Input: `hotelId: string`
   - Output: Room assignments with crew member names
   - Endpoint: `GET /api/v5/hotel/{hotelId}/roomlist`

### Phase 7: Contacts (P3)

1. **`get_hotel_contacts`**
   - Input: `hotelId: string`
   - Output: Hotel staff contacts (front desk, manager, etc.)
   - Endpoint: `GET /api/v5/hotel/{hotelId}/contacts`

2. **`get_company_contacts`**
   - Input: `companyId: string`
   - Output: Company/promoter contacts
   - Endpoint: `GET /api/v5/company/{companyId}/contacts`

### Phase 8: Notifications (P4)

1. **`get_push_notifications`**
   - Input: `limit?: number`, `since?: string`
   - Output: Push notification history
   - Endpoint: `GET /api/v5/push/history`

---

## Implementation Guidelines

Follow the existing patterns in this codebase:

1. **File structure:** Create `src/tools/{toolName}.ts` for each tool
2. **Types:** Add output types to `src/types/outputs.ts`
3. **Tests:** Create `tests/unit/{toolName}.test.ts` with mock client
4. **Structured outputs:** Return `ToolResult<T>` with `data` and `text` fields
5. **Formatters:** Use shared utilities in `src/utils/formatters.ts`
6. **DI pattern:** Accept `client: MasterTourClient` as first parameter

### Example Implementation Pattern

```typescript
// src/tools/getEventGuestlist.ts
import { MasterTourClient } from '../api/client.js';
import { ToolResult, GuestListOutput } from '../types/outputs.js';

export async function getEventGuestlist(
  client: MasterTourClient,
  params: { eventId: string }
): Promise<ToolResult<GuestListOutput>> {
  const response = await client.get(`/event/${params.eventId}/guestlist`);

  // Transform and format response
  const data: GuestListOutput = { /* ... */ };
  const text = formatGuestList(data);

  return { data, text };
}
```

---

## API Reference

Full API documentation: `https://my.eventric.com/portal/apidocs`

### Authentication
All endpoints require OAuth 1.0 signing (already implemented in `src/auth/oauth.ts`).

### Required Query Parameter
All requests must include `version=7` (already handled by `MasterTourClient`).

### Response Format
```json
{
  "success": true,
  "message": "",
  "data": { /* endpoint-specific data */ }
}
```

---

## Known API Limitations

These operations are **not available via API** and require the desktop application:

- Creating new tours
- Creating new days/events
- Creating or updating venues
- Global venue search (workaround: search within user's past tours)
- Deleting tours, days, or events

---

## Testing

Run existing tests to ensure no regressions:
```bash
npm test
```

Current coverage: 146 tests across 20 files.
