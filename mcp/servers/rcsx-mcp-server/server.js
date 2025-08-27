#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// RCSX MCP Server - Enables AI agents to send RCS messages via RCSX API
class RCSXMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "rcsx-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "rcs_send_message",
            description: "Send RCS message through RCSX emulator API. Accepts full RCS message JSON with optional headers (messageId, conversationId, participantId) and supports single message or message array formats.",
            inputSchema: {
              type: "object",
              properties: {
                rcsMessage: {
                  type: "object",
                  description: "Complete RCS message in GSMA UP compliant format. Can include headers (messageId, conversationId, participantId) and supports both single message and message array formats.",
                  properties: {
                    messageId: {
                      type: "string",
                      description: "Optional unique message identifier"
                    },
                    conversationId: {
                      type: "string", 
                      description: "Optional conversation identifier"
                    },
                    participantId: {
                      type: "string",
                      description: "Optional participant phone number or ID"
                    },
                    messages: {
                      type: "array",
                      description: "Array of RCS messages (GSMA UP format)"
                    },
                    type: {
                      type: "string",
                      description: "Message type for single message format (text, richCard, etc.)"
                    },
                    text: {
                      type: "string",
                      description: "Text content for single text messages"
                    }
                  }
                }
              },
              required: ["rcsMessage"]
            }
          },
          {
            name: "rcs_get_notifications",
            description: "Retrieve RBM server notifications for user interactions (button clicks, messages, etc.) from RCSX emulator.",
            inputSchema: {
              type: "object",
              properties: {
                conversationId: {
                  type: "string",
                  description: "Optional conversation ID to filter notifications"
                },
                since: {
                  type: "string",
                  description: "Optional ISO timestamp to get notifications since specific time"
                },
                limit: {
                  type: "number",
                  description: "Optional limit on number of notifications to return (default: 50)"
                }
              }
            }
          }
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "rcs_send_message":
            return await this.handleSendMessage(args);
          case "rcs_get_notifications":
            return await this.handleGetNotifications(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleSendMessage(args) {
    const { rcsMessage } = args;

    if (!rcsMessage) {
      throw new Error("rcsMessage parameter is required");
    }

    // Get configuration from environment
    const serverUrl = process.env.RCSX_SERVER_URL || "http://localhost:3000";
    const apiKey = process.env.RCSX_API_KEY;

    if (!apiKey) {
      throw new Error("RCSX_API_KEY environment variable is required");
    }

    try {
      // Send RCS message directly to RCSX API
      const response = await fetch(`${serverUrl}/api/rcs/send`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rcsMessage),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`RCSX API error (${response.status}): ${errorData.error || response.statusText}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `✅ RCS message sent successfully!\n\nMessage ID: ${result.messageId}\nTimestamp: ${result.timestamp}\nStatus: ${result.message}\n\nServer: ${serverUrl}`,
          },
        ],
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to RCSX server at ${serverUrl}. Make sure the server is running.`);
      }
      throw error;
    }
  }

  async handleGetNotifications(args) {
    const { conversationId, since, limit = 50 } = args;

    // Get configuration from environment
    const serverUrl = process.env.RCSX_SERVER_URL || "http://localhost:3000";
    const apiKey = process.env.RCSX_API_KEY;

    if (!apiKey) {
      throw new Error("RCSX_API_KEY environment variable is required");
    }

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (conversationId) params.append('conversationId', conversationId);
      if (since) params.append('since', since);
      if (limit) params.append('limit', limit.toString());

      const url = `${serverUrl}/api/rbm/notifications${params.toString() ? '?' + params.toString() : ''}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`RCSX API error (${response.status}): ${errorData.error || response.statusText}`);
      }

      const notifications = await response.json();

      return {
        content: [
          {
            type: "text",
            text: `📬 Retrieved ${notifications.length} notifications:\n\n${JSON.stringify(notifications, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to RCSX server at ${serverUrl}. Make sure the server is running.`);
      }
      throw error;
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error("[MCP Error]", error);
    };

    process.on("SIGINT", async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("RCSX MCP server running on stdio");
  }
}

// Start the server
const server = new RCSXMCPServer();
server.run().catch(console.error);
