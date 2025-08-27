#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { RCSXMCPServer } from '../servers/rcsx-mcp-server/server.js';

// HTTP wrapper for RCSX MCP Server - enables remote agent access
class RCSXMCPService {
  constructor() {
    this.app = express();
    this.mcpServer = new RCSXMCPServer();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'rcsx-mcp-service',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: {
          rcsxUrl: process.env.RCSX_SERVER_URL || 'http://localhost:3000',
          hasApiKey: !!process.env.RCSX_API_KEY
        }
      });
    });

    // List available tools
    this.app.get('/tools', async (req, res) => {
      try {
        const tools = await this.mcpServer.listTools();
        res.json({
          success: true,
          tools: tools.tools
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Call MCP tool via HTTP
    this.app.post('/tools/:toolName', async (req, res) => {
      const { toolName } = req.params;
      const args = req.body;

      try {
        console.log(`Calling tool: ${toolName}`, JSON.stringify(args, null, 2));
        
        const result = await this.mcpServer.callTool(toolName, args);
        
        res.json({
          success: true,
          result: result
        });
      } catch (error) {
        console.error(`Tool call error: ${error.message}`);
        res.status(400).json({
          success: false,
          error: error.message,
          tool: toolName
        });
      }
    });

    // Convenience endpoints for specific tools
    this.app.post('/rcs/send', async (req, res) => {
      try {
        const result = await this.mcpServer.callTool('rcs_send_message', req.body);
        res.json(result);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    this.app.get('/rcs/notifications', async (req, res) => {
      try {
        const result = await this.mcpServer.callTool('rcs_get_notifications', req.query);
        res.json(result);
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error.message
        });
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
          'GET /health',
          'GET /tools', 
          'POST /tools/:toolName',
          'POST /rcs/send',
          'GET /rcs/notifications'
        ]
      });
    });
  }

  start(port = 3001) {
    this.app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 RCSX MCP Service running on port ${port}`);
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`🛠️  Tools endpoint: http://localhost:${port}/tools`);
      console.log(`📱 RCS send: POST http://localhost:${port}/rcs/send`);
      console.log(`📬 Notifications: GET http://localhost:${port}/rcs/notifications`);
      
      // Environment check
      if (!process.env.RCSX_API_KEY) {
        console.warn('⚠️  RCSX_API_KEY not set - tool calls will fail');
      }
      
      console.log(`🎯 Target RCSX: ${process.env.RCSX_SERVER_URL || 'http://localhost:3000'}`);
    });
  }
}

// Enhanced MCP Server with HTTP callable methods
class EnhancedRCSXMCPServer extends RCSXMCPServer {
  async listTools() {
    return {
      tools: [
        {
          name: "rcs_send_message",
          description: "Send RCS message through RCSX emulator API",
          parameters: ["rcsMessage"]
        },
        {
          name: "rcs_get_notifications", 
          description: "Get RBM server notifications",
          parameters: ["conversationId", "since", "limit"]
        }
      ]
    };
  }

  async callTool(toolName, args) {
    switch (toolName) {
      case 'rcs_send_message':
        return await this.handleSendMessage(args);
      case 'rcs_get_notifications':
        return await this.handleGetNotifications(args);
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}

// Start the service
const port = process.env.PORT || 3001;
const service = new RCSXMCPService();
service.start(port);
