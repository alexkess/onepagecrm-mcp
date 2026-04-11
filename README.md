# OnePage CRM MCP Server

An open-source [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for the [OnePage CRM](https://www.onepagecrm.com/) API. Manage contacts, deals, actions, notes, and pipelines — all from your AI assistant.

Created by [Kess Media](https://kess.media)

## Features

14 tools covering the core OnePage CRM workflow:

| Tool | Description |
|---|---|
| `crm_list_actions` | Pull the action stream — due today, overdue, or all. Filter by done/not done |
| `crm_get_contact` | Get full contact detail by ID |
| `crm_list_contacts` | Search/list contacts with pagination and filtering |
| `crm_create_contact` | Create a new contact with name, company, emails, status, tags |
| `crm_update_contact` | Update contact fields |
| `crm_create_action` | Set next action on a contact with text and date |
| `crm_update_action` | Update/push action date, mark done, reassign |
| `crm_complete_action` | Mark an action as done |
| `crm_create_note` | Log a note on a contact (call logs, meeting notes) |
| `crm_list_notes` | Get notes for a contact |
| `crm_list_deals` | List deals with pipeline filtering |
| `crm_get_deal` | Get deal detail |
| `crm_update_deal` | Update deal stage, amount, status |
| `crm_list_pipelines` | List pipeline stages |

## Setup

### Prerequisites

- Node.js 18+
- OnePage CRM account with API access
- Your OnePage CRM **User ID** and **API Key** (found in OnePage CRM → Settings → API)

### Install & Build

```bash
git clone https://github.com/alexkess/onepagecrm-mcp.git
cd onepagecrm-mcp
npm install
npm run build
```

### Test Locally

```bash
ONEPAGECRM_USER_ID=your_user_id \
ONEPAGECRM_API_KEY="your_api_key" \
node dist/index.js
```

## Claude Code (CLI)

Add to your Claude Code MCP config (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "onepage-crm": {
      "command": "node",
      "args": ["/path/to/onepagecrm-mcp/dist/index.js"],
      "env": {
        "ONEPAGECRM_USER_ID": "your_user_id",
        "ONEPAGECRM_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Claude Desktop

Add to your Claude Desktop config:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "onepage-crm": {
      "command": "node",
      "args": ["/path/to/onepagecrm-mcp/dist/index.js"],
      "env": {
        "ONEPAGECRM_USER_ID": "your_user_id",
        "ONEPAGECRM_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Cloudflare Worker (Remote)

Deploy as a Cloudflare Worker for remote MCP access:

```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy

# Set secrets
echo "your_user_id" | npx wrangler secret put ONEPAGECRM_USER_ID
echo "your_api_key" | npx wrangler secret put ONEPAGECRM_API_KEY
```

Then configure your MCP client to use the remote URL:

```json
{
  "mcpServers": {
    "onepage-crm": {
      "type": "url",
      "url": "https://onepage-crm-mcp.your-subdomain.workers.dev/mcp"
    }
  }
}
```

## API Authentication

OnePage CRM uses HTTP Basic authentication. The server encodes your credentials as:

```
Authorization: Basic base64(user_id:api_key)
```

Credentials are passed via environment variables only — never stored in source code.

## API Response Format

OnePage CRM returns data in the format:

```json
{
  "status": 0,
  "message": "OK",
  "data": { ... }
}
```

## Development

```bash
npm run dev     # Watch mode — recompiles on changes
npm run build   # One-time build
npm start       # Run the server
```

## License

MIT — see [LICENSE](LICENSE)
