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
    const baseMessage = {
        id: Date.now() + Math.random(),
        timestamp: new Date(),
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
           jsonData.text;
};

const _parseGoogleRCSMessage = (googleData) => {
    if (!googleData.messages || !Array.isArray(googleData.messages)) {
        throw new Error('Invalid Google RCS format: missing messages array');
    }
    
    if (googleData.messages.length === 0) {
        throw new Error('Invalid Google RCS format: empty messages array');
    }
    
    const message = googleData.messages[0];
    
    if (message.richCard) {
        return _parseGoogleRichCard(message.richCard);
    }
    if (message.text) {
        return { text: _parseTextMessage(message) };
    }
    
    throw new Error('Unsupported Google RCS message type');
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
        if (suggestion.action) {
            return {
                label: suggestion.action.text || '',
                action: suggestion.action.postbackData || '',
                type: _mapGoogleActionType(suggestion.action)
            };
        }
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
    
    return suggestions.map(suggestion => ({
        label: suggestion.label || suggestion.text || '',
        action: suggestion.action || suggestion.postbackData || ''
    }));
};

const _mapParsedToUI = (parsedMessage, baseMessage) => {
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
