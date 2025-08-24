// RCS Emulator JavaScript
class RCSEmulator {
    constructor() {
        this.messages = [];
        this.isTyping = false;
        this.attachmentOptionsVisible = false;
        this.currentTime = new Date();
        
        this.initializeElements();
        this.bindEvents();
        this.updateTime();
        this.setupAutoResponses();
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

        const message = {
            id: Date.now(),
            text: text,
            type: 'sent',
            timestamp: new Date(),
            status: 'sending'
        };

        this.addMessage(message);
        this.messageInput.value = '';
        this.autoResizeTextarea();
        this.handleInputChange();
        this.hideAttachmentOptions();

        // Simulate message status updates
        setTimeout(() => this.updateMessageStatus(message.id, 'sent'), 500);
        setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 1000);
        setTimeout(() => this.updateMessageStatus(message.id, 'read'), 2000);

        // Trigger auto-response
        this.triggerAutoResponse(text);
    }

    addMessage(message) {
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }

    renderMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${message.type}`;
        messageElement.dataset.messageId = message.id;

        const timeString = message.timestamp.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

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
                return `<div class="message-media"><video src="${media.url}" controls></video></div>`;
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

    renderRichCard(card) {
        return `
            <div class="rich-card">
                ${card.image ? `<img src="${card.image}" alt="${card.title}" class="rich-card-image">` : ''}
                <div class="rich-card-content">
                    <h3 class="rich-card-title">${this.escapeHtml(card.title)}</h3>
                    <p class="rich-card-description">${this.escapeHtml(card.description)}</p>
                    <div class="rich-card-actions">
                        ${card.actions.map(action => 
                            `<button class="rich-card-action ${action.type || ''}" onclick="handleRichCardAction('${action.action}')">${action.label}</button>`
                        ).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderSuggestedActions(actions) {
        return `
            <div class="suggested-actions">
                ${actions.map(action => 
                    `<button class="suggested-action" onclick="sendSuggestedAction('${action.text}')">${action.text}</button>`
                ).join('')}
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
            const message = {
                id: Date.now() + Math.random(),
                text: '',
                type: 'sent',
                timestamp: new Date(),
                status: 'sending',
                media: {
                    type: this.getMediaType(file.type),
                    url: URL.createObjectURL(file),
                    name: file.name,
                    size: file.size
                }
            };

            this.addMessage(message);
            
            // Simulate upload progress
            setTimeout(() => this.updateMessageStatus(message.id, 'sent'), 1000);
            setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 2000);
            setTimeout(() => this.updateMessageStatus(message.id, 'read'), 3000);
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
        // Simulate camera capture with a placeholder image
        const message = {
            id: Date.now(),
            text: '',
            type: 'sent',
            timestamp: new Date(),
            status: 'sending',
            media: {
                type: 'image',
                url: 'https://via.placeholder.com/300x200/007AFF/FFFFFF?text=📷+Photo',
                name: 'IMG_' + Date.now() + '.jpg',
                size: 1024000
            }
        };

        this.addMessage(message);
        setTimeout(() => this.updateMessageStatus(message.id, 'sent'), 500);
        setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 1000);
        setTimeout(() => this.updateMessageStatus(message.id, 'read'), 2000);
    }

    shareLocation() {
        const message = {
            id: Date.now(),
            text: '',
            type: 'sent',
            timestamp: new Date(),
            status: 'sending',
            richCard: {
                title: 'Current Location',
                description: 'San Francisco, CA, USA',
                image: 'https://via.placeholder.com/300x160/007AFF/FFFFFF?text=📍+Map',
                actions: [
                    { label: 'Open in Maps', action: 'open_maps', type: 'primary' },
                    { label: 'Share', action: 'share_location', type: 'secondary' }
                ]
            }
        };

        this.addMessage(message);
        setTimeout(() => this.updateMessageStatus(message.id, 'sent'), 500);
        setTimeout(() => this.updateMessageStatus(message.id, 'delivered'), 1000);
        setTimeout(() => this.updateMessageStatus(message.id, 'read'), 2000);
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

    // Auto-response system for business messaging simulation
    setupAutoResponses() {
        this.autoResponses = {
            'hello': 'Hello! Welcome to our business messaging service. How can I help you today?',
            'hi': 'Hi there! Thanks for reaching out. What can I do for you?',
            'help': 'I\'m here to help! You can ask me about our products, services, or support.',
            'hours': 'Our business hours are Monday-Friday 9AM-6PM PST.',
            'location': 'We\'re located in San Francisco, CA. Would you like directions?',
            'price': 'Our pricing varies by service. Would you like me to send you our pricing guide?',
            'support': 'I\'ll connect you with our support team right away.',
            'thanks': 'You\'re welcome! Is there anything else I can help you with?',
            'bye': 'Thank you for contacting us! Have a great day! 👋'
        };
    }

    triggerAutoResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        let response = null;

        // Find matching auto-response
        for (const [keyword, reply] of Object.entries(this.autoResponses)) {
            if (lowerMessage.includes(keyword)) {
                response = reply;
                break;
            }
        }

        // Default response if no match
        if (!response) {
            const responses = [
                'Thanks for your message! A team member will get back to you shortly.',
                'I understand. Let me help you with that.',
                'That\'s a great question! Let me provide you with more information.',
                'I\'ll make sure to pass this along to the right department.'
            ];
            response = responses[Math.floor(Math.random() * responses.length)];
        }

        // Send auto-response after delay
        setTimeout(() => {
            this.sendAutoResponse(response);
        }, 1500 + Math.random() * 1000);
    }

    sendAutoResponse(text) {
        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();

            const message = {
                id: Date.now(),
                text: text,
                type: 'received',
                timestamp: new Date()
            };

            // Add suggested actions for certain responses
            if (text.includes('pricing')) {
                message.suggestedActions = [
                    { text: 'View Pricing' },
                    { text: 'Schedule Demo' },
                    { text: 'Contact Sales' }
                ];
            } else if (text.includes('help')) {
                message.suggestedActions = [
                    { text: 'Product Info' },
                    { text: 'Technical Support' },
                    { text: 'Billing Questions' }
                ];
            }

            this.addMessage(message);
        }, 2000 + Math.random() * 1000);
    }

    connectToSSE() {
        this.eventSource = new EventSource('/api/events');
        
        this.eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'newMessage') {
                this.renderApiMessage(data.message);
            }
        };

        this.eventSource.onerror = (error) => {
            console.error('SSE connection error:', error);
        };

        console.log('Connected to SSE stream for real-time messages');
    }

    renderApiMessage(apiMessage) {
        const uiMessage = this.convertApiToUIMessage(apiMessage);
        this.addMessage(uiMessage);
    }

    convertApiToUIMessage(apiMsg) {
        const baseMessage = {
            id: apiMsg.id,
            timestamp: new Date(apiMsg.timestamp),
            type: 'received' // API messages are always received from business
        };

        switch (apiMsg.type) {
            case 'text':
                return {
                    ...baseMessage,
                    text: apiMsg.text,
                    suggestedActions: apiMsg.suggestedActions
                };
                
            case 'richCard':
                return {
                    ...baseMessage,
                    text: '',
                    richCard: {
                        title: apiMsg.title,
                        description: apiMsg.description,
                        image: apiMsg.image,
                        actions: apiMsg.actions || []
                    }
                };
                
            case 'media':
                return {
                    ...baseMessage,
                    text: apiMsg.text || '',
                    media: {
                        type: apiMsg.mediaType,
                        url: apiMsg.url,
                        name: apiMsg.name || `media_${Date.now()}`,
                        size: apiMsg.size || 1024000
                    }
                };
                
            default:
                // For unknown types, treat as text
                return {
                    ...baseMessage,
                    text: apiMsg.text || JSON.stringify(apiMsg)
                };
        }
    }

    addSystemMessage() {
        // Add RCS features indicator
        const featuresMessage = {
            id: Date.now(),
            text: 'RCS Features Active: ✓ Read Receipts ✓ Typing Indicators ✓ Rich Media ✓ Suggested Actions',
            type: 'received',
            timestamp: new Date()
        };

        setTimeout(() => {
            this.addMessage(featuresMessage);
        }, 1000);
    }
}

// Global functions for rich card actions
window.handleRichCardAction = function(action) {
    console.log('Rich card action:', action);
    // Handle rich card actions here
    switch (action) {
        case 'open_maps':
            alert('Opening in Maps app...');
            break;
        case 'add_contact':
            alert('Adding contact to address book...');
            break;
        case 'call_contact':
            alert('Initiating call...');
            break;
        default:
            console.log('Unknown action:', action);
    }
};

window.sendSuggestedAction = function(text) {
    if (window.rcsEmulator) {
        window.rcsEmulator.messageInput.value = text;
        window.rcsEmulator.sendMessage();
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
            
            // Validate required fields
            if (!parsed.type) {
                this.showStatus('Error: "type" field is required.', 'error');
                return false;
            }

            // Validate based on type
            const isValid = this.validateMessageType(parsed);
            
            if (isValid) {
                this.showStatus('✅ JSON is valid and ready to send!', 'success');
                this.sendJsonBtn.disabled = false;
                return true;
            }
            
        } catch (error) {
            this.showStatus(`JSON Parse Error: ${error.message}`, 'error');
            return false;
        }
    }

    validateMessageType(message) {
        switch (message.type) {
            case 'text':
                if (!message.text) {
                    this.showStatus('Error: Text messages require a "text" field.', 'error');
                    return false;
                }
                break;
                
            case 'richCard':
                if (!message.title || !message.description) {
                    this.showStatus('Error: Rich cards require "title" and "description" fields.', 'error');
                    return false;
                }
                if (message.actions && !Array.isArray(message.actions)) {
                    this.showStatus('Error: "actions" must be an array.', 'error');
                    return false;
                }
                break;
                
            case 'media':
                if (!message.mediaType || !message.url) {
                    this.showStatus('Error: Media messages require "mediaType" and "url" fields.', 'error');
                    return false;
                }
                if (!['image', 'video', 'document'].includes(message.mediaType)) {
                    this.showStatus('Error: mediaType must be "image", "video", or "document".', 'error');
                    return false;
                }
                break;
                
            default:
                this.showStatus(`Warning: Unknown message type "${message.type}". Proceeding anyway.`, 'success');
        }
        
        return true;
    }

    sendJSONMessage() {
        if (!this.validateJSON()) {
            return;
        }

        try {
            const messageData = JSON.parse(this.jsonInput.value.trim());
            const message = this.convertJSONToMessage(messageData);
            
            if (window.rcsEmulator) {
                window.rcsEmulator.addMessage(message);
                this.showStatus('✅ Message sent to phone successfully!', 'success');
                
                // Auto-clear after successful send
                setTimeout(() => {
                    this.clearInput();
                }, 2000);
            } else {
                this.showStatus('Error: RCS Emulator not found.', 'error');
            }
            
        } catch (error) {
            this.showStatus(`Error sending message: ${error.message}`, 'error');
        }
    }

    convertJSONToMessage(jsonData) {
        // Use the same converter as RCSEmulator but override the type based on sender
        const apiMessage = {
            ...jsonData,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };
        
        const uiMessage = window.rcsEmulator.convertApiToUIMessage(apiMessage);
        
        // Override type based on sender field
        if (jsonData.sender === 'user') {
            uiMessage.type = 'sent';
        } else {
            uiMessage.type = 'received';
        }
        
        return uiMessage;
    }

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
