# mastertour-mcp

An MCP server enabling AI assistants to interact with Master Tour, the industry-standard tour management software by Eventric.

## Tools

| Tool | Description |
|------|-------------|
| `list_tours` | List all tours you have access to with IDs and permission levels |
| `get_today_schedule` | Get daily schedule with itinerary, events, and times |
| `add_schedule_item` | Add new items to a day's schedule |
| `update_schedule_item` | Update existing schedule items |
| `delete_schedule_item` | Delete schedule items |
| `update_day_notes` | Update day notes (general, hotel, travel) |

## Setup

1. Get API credentials from Master Tour
2. Create `.env` file:
   ```
   MASTERTOUR_KEY=your_consumer_key
   MASTERTOUR_SECRET=your_consumer_secret
   MASTERTOUR_DEFAULT_TOUR_ID=optional_default_tour_id
   ```
3. Build: `npm run build`

## Claude Desktop Configuration

Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "mastertour": {
      "command": "node",
      "args": ["/path/to/mastertour-mcp/dist/index.js"],
      "env": {
        "MASTERTOUR_KEY": "your_key",
        "MASTERTOUR_SECRET": "your_secret"
      }
    }
  }
}
```

## Development

- `npm run build` - Compile TypeScript
- `npm test` - Run tests (57 passing)
- `npm run lint` - Lint code
