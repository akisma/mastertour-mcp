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

### Timezone Handling (pending spike)
- Master Tour docs do not state timezone semantics; example datetimes are naive (no TZ).
- Plan: run a pre-work spike against real API data to confirm storage/returned timezone behavior.
- Until confirmed, treat returned datetimes as tour-local display strings; avoid conversions.

---

## API Reference

### Master Tour API

**Base URL:** `https://my.eventric.com/api/v5/`

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
2. Build signature base string
3. Sign with HMAC-SHA1
4. Add signature to request headers

*Implementation details to be added*

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
