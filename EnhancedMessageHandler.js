// EnhancedMessageHandler.js - New message handler with validation and ID support
// Replaces MessageFormatHandler.js with better error reporting and GSMA UP compliance

const GSMAValidator = require('./GSMAValidator.js');
const MessageAdapter = require('./MessageAdapter.js');

const EnhancedMessageHandler = {
    validateMessageData,
    parseMessage,
    convertToUIMessage,
    getValidationErrors
};

// Enhanced validation with precise error reporting
function validateMessageData(jsonData) {
    try {
        const validation = GSMAValidator.validateMessage(jsonData);
        
        if (validation.valid) {
            return null; // No errors
        }
        
        // Return first error for backward compatibility
        return validation.errors[0];
        
    } catch (error) {
        return `Validation failed: ${error.message}`;
    }
}

// Parse message with ID support and stable output format
function parseMessage(jsonData) {
    try {
        // Validate first
        const validation = GSMAValidator.validateMessage(jsonData);
        if (!validation.valid) {
            throw new Error(`Invalid message: ${validation.errors[0]}`);
        }
        
        // Generate IDs if needed
        const defaultIds = validation.hasIds ? {} : GSMAValidator.generateDefaultIds(jsonData);
        
        // Adapt to GUI format
        const adapted = MessageAdapter.adaptToGUI(jsonData, defaultIds);
        
        // Return in expected format for GUI
        return _formatForGUI(adapted);
        
    } catch (error) {
        throw new Error(`Message parsing failed: ${error.message}`);
    }
}

// Convert to UI message format (backward compatibility)
function convertToUIMessage(parsedMessage, sender = 'business') {
    const baseMessage = {
        id: parsedMessage.id || Date.now() + Math.random(),
        timestamp: new Date(),
        type: sender === 'user' ? 'sent' : 'received'
    };
    
    return { ...baseMessage, ...parsedMessage.content };
}

// Get detailed validation errors for UI display
function getValidationErrors(jsonData) {
    try {
        const validation = GSMAValidator.validateMessage(jsonData);
        return GSMAValidator.getValidationErrors(validation);
    } catch (error) {
        return [{
            type: 'system',
            message: 'Unable to validate message format',
            technical: error.message
        }];
    }
}

// Private helper functions
function _formatForGUI(adapted) {
    // Handle multiple messages
    if (adapted.messages.length > 1) {
        return {
            messages: adapted.messages.map(msg => _formatSingleMessage(msg))
        };
    }
    
    // Single message
    return _formatSingleMessage(adapted.messages[0]);
}

function _formatSingleMessage(message) {
    switch (message.type) {
        case 'text':
            return {
                text: message.text,
                suggestedActions: message.suggestedActions
            };
            
        case 'richCard':
            return {
                richCard: {
                    title: message.title,
                    description: message.description,
                    image: message.image,
                    actions: message.actions
                }
            };
            
        default:
            return { text: message.text || 'Unsupported message type' };
    }
}

// Export for Node.js
module.exports = EnhancedMessageHandler;
