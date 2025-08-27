// MessageAdapter.js - Stable GUI interface adapter
// Converts GSMA UP messages to consistent internal format for GUI rendering

const MessageAdapter = {
    adaptToGUI,
    adaptFromGUI,
    generateInternalFormat
};

// Convert GSMA UP message to stable GUI format
function adaptToGUI(gsmaMessage, defaultIds = {}) {
    try {
        const format = _detectFormat(gsmaMessage);
        const messages = _extractMessages(gsmaMessage, format);
        const ids = _extractIds(gsmaMessage, defaultIds);
        
        return {
            id: ids.messageId,
            conversationId: ids.conversationId,
            participantId: ids.participantId,
            timestamp: new Date(),
            type: 'received',
            messages: messages.map(msg => _adaptSingleMessage(msg))
        };
        
    } catch (error) {
        throw new Error(`Message adaptation failed: ${error.message}`);
    }
}

// Convert GUI format back to GSMA UP (for API responses)
function adaptFromGUI(guiMessage) {
    const gsmaMessages = guiMessage.messages.map(msg => _convertToGSMA(msg));
    
    return {
        messageId: guiMessage.id,
        conversationId: guiMessage.conversationId,
        participantId: guiMessage.participantId,
        messages: gsmaMessages
    };
}

// Generate consistent internal format for GUI rendering
function generateInternalFormat(adaptedMessage) {
    // This is what the GUI expects - stable interface
    return {
        id: adaptedMessage.id,
        timestamp: adaptedMessage.timestamp,
        type: adaptedMessage.type,
        content: _generateGUIContent(adaptedMessage.messages)
    };
}

// Private adapter functions
function _detectFormat(message) {
    if (message.messages && Array.isArray(message.messages)) {
        return 'gsma_array';
    }
    if (message.type || message.text || message.richCard) {
        return 'single_message';
    }
    return 'unknown';
}

function _extractMessages(gsmaMessage, format) {
    switch (format) {
        case 'gsma_array':
            return gsmaMessage.messages;
        case 'single_message':
            return [gsmaMessage];
        default:
            throw new Error('Unknown message format');
    }
}

function _extractIds(gsmaMessage, defaultIds) {
    return {
        messageId: gsmaMessage.messageId || defaultIds.messageId,
        conversationId: gsmaMessage.conversationId || defaultIds.conversationId,
        participantId: gsmaMessage.participantId || defaultIds.participantId
    };
}

function _adaptSingleMessage(message) {
    // Text message with suggestions
    if (message.text) {
        return {
            type: 'text',
            text: message.text,
            suggestedActions: _adaptSuggestions(message.suggestions || [])
        };
    }
    
    // Rich card message
    if (message.richCard && message.richCard.standaloneCard) {
        return _adaptRichCard(message.richCard.standaloneCard);
    }
    
    // Type-based message
    if (message.type) {
        return _adaptTypedMessage(message);
    }
    
    throw new Error('Unsupported message type');
}

function _adaptRichCard(standaloneCard) {
    const content = standaloneCard.cardContent;
    
    return {
        type: 'richCard',
        title: content.title || '',
        description: content.description || '',
        image: content.media?.contentInfo?.fileUrl || '',
        actions: _adaptSuggestions(content.suggestions || [])
    };
}

function _adaptTypedMessage(message) {
    const adapted = {
        type: message.type,
        text: message.text || '',
        suggestedActions: _adaptSuggestions(message.suggestions || [])
    };
    
    // Add type-specific fields
    if (message.type === 'richCard') {
        adapted.title = message.title || '';
        adapted.description = message.description || '';
        adapted.image = message.image || '';
        adapted.actions = _adaptSuggestions(message.actions || []);
    }
    
    return adapted;
}

function _adaptSuggestions(suggestions) {
    if (!Array.isArray(suggestions)) return [];
    
    return suggestions.map(suggestion => {
        if (suggestion.action) {
            return {
                label: suggestion.action.text,
                action: suggestion.action.postbackData,
                type: 'secondary',
                url: suggestion.action.openUrlAction?.url
            };
        }
        
        // Legacy format support
        return {
            label: suggestion.text || suggestion.label,
            action: suggestion.postbackData || suggestion.action,
            type: suggestion.type || 'secondary'
        };
    });
}

function _generateGUIContent(messages) {
    // Handle multiple messages
    if (messages.length === 1) {
        return _generateSingleContent(messages[0]);
    }
    
    // Multiple messages - return as array for GUI to handle
    return {
        type: 'multiple',
        messages: messages.map(msg => _generateSingleContent(msg))
    };
}

function _generateSingleContent(message) {
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

function _convertToGSMA(guiMessage) {
    // Convert GUI format back to GSMA UP
    switch (guiMessage.type) {
        case 'text':
            const gsmaText = { text: guiMessage.text };
            if (guiMessage.suggestedActions && guiMessage.suggestedActions.length > 0) {
                gsmaText.suggestions = guiMessage.suggestedActions.map(action => ({
                    action: {
                        text: action.label,
                        postbackData: action.action,
                        ...(action.url && { openUrlAction: { url: action.url } })
                    }
                }));
            }
            return gsmaText;
            
        case 'richCard':
            return {
                richCard: {
                    standaloneCard: {
                        cardContent: {
                            title: guiMessage.title,
                            description: guiMessage.description,
                            ...(guiMessage.image && {
                                media: {
                                    height: 'MEDIUM',
                                    contentInfo: {
                                        fileUrl: guiMessage.image,
                                        mimeType: 'image/jpeg'
                                    }
                                }
                            }),
                            suggestions: guiMessage.actions.map(action => ({
                                action: {
                                    text: action.label,
                                    postbackData: action.action,
                                    ...(action.url && { openUrlAction: { url: action.url } })
                                }
                            }))
                        }
                    }
                }
            };
            
        default:
            return { text: guiMessage.text || 'Unknown message type' };
    }
}

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MessageAdapter;
} else if (typeof window !== 'undefined') {
    window.MessageAdapter = MessageAdapter;
}
