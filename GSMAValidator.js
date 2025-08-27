// GSMAValidator.js - GSMA UP compliant message validation with clear error reporting
// Supports optional ID fields with auto-generation fallbacks

const GSMAValidator = {
    validateMessage,
    generateDefaultIds,
    getValidationErrors
};

// Main validation function with precise error reporting
function validateMessage(messageData) {
    try {
        const errors = [];
        
        // Validate basic structure
        _validateBasicStructure(messageData, errors);
        
        if (errors.length > 0) {
            return { valid: false, errors };
        }
        
        // Validate message format (single vs array)
        const format = _detectMessageFormat(messageData);
        _validateMessageFormat(messageData, format, errors);
        
        // Validate ID fields if present
        _validateIdFields(messageData, errors);
        
        return {
            valid: errors.length === 0,
            errors,
            format,
            hasIds: _hasExplicitIds(messageData)
        };
        
    } catch (error) {
        return {
            valid: false,
            errors: [`Validation error: ${error.message}`],
            format: 'unknown'
        };
    }
}

// Generate default IDs for messages without explicit IDs
function generateDefaultIds(messageData) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    
    return {
        messageId: messageData.messageId || `msg_${timestamp}_${randomId}`,
        conversationId: messageData.conversationId || `conv_${timestamp}`,
        participantId: messageData.participantId || '+15551234567' // Default test number
    };
}

// Get user-friendly validation errors for UI display
function getValidationErrors(validationResult) {
    if (validationResult.valid) {
        return [];
    }
    
    return validationResult.errors.map(error => ({
        type: _categorizeError(error),
        message: _humanizeError(error),
        technical: error
    }));
}

// Private validation functions
function _validateBasicStructure(data, errors) {
    if (!data || typeof data !== 'object') {
        errors.push('Message must be a valid JSON object');
        return;
    }
    
    if (Array.isArray(data)) {
        errors.push('Root level cannot be an array - use {messages: [...]} format');
        return;
    }
}

function _detectMessageFormat(data) {
    // GSMA UP array format
    if (data.messages && Array.isArray(data.messages)) {
        return 'gsma_array';
    }
    
    // Single message format
    if (data.type || data.text || data.richCard) {
        return 'single_message';
    }
    
    return 'unknown';
}

function _validateMessageFormat(data, format, errors) {
    switch (format) {
        case 'gsma_array':
            _validateArrayFormat(data, errors);
            break;
        case 'single_message':
            _validateSingleFormat(data, errors);
            break;
        default:
            errors.push('Unknown message format - must have "messages" array or message "type"');
    }
}

function _validateArrayFormat(data, errors) {
    if (!Array.isArray(data.messages)) {
        errors.push('Messages field must be an array');
        return;
    }
    
    if (data.messages.length === 0) {
        errors.push('Messages array cannot be empty');
        return;
    }
    
    data.messages.forEach((message, index) => {
        _validateSingleMessage(message, errors, `Message ${index + 1}`);
    });
}

function _validateSingleFormat(data, errors) {
    _validateSingleMessage(data, errors, 'Message');
}

function _validateSingleMessage(message, errors, context) {
    // Text messages
    if (message.text) {
        _validateTextMessage(message, errors, context);
    }
    // Rich card messages
    else if (message.richCard) {
        _validateRichCard(message.richCard, errors, context);
    }
    // Type-based messages
    else if (message.type) {
        _validateTypedMessage(message, errors, context);
    }
    else {
        errors.push(`${context}: Must have text, richCard, or type field`);
    }
}

function _validateTextMessage(message, errors, context) {
    if (typeof message.text !== 'string' || message.text.trim() === '') {
        errors.push(`${context}: Text field must be a non-empty string`);
    }
    
    if (message.suggestions) {
        _validateSuggestions(message.suggestions, errors, context);
    }
}

function _validateRichCard(richCard, errors, context) {
    if (richCard.standaloneCard) {
        _validateStandaloneCard(richCard.standaloneCard, errors, context);
    } else {
        errors.push(`${context}: Rich card must have standaloneCard structure`);
    }
}

function _validateStandaloneCard(card, errors, context) {
    const content = card.cardContent;
    if (!content) {
        errors.push(`${context}: Standalone card must have cardContent`);
        return;
    }
    
    if (!content.title || typeof content.title !== 'string') {
        errors.push(`${context}: Card must have a title string`);
    }
    
    if (content.suggestions) {
        _validateSuggestions(content.suggestions, errors, context);
    }
}

function _validateTypedMessage(message, errors, context) {
    const validTypes = ['text', 'richCard', 'media'];
    if (!validTypes.includes(message.type)) {
        errors.push(`${context}: Invalid type "${message.type}" - must be: ${validTypes.join(', ')}`);
    }
    
    if (message.type === 'text' && (!message.text || typeof message.text !== 'string')) {
        errors.push(`${context}: Text type messages must have text field`);
    }
}

function _validateSuggestions(suggestions, errors, context) {
    if (!Array.isArray(suggestions)) {
        errors.push(`${context}: Suggestions must be an array`);
        return;
    }
    
    suggestions.forEach((suggestion, index) => {
        if (suggestion.action) {
            _validateAction(suggestion.action, errors, `${context} suggestion ${index + 1}`);
        } else {
            errors.push(`${context} suggestion ${index + 1}: Must have action field`);
        }
    });
}

function _validateAction(action, errors, context) {
    if (!action.text || typeof action.text !== 'string') {
        errors.push(`${context}: Action must have text field`);
    }
    
    if (!action.postbackData || typeof action.postbackData !== 'string') {
        errors.push(`${context}: Action must have postbackData field`);
    }
}

function _validateIdFields(data, errors) {
    if (data.messageId && typeof data.messageId !== 'string') {
        errors.push('messageId must be a string');
    }
    
    if (data.conversationId && typeof data.conversationId !== 'string') {
        errors.push('conversationId must be a string');
    }
    
    if (data.participantId && typeof data.participantId !== 'string') {
        errors.push('participantId must be a string');
    }
}

function _hasExplicitIds(data) {
    return !!(data.messageId || data.conversationId || data.participantId);
}

function _categorizeError(error) {
    if (error.includes('must be')) return 'format';
    if (error.includes('cannot be')) return 'structure';
    if (error.includes('Invalid')) return 'value';
    return 'general';
}

function _humanizeError(error) {
    // Convert technical errors to user-friendly messages
    const errorMap = {
        'Messages field must be an array': 'The "messages" field should contain a list of messages',
        'Messages array cannot be empty': 'You need to include at least one message',
        'Action must have text field': 'Button actions need display text',
        'Action must have postbackData field': 'Button actions need postback data for processing'
    };
    
    return errorMap[error] || error;
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GSMAValidator;
} else if (typeof window !== 'undefined') {
    window.GSMAValidator = GSMAValidator;
}
