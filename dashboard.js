// Dashboard functionality for RCS Emulator SaaS
class Dashboard {
    constructor() {
        this.messageCount = 0;
        this.eventSource = null;
        this.init();
    }

    init() {
        // Check authentication
        if (!window.AuthSystem.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        this.setupUI();
        this.bindEvents();
        this.loadUserData();
        this.setupNavigation();
        this.setupSSE();
    }

    setupSSE() {
        // Connect to Server-Sent Events for real-time messages
        try {
            this.eventSource = new EventSource('/api/events');
            
            this.eventSource.onopen = () => {
                console.log('SSE connection established');
                this.showToast('Connected to real-time updates', 'success');
            };

            this.eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleSSEMessage(data);
                } catch (error) {
                    console.error('Error parsing SSE message:', error);
                }
            };

            this.eventSource.onerror = (error) => {
                console.error('SSE connection error:', error);
                this.showToast('Real-time connection lost', 'error');
            };

        } catch (error) {
            console.error('Failed to establish SSE connection:', error);
        }
    }

    handleSSEMessage(data) {
        if (data.type === 'connected') {
            console.log('SSE client connected with ID:', data.clientId);
        } else if (data.type === 'newMessage') {
            // Display the API message in the emulator
            this.displayAPIMessage(data.message);
            this.incrementMessageCount();
        }
    }

    displayAPIMessage(messageData) {
        // Convert API message to emulator format and display
        if (window.rcsEmulator) {
            const message = this.convertAPIMessageToEmulator(messageData);
            window.rcsEmulator.addMessage(message);
            this.showToast('New API message received!', 'info');
        }
    }

    convertAPIMessageToEmulator(apiMessage) {
        const baseMessage = {
            id: apiMessage.id,
            timestamp: new Date(apiMessage.timestamp),
            sender: apiMessage.sender || 'business',
            status: 'delivered'
        };

        switch (apiMessage.type) {
            case 'text':
                return {
                    ...baseMessage,
                    type: 'text',
                    text: apiMessage.text
                };

            case 'richCard':
                return {
                    ...baseMessage,
                    type: 'richCard',
                    title: apiMessage.title,
                    description: apiMessage.description,
                    image: apiMessage.image,
                    actions: apiMessage.actions || []
                };

            case 'media':
                return {
                    ...baseMessage,
                    type: 'media',
                    mediaType: apiMessage.mediaType,
                    url: apiMessage.url,
                    caption: apiMessage.caption
                };

            default:
                return {
                    ...baseMessage,
                    type: 'text',
                    text: `Unsupported message type: ${apiMessage.type}`
                };
        }
    }

    setupUI() {
        // Display user information
        const user = window.AuthSystem.getCurrentUser();
        const apiKey = window.AuthSystem.getApiKey();

        if (user) {
            document.getElementById('username').textContent = user.username;
            document.getElementById('settingsUsername').textContent = user.username;
            
            if (user.loginTime) {
                const loginTime = new Date(user.loginTime).toLocaleString();
                document.getElementById('loginTime').textContent = loginTime;
            }
        }

        if (apiKey) {
            document.getElementById('apiKeyDisplay').textContent = apiKey;
            document.getElementById('settingsApiKey').textContent = apiKey;
        }
    }

    bindEvents() {
        // Copy API key buttons
        document.getElementById('copyApiKey').addEventListener('click', () => {
            this.copyToClipboard(window.AuthSystem.getApiKey());
        });

        document.getElementById('copySettingsApiKey').addEventListener('click', () => {
            this.copyToClipboard(window.AuthSystem.getApiKey());
        });

        // API test button
        document.getElementById('testApiBtn').addEventListener('click', () => {
            this.testApiCall();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.getAttribute('href').substring(1);
                this.showSection(target);
            });
        });
    }

    setupNavigation() {
        // Show emulator section by default
        this.showSection('emulator');
    }

    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Add active class to nav item
        const navItem = document.querySelector(`[href="#${sectionId}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
    }

    loadUserData() {
        // Load message count from localStorage
        const count = localStorage.getItem('rcs_message_count') || '0';
        this.messageCount = parseInt(count);
        document.getElementById('messagesCount').textContent = this.messageCount;
    }

    incrementMessageCount() {
        this.messageCount++;
        localStorage.setItem('rcs_message_count', this.messageCount.toString());
        document.getElementById('messagesCount').textContent = this.messageCount;
    }

    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast('API key copied to clipboard!', 'success');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('API key copied to clipboard!', 'success');
        }
    }

    async testApiCall() {
        const jsonInput = document.getElementById('apiTestJson');
        const resultDiv = document.getElementById('apiTestResult');
        
        try {
            const messageData = JSON.parse(jsonInput.value);
            const apiKey = window.AuthSystem.getApiKey();
            
            // Use the global API function
            const result = await window.sendRCSMessage(apiKey, messageData);
            
            resultDiv.className = 'json-status success';
            resultDiv.style.display = 'block';
            resultDiv.textContent = `✅ API Test Successful! Message ID: ${result.messageId}`;
            
            this.incrementMessageCount();
            
        } catch (error) {
            resultDiv.className = 'json-status error';
            resultDiv.style.display = 'block';
            resultDiv.textContent = `❌ API Test Failed: ${error.message}`;
        }
    }

    showToast(message, type = 'info') {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // Style the toast
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        if (type === 'success') {
            toast.style.background = '#34c759';
        } else if (type === 'error') {
            toast.style.background = '#ff3b30';
        } else {
            toast.style.background = '#007AFF';
        }

        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Enhanced Developer Panel for Dashboard
class DashboardDeveloperPanel extends DeveloperPanel {
    constructor() {
        super();
        this.dashboard = null;
    }

    setDashboard(dashboard) {
        this.dashboard = dashboard;
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
                
                // Increment message count in dashboard
                if (this.dashboard) {
                    this.dashboard.incrementMessageCount();
                }
                
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
}

// Add additional CSS for dashboard-specific elements
const dashboardStyles = `
.dashboard-content {
    padding-top: 80px; /* Account for fixed header */
}

.content-section {
    display: none;
}

.content-section.active {
    display: block;
}

.api-key-section {
    margin-bottom: 24px;
    padding: 16px;
    background: rgba(0, 122, 255, 0.05);
    border: 1px solid rgba(0, 122, 255, 0.2);
    border-radius: 12px;
}

.api-key-section label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1d1d1f;
    margin-bottom: 8px;
}

.api-key-display {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
}

.api-key-display code {
    flex: 1;
    background: rgba(0, 0, 0, 0.05);
    padding: 8px 12px;
    border-radius: 6px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 12px;
    word-break: break-all;
}

.copy-btn {
    background: #007AFF;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
}

.copy-btn:hover {
    background: #0056b3;
}

.api-key-note {
    font-size: 12px;
    color: #6e6e73;
    margin: 0;
}

.api-test-section {
    margin-top: 24px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e5e5e7;
}

.api-test-section h3 {
    margin-bottom: 12px;
}

.api-test-section textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #e5e5e7;
    border-radius: 8px;
    font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
    font-size: 13px;
    margin-bottom: 12px;
    resize: vertical;
}

.settings-section {
    margin-bottom: 32px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e5e5e7;
}

.settings-section h3 {
    margin-bottom: 16px;
    color: #1d1d1f;
}

.setting-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid #e5e5e7;
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-item label {
    font-weight: 600;
    color: #1d1d1f;
}

.usage-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin-top: 16px;
}

.stat-item {
    text-align: center;
    padding: 20px;
    background: white;
    border-radius: 12px;
    border: 1px solid #e5e5e7;
}

.stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #007AFF;
    margin-bottom: 8px;
}

.stat-label {
    font-size: 14px;
    color: #6e6e73;
    font-weight: 500;
}

@media (max-width: 768px) {
    .dashboard-content {
        padding-top: 120px;
    }
    
    .api-key-display {
        flex-direction: column;
        align-items: stretch;
    }
    
    .setting-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
    }
}
`;

// Inject dashboard styles
const styleSheet = document.createElement('style');
styleSheet.textContent = dashboardStyles;
document.head.appendChild(styleSheet);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dashboard
    const dashboard = new Dashboard();
    
    // Replace the original developer panel with dashboard version
    if (window.developerPanel) {
        window.developerPanel = new DashboardDeveloperPanel();
        window.developerPanel.setDashboard(dashboard);
    }
    
    // Make dashboard available globally
    window.dashboard = dashboard;
});
