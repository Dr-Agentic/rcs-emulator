// RCS Emulator JavaScript
// MessageFormatHandler will be available as global after script loads

class RCSEmulator {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.attachmentOptionsVisible = false;
        this.currentTime = new Date();
        
        this.initializeElements();
        this.bindEvents();
        this.updateTime();
        this.connectToSSE();
        
        // Initialize with welcome messages
        this.addSystemMessage();
    }

    initializeElements() {
        this.messagesContainer = document.getElementById('messagesContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.attachmentBtn = document.getElementById('attachmentBtn');
        this.attachmentOptions = document.getElementById('attachmentOptions');
        this.fileInput = document.getElementById('fileInput');
        this.typingIndicator = document.getElementById('typingIndicator');
        this.timeDisplay = document.querySelector('.time');
    }

    bindEvents() {
        // Send message events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Input events
        this.messageInput.addEventListener('input', () => {
            this.handleInputChange();
            this.showTypingIndicator();
        });

        // Attachment events
        this.attachmentBtn.addEventListener('click', () => this.toggleAttachmentOptions());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        // Attachment option events
        document.querySelectorAll('.attachment-option').forEach(option => {
            option.addEventListener('click', (e) => this.handleAttachmentOption(e));
        });

        // Auto-resize textarea
        this.messageInput.addEventListener('input', () => this.autoResizeTextarea());

        // Click outside to close attachment options
        document.addEventListener('click', (e) => {
            if (!this.attachmentBtn.contains(e.target) && !this.attachmentOptions.contains(e.target)) {
                this.hideAttachmentOptions();
            }
        });
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: false 
        });
        this.timeDisplay.textContent = timeString;
        
        // Update every minute
        setTimeout(() => this.updateTime(), 60000);
    }

    handleInputChange() {
        const hasText = this.messageInput.value.trim().length > 0;
        this.sendBtn.disabled = !hasText;
        
        if (hasText) {
            this.sendBtn.style.background = '#007AFF';
        } else {
            this.sendBtn.style.background = '#c7c7cc';
        }
    }

    autoResizeTextarea() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    sendMessage() {
        const text = this.messageInput.value.trim();
        if (!text) return;

        // 📡 CAPTURE USER MESSAGE EVENT for RCS business server
        if (window.rcsEventCapture) {
            console.log('📡 Capturing user message event:', text);
            window.rcsEventCapture.captureUserMessage(text);
        }

        // Create Google RCS format message (consistent with API)
        const rcsMessage = {
            messages: [
                {
                    type: 'text',
                    text: text
                }
            ],
            sender: 'user'
        };

        // Process through the same pipeline as API messages
        const uiMessage = this.convertApiToUIMessage(rcsMessage);
        
        // Handle both single and array messages consistently
        if (Array.isArray(uiMessage)) {
            uiMessage.forEach((msg, index) => {
                msg.type = 'sent'; // Override to sent for user messages
                msg.status = 'sending';
                setTimeout(() => {
                    this.addMessage(msg);
                }, index * 50);
            });
        } else {
            uiMessage.type = 'sent';
            uiMessage.status = 'sending';
            this.addMessage(uiMessage);
        }

        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.handleInputChange();
        this.hideAttachmentOptions();

        // Send user interaction to configured server
        this.sendUserInteraction({
            type: 'message',
            messageType: 'text',
            text: text,
            userId: this.getUserId(),
            messageId: uiMessage.id || (Array.isArray(uiMessage) ? uiMessage[0].id : Date.now())
        });

        // Simulate message status updates
        setTimeout(() => this.updateMessageStatus(message.id, 'sent'), 500);
        setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 1000);
        setTimeout(() => this.updateMessageStatus(message.id, 'read'), 2000);
    }

    addMessage(message) {
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    formatMessageTime(timestamp) {
        // Handle both Date objects and ISO strings properly
        if (!timestamp) {
            return new Date().toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit'
            });
        }
        
        let date;
        if (timestamp instanceof Date) {
            date = timestamp;
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
            // Check if the date is valid
            if (isNaN(date.getTime())) {
                date = new Date(); // Fallback to current time
            }
        } else {
            date = new Date(); // Fallback to current time
        }
        
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;
        messageElement.dataset.messageId = message.id;

        const timeString = this.formatMessageTime(message.timestamp);

        let statusHTML = '';
        if (message.type === 'sent') {
            statusHTML = `
                <div class="message-status">
                    <span class="read-receipt" data-status="${message.status}">
                        ${this.getStatusIcon(message.status)}
                    </span>
                </div>
            `;
        }

        if (message.media) {
            messageElement.innerHTML = `
                <div class="message-content">
                    ${this.renderMedia(message.media)}
                    ${message.text ? `<p>${this.escapeHtml(message.text)}</p>` : ''}
                    <div class="message-time">${timeString}</div>
                </div>
                ${statusHTML}
            `;
        } else if (message.richCard) {
            messageElement.innerHTML = `
                <div class="message-content">
                    ${this.renderRichCard(message.richCard)}
                    <div class="message-time">${timeString}</div>
                </div>
                ${statusHTML}
            `;
        } else if (message.carousel) {
            messageElement.classList.add('carousel-message');
            messageElement.innerHTML = `
                <div class="message-content">
                    ${this.renderCarousel(message.carousel)}
                    <div class="message-time">${timeString}</div>
                </div>
                ${statusHTML}
            `;
        } else {
            messageElement.innerHTML = `
                <div class="message-content">
                    <p>${this.escapeHtml(message.text)}</p>
                    <div class="message-time">${timeString}</div>
                </div>
                ${statusHTML}
            `;
        }

        // Add suggested actions if present
        if (message.suggestedActions) {
            const actionsHTML = this.renderSuggestedActions(message.suggestedActions);
            messageElement.querySelector('.message-content').insertAdjacentHTML('beforeend', actionsHTML);
        }

        this.messagesContainer.appendChild(messageElement);
    }

    renderMedia(media) {
        switch (media.type) {
            case 'image':
                return `<div class="message-media"><img src="${media.url}" alt="Image" onclick="this.requestFullscreen()"></div>`;
            case 'video':
                // Check if it's a YouTube embed URL
                if (media.url.includes('youtube.com/embed/')) {
                    return `<div class="message-media">
                        <iframe 
                            src="${media.url}" 
                            width="300" 
                            height="200" 
                            frameborder="0" 
                            allowfullscreen
                            style="border-radius: 8px;">
                        </iframe>
                    </div>`;
                } else {
                    return `<div class="message-media"><video src="${media.url}" controls style="max-width: 300px; border-radius: 8px;"></video></div>`;
                }
            case 'document':
                return `
                    <div class="message-document">
                        <div class="document-icon">${this.getDocumentIcon(media.name)}</div>
                        <div class="document-info">
                            <h4>${media.name}</h4>
                            <p>${this.formatFileSize(media.size)}</p>
                        </div>
                    </div>
                `;
            default:
                return '';
        }
    }

    renderCarousel(carousel) {
        const carouselId = `carousel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        return `
            <div class="carousel-container" id="${carouselId}">
                <div class="carousel-nav-left" onclick="scrollCarousel('${carouselId}', 'left')">
                    <div class="carousel-arrow">◀</div>
                </div>
                <div class="carousel-scroll">
                    ${carousel.cards.map((card, index) => `
                        <div class="carousel-card" data-index="${index}">
                            ${card.image ? `<img src="${card.image}" alt="${card.title || 'Card image'}" class="carousel-image">` : ''}
                            <div class="carousel-content">
                                ${card.title ? `<h3 class="carousel-title">${this.escapeHtml(card.title)}</h3>` : ''}
                                ${card.description ? `<p class="carousel-description">${this.escapeHtml(card.description)}</p>` : ''}
                                ${card.actions && card.actions.length > 0 ? `
                                    <div class="carousel-actions">
                                        ${card.actions.map(action => 
                                            `<button class="carousel-action ${action.type || ''}" 
                                                    data-postback="${action.action}"
                                                    data-display-text="${action.label}"
                                                    data-action-type="${action.type || 'secondary'}"
                                                    data-card-title="${card.title}"
                                                    data-card-index="${index}">${this.escapeHtml(action.label)}</button>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="carousel-nav-right" onclick="scrollCarousel('${carouselId}', 'right')">
                    <div class="carousel-arrow">▶</div>
                </div>
                <div class="carousel-indicators">
                    ${carousel.cards.map((_, index) => `
                        <div class="carousel-dot ${index === 0 ? 'active' : ''}" onclick="scrollCarouselToCard('${carouselId}', ${index})"></div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderRichCard(card) {
        return `
            <div class="rich-card">
                ${card.image ? `<img src="${card.image}" alt="${card.title}" class="rich-card-image">` : ''}
                <div class="rich-card-content">
                    <h3 class="rich-card-title">${this.escapeHtml(card.title)}</h3>
                    <p class="rich-card-description">${this.escapeHtml(card.description)}</p>
                    <div class="rich-card-actions">
                        ${card.actions.map(action => 
                            `<button class="rich-card-action ${action.type || ''}" 
                                    data-postback="${action.action}"
                                    data-display-text="${action.label}"
                                    data-action-type="${action.type || 'secondary'}">${action.label}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderSuggestedActions(actions) {
        return `
            <div class="suggested-actions">
                ${actions.map((action, index) => {
                    // Handle GSMA UP compliant format
                    const displayText = action.displayText || action.text || action.label || '';
                    const postbackData = action.postbackData || action.action || '';
                    const suggestionType = action.type || 'action'; // reply or action
                    
                    return `<button class="suggested-action" 
                                   data-suggestion-type="${suggestionType}"
                                   data-postback="${postbackData}"
                                   data-display-text="${displayText}"
                                   data-action-index="${index}">${displayText}</button>`;
                }).join('')}
            </div>
        `;
    }

    getStatusIcon(status) {
        switch (status) {
            case 'sending': return '○';
            case 'sent': return '✓';
            case 'delivered': return '✓✓';
            case 'read': return '✓✓';
            default: return '○';
        }
    }

    async sendUserInteraction(interactionData) {
        // Use dashboard's sendUserInteraction method if available
        if (window.dashboard && typeof window.dashboard.sendUserInteraction === 'function') {
            await window.dashboard.sendUserInteraction(interactionData);
        } else {
            console.log('Dashboard not available, interaction logged:', interactionData);
        }
    }

    getUserId() {
        let userId = localStorage.getItem('rcs_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('rcs_user_id', userId);
        }
        return userId;
    }

    updateMessageStatus(messageId, status) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            const statusElement = messageElement.querySelector('[data-status]');
            if (statusElement) {
                statusElement.dataset.status = status;
                statusElement.textContent = this.getStatusIcon(status);
                
                if (status === 'read') {
                    statusElement.style.color = '#007AFF';
                }
            }
        }

        // Update message in array
        const message = this.messages.find(m => m.id === messageId);
        if (message) {
            message.status = status;
        }
    }

    toggleAttachmentOptions() {
        this.attachmentOptionsVisible = !this.attachmentOptionsVisible;
        this.attachmentOptions.style.display = this.attachmentOptionsVisible ? 'block' : 'none';
    }

    hideAttachmentOptions() {
        this.attachmentOptionsVisible = false;
        this.attachmentOptions.style.display = 'none';
    }

    handleAttachmentOption(e) {
        const type = e.currentTarget.dataset.type;
        
        switch (type) {
            case 'photo':
            case 'video':
            case 'document':
                this.fileInput.accept = this.getFileAccept(type);
                this.fileInput.click();
                break;
            case 'camera':
                this.simulateCameraCapture();
                break;
            case 'location':
                this.shareLocation();
                break;
            case 'contact':
                this.shareContact();
                break;
        }
        
        this.hideAttachmentOptions();
    }

    getFileAccept(type) {
        switch (type) {
            case 'photo': return 'image/*';
            case 'video': return 'video/*';
            case 'document': return '.pdf,.doc,.docx,.txt,.xlsx,.pptx';
            default: return '*/*';
        }
    }

    handleFileUpload(e) {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            // Create Google RCS format media message
            const rcsMessage = {
                messages: [
                    {
                        type: 'media',
                        media: {
                            mediaType: this.getMediaType(file.type),
                            url: URL.createObjectURL(file),
                            name: file.name,
                            size: file.size
                        }
                    }
                ],
                sender: 'user'
            };

            // Process through consistent pipeline
            const uiMessage = this.convertApiToUIMessage(rcsMessage);
            if (Array.isArray(uiMessage)) {
                uiMessage.forEach(msg => {
                    msg.type = 'sent';
                    msg.status = 'sending';
                    this.addMessage(msg);
                });
            } else {
                uiMessage.type = 'sent';
                uiMessage.status = 'sending';
                this.addMessage(uiMessage);
            }
            
            // Simulate upload progress
            const messageId = Array.isArray(uiMessage) ? uiMessage[0].id : uiMessage.id;
            setTimeout(() => this.updateMessageStatus(messageId, 'sent'), 1000);
            setTimeout(() => this.updateMessageStatus(messageId, 'delivered'), 2000);
            setTimeout(() => this.updateMessageStatus(messageId, 'read'), 3000);
        });

        // Clear file input
        e.target.value = '';
    }

    getMediaType(mimeType) {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        return 'document';
    }

    getDocumentIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        switch (ext) {
            case 'pdf': return '📄';
            case 'doc':
            case 'docx': return '📝';
            case 'xls':
            case 'xlsx': return '📊';
            case 'ppt':
            case 'pptx': return '📈';
            default: return '📄';
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    simulateCameraCapture() {
        // Create Google RCS format image message
        const rcsMessage = {
            messages: [
                {
                    type: 'media',
                    media: {
                        mediaType: 'image',
                        url: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=📷+Photo',
                        name: 'IMG_' + Date.now() + '.jpg',
                        size: 1024000
                    }
                }
            ],
            sender: 'user'
        };

        // Process through consistent pipeline
        const uiMessage = this.convertApiToUIMessage(rcsMessage);
        if (Array.isArray(uiMessage)) {
            uiMessage.forEach(msg => {
                msg.type = 'sent';
                msg.status = 'sending';
                this.addMessage(msg);
            });
        } else {
            uiMessage.type = 'sent';
            uiMessage.status = 'sending';
            this.addMessage(uiMessage);
        }

        const messageId = Array.isArray(uiMessage) ? uiMessage[0].id : uiMessage.id;
        setTimeout(() => this.updateMessageStatus(messageId, 'sent'), 500);
        setTimeout(() => this.updateMessageStatus(messageId, 'delivered'), 1000);
        setTimeout(() => this.updateMessageStatus(messageId, 'read'), 2000);
    }

    shareLocation() {
        // Create Google RCS format rich card for location
        const rcsMessage = {
            messages: [
                {
                    type: 'richCard',
                    richCard: {
                        standaloneCard: {
                            cardContent: {
                                title: 'Current Location',
                                description: 'San Francisco, CA, USA',
                                media: {
                                    height: 'MEDIUM',
                                    contentInfo: {
                                        fileUrl: 'https://via.placeholder.com/300x160/007AFF/FFFFFF?text=📍+Map',
                                        altText: 'Location Map'
                                    }
                                },
                                suggestions: [
                                    {
                                        action: {
                                            urlAction: {
                                                openUrl: {
                                                    url: 'https://maps.apple.com/?ll=37.7749,-122.4194'
                                                }
                                            }
                                        },
                                        text: 'Open in Maps'
                                    }
                                ]
                            }
                        }
                    }
                }
            ],
            sender: 'user'
        };

        // Process through consistent pipeline
        const uiMessage = this.convertApiToUIMessage(rcsMessage);
        if (Array.isArray(uiMessage)) {
            uiMessage.forEach(msg => {
                msg.type = 'sent';
                msg.status = 'sending';
                this.addMessage(msg);
            });
        } else {
            uiMessage.type = 'sent';
            uiMessage.status = 'sending';
            this.addMessage(uiMessage);
        }

        const messageId = Array.isArray(uiMessage) ? uiMessage[0].id : uiMessage.id;
        setTimeout(() => this.updateMessageStatus(messageId, 'sent'), 500);
        setTimeout(() => this.updateMessageStatus(messageId, 'delivered'), 1000);
        setTimeout(() => this.updateMessageStatus(messageId, 'read'), 2000);
    }

    shareContact() {
        const message = {
            id: Date.now(),
            text: '',
            type: 'sent',
            timestamp: new Date(),
            status: 'sending',
            richCard: {
                title: 'John Doe',
                description: '+1 (555) 123-4567\njohn.doe@email.com',
                image: 'https://via.placeholder.com/80x80/007AFF/FFFFFF?text=JD',
                actions: [
                    { label: 'Add Contact', action: 'add_contact', type: 'primary' },
                    { label: 'Call', action: 'call_contact', type: 'secondary' }
                ]
            }
        };

        this.addMessage(message);
        setTimeout(() => this.updateMessageStatus(message.id, 'sent'), 500);
        setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 1000);
        setTimeout(() => this.updateMessageStatus(message.id, 'read'), 2000);
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();

        // Hide after 3 seconds of no typing
        clearTimeout(this.typingTimeout);
        this.typingTimeout = setTimeout(() => {
            this.hideTypingIndicator();
        }, 3000);
    }

    hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        }, 100);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    connectToSSE() {
        this.eventSource = new EventSource('/api/events');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'newMessage') {
                this.renderApiMessage(data.message); // data.message is now the server envelope
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
        };

        console.log('Connected to SSE stream for real-time messages');
    }

    renderApiMessage(serverEnvelope) {
        // Extract pure RCS content from server envelope
        console.log("renderApiMessage --> Server Envelope: ", serverEnvelope);

        const rcsMessage = serverEnvelope.content || serverEnvelope;
        const uiMessage = this.convertApiToUIMessage(rcsMessage);
        
        // Handle message arrays (Google RCS format)
        if (Array.isArray(uiMessage)) {
            uiMessage.forEach((msg, index) => {
                setTimeout(() => {
                    this.addMessage(msg);
                }, index * 200);
            });
        } else {
            this.addMessage(uiMessage);
        }
    }

    convertApiToUIMessage(rcsMessage) {
        try {
            // Use universal message format handler with pure RCS content
            const parsedMessage = MessageFormatHandler.parseMessage(rcsMessage);
            const sender = rcsMessage.sender || 'business';
            return MessageFormatHandler.convertToUIMessage(parsedMessage, sender);
        } catch (error) {
            console.error('Message parsing error:', error);
            // Fallback to simple text message
            return {
                id: Date.now() + Math.random(),
                timestamp: new Date(),
                type: 'received',
                text: `Error parsing message: ${error.message}`
            };
        }
    }

    addSystemMessage() {
        // Add welcome message using proper RCS method chain
        const welcomeMessage = {
            id: Date.now(),
            text: 'Welcome to RCS Emulator SaaS! 🎉',
            type: 'received',
            timestamp: new Date()
        };

        // Use the same method chain as API calls
        setTimeout(() => {
            this.addMessage(welcomeMessage);
        }, 500);
    }
}

// Global functions for rich card actions
window.handleRichCardAction = function(action, context = {}) {
    console.log('Rich card action:', action);
    
    // NOTE: Legacy sendUserInteraction removed - now using GSMA UP compliant
    // event capture via rcs-event-handlers.js for rich card button clicks
    
    // Handle rich card actions here
    switch (action) {
        case 'buy_now':
        case 'buy_iphone':
            alert('🛒 Redirecting to purchase page...');
            break;
        case 'learn_more':
            alert('📖 Opening product details...');
            break;
        case 'order_coffee':
            alert('☕ Adding to cart...');
            break;
        case 'view_menu':
            alert('📋 Opening menu...');
            break;
        case 'open_maps':
            alert('🗺️ Opening in Maps app...');
            break;
        case 'add_contact':
            alert('📞 Adding contact to address book...');
            break;
        case 'call_contact':
            alert('📱 Initiating call...');
            break;
        default:
            console.log('Unknown action:', action);
            alert(`Action: ${action}`);
    }
};

window.sendSuggestedAction = function(displayText, postbackData = '', suggestionType = 'action') {
    if (window.rcsEmulator) {
        // Find the source message ID (latest business message)
        const messages = document.querySelectorAll('.message.received');
        const sourceMessageId = messages.length > 0 ? 
            messages[messages.length - 1].dataset.messageId || 'msg_' + Date.now() : 
            'msg_unknown';
        
        // Capture the appropriate event based on suggestion type
        if (suggestionType === 'reply') {
            // Handle as suggested reply (generates userMessage)
            if (window.rcsEventCapture) {
                window.rcsEventCapture.captureSuggestedReply(displayText, postbackData, sourceMessageId, {});
            }
            
            // Send the reply text as a user message
            window.rcsEmulator.messageInput.value = displayText;
            window.rcsEmulator.sendMessage();
        } else {
            // Handle as suggestion action (generates suggestionResponse)
            if (window.rcsEventCapture) {
                window.rcsEventCapture.captureSuggestionResponse(
                    postbackData, 
                    displayText, 
                    'action', 
                    sourceMessageId, 
                    null, // actionUrl
                    { buttonType: 'suggested-action' }
                );
            }
            
            // For actions, we don't send a user message, just capture the event
            console.log(`Suggestion action triggered: ${displayText} (${postbackData})`);
        }
        
        // NOTE: Legacy interaction tracking removed - now using GSMA UP compliant
        // event capture via rcsEventCapture.captureSuggestionResponse() above
    }
};

// Tab functionality
class TabManager {
    constructor() {
        this.initializeTabs();
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.menu-item');
        const tabContents = document.querySelectorAll('.tab-pane');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }
}

// Initialize the RCS Emulator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.rcsEmulator = new RCSEmulator();
    window.developerPanel = new DeveloperPanel();
    window.tabManager = new TabManager();
});

// Developer Panel Class
class DeveloperPanel {
    constructor() {
        this.initializeElements();
        this.bindEvents();
        this.setupExamples();
    }

    initializeElements() {
        this.jsonInput = document.getElementById('jsonInput');
        this.sendJsonBtn = document.getElementById('sendJsonBtn');
        this.jsonStatus = document.getElementById('jsonStatus');
        this.exampleBtns = document.querySelectorAll('.example-btn');
    }

    bindEvents() {
        this.sendJsonBtn.addEventListener('click', () => this.sendJSONMessage());
        
        this.exampleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.loadExample(e.target.dataset.example));
        });

        // Clear status on input change
        this.jsonInput.addEventListener('input', () => {
            this.clearStatus();
        });
    }

    setupExamples() {
        this.examples = {
            text: {
                type: "text",
                text: "Hello! This is a test message from the developer panel.",
                sender: "business"
            },
            richCard: {
                type: "richCard",
                title: "Developer Test Card",
                description: "This rich card was sent from the developer panel to test RCS functionality.",
                image: "https://via.placeholder.com/300x160/007AFF/FFFFFF?text=DEV+TEST",
                actions: [
                    { label: "Primary Action", action: "primary_test", type: "primary" },
                    { label: "Secondary Action", action: "secondary_test", type: "secondary" }
                ]
            },
            suggestedActions: {
                type: "text",
                text: "Please choose one of the following options:",
                sender: "business",
                suggestedActions: [
                    { text: "Option 1" },
                    { text: "Option 2" },
                    { text: "Option 3" }
                ]
            },
            media: {
                type: "media",
                mediaType: "image",
                url: "https://via.placeholder.com/300x200/34C759/FFFFFF?text=📱+RCS+Media",
                text: "This is a media message sent from the developer panel."
            }
        };
    }

    validateJSON() {
        const jsonText = this.jsonInput.value.trim();
        
        if (!jsonText) {
            this.showStatus('Please enter JSON content to validate.', 'error');
            return false;
        }

        try {
            const parsed = JSON.parse(jsonText);
            
            // Use universal format handler for validation
            const format = MessageFormatHandler.detectMessageFormat(parsed);
            const parsedMessage = MessageFormatHandler.parseMessage(parsed);
            
            this.showStatus(`✅ Valid ${format} format message ready to send!`, 'success');
            this.sendJsonBtn.disabled = false;
            return true;
            
        } catch (error) {
            this.showStatus(`Validation Error: ${error.message}`, 'error');
            this.sendJsonBtn.disabled = true;
            return false;
        }
    }

    sendJSONMessage() {
        if (!this.validateJSON()) {
            return;
        }

        try {
            const messageData = JSON.parse(this.jsonInput.value.trim());
            
            // Create server envelope structure (same as API)
            const serverEnvelope = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                status: 'sent',
                content: messageData  // Pure RCS message
            };
            
            if (window.rcsEmulator) {
                // Use existing pipeline that handles arrays correctly
                window.rcsEmulator.renderApiMessage(serverEnvelope);
                this.showStatus('✅ Message sent to phone successfully!', 'success');
                
                // Generate delivery/read events for business→user messages
                const businessMessageId = 'msg_business_' + Date.now();
                
                // Simulate message delivery (business message reached user device)
                setTimeout(() => {
                    if (window.rcsEventCapture) {
                        window.rcsEventCapture.captureMessageStatus(businessMessageId, 'delivered');
                    }
                }, 800);
                
                // Simulate message read (user opened business message)
                setTimeout(() => {
                    if (window.rcsEventCapture) {
                        window.rcsEventCapture.captureMessageStatus(businessMessageId, 'read');
                    }
                }, 2000);
                
            } else {
                this.showStatus('Error: RCS Emulator not found.', 'error');
            }
            
        } catch (error) {
            this.showStatus(`Error sending message: ${error.message}`, 'error');
        }
    }

    // Method removed - now using renderApiMessage pipeline for consistency

    loadExample(exampleType) {
        if (this.examples[exampleType]) {
            this.jsonInput.value = JSON.stringify(this.examples[exampleType], null, 2);
            this.clearStatus();
        }
    }

    clearInput() {
        this.jsonInput.value = '';
        this.clearStatus();
    }

    showStatus(message, type) {
        this.jsonStatus.textContent = message;
        this.jsonStatus.className = `status-message ${type}`;
    }

    clearStatus() {
        this.jsonStatus.className = 'status-message';
        this.jsonStatus.textContent = '';
    }
}

// Carousel navigation functions
window.scrollCarousel = function(carouselId, direction) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const scrollContainer = carousel.querySelector('.carousel-scroll');
    const cardWidth = 292; // 280px card + 12px gap
    const currentScroll = scrollContainer.scrollLeft;
    
    if (direction === 'left') {
        scrollContainer.scrollTo({
            left: Math.max(0, currentScroll - cardWidth),
            behavior: 'smooth'
        });
    } else {
        scrollContainer.scrollTo({
            left: currentScroll + cardWidth,
            behavior: 'smooth'
        });
    }
    
    // Update navigation arrows and indicators after scroll
    setTimeout(() => updateCarouselNavigation(carouselId), 300);
};

window.scrollCarouselToCard = function(carouselId, cardIndex) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const scrollContainer = carousel.querySelector('.carousel-scroll');
    const cardWidth = 292; // 280px card + 12px gap
    
    scrollContainer.scrollTo({
        left: cardIndex * cardWidth,
        behavior: 'smooth'
    });
    
    // Update indicators
    setTimeout(() => updateCarouselNavigation(carouselId), 300);
};

function updateCarouselNavigation(carouselId) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    
    const scrollContainer = carousel.querySelector('.carousel-scroll');
    const leftArrow = carousel.querySelector('.carousel-nav-left');
    const rightArrow = carousel.querySelector('.carousel-nav-right');
    const dots = carousel.querySelectorAll('.carousel-dot');
    
    const scrollLeft = scrollContainer.scrollLeft;
    const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
    const cardWidth = 292;
    const currentCard = Math.round(scrollLeft / cardWidth);
    
    // Update arrow visibility
    leftArrow.style.opacity = scrollLeft > 10 ? '1' : '0';
    rightArrow.style.opacity = scrollLeft < maxScroll - 10 ? '1' : '0';
    
    // Update dot indicators
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCard);
    });
}

// Initialize carousel navigation on scroll
document.addEventListener('DOMContentLoaded', () => {
    // Add scroll listeners to all carousels
    document.addEventListener('scroll', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('carousel-scroll')) {
            const carousel = e.target.closest('.carousel-container');
            if (carousel) {
                updateCarouselNavigation(carousel.id);
            }
        }
    }, true);
    
    // Add click listeners for suggested action buttons
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('suggested-action')) {
            const button = e.target;
            const displayText = button.dataset.displayText || button.textContent.trim();
            const postbackData = button.dataset.postback || '';
            const suggestionType = button.dataset.suggestionType || 'action';
            
            // Call the sendSuggestedAction function with proper parameters
            sendSuggestedAction(displayText, postbackData, suggestionType);
        }
    });
});
// Global collapsible toggle function
function toggleCollapsible(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.collapse-icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}
