# RCSX MCP Server

MCP (Model Context Protocol) server that enables AI agents to send RCS messages through the RCSX emulator API.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mcp/servers/rcsx-mcp-server
npm install
```

### 2. Configure Your Agent

#### For Claude Desktop:
Add to `~/.config/claude-desktop/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "rcsx": {
      "command": "node",
      "args": ["/Users/Morsy/Documents/dev/rcs/mcp/servers/rcsx-mcp-server/server.js"],
      "env": {
        "RCSX_SERVER_URL": "https://rcsx.specialized.live",
        "RCSX_API_KEY": "your_api_key_from_rcsx_dashboard"
      }
    }
  }
}
```

#### For Local Development:
```json
{
  "mcpServers": {
    "rcsx": {
      "command": "node", 
      "args": ["/Users/Morsy/Documents/dev/rcs/mcp/servers/rcsx-mcp-server/server.js"],
      "env": {
        "RCSX_SERVER_URL": "http://localhost:3000",
        "RCSX_API_KEY": "rcs_qirKDSqNZurdYhDXszdjI8XYxVFXqLLE"
      }
    }
  }
}
```

### 3. Get Your API Key
1. Open RCSX dashboard (localhost:3000 or rcsx.specialized.live)
2. Login with demo credentials (user/user)
3. Copy API key from left panel

## 🛠️ Available Tools

### `rcs_send_message`
Send RCS messages through RCSX emulator.

**Parameters:**
- `rcsMessage`: Complete RCS message in GSMA UP format

**Example Usage:**
```javascript
// Rich card with headers
{
  "rcsMessage": {
    "messageId": "msg_agent_001",
    "conversationId": "conv_customer_123",
    "participantId": "+1234567890",
    "messages": [
      {
        "richCard": {
          "standaloneCard": {
            "cardContent": {
              "title": "Coffee Menu ☕",
              "description": "Choose your drink:",
              "suggestions": [
                {"action": {"text": "Cappuccino", "postbackData": "order_cappuccino"}},
                {"action": {"text": "Latte", "postbackData": "order_latte"}}
              ]
            }
          }
        }
      }
    ]
  }
}
```

### `rcs_get_notifications`
Retrieve RBM server notifications for user interactions.

**Parameters:**
- `conversationId` (optional): Filter by conversation
- `since` (optional): ISO timestamp to get notifications since
- `limit` (optional): Max notifications to return (default: 50)

## 📋 Supported RCS Formats

The MCP server accepts all RCSX-supported formats:

1. **With Headers**: messageId, conversationId, participantId, timestamp, etc.
2. **Without Headers**: Auto-generated IDs
3. **Single Message**: Direct message object
4. **Message Array**: GSMA UP compliant array format

## 🔧 Environment Variables

- `RCSX_SERVER_URL`: RCSX server URL (required)
- `RCSX_API_KEY`: API key from RCSX dashboard (required)

## 🧪 Testing

Test the MCP server directly:
```bash
cd mcp/servers/rcsx-mcp-server
RCSX_SERVER_URL=http://localhost:3000 RCSX_API_KEY=your_key node server.js
```

## 🤝 Agent Integration

Your AI agent can now:
1. Generate conversation IDs and message IDs
2. Create rich RCS messages with buttons and cards
3. Send messages through RCSX emulator
4. Receive user interaction notifications
5. Handle multi-message conversations

The agent has full control over message format and conversation management!
