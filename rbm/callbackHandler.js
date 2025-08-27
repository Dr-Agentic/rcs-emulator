// RBM Callback Handler - Main endpoint for receiving RCS events
const GSMAValidator = require('./gsmaValidator');
const EventProcessor = require('./eventProcessor');

class RBMCallbackHandler {
    constructor() {
        this.validator = new GSMAValidator();
        this.eventProcessor = new EventProcessor();
        this.eventCount = 0;
        this.startTime = new Date();
        
        console.log('🚀 RBM Callback Handler initialized');
        console.log('📡 Ready to receive RCS events at /api/rbm/callback');
    }

    // Main callback handler for POST /api/rbm/callback
    async handleCallback(req, res) {
        const startTime = Date.now();
        
        try {
            // Extract event from request body
            const event = req.body;
            if (!event) {
                return this._sendError(res, 400, 'Missing request body');
            }

            // Validate GSMA UP compliance
            const validationResult = this.validator.validate(event);
            if (!validationResult.isValid) {
                console.error('\n❌ GSMA VALIDATION FAILED:');
                validationResult.errors.forEach(error => {
                    console.error(`   • ${error}`);
                });
                console.log('');
                
                return this._sendError(res, 400, 'Invalid GSMA UP event format', {
                    errors: validationResult.errors
                });
            }

            // Process the event (this will handle all console logging)
            const processingResult = await this.eventProcessor.processEvent(event);

            // Update statistics
            this.eventCount++;
            const processingTime = Date.now() - startTime;

            // Send success response using Node.js HTTP methods
            this._sendJsonResponse(res, 200, {
                success: true,
                eventId: event.eventId,
                eventType: event.eventType,
                processed: true,
                processingTime: processingTime
            });

        } catch (error) {
            console.error('\n💥 RBM CALLBACK ERROR:');
            console.error(`   Error: ${error.message}`);
            console.log('');
            
            const processingTime = Date.now() - startTime;
            this._sendJsonResponse(res, 500, {
                success: false,
                error: 'Internal server error',
                message: error.message,
                processingTime: processingTime
            });
        }
    }

    // Handle GET requests for status/health check
    async handleStatus(req, res) {
        try {
            const uptime = Date.now() - this.startTime.getTime();
            const stats = this.eventProcessor.getStats();
            
            const status = {
                service: 'RBM Callback Handler',
                status: 'healthy',
                uptime: uptime,
                uptimeFormatted: this._formatUptime(uptime),
                startTime: this.startTime.toISOString(),
                eventsProcessed: this.eventCount,
                conversationCount: stats.conversationCount,
                supportedEventTypes: stats.eventTypes,
                endpoints: {
                    callback: 'POST /api/rbm/callback',
                    status: 'GET /api/rbm/status'
                }
            };

            // Also log to console
            console.log('\n📊 RBM SERVER STATUS:');
            console.log(`   Status: ${status.status}`);
            console.log(`   Uptime: ${status.uptimeFormatted}`);
            console.log(`   Events Processed: ${status.eventsProcessed}`);
            console.log(`   Active Conversations: ${status.conversationCount}`);
            console.log('');

            this._sendJsonResponse(res, 200, status);

        } catch (error) {
            console.error(`Error getting RBM status:`, error);
            this._sendJsonResponse(res, 500, {
                service: 'RBM Callback Handler',
                status: 'error',
                error: error.message
            });
        }
    }

    // Handle webhook validation (if needed by external systems)
    async handleValidation(req, res) {
        // Some webhook systems send validation challenges
        const challenge = req.query.challenge || req.query['hub.challenge'];
        
        if (challenge) {
            console.log(`🔐 Webhook validation challenge: ${challenge}`);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end(challenge);
        } else {
            console.log('🔐 Webhook validation request (no challenge)');
            this._sendJsonResponse(res, 200, {
                service: 'RBM Callback Handler',
                validation: 'ready',
                timestamp: new Date().toISOString()
            });
        }
    }

    // Send JSON response using Node.js HTTP methods
    _sendJsonResponse(res, statusCode, data) {
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    }

    // Send error response
    _sendError(res, statusCode, message, details = {}) {
        const errorResponse = {
            success: false,
            error: message,
            timestamp: new Date().toISOString(),
            ...details
        };

        this._sendJsonResponse(res, statusCode, errorResponse);
    }

    // Format uptime in human readable format
    _formatUptime(uptimeMs) {
        const seconds = Math.floor(uptimeMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // Get handler statistics
    getStats() {
        return {
            eventCount: this.eventCount,
            startTime: this.startTime,
            uptime: Date.now() - this.startTime.getTime(),
            processorStats: this.eventProcessor.getStats()
        };
    }
}

module.exports = RBMCallbackHandler;
