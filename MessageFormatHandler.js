// MessageFormatHandler.js - Universal message format detection and routing
// Works in both browser and Node.js environments

// Exported functions
const detectMessageFormat = (jsonData) => {
    _validateMessageStructure(jsonData);
    
    if (_detectGoogleFormat(jsonData)) {
        return 'google_rcs';
    }
    if (_detectCurrentFormat(jsonData)) {
        return 'current';
    }
    
    throw new Error('Unknown message format - must be Google RCS or current format');
};

const parseMessage = (jsonData) => {
    const format = detectMessageFormat(jsonData);
    
    switch (format) {
        case 'google_rcs':
            return _parseGoogleRCSMessage(jsonData);
        case 'current':
            return _parseCurrentFormat(jsonData);
        default:
            throw new Error(`Unsupported format: ${format}`);
    }
};

const convertToUIMessage = (parsedMessage, sender = 'business') => {
    const baseTimestamp = new Date();
    const baseMessage = {
        id: Date.now() + Math.random(),
        timestamp: baseTimestamp,
        type: sender === 'user' ? 'sent' : 'received'
    };

    return _mapParsedToUI(parsedMessage, baseMessage);
};

const validateMessageData = (jsonData) => {
    try {
        const format = detectMessageFormat(jsonData);
        const parsedMessage = parseMessage(jsonData);
        return null; // No validation errors
    } catch (error) {
        return error.message;
    }
};

// Private functions - self-contained to avoid dependency issues
const _validateMessageStructure = (messageData) => {
    if (!messageData || typeof messageData !== 'object') {
        throw new Error('Invalid message structure: must be an object');
    }
    return true;
};

const _detectGoogleFormat = (jsonData) => {
    return jsonData.messages && 
           Array.isArray(jsonData.messages) && 
           jsonData.messages.length > 0;
};

const _detectCurrentFormat = (jsonData) => {
    return jsonData.type || 
           jsonData.richCard || 
           jsonData.carousel || 
           jsonData.text ||
           jsonData.media;
};

const _parseGoogleRCSMessage = (googleData) => {
    if (!googleData.messages || !Array.isArray(googleData.messages)) {
        throw new Error('Invalid Google RCS format: missing messages array');
    }
    
    if (googleData.messages.length === 0) {
        throw new Error('Invalid Google RCS format: empty messages array');
    }
    
    // Process all messages in the array
    const parsedMessages = googleData.messages.map(message => {
        if (message.richCard) {
            return _parseGoogleRichCard(message.richCard);
        }
        if (message.text) {
            return { text: _parseTextMessage(message) };
        }
        
        throw new Error('Unsupported Google RCS message type');
    });
    
    // Return as a messages array for proper handling
    return { messages: parsedMessages };
};

const _parseGoogleRichCard = (richCard) => {
    if (richCard.carouselCard) {
        return { carousel: _parseGoogleCarousel(richCard.carouselCard) };
    }
    if (richCard.standaloneCard) {
        return { richCard: _parseGoogleStandaloneCard(richCard.standaloneCard) };
    }
    
    // Handle direct richCard format
    return { richCard: _parseRichCard(richCard) };
};

const _parseGoogleCarousel = (carouselCard) => {
    const cardContents = carouselCard.cardContents || [];
    
    const cards = cardContents.map(cardContent => ({
        title: cardContent.title || '',
        description: cardContent.description || '',
        image: cardContent.media?.contentInfo?.fileUrl || '',
        actions: _parseGoogleSuggestions(cardContent.suggestions || [])
    }));
    
    return { cards };
};

const _parseGoogleStandaloneCard = (standaloneCard) => {
    const cardContent = standaloneCard.cardContent || {};
    
    return {
        title: cardContent.title || '',
        description: cardContent.description || '',
        image: cardContent.media?.contentInfo?.fileUrl || '',
        actions: _parseGoogleSuggestions(cardContent.suggestions || [])
    };
};

const _parseGoogleSuggestions = (suggestions) => {
    if (!Array.isArray(suggestions)) return [];
    
    return suggestions.map(suggestion => {
        // Handle reply suggestions
        if (suggestion.reply) {
            return {
                type: 'reply',
                text: suggestion.reply.text || '',
                postbackData: suggestion.reply.postbackData || '',
                displayText: suggestion.reply.text || ''
            };
        }
        
        // Handle action suggestions
        if (suggestion.action) {
            const action = {
                label: suggestion.action.text || '',           // UI expects 'label'
                action: suggestion.action.postbackData || '',  // UI expects 'action' 
                type: 'secondary'                              // UI expects primary/secondary
            };
            
            // Add URL if present (for future URL action support)
            if (suggestion.action.openUrlAction) {
                action.url = suggestion.action.openUrlAction.url;
            }
            
            return action;
        }
        
        // Fallback for legacy format
        return {
            label: suggestion.text || '',
            action: suggestion.postbackData || '',
            type: 'secondary'
        };
    });
};

const _mapGoogleActionType = (action) => {
    if (action.openUrlAction) return 'secondary';
    if (action.dialAction) return 'secondary';
    return 'primary';
};

const _parseCurrentFormat = (jsonData) => {
    if (jsonData.type === 'media' || jsonData.media) {
        return { media: _parseMediaMessage(jsonData) };
    }
    if (jsonData.type === 'carousel' || jsonData.carousel) {
        return { carousel: _parseCarousel(jsonData.carousel || jsonData) };
    }
    if (jsonData.type === 'richCard' || jsonData.richCard) {
        return { richCard: _parseRichCard(jsonData.richCard || jsonData) };
    }
    if (jsonData.type === 'text' || jsonData.text) {
        return { text: _parseTextMessage(jsonData) };
    }
    
    throw new Error('Unknown current format message type');
};

const _parseRichCard = (richCardData) => {
    if (!richCardData || typeof richCardData !== 'object') {
        throw new Error('Invalid rich card data structure');
    }
    
    return {
        title: richCardData.title || '',
        description: richCardData.description || '',
        image: richCardData.image || richCardData.media?.contentInfo?.fileUrl || '',
        actions: _parseActions(richCardData.actions || richCardData.suggestions || [])
    };
};

const _parseCarousel = (carouselData) => {
    if (!carouselData || typeof carouselData !== 'object') {
        throw new Error('Invalid carousel data structure');
    }
    
    const cards = carouselData.cards || carouselData.cardContents || [];
    if (!Array.isArray(cards)) {
        throw new Error('Carousel cards must be an array');
    }
    
    return {
        cards: cards.map(card => _parseRichCard(card))
    };
};

const _parseTextMessage = (textData) => {
    if (!textData || typeof textData !== 'object') {
        throw new Error('Invalid text message data structure');
    }
    
    return {
        text: textData.text || '',
        suggestedActions: _parseSuggestedActions(textData.suggestedActions || textData.suggestions || [])
    };
};

const _parseMediaMessage = (mediaData) => {
    if (!mediaData || typeof mediaData !== 'object') {
        throw new Error('Invalid media message data structure');
    }
    
    // RCS standard format: { type: "media", mediaType: "image", url: "...", text: "..." }
    return {
        text: mediaData.text || '',
        type: 'media',
        mediaType: mediaData.mediaType || 'image',  // image, video, document
        url: _processMediaUrl(mediaData.url || ''),
        name: mediaData.name || '',
        size: mediaData.size || 0,
        suggestedActions: _parseSuggestedActions(mediaData.suggestedActions || mediaData.suggestions || [])
    };
};

const _processMediaUrl = (url) => {
    if (!url) return '';
    
    // Convert YouTube URLs to embeddable format
    if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
        const videoId = _extractYouTubeVideoId(url);
        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}`;
        }
    }
    
    return url;
};

const _extractYouTubeVideoId = (url) => {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
        /youtube\.com\/embed\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    
    return null;
};

const _parseActions = (actions) => {
    if (!Array.isArray(actions)) return [];
    
    return actions.map(action => ({
        label: action.label || action.text || '',
        action: action.action || action.postbackData || '',
        type: action.type || 'secondary'
    }));
};

const _parseSuggestedActions = (suggestions) => {
    if (!Array.isArray(suggestions)) return [];
    
    return suggestions.map(suggestion => {
        // Handle GSMA UP format with reply/action structure
        if (suggestion.reply) {
            return {
                type: 'reply',
                text: suggestion.reply.text || '',
                postbackData: suggestion.reply.postbackData || '',
                displayText: suggestion.reply.text || ''
            };
        }
        
        if (suggestion.action) {
            const action = {
                type: 'action',
                text: suggestion.action.text || '',
                postbackData: suggestion.action.postbackData || '',
                displayText: suggestion.action.text || ''
            };
            
            // Determine action type
            if (suggestion.action.openUrlAction) {
                action.actionType = 'openUrl';
                action.url = suggestion.action.openUrlAction.url;
            } else if (suggestion.action.dialAction) {
                action.actionType = 'dial';
                action.phoneNumber = suggestion.action.dialAction.phoneNumber;
            } else {
                action.actionType = 'generic';
            }
            
            return action;
        }
        
        // Legacy format fallback
        return {
            type: 'action',
            text: suggestion.label || suggestion.text || '',
            postbackData: suggestion.action || suggestion.postbackData || '',
            displayText: suggestion.label || suggestion.text || '',
            actionType: 'generic'
        };
    });
};

const _mapParsedToUI = (parsedMessage, baseMessage) => {
    if (parsedMessage.messages) {
        // Handle Google RCS messages array - return array of UI messages
        const baseTime = baseMessage.timestamp.getTime();
        return parsedMessage.messages.map((msg, index) => {
            const msgBaseMessage = {
                ...baseMessage,
                id: baseMessage.id + index,  // Unique ID for each message
                timestamp: new Date(baseTime + index * 100)  // Proper Date objects with staggered timing
            };
            return _mapParsedToUI(msg, msgBaseMessage);
        });
    }
    if (parsedMessage.carousel) {
        return { ...baseMessage, carousel: parsedMessage.carousel };
    }
    if (parsedMessage.richCard) {
        return { ...baseMessage, richCard: parsedMessage.richCard };
    }
    if (parsedMessage.text) {
        return { 
            ...baseMessage, 
            text: parsedMessage.text.text,
            suggestedActions: parsedMessage.text.suggestedActions
        };
    }
    if (parsedMessage.media) {
        return {
            ...baseMessage,
            text: parsedMessage.media.text,
            media: {
                type: parsedMessage.media.mediaType,  // Use mediaType as type for renderMedia
                url: parsedMessage.media.url,
                name: parsedMessage.media.name,
                size: parsedMessage.media.size
            },
            suggestedActions: parsedMessage.media.suggestedActions
        };
    }
    
    throw new Error('Unknown message type in parsed message');
};

// Universal export (UMD pattern)
(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        // Node.js
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define([], factory);
    } else {
        // Browser globals
        root.MessageFormatHandler = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    
    const MessageFormatHandler = {
        detectMessageFormat,
        parseMessage,
        convertToUIMessage,
        validateMessageData
    };
    
    return MessageFormatHandler;
}));
