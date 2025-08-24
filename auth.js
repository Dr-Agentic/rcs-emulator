// Authentication System for RCS Emulator SaaS
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.apiKey = null;
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkAuthStatus();
        
        // Bind login form if it exists
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Bind logout button if it exists
        const logoutBtn = document.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    checkAuthStatus() {
        const userData = localStorage.getItem('rcs_user');
        const apiKey = localStorage.getItem('rcs_api_key');
        
        if (userData && apiKey) {
            this.currentUser = JSON.parse(userData);
            this.apiKey = apiKey;
            
            // If on login page and already authenticated, redirect to dashboard
            if (window.location.pathname.includes('login.html')) {
                window.location.href = 'dashboard.html';
            }
        } else {
            // If not on login page and not authenticated, redirect to login
            if (!window.location.pathname.includes('login.html') && 
                !window.location.pathname.includes('index.html')) {
                window.location.href = 'login.html';
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.querySelector('.login-btn');
        const btnText = document.querySelector('.btn-text');
        const btnLoader = document.querySelector('.btn-loader');
        const errorDiv = document.getElementById('authError');
        
        // Show loading state
        if (loginBtn && btnText && btnLoader) {
            loginBtn.disabled = true;
            btnText.style.opacity = '0';
            btnLoader.style.display = 'block';
        }
        
        // Clear previous errors
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Simple authentication (in production, this would be a secure API call)
        if (username === 'user' && password === 'user') {
            // Generate API key
            const apiKey = this.generateApiKey();
            
            // Store user data
            const userData = {
                username: username,
                email: `${username}@rcsemulator.com`,
                name: username.charAt(0).toUpperCase() + username.slice(1),
                loginTime: new Date().toISOString(),
                id: 'user_001',
                role: 'developer'
            };
            
            localStorage.setItem('rcs_user', JSON.stringify(userData));
            localStorage.setItem('rcs_api_key', apiKey);
            localStorage.setItem('rcs_login_time', userData.loginTime);
            
            this.currentUser = userData;
            this.apiKey = apiKey;
            
            // Show success state briefly
            if (loginBtn && btnText && btnLoader) {
                btnLoader.style.display = 'none';
                btnText.textContent = 'Success!';
                btnText.style.opacity = '1';
                loginBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            }
            
            // Redirect after brief success display
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
            
        } else {
            // Reset button state
            if (loginBtn && btnText && btnLoader) {
                loginBtn.disabled = false;
                btnText.style.opacity = '1';
                btnText.textContent = 'Sign In';
                btnLoader.style.display = 'none';
                loginBtn.style.background = 'linear-gradient(135deg, #007AFF, #5856D6)';
            }
            
            this.showError('Invalid username or password. Please use: user/user');
        }
    }

    handleLogout() {
        // Clear stored data
        localStorage.removeItem('rcs_user');
        localStorage.removeItem('rcs_api_key');
        
        this.currentUser = null;
        this.apiKey = null;
        
        // Redirect to login
        window.location.href = 'login.html';
    }

    generateApiKey() {
        // Generate a simple API key (in production, this would be server-generated)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = 'rcs_';
        for (let i = 0; i < 32; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    showError(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    showSuccess(message) {
        const errorDiv = document.getElementById('authError');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            errorDiv.style.background = 'rgba(52, 199, 89, 0.1)';
            errorDiv.style.borderColor = 'rgba(52, 199, 89, 0.3)';
            errorDiv.style.color = '#28a745';
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getApiKey() {
        return this.apiKey;
    }

    isAuthenticated() {
        return this.currentUser !== null && this.apiKey !== null;
    }
}

// API Handler for RCS Messages
class RCSApi {
    constructor(authSystem) {
        this.auth = authSystem;
        this.baseUrl = window.location.origin;
    }

    async sendMessage(messageData) {
        if (!this.auth.isAuthenticated()) {
            throw new Error('User not authenticated');
        }

        // Validate API key
        const apiKey = this.auth.getApiKey();
        if (!apiKey) {
            throw new Error('API key not found');
        }

        // In a real implementation, this would make an HTTP request to your API
        // For now, we'll simulate the API call and directly send to the emulator
        try {
            // Validate the message data
            this.validateMessageData(messageData);
            
            // Send to emulator if it's available (same page)
            if (window.rcsEmulator) {
                const message = this.convertApiMessageToEmulator(messageData);
                window.rcsEmulator.addMessage(message);
                return {
                    success: true,
                    messageId: message.id,
                    timestamp: message.timestamp
                };
            } else {
                // Store message for later delivery (when emulator loads)
                this.storeMessageForDelivery(messageData);
                return {
                    success: true,
                    messageId: Date.now(),
                    timestamp: new Date().toISOString(),
                    note: 'Message queued for delivery'
                };
            }
        } catch (error) {
            throw new Error(`API Error: ${error.message}`);
        }
    }

    validateMessageData(data) {
        if (!data.type) {
            throw new Error('Message type is required');
        }

        switch (data.type) {
            case 'text':
                if (!data.text) {
                    throw new Error('Text field is required for text messages');
                }
                break;
            case 'richCard':
                if (!data.title || !data.description) {
                    throw new Error('Title and description are required for rich cards');
                }
                break;
            case 'media':
                if (!data.mediaType || !data.url) {
                    throw new Error('MediaType and URL are required for media messages');
                }
                break;
        }
    }

    convertApiMessageToEmulator(apiData) {
        const baseMessage = {
            id: Date.now(),
            timestamp: new Date(),
            type: apiData.sender === 'user' ? 'sent' : 'received'
        };

        switch (apiData.type) {
            case 'text':
                return {
                    ...baseMessage,
                    text: apiData.text,
                    suggestedActions: apiData.suggestedActions
                };
                
            case 'richCard':
                return {
                    ...baseMessage,
                    text: '',
                    richCard: {
                        title: apiData.title,
                        description: apiData.description,
                        image: apiData.image,
                        actions: apiData.actions || []
                    }
                };
                
            case 'media':
                return {
                    ...baseMessage,
                    text: apiData.text || '',
                    media: {
                        type: apiData.mediaType,
                        url: apiData.url,
                        name: apiData.name || `media_${Date.now()}`,
                        size: apiData.size || 1024000
                    }
                };
                
            default:
                return {
                    ...baseMessage,
                    text: apiData.text || JSON.stringify(apiData)
                };
        }
    }

    storeMessageForDelivery(messageData) {
        const queuedMessages = JSON.parse(localStorage.getItem('rcs_queued_messages') || '[]');
        queuedMessages.push({
            ...messageData,
            queuedAt: new Date().toISOString()
        });
        localStorage.setItem('rcs_queued_messages', JSON.stringify(queuedMessages));
    }

    getQueuedMessages() {
        return JSON.parse(localStorage.getItem('rcs_queued_messages') || '[]');
    }

    clearQueuedMessages() {
        localStorage.removeItem('rcs_queued_messages');
    }
}

// Initialize authentication system
const authSystem = new AuthSystem();
const rcsApi = new RCSApi(authSystem);

// Make API available globally for external use
window.RCSApi = rcsApi;
window.AuthSystem = authSystem;

// API endpoint simulation for external calls
window.sendRCSMessage = async function(apiKey, messageData) {
    // Validate API key
    const storedApiKey = localStorage.getItem('rcs_api_key');
    if (apiKey !== storedApiKey) {
        throw new Error('Invalid API key');
    }
    
    return await rcsApi.sendMessage(messageData);
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AuthSystem, RCSApi };
}
