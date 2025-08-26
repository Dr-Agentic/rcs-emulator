// RCS Event Capture Service - GSMA UP Compliant
class RCSEventCapture {
    constructor() {
        this.conversationId = "conv_emulator_" + Date.now();
        this.userId = "user_emulator";
        this.messageCounter = 1;
    }

    // Generate unique message ID
    generateMessageId() {
        return `msg_${Date.now()}_${this.messageCounter++}`;
    }

    // Format base event structure
    formatBaseEvent(eventType, additionalData = {}) {
        return {
            eventType: eventType,
            timestamp: new Date().toISOString(),
            conversationId: this.conversationId,
            userId: this.userId,
            ...additionalData
        };
    }

    // Capture typing indicator event
    captureTypingIndicator(typingStatus) {
        const eventData = this.formatBaseEvent("user.typing", {
            typingStatus: typingStatus // "started" or "stopped"
        });

        this.displayAndSend(eventData);
    }

    // Capture user message event
    captureUserMessage(text, mediaType = null, mediaUrl = null) {
        console.log('🔍 captureUserMessage called with:', { text, mediaType, mediaUrl });
        
        const messageId = this.generateMessageId();
        console.log('📝 Generated messageId:', messageId);
        
        const eventData = this.formatBaseEvent("user.message", {
            messageId: messageId,
            messageType: mediaType ? "media" : "text",
            content: mediaType ? {
                mediaType: mediaType,
                mediaUrl: mediaUrl,
                text: text || ""
            } : {
                text: text
            }
        });

        console.log('📡 Formatted event data:', eventData);
        this.displayAndSend(eventData);
        return messageId;
    }

    // Capture action click event
    captureActionClick(actionId, actionLabel, actionType, sourceMessageId, context = {}) {
        const eventData = this.formatBaseEvent("action.clicked", {
            actionId: actionId,
            actionLabel: actionLabel,
            actionType: actionType,
            sourceMessageId: sourceMessageId,
            context: context
        });

        this.displayAndSend(eventData);
    }

    // Capture message status event
    captureMessageStatus(messageId, status) {
        const eventData = this.formatBaseEvent(`message.${status}`, {
            messageId: messageId,
            [`${status}At`]: new Date().toISOString()
        });

        this.displayAndSend(eventData);
    }

    // Capture rich card interaction
    captureCardInteraction(cardId, interactionType, sourceMessageId, cardContext = {}) {
        const eventData = this.formatBaseEvent("card.clicked", {
            cardId: cardId,
            interactionType: interactionType,
            sourceMessageId: sourceMessageId,
            cardContext: cardContext
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

    // Manual send to webhook
    manualSend() {
        const jsonViewer = document.getElementById('eventJsonViewer');
        if (jsonViewer && jsonViewer.textContent) {
            try {
                const eventData = JSON.parse(jsonViewer.textContent);
                this.sendToWebhook(eventData);
            } catch (error) {
                this.updateWebhookStatus('❌ Invalid JSON format', 'error');
            }
        }
    }

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
