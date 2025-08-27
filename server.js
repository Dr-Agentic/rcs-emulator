// Simple Node.js server for RCS Emulator SaaS API
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const MessageFormatHandler = require('./MessageFormatHandler.js');
const RBMCallbackHandler = require('./rbm/callbackHandler.js');

class RCSServer {
    constructor(port = process.env.PORT || 3000) {
        this.port = port;
        this.host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
        this.validApiKey = 'rcs_demo_key_12345'; // In production, this would be stored securely
        this.messageQueue = [];
        this.sseClients = []; // Store SSE connections
        
        // Initialize RBM callback handler
        this.rbmHandler = new RBMCallbackHandler();
        
        this.setupServer();
    }

    setupServer() {
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
    }

    async handleRequest(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method;

        // Add query parameters to request object for RBM handlers
        req.query = parsedUrl.query;

        // Enable CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        // Handle preflight requests
        if (method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        try {
            // API Routes
            if (pathname.startsWith('/api/')) {
                await this.handleApiRequest(req, res, pathname, method);
            } else {
                // Serve static files
                await this.serveStaticFile(req, res, pathname);
            }
        } catch (error) {
            console.error('Server error:', error);
            this.sendJsonResponse(res, 500, { error: 'Internal server error' });
        }
    }

    async handleApiRequest(req, res, pathname, method) {
        if (pathname === '/api/rcs/send' && method === 'POST') {
            await this.handleSendMessage(req, res);
        } else if (pathname === '/api/rcs/messages' && method === 'GET') {
            await this.handleGetMessages(req, res);
        } else if (pathname === '/api/auth/validate' && method === 'POST') {
            await this.handleValidateAuth(req, res);
        } else if (pathname === '/api/events' && method === 'GET') {
            await this.handleSSE(req, res);
        } else if (pathname === '/api/rbm/callback' && method === 'POST') {
            await this.handleRBMCallback(req, res);
        } else if (pathname === '/api/rbm/callback' && method === 'GET') {
            await this.handleRBMValidation(req, res);
        } else if (pathname === '/api/rbm/status' && method === 'GET') {
            await this.handleRBMStatus(req, res);
        } else {
            this.sendJsonResponse(res, 404, { error: 'API endpoint not found' });
        }
    }

    async handleSendMessage(req, res) {
        try {
            // Get request body
            const body = await this.getRequestBody(req);
            const messageData = JSON.parse(body);

            // Validate API key
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return this.sendJsonResponse(res, 401, { error: 'Missing or invalid authorization header' });
            }

            const apiKey = authHeader.substring(7);
            if (!this.validateApiKey(apiKey)) {
                return this.sendJsonResponse(res, 401, { error: 'Invalid API key' });
            }

            // Validate message data
            const validationError = this.validateMessageData(messageData);
            if (validationError) {
                return this.sendJsonResponse(res, 400, { error: validationError });
            }

            // Process message with proper separation
            const messageId = Date.now().toString();
            const serverEnvelope = {
                id: messageId,
                timestamp: new Date().toISOString(),
                status: 'sent',
                content: messageData  // Keep RCS message pure
            };

            // Store envelope in queue
            this.messageQueue.push(serverEnvelope);

            // Send success response
            this.sendJsonResponse(res, 200, {
                success: true,
                messageId: messageId,
                timestamp: serverEnvelope.timestamp,
                message: 'RCS message sent successfully'
            });

            console.log(`RCS message sent: ${messageId}`, messageData);
            console.log('Server envelope:', serverEnvelope);

            // Broadcast to all connected SSE clients
            this.broadcastToClients(serverEnvelope);

        } catch (error) {
            console.error('Error sending message:', error);
            this.sendJsonResponse(res, 400, { error: 'Invalid JSON or request format' });
        }
    }

    async handleSSE(req, res) {
        // Set up Server-Sent Events
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        // Add client to the list
        const clientId = Date.now();
        const client = { id: clientId, res };
        this.sseClients.push(client);

        console.log(`SSE client connected: ${clientId}`);

        // Send initial connection message
        res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

        // Handle client disconnect
        req.on('close', () => {
            console.log(`SSE client disconnected: ${clientId}`);
            this.sseClients = this.sseClients.filter(c => c.id !== clientId);
        });
    }

    broadcastToClients(message) {
        const data = JSON.stringify({ type: 'newMessage', message });
        this.sseClients.forEach(client => {
            try {
                client.res.write(`data: ${data}\n\n`);
            } catch (error) {
                console.error('Error broadcasting to client:', error);
                // Remove disconnected client
                this.sseClients = this.sseClients.filter(c => c.id !== client.id);
            }
        });
        console.log(`Broadcasted message to ${this.sseClients.length} clients`);
    }

    async handleGetMessages(req, res) {
        // Return recent messages (for debugging/monitoring)
        const recentMessages = this.messageQueue.slice(-10);
        this.sendJsonResponse(res, 200, {
            messages: recentMessages,
            total: this.messageQueue.length
        });
    }

    async handleValidateAuth(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { username, password } = JSON.parse(body);

            // Simple authentication (in production, use proper authentication)
            if (username === 'user' && password === 'user') {
                const apiKey = this.generateApiKey();
                this.sendJsonResponse(res, 200, {
                    success: true,
                    apiKey: apiKey,
                    user: { username, id: 'user_001' }
                });
            } else {
                this.sendJsonResponse(res, 401, { error: 'Invalid credentials' });
            }
        } catch (error) {
            this.sendJsonResponse(res, 400, { error: 'Invalid request format' });
        }
    }

    validateApiKey(apiKey) {
        // In production, validate against database
        return apiKey.startsWith('rcs_') && apiKey.length > 10;
    }

    validateMessageData(data) {
        // Use universal message format handler
        return MessageFormatHandler.validateMessageData(data);
    }

    generateApiKey() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'rcs_';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // RBM Callback Handlers
    async handleRBMCallback(req, res) {
        console.log('📥 RBM Callback request received');
        
        try {
            // Get request body
            const body = await this.getRequestBody(req);
            req.body = JSON.parse(body);
            
            // Delegate to RBM handler
            await this.rbmHandler.handleCallback(req, res);
            
        } catch (error) {
            console.error('❌ Error in RBM callback:', error);
            this.sendJsonResponse(res, 500, {
                success: false,
                error: 'Failed to process RBM callback',
                message: error.message
            });
        }
    }

    async handleRBMValidation(req, res) {
        console.log('🔐 RBM Validation request received');
        await this.rbmHandler.handleValidation(req, res);
    }

    async handleRBMStatus(req, res) {
        console.log('📊 RBM Status request received');
        await this.rbmHandler.handleStatus(req, res);
    }

    async serveStaticFile(req, res, pathname) {
        // Default to index.html for root path
        if (pathname === '/') {
            pathname = '/login.html';
        }

        const filePath = path.join(__dirname, pathname);
        const ext = path.extname(filePath).toLowerCase();

        // Security check - prevent directory traversal
        if (!filePath.startsWith(__dirname)) {
            return this.sendResponse(res, 403, 'Forbidden');
        }

        try {
            const data = fs.readFileSync(filePath);
            const contentType = this.getContentType(ext);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        } catch (error) {
            if (error.code === 'ENOENT') {
                this.sendResponse(res, 404, 'File not found');
            } else {
                this.sendResponse(res, 500, 'Server error');
            }
        }
    }

    getContentType(ext) {
        const types = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon'
        };
        return types[ext] || 'text/plain';
    }

    async getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
            req.on('error', reject);
        });
    }

    sendJsonResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    sendResponse(res, statusCode, message) {
        res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
        res.end(message);
    }

    start() {
        this.server.listen(this.port, this.host, () => {
            console.log(`🚀 RCS Emulator SaaS Server running on http://${this.host}:${this.port}`);
            console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📱 Access the emulator at: http://${this.host}:${this.port}`);
            console.log(`📚 API Documentation: http://${this.host}:${this.port}/dashboard.html#api-docs`);
            console.log(`🔑 Demo credentials: user/user`);
            console.log(`📡 RBM Callback endpoint: http://${this.host}:${this.port}/api/rbm/callback`);
            console.log(`📊 RBM Status endpoint: http://${this.host}:${this.port}/api/rbm/status`);
        });
        
        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM received, shutting down gracefully');
            this.server.close(() => {
                console.log('Process terminated');
            });
        });
    }

    stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

// Start server if this file is run directly
if (require.main === module) {
    const port = process.env.PORT || 3000;
    const server = new RCSServer(port);
    server.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down server...');
        server.stop();
        process.exit(0);
    });
}

module.exports = RCSServer;
