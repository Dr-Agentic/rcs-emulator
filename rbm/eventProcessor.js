// RCS Event Processor - Routes and processes GSMA UP events
const ConversationTracker = require('./conversationTracker');

class EventProcessor {
    constructor() {
        this.conversationTracker = new ConversationTracker();
        this.eventHandlers = {
            'userMessage': this.handleUserMessage.bind(this),
            'chatState': this.handleChatState.bind(this),
            'suggestionResponse': this.handleSuggestionResponse.bind(this),
            'deliveryReceipt': this.handleDeliveryReceipt.bind(this),
            'readReceipt': this.handleReadReceipt.bind(this)
        };
    }

    // Main event processing entry point
    async processEvent(event) {
        try {
            console.log('\n' + '='.repeat(80));
            console.log(`📨 RBM EVENT RECEIVED: ${event.eventType.toUpperCase()}`);
            console.log('='.repeat(80));
            console.log('📋 Event Details:');
            console.log(`   Event ID: ${event.eventId}`);
            console.log(`   Timestamp: ${event.timestamp}`);
            console.log(`   Conversation: ${event.conversationId}`);
            console.log(`   Participant: ${event.participantId}`);
            console.log('');

            // Route to appropriate handler
            const handler = this.eventHandlers[event.eventType];
            if (!handler) {
                throw new Error(`No handler found for event type: ${event.eventType}`);
            }

            // Process the event
            const result = await handler(event);

            // Update conversation tracking
            await this.conversationTracker.updateConversation(event);

            console.log(`✅ Event processed successfully`);
            console.log('='.repeat(80) + '\n');
            
            return result;

        } catch (error) {
            console.error(`❌ Error processing ${event.eventType} event:`, error.message);
            console.log('='.repeat(80) + '\n');
            throw error;
        }
    }

    // Handle user message events
    async handleUserMessage(event) {
        const { messageId, content, conversationId, participantId } = event;
        
        console.log('💬 USER MESSAGE:');
        console.log(`   Message ID: ${messageId}`);
        
        if (content.text) {
            console.log(`   Text: "${content.text}"`);
        }
        
        if (content.media) {
            console.log(`   Media Type: ${content.media.mediaType}`);
            console.log(`   Media URL: ${content.media.mediaUrl}`);
        }

        // Check if this is a reply to a suggestion
        if (event._replyContext) {
            console.log('🔄 REPLY CONTEXT:');
            console.log(`   Source Message: ${event._replyContext.sourceMessageId}`);
            console.log(`   Postback Data: ${event._replyContext.postbackData}`);
            console.log(`   Reply Type: ${event._replyContext.type}`);
        }

        return {
            type: 'userMessage',
            processed: true,
            messageId,
            text: content.text || '[media]'
        };
    }

    // Handle chat state events (typing indicators)
    async handleChatState(event) {
        const { state, conversationId, participantId } = event;
        
        console.log('⌨️ CHAT STATE:');
        console.log(`   State: ${state.toUpperCase()}`);
        console.log(`   User is ${state === 'composing' ? 'typing...' : 'idle'}`);

        return {
            type: 'chatState',
            processed: true,
            state
        };
    }

    // Handle suggestion response events (button clicks)
    async handleSuggestionResponse(event) {
        const { 
            sourceMessageId, 
            postbackData, 
            displayText, 
            responseType, 
            actionUrl,
            conversationId, 
            participantId 
        } = event;
        
        console.log('🔘 BUTTON CLICKED:');
        console.log(`   Button Text: "${displayText}"`);
        console.log(`   Postback Data: ${postbackData}`);
        console.log(`   Response Type: ${responseType}`);
        console.log(`   Source Message: ${sourceMessageId}`);
        
        if (actionUrl) {
            console.log(`   Action URL: ${actionUrl}`);
        }

        // Process the action
        const actionResult = this._processAction(postbackData, displayText);
        console.log('🎯 ACTION PROCESSING:');
        console.log(`   Intent: ${actionResult.intent}`);
        console.log(`   Next Step: ${actionResult.nextStep}`);

        return {
            type: 'suggestionResponse',
            processed: true,
            action: postbackData,
            displayText,
            actionResult
        };
    }

    // Handle delivery receipt events
    async handleDeliveryReceipt(event) {
        const { messageId, deliveredTimestamp } = event;
        
        console.log('📬 MESSAGE DELIVERED:');
        console.log(`   Message ID: ${messageId}`);
        console.log(`   Delivered At: ${deliveredTimestamp}`);

        return {
            type: 'deliveryReceipt',
            processed: true,
            messageId
        };
    }

    // Handle read receipt events
    async handleReadReceipt(event) {
        const { messageId, readTimestamp } = event;
        
        console.log('👁️ MESSAGE READ:');
        console.log(`   Message ID: ${messageId}`);
        console.log(`   Read At: ${readTimestamp}`);

        return {
            type: 'readReceipt',
            processed: true,
            messageId
        };
    }

    // Process specific actions based on postbackData
    _processAction(postbackData, displayText) {
        console.log(`🎯 Processing action: ${postbackData}`);

        // Action processing logic based on postbackData
        switch (postbackData) {
            case 'view_products':
                return {
                    action: 'view_products',
                    intent: 'product_inquiry',
                    nextStep: 'show_catalog',
                    description: 'User wants to browse products'
                };
            
            case 'place_order':
                return {
                    action: 'place_order',
                    intent: 'purchase_intent',
                    nextStep: 'collect_order_details',
                    description: 'User wants to make a purchase'
                };
            
            case 'contact_support':
                return {
                    action: 'contact_support',
                    intent: 'support_request',
                    nextStep: 'route_to_agent',
                    description: 'User needs assistance'
                };
            
            case 'find_store':
                return {
                    action: 'find_store',
                    intent: 'location_inquiry',
                    nextStep: 'request_location',
                    description: 'User wants to find nearby store'
                };
            
            default:
                return {
                    action: postbackData,
                    intent: 'unknown',
                    nextStep: 'log_and_continue',
                    description: `Generic action: ${displayText}`
                };
        }
    }

    // Get processing statistics
    getStats() {
        const conversationStats = this.conversationTracker.getAllConversations();
        
        console.log('\n📊 RBM SERVER STATISTICS:');
        console.log(`   Active Conversations: ${conversationStats.length}`);
        console.log(`   Supported Event Types: ${Object.keys(this.eventHandlers).join(', ')}`);
        
        if (conversationStats.length > 0) {
            console.log('\n💬 Recent Conversations:');
            conversationStats.slice(-3).forEach(conv => {
                console.log(`   ${conv.conversationId}: ${conv.eventCount} events, last active ${conv.lastActivity}`);
            });
        }
        
        return {
            conversationCount: conversationStats.length,
            eventTypes: Object.keys(this.eventHandlers),
            recentConversations: conversationStats.slice(-5)
        };
    }
}

module.exports = EventProcessor;
