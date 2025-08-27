// RCS Event Capture Service - GSMA UP Compliant
class RCSEventCapture {
    constructor() {
        this.conversationId = "conv_emulator_" + Date.now();
        this.participantId = "+15551234567"; // GSMA UP requires MSISDN or SIP URI format
        this.messageCounter = 1;
        this.eventCounter = 1;
    }

    // Generate unique message ID
    generateMessageId() {
        return `msg_${Date.now()}_${this.messageCounter++}`;
    }

    // Generate unique event ID for GSMA UP compliance
    generateEventId() {
        return `evt_${Date.now()}_${this.eventCounter++}`;
    }

    // Format base event structure (GSMA UP compliant)
    formatBaseEvent(eventType, additionalData = {}) {
        return {
            eventType: eventType,
            eventId: this.generateEventId(), // Required by GSMA UP
            timestamp: new Date().toISOString(),
            conversationId: this.conversationId,
            participantId: this.participantId, // GSMA UP field name
            ...additionalData
        };
    }

    // Capture typing indicator event (GSMA UP compliant)
    captureTypingIndicator(state) {
        const eventData = this.formatBaseEvent("chatState", {
            state: state === 'started' ? 'composing' : 'idle' // GSMA UP states
        });

        this.displayAndSend(eventData);
    }

    // Capture user message event (GSMA UP compliant)
    captureUserMessage(text, mediaType = null, mediaUrl = null) {
        console.log('🔍 captureUserMessage called with:', { text, mediaType, mediaUrl });
        
        const messageId = this.generateMessageId();
        console.log('📝 Generated messageId:', messageId);
        
        // GSMA UP compliant structure
        const eventData = this.formatBaseEvent("userMessage", {
            messageId: messageId,
            content: mediaType ? {
                media: {
                    mediaType: mediaType,
                    mediaUrl: mediaUrl
                },
                text: text || ""
            } : {
                text: text
            }
        });

        console.log('📡 Formatted event data:', eventData);
        this.displayAndSend(eventData);
        return messageId;
    }

    // Capture suggested reply (GSMA UP compliant) - returns userMessage
    captureSuggestedReply(replyText, postbackData, sourceMessageId, context = {}) {
        const messageId = this.generateMessageId();
        const eventData = this.formatBaseEvent("userMessage", {
            messageId: messageId,
            content: {
                text: replyText
            },
            // Additional context for business logic
            _replyContext: {
                sourceMessageId: sourceMessageId,
                postbackData: postbackData,
                type: "suggested_reply"
            }
        });

        this.displayAndSend(eventData);
        return messageId;
    }

    // Capture suggestion response (GSMA UP compliant) - for actions
    captureSuggestionResponse(postbackData, displayText, responseType, sourceMessageId, actionUrl = null, context = {}) {
        const eventData = this.formatBaseEvent("suggestionResponse", {
            sourceMessageId: sourceMessageId,
            responseType: responseType, // "action", "reply", etc.
            postbackData: postbackData,
            displayText: displayText,
            actionUrl: actionUrl, // For openUrlAction, dialAction, etc.
            context: context
        });

        this.displayAndSend(eventData);
    }

    // Capture delivery receipt (GSMA UP compliant)
    captureDeliveryReceipt(messageId) {
        const eventData = this.formatBaseEvent("deliveryReceipt", {
            messageId: messageId,
            deliveredTimestamp: new Date().toISOString()
        });

        this.displayAndSend(eventData);
    }

    // Capture read receipt (GSMA UP compliant)
    captureReadReceipt(messageId) {
        const eventData = this.formatBaseEvent("readReceipt", {
            messageId: messageId,
            readTimestamp: new Date().toISOString()
        });

        this.displayAndSend(eventData);
    }

    // Capture rich card interaction (VENDOR EXTENSION - not official GSMA UP)
    captureCardInteraction(cardId, interactionType, sourceMessageId, cardContext = {}) {
        const eventData = this.formatBaseEvent("richCardInteraction", {
            messageId: this.generateMessageId(),
            cardId: cardId,
            interactionType: interactionType,
            sourceMessageId: sourceMessageId,
            cardContext: cardContext,
            _vendorExtension: true // Mark as non-standard
        });

        this.displayAndSend(eventData);
    }

    // Display in JSON viewer and send to webhook
    displayAndSend(eventData) {
        // Update JSON viewer
        this.updateJSONViewer(eventData);
        
        // Send to webhook if configured
        this.sendToWebhook(eventData);
    }

    // Update the JSON viewer in right panel
    updateJSONViewer(eventData) {
        const jsonViewer = document.getElementById('eventJsonViewer');
        if (jsonViewer) {
            jsonViewer.textContent = JSON.stringify(eventData, null, 2);
            
            // Update status
            const statusElement = document.getElementById('eventStatus');
            if (statusElement) {
                statusElement.textContent = `📡 Event captured: ${eventData.eventType}`;
                statusElement.className = 'event-status success';
            }
        }
    }

    // Send to webhook (fire-and-forget)
    sendToWebhook(eventData) {
        const webhookUrl = document.getElementById('rcsServerUrl')?.value;
        const authToken = document.getElementById('authToken')?.value;
        
        if (!webhookUrl) {
            this.updateWebhookStatus('No webhook URL configured', 'info');
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'RCS-Emulator/1.0'
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(eventData)
        })
        .then(response => {
            if (response.ok) {
                this.updateWebhookStatus(`✅ Sent to ${webhookUrl}`, 'success');
            } else {
                this.updateWebhookStatus(`❌ Failed: HTTP ${response.status}`, 'error');
            }
        })
        .catch(error => {
            this.updateWebhookStatus(`❌ Failed: ${error.message}`, 'error');
        });
    }

    // Update webhook status display
    updateWebhookStatus(message, type) {
        const statusElement = document.getElementById('webhookStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `webhook-status ${type}`;
        }
    }

    // Copy JSON to clipboard
    copyJSON() {
        const jsonViewer = document.getElementById('eventJsonViewer');
        if (jsonViewer && jsonViewer.textContent) {
            navigator.clipboard.writeText(jsonViewer.textContent)
                .then(() => {
                    this.updateEventStatus('📋 JSON copied to clipboard', 'success');
                })
                .catch(() => {
                    this.updateEventStatus('❌ Failed to copy JSON', 'error');
                });
        }
    }

    // NOTE: manualSend() function removed - events are now sent automatically
    // to the auto-configured RBM server endpoint

    // Update event status
    updateEventStatus(message, type) {
        const statusElement = document.getElementById('eventStatus');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `event-status ${type}`;
            
            // Clear after 3 seconds
            setTimeout(() => {
                statusElement.textContent = '📡 Waiting for user interaction...';
                statusElement.className = 'event-status';
            }, 3000);
        }
    }
}

// Global instance
window.rcsEventCapture = new RCSEventCapture();
