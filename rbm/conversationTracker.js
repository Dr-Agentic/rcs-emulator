// Conversation Tracker - Manages conversation state and context
class ConversationTracker {
    constructor() {
        // In-memory conversation storage (could be replaced with database)
        this.conversations = new Map();
        this.participants = new Map();
    }

    // Update conversation with new event
    async updateConversation(event) {
        const { conversationId, participantId, eventType, timestamp } = event;
        
        // Get or create conversation
        let conversation = this.conversations.get(conversationId);
        if (!conversation) {
            conversation = this._createNewConversation(conversationId, participantId);
            this.conversations.set(conversationId, conversation);
            console.log(`🆕 New conversation created: ${conversationId}`);
        }

        // Update conversation metadata
        conversation.lastActivity = timestamp;
        conversation.eventCount++;
        conversation.events.push({
            eventType,
            eventId: event.eventId,
            timestamp,
            summary: this._getEventSummary(event)
        });

        // Update participant info
        this._updateParticipant(participantId, conversationId, timestamp);

        // Update conversation state based on event type
        this._updateConversationState(conversation, event);

        console.log(`📊 Conversation updated:`, {
            conversationId,
            eventCount: conversation.eventCount,
            state: conversation.state,
            lastActivity: conversation.lastActivity
        });

        return conversation;
    }

    // Get conversation by ID
    getConversation(conversationId) {
        return this.conversations.get(conversationId);
    }

    // Get all conversations for a participant
    getParticipantConversations(participantId) {
        const participant = this.participants.get(participantId);
        if (!participant) return [];

        return participant.conversations.map(convId => 
            this.conversations.get(convId)
        ).filter(conv => conv !== undefined);
    }

    // Get conversation statistics
    getConversationStats(conversationId) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) return null;

        const eventTypeCounts = {};
        conversation.events.forEach(event => {
            eventTypeCounts[event.eventType] = (eventTypeCounts[event.eventType] || 0) + 1;
        });

        return {
            conversationId,
            participantId: conversation.participantId,
            startTime: conversation.startTime,
            lastActivity: conversation.lastActivity,
            duration: new Date(conversation.lastActivity) - new Date(conversation.startTime),
            eventCount: conversation.eventCount,
            state: conversation.state,
            eventTypeCounts
        };
    }

    // Get total conversation count
    getConversationCount() {
        return this.conversations.size;
    }

    // Get all conversations (for admin/monitoring)
    getAllConversations() {
        return Array.from(this.conversations.values()).map(conv => ({
            conversationId: conv.conversationId,
            participantId: conv.participantId,
            startTime: conv.startTime,
            lastActivity: conv.lastActivity,
            eventCount: conv.eventCount,
            state: conv.state
        }));
    }

    // Create new conversation
    _createNewConversation(conversationId, participantId) {
        return {
            conversationId,
            participantId,
            startTime: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            eventCount: 0,
            state: 'active',
            context: {},
            events: []
        };
    }

    // Update participant information
    _updateParticipant(participantId, conversationId, timestamp) {
        let participant = this.participants.get(participantId);
        if (!participant) {
            participant = {
                participantId,
                firstSeen: timestamp,
                lastSeen: timestamp,
                conversations: [],
                totalEvents: 0
            };
            this.participants.set(participantId, participant);
        }

        participant.lastSeen = timestamp;
        participant.totalEvents++;

        // Add conversation if not already tracked
        if (!participant.conversations.includes(conversationId)) {
            participant.conversations.push(conversationId);
        }
    }

    // Update conversation state based on event
    _updateConversationState(conversation, event) {
        switch (event.eventType) {
            case 'userMessage':
                conversation.state = 'active';
                // Update context with message content
                if (event.content && event.content.text) {
                    conversation.context.lastUserMessage = event.content.text;
                }
                break;

            case 'suggestionResponse':
                conversation.state = 'active';
                // Track user actions
                if (!conversation.context.userActions) {
                    conversation.context.userActions = [];
                }
                conversation.context.userActions.push({
                    action: event.postbackData,
                    displayText: event.displayText,
                    timestamp: event.timestamp
                });
                break;

            case 'chatState':
                if (event.state === 'composing') {
                    conversation.state = 'typing';
                } else {
                    conversation.state = 'active';
                }
                break;

            case 'deliveryReceipt':
            case 'readReceipt':
                // These don't change conversation state
                break;
        }

        // Auto-expire conversations after 24 hours of inactivity
        const lastActivity = new Date(conversation.lastActivity);
        const now = new Date();
        const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
        
        if (hoursSinceActivity > 24 && conversation.state !== 'expired') {
            conversation.state = 'expired';
            console.log(`⏰ Conversation expired: ${conversation.conversationId}`);
        }
    }

    // Get event summary for logging
    _getEventSummary(event) {
        switch (event.eventType) {
            case 'userMessage':
                return {
                    type: 'message',
                    text: event.content?.text?.substring(0, 50) || '[media]'
                };
            
            case 'suggestionResponse':
                return {
                    type: 'action',
                    action: event.postbackData,
                    text: event.displayText
                };
            
            case 'chatState':
                return {
                    type: 'state',
                    state: event.state
                };
            
            case 'deliveryReceipt':
                return {
                    type: 'receipt',
                    status: 'delivered'
                };
            
            case 'readReceipt':
                return {
                    type: 'receipt',
                    status: 'read'
                };
            
            default:
                return {
                    type: event.eventType
                };
        }
    }

    // Clean up expired conversations (call periodically)
    cleanupExpiredConversations() {
        let cleanedCount = 0;
        const now = new Date();
        
        for (const [conversationId, conversation] of this.conversations.entries()) {
            const lastActivity = new Date(conversation.lastActivity);
            const hoursSinceActivity = (now - lastActivity) / (1000 * 60 * 60);
            
            // Remove conversations inactive for more than 7 days
            if (hoursSinceActivity > 168) {
                this.conversations.delete(conversationId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned up ${cleanedCount} expired conversations`);
        }
        
        return cleanedCount;
    }
}

module.exports = ConversationTracker;
