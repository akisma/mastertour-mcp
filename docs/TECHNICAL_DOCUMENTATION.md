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

*To be completed after SOFTWARE_DESIGN_DOC.md is finalized*

### High-Level Components
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Claude/AI      │────▶│  MCP Server     │────▶│  Master Tour    │
│  Assistant      │◀────│  (This Project) │◀────│  REST API       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Component Details
*To be added as implementation progresses*

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

### MVP Tool: get_today_schedule

**Purpose:** Retrieve today's itinerary and schedule summary

**Input Schema:**
```typescript
{
  tourId?: string  // Optional if default tour configured
}
```

**Output:** Today's schedule including:
- Itinerary items
- Events
- Notes
- Travel information

*Full schema to be defined in SOFTWARE_DESIGN_DOC.md*

---

## Testing

### Strategy
- **Unit Tests:** Mock API responses, test business logic
- **Integration Tests:** Real Master Tour account, test actual API calls

### Test Structure
*To be defined*

### Running Tests
```bash
# TBD
npm test
```

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
