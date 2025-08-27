// Event Forwarder - Forward RCS events to external systems
class EventForwarder {
    constructor() {
        this.forwardingEndpoints = [];
        this.forwardingEnabled = false;
        this.forwardingStats = {
            totalForwarded: 0,
            successCount: 0,
            errorCount: 0,
            lastForwardTime: null
        };
    }

    // Add forwarding endpoint
    addEndpoint(url, options = {}) {
        const endpoint = {
            url,
            method: options.method || 'POST',
            headers: options.headers || {},
            timeout: options.timeout || 5000,
            retries: options.retries || 3,
            enabled: options.enabled !== false
        };

        this.forwardingEndpoints.push(endpoint);
        console.log(`📡 Added forwarding endpoint: ${url}`);
        
        return endpoint;
    }

    // Enable/disable forwarding
    setForwardingEnabled(enabled) {
        this.forwardingEnabled = enabled;
        console.log(`📡 Event forwarding ${enabled ? 'enabled' : 'disabled'}`);
    }

    // Forward event to all configured endpoints
    async forwardEvent(event, processingResult = null) {
        if (!this.forwardingEnabled || this.forwardingEndpoints.length === 0) {
            return { forwarded: false, reason: 'Forwarding disabled or no endpoints' };
        }

        const forwardingPromises = this.forwardingEndpoints
            .filter(endpoint => endpoint.enabled)
            .map(endpoint => this._forwardToEndpoint(event, processingResult, endpoint));

        try {
            const results = await Promise.allSettled(forwardingPromises);
            
            // Update statistics
            this.forwardingStats.totalForwarded++;
            this.forwardingStats.lastForwardTime = new Date().toISOString();
            
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            const errorCount = results.filter(r => r.status === 'rejected').length;
            
            this.forwardingStats.successCount += successCount;
            this.forwardingStats.errorCount += errorCount;

            console.log(`📡 Event forwarded to ${this.forwardingEndpoints.length} endpoints:`, {
                eventId: event.eventId,
                eventType: event.eventType,
                successCount,
                errorCount
            });

            return {
                forwarded: true,
                endpointCount: this.forwardingEndpoints.length,
                successCount,
                errorCount,
                results: results.map((result, index) => ({
                    endpoint: this.forwardingEndpoints[index].url,
                    status: result.status,
                    error: result.status === 'rejected' ? result.reason.message : null
                }))
            };

        } catch (error) {
            console.error(`❌ Error forwarding event:`, error);
            this.forwardingStats.errorCount++;
            
            return {
                forwarded: false,
                error: error.message
            };
        }
    }

    // Forward to specific endpoint with retry logic
    async _forwardToEndpoint(event, processingResult, endpoint) {
        const payload = {
            event,
            processingResult,
            timestamp: new Date().toISOString(),
            source: 'rcs-emulator'
        };

        let lastError;
        
        for (let attempt = 1; attempt <= endpoint.retries; attempt++) {
            try {
                console.log(`📤 Forwarding to ${endpoint.url} (attempt ${attempt}/${endpoint.retries})`);
                
                const response = await this._makeRequest(endpoint, payload);
                
                console.log(`✅ Successfully forwarded to ${endpoint.url}:`, {
                    status: response.status,
                    attempt
                });
                
                return {
                    endpoint: endpoint.url,
                    success: true,
                    status: response.status,
                    attempt
                };

            } catch (error) {
                lastError = error;
                console.warn(`⚠️ Forward attempt ${attempt} failed for ${endpoint.url}:`, error.message);
                
                // Wait before retry (exponential backoff)
                if (attempt < endpoint.retries) {
                    const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s...
                    await this._sleep(delay);
                }
            }
        }

        // All retries failed
        throw new Error(`Failed to forward to ${endpoint.url} after ${endpoint.retries} attempts: ${lastError.message}`);
    }

    // Make HTTP request to endpoint
    async _makeRequest(endpoint, payload) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

        try {
            const response = await fetch(endpoint.url, {
                method: endpoint.method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'RCS-Emulator-Forwarder/1.0',
                    ...endpoint.headers
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return response;

        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${endpoint.timeout}ms`);
            }
            
            throw error;
        }
    }

    // Sleep utility for retry delays
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Remove forwarding endpoint
    removeEndpoint(url) {
        const index = this.forwardingEndpoints.findIndex(ep => ep.url === url);
        if (index !== -1) {
            this.forwardingEndpoints.splice(index, 1);
            console.log(`📡 Removed forwarding endpoint: ${url}`);
            return true;
        }
        return false;
    }

    // Get forwarding statistics
    getStats() {
        return {
            enabled: this.forwardingEnabled,
            endpointCount: this.forwardingEndpoints.length,
            endpoints: this.forwardingEndpoints.map(ep => ({
                url: ep.url,
                method: ep.method,
                enabled: ep.enabled
            })),
            stats: { ...this.forwardingStats }
        };
    }

    // Reset statistics
    resetStats() {
        this.forwardingStats = {
            totalForwarded: 0,
            successCount: 0,
            errorCount: 0,
            lastForwardTime: null
        };
        console.log(`📊 Forwarding statistics reset`);
    }
}

module.exports = EventForwarder;
