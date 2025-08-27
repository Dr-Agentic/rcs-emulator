// GSMA Universal Profile Event Validator
class GSMAValidator {
    constructor() {
        this.validEventTypes = [
            'userMessage',
            'chatState', 
            'suggestionResponse',
            'deliveryReceipt',
            'readReceipt'
        ];
        
        this.validChatStates = ['composing', 'idle'];
        this.validResponseTypes = ['action', 'reply'];
    }

    // Main validation entry point
    validate(event) {
        const errors = [];
        
        try {
            // Basic structure validation
            this._validateBasicStructure(event, errors);
            
            // Event type specific validation
            if (errors.length === 0) {
                this._validateEventSpecific(event, errors);
            }
            
            // Data format validation
            if (errors.length === 0) {
                this._validateDataFormats(event, errors);
            }
            
        } catch (error) {
            errors.push(`Validation error: ${error.message}`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Validate basic GSMA UP event structure
    _validateBasicStructure(event, errors) {
        if (!event || typeof event !== 'object') {
            errors.push('Event must be a valid object');
            return;
        }

        // Required fields for all events
        const requiredFields = ['eventType', 'eventId', 'timestamp', 'conversationId', 'participantId'];
        
        for (const field of requiredFields) {
            if (!event[field]) {
                errors.push(`Missing required field: ${field}`);
            }
        }

        // Validate eventType
        if (event.eventType && !this.validEventTypes.includes(event.eventType)) {
            errors.push(`Invalid eventType: ${event.eventType}. Must be one of: ${this.validEventTypes.join(', ')}`);
        }
    }

    // Validate event type specific fields
    _validateEventSpecific(event, errors) {
        switch (event.eventType) {
            case 'userMessage':
                this._validateUserMessage(event, errors);
                break;
            case 'chatState':
                this._validateChatState(event, errors);
                break;
            case 'suggestionResponse':
                this._validateSuggestionResponse(event, errors);
                break;
            case 'deliveryReceipt':
                this._validateDeliveryReceipt(event, errors);
                break;
            case 'readReceipt':
                this._validateReadReceipt(event, errors);
                break;
        }
    }

    // Validate userMessage events
    _validateUserMessage(event, errors) {
        if (!event.messageId) {
            errors.push('userMessage events must have messageId');
        }
        
        if (!event.content) {
            errors.push('userMessage events must have content');
        } else {
            // Must have either text or media content
            if (!event.content.text && !event.content.media) {
                errors.push('userMessage content must have either text or media');
            }
        }
    }

    // Validate chatState events
    _validateChatState(event, errors) {
        if (!event.state) {
            errors.push('chatState events must have state field');
        } else if (!this.validChatStates.includes(event.state)) {
            errors.push(`Invalid chatState: ${event.state}. Must be one of: ${this.validChatStates.join(', ')}`);
        }
    }

    // Validate suggestionResponse events
    _validateSuggestionResponse(event, errors) {
        if (!event.sourceMessageId) {
            errors.push('suggestionResponse events must have sourceMessageId');
        }
        
        if (!event.postbackData) {
            errors.push('suggestionResponse events must have postbackData');
        }
        
        if (!event.displayText) {
            errors.push('suggestionResponse events must have displayText');
        }
        
        if (event.responseType && !this.validResponseTypes.includes(event.responseType)) {
            errors.push(`Invalid responseType: ${event.responseType}. Must be one of: ${this.validResponseTypes.join(', ')}`);
        }
    }

    // Validate deliveryReceipt events
    _validateDeliveryReceipt(event, errors) {
        if (!event.messageId) {
            errors.push('deliveryReceipt events must have messageId');
        }
        
        if (!event.deliveredTimestamp) {
            errors.push('deliveryReceipt events must have deliveredTimestamp');
        }
    }

    // Validate readReceipt events
    _validateReadReceipt(event, errors) {
        if (!event.messageId) {
            errors.push('readReceipt events must have messageId');
        }
        
        if (!event.readTimestamp) {
            errors.push('readReceipt events must have readTimestamp');
        }
    }

    // Validate data formats
    _validateDataFormats(event, errors) {
        // Validate participantId (should be MSISDN format)
        if (event.participantId && !this._isValidMSISDN(event.participantId)) {
            errors.push(`Invalid participantId format: ${event.participantId}. Should be MSISDN format (e.g., +15551234567)`);
        }

        // Validate timestamp (should be ISO 8601)
        if (event.timestamp && !this._isValidISO8601(event.timestamp)) {
            errors.push(`Invalid timestamp format: ${event.timestamp}. Should be ISO 8601 format`);
        }

        // Validate eventId (should be unique identifier)
        if (event.eventId && !this._isValidEventId(event.eventId)) {
            errors.push(`Invalid eventId format: ${event.eventId}. Should be unique identifier`);
        }
    }

    // Helper: Validate MSISDN format
    _isValidMSISDN(participantId) {
        // Basic MSISDN validation: starts with + followed by digits
        const msisdnPattern = /^\+[1-9]\d{1,14}$/;
        return msisdnPattern.test(participantId);
    }

    // Helper: Validate ISO 8601 timestamp
    _isValidISO8601(timestamp) {
        try {
            const date = new Date(timestamp);
            return date.toISOString() === timestamp;
        } catch {
            return false;
        }
    }

    // Helper: Validate eventId format
    _isValidEventId(eventId) {
        // Should be non-empty string with reasonable length
        return typeof eventId === 'string' && eventId.length > 0 && eventId.length < 256;
    }
}

module.exports = GSMAValidator;
