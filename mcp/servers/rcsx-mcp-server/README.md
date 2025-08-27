# rcsx-mcp-server

MCP (Model Context Protocol) server that enables AI agents to send RCS messages through the RCSX emulator.

## 🚀 Quick Start

### For Claude Desktop Users

Add to your `~/.config/claude-desktop/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "rcsx": {
      "command": "npx",
      "args": ["rcsx-mcp-server"],
      "env": {
        "RCSX_SERVER_URL": "https://rcsx.specialized.live",
        "RCSX_API_KEY": "your_api_key_from_rcsx_dashboard"
      }
    }
  }
}
```

### For Local Development

```json
{
  "mcpServers": {
    "rcsx": {
      "command": "npx",
      "args": ["rcsx-mcp-server"],
      "env": {
        "RCSX_SERVER_URL": "http://localhost:3000",
        "RCSX_API_KEY": "rcs_your_local_api_key"
      }
    }
  }
}
```

## 🔑 Getting Your API Key

1. Visit [RCSX Dashboard](https://rcsx.specialized.live) or your local instance
2. Login with demo credentials: `user` / `user`
3. Copy the API key from the left panel

## 🛠️ Available Tools

### `rcs_send_message`
Send RCS messages with rich cards, buttons, and media.

**Example:**
```javascript
{
  "rcsMessage": {
    "messageId": "msg_001",
    "conversationId": "conv_customer_123",
    "participantId": "+1234567890",
    "messages": [
      {
        "richCard": {
          "standaloneCard": {
            "cardContent": {
              "title": "Welcome! 👋",
              "description": "How can I help you today?",
              "suggestions": [
                {"action": {"text": "Get Started", "postbackData": "get_started"}},
                {"action": {"text": "Learn More", "postbackData": "learn_more"}}
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
Retrieve user interactions and button clicks from the RCS emulator.

## 📱 Supported Message Types

- **Text Messages** with suggested actions
- **Rich Cards** with images, titles, descriptions, and buttons
- **Multi-Message Arrays** for conversation flows
- **GSMA UP Compliant** message formats

## 🔧 Environment Variables

- `RCSX_SERVER_URL`: URL of your RCSX emulator instance (required)
- `RCSX_API_KEY`: API key from RCSX dashboard (required)

## 📖 Usage in AI Agents

Once configured, your AI agent can:

1. **Generate RCS Messages**: Create rich, interactive messages
2. **Send to Users**: Messages appear in RCSX emulator interface
3. **Handle Responses**: Receive user button clicks and interactions
4. **Manage Conversations**: Track conversation flows with IDs

## 🌐 RCSX Emulator

This MCP server connects to the [RCSX RCS Emulator](https://github.com/Dr-Agentic/rcs-emulator), a professional RCS business messaging development platform that emulates iPhone 16 Pro Max messaging experience.

## 📄 License

MIT - See the main [RCSX repository](https://github.com/Dr-Agentic/rcs-emulator) for details.
