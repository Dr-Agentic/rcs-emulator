// RCS Event Handlers - Capture iPhone Emulator Interactions

// Initialize event handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEventCapture();
});

function initializeEventCapture() {
    // Capture user message from iPhone emulator
    const sendBtn = document.getElementById('sendBtn');
    const messageInput = document.getElementById('messageInput');
    
    if (sendBtn && messageInput) {
        // Capture typing indicators
        let typingTimer;
        let isTyping = false;
        
        messageInput.addEventListener('input', function() {
            // User started typing
            if (!isTyping) {
                isTyping = true;
                window.rcsEventCapture.captureTypingIndicator('started');
            }
            
            // Reset typing timer
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
                isTyping = false;
                window.rcsEventCapture.captureTypingIndicator('stopped');
            }, 2000); // Stop typing after 2 seconds of inactivity
        });
        
        sendBtn.addEventListener('click', function(e) {
            console.log('🔍 Send button clicked!');
            e.preventDefault();
            const messageText = messageInput.value.trim();
            console.log('📝 Message text:', messageText);
            
            if (messageText) {
                console.log('✅ Message text is valid, proceeding...');
                
                // Stop typing indicator if active
                if (isTyping) {
                    clearTimeout(typingTimer);
                    isTyping = false;
                    window.rcsEventCapture.captureTypingIndicator('stopped');
                }
                
                // Capture user message event (MAIN EVENT for business servers)
                console.log('📡 Calling captureUserMessage...');
                const messageId = window.rcsEventCapture.captureUserMessage(messageText);
                console.log('✅ Message captured with ID:', messageId);
                
                // Add message to iPhone display
                addMessageToPhone(messageText, 'user');
                
                // Clear input
                messageInput.value = '';
            } else {
                console.log('❌ Message text is empty, not sending');
            }
        });
        
        // Also capture on Enter key
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        });
    }
    
    // Capture action button clicks
    initializeActionButtonCapture();
    
    // Capture rich card interactions
    initializeCardInteractionCapture();
    
    // Override existing handleRichCardAction function
    overrideRichCardActions();
    
    // Override existing sendSuggestedAction function
    overrideSuggestedActions();
}

function initializeActionButtonCapture() {
    // Add event listeners to dynamically created RCS action buttons
    document.addEventListener('click', function(e) {
        // Check for rich card actions
        if (e.target.classList.contains('rich-card-action') || 
            e.target.classList.contains('carousel-action')) {
            
            const button = e.target;
            const actionId = extractActionFromOnClick(button.getAttribute('onclick'));
            const actionLabel = button.textContent.trim();
            const actionType = button.classList.contains('primary') ? 'primary' : 'secondary';
            
            // Find source message context
            const messageElement = button.closest('.message');
            const sourceMessageId = messageElement ? messageElement.dataset.messageId || 'msg_' + Date.now() : 'msg_unknown';
            
            // Extract card context
            const cardElement = button.closest('.rich-card, .carousel-card');
            const context = cardElement ? {
                cardTitle: cardElement.querySelector('.rich-card-title, .carousel-title')?.textContent || '',
                cardDescription: cardElement.querySelector('.rich-card-description, .carousel-description')?.textContent || ''
            } : {};
            
            // Capture action click event
            window.rcsEventCapture.captureActionClick(actionId, actionLabel, actionType, sourceMessageId, context);
        }
        
        // Check for suggested actions
        if (e.target.classList.contains('suggested-action')) {
            const button = e.target;
            const actionId = extractActionFromOnClick(button.getAttribute('onclick'));
            const actionLabel = button.textContent.trim();
            const actionType = 'quick_reply';
            
            // Find source message context
            const messageElement = button.closest('.message');
            const sourceMessageId = messageElement ? messageElement.dataset.messageId || 'msg_' + Date.now() : 'msg_unknown';
            
            // Capture action click event
            window.rcsEventCapture.captureActionClick(actionId, actionLabel, actionType, sourceMessageId, {});
        }
    });
}

function initializeCardInteractionCapture() {
    // Add event listeners to rich card elements (excluding buttons)
    document.addEventListener('click', function(e) {
        // Check if clicked element is part of a rich card but not a button
        const cardElement = e.target.closest('.rich-card, .carousel-card');
        
        if (cardElement && 
            !e.target.closest('.rich-card-action, .carousel-action, .suggested-action') &&
            !e.target.classList.contains('rich-card-action') &&
            !e.target.classList.contains('carousel-action') &&
            !e.target.classList.contains('suggested-action')) {
            
            const cardId = cardElement.dataset.cardId || 'card_' + Date.now();
            const interactionType = 'tap';
            
            // Find source message
            const messageElement = cardElement.closest('.message');
            const sourceMessageId = messageElement ? messageElement.dataset.messageId || 'msg_' + Date.now() : 'msg_unknown';
            
            // Extract card context
            const cardContext = {
                title: cardElement.querySelector('.rich-card-title, .carousel-title')?.textContent || '',
                description: cardElement.querySelector('.rich-card-description, .carousel-description')?.textContent || '',
                imageUrl: cardElement.querySelector('.rich-card-image, .carousel-image')?.src || ''
            };
            
            // Capture card interaction event
            window.rcsEventCapture.captureCardInteraction(cardId, interactionType, sourceMessageId, cardContext);
            
            // Visual feedback
            cardElement.style.transform = 'scale(0.98)';
            setTimeout(() => {
                cardElement.style.transform = 'scale(1)';
            }, 150);
        }
    });
}

// Override the existing handleRichCardAction function to capture events
function overrideRichCardActions() {
    const originalHandleRichCardAction = window.handleRichCardAction;
    
    window.handleRichCardAction = function(action, context = {}) {
        // Call original function first
        if (originalHandleRichCardAction) {
            originalHandleRichCardAction(action, context);
        }
        
        // Our event capture is already handled by click listeners
        // This override ensures compatibility with existing code
    };
}

// Override the existing sendSuggestedAction function to capture events
function overrideSuggestedActions() {
    const originalSendSuggestedAction = window.sendSuggestedAction;
    
    window.sendSuggestedAction = function(label, action) {
        // Call original function first
        if (originalSendSuggestedAction) {
            originalSendSuggestedAction(label, action);
        }
        
        // Our event capture is already handled by click listeners
        // This override ensures compatibility with existing code
    };
}

// Helper function to extract action from onclick attribute
function extractActionFromOnClick(onclickStr) {
    if (!onclickStr) return 'unknown_action';
    
    // Extract action from handleRichCardAction('action_name') or sendSuggestedAction('label', 'action')
    const match = onclickStr.match(/'([^']+)'/);
    return match ? match[1].toLowerCase().replace(/\s+/g, '_') : 'unknown_action';
}

// Helper function to add message to iPhone display
function addMessageToPhone(text, sender) {
    const messagesContainer = document.querySelector('.messages-container');
    if (!messagesContainer) return;
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}-message`;
    messageElement.dataset.messageId = 'msg_' + Date.now();
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text;
    
    const timestamp = document.createElement('div');
    timestamp.className = 'message-time';
    timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageElement.appendChild(messageContent);
    messageElement.appendChild(timestamp);
    messagesContainer.appendChild(messageElement);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Export for global access
window.rcsEventHandlers = {
    initializeEventCapture,
    addMessageToPhone
};
