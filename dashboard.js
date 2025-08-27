// Dashboard functionality for RCS Emulator SaaS
class Dashboard {
    constructor() {
        this.messageCount = 0;
        this.eventSource = null;
        this.init();
    }

    init() {
        console.log('Dashboard initializing...');
        
        // Simple check - if no auth system, just continue
        // This allows the dashboard to work even without proper auth
        
        this.setupNavigation();
        this.loadUserData();
        this.setupSSE();
        this.setupCurlCommand();
        this.setupServerConfig();
        
        console.log('Dashboard initialization complete');
    }

    setupNavigation() {
        console.log('Setting up navigation...');
        
        // Handle all navigation links
        const navLinks = document.querySelectorAll('.nav-link[data-section]');
        console.log('Found nav links:', navLinks.length);
        
        navLinks.forEach((link, index) => {
            console.log(`Setting up nav link ${index}:`, link.getAttribute('data-section'));
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                console.log('Nav clicked:', section);
                this.showSection(section);
            });
        });

        // Handle user dropdown
        this.setupUserDropdown();
        
        // Setup copy buttons for API keys
        this.setupCopyButtons();
        
        // Setup example buttons
        this.setupExampleButtons();
        
        // Show default section
        this.showSection('emulator');
    }

    setupCurlCommand() {
        const jsonInput = document.getElementById('jsonInput');
        const curlCommand = document.getElementById('curlCommand');
        const copyCurlBtn = document.getElementById('copyCurlBtn');
        
        if (jsonInput && curlCommand) {
            // Update curl command when JSON changes
            const updateCurlCommand = () => {
                const jsonContent = jsonInput.value.trim();
                this.updateCurlCommand(jsonContent);
            };
            
            // Update on input change with debouncing
            let timeout;
            jsonInput.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(updateCurlCommand, 300);
            });
            
            // Also update on keyup for immediate feedback
            jsonInput.addEventListener('keyup', () => {
                clearTimeout(timeout);
                timeout = setTimeout(updateCurlCommand, 100);
            });
            
            // Initial update
            setTimeout(updateCurlCommand, 500);
            
            // Handle copy button
            if (copyCurlBtn) {
                copyCurlBtn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const curlText = curlCommand.textContent;
                    await this.copyToClipboard(curlText, 'cURL command copied to clipboard!');
                });
            }
            
            // Handle refresh button
            const refreshCurlBtn = document.getElementById('refreshCurlBtn');
            if (refreshCurlBtn) {
                refreshCurlBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const jsonContent = jsonInput.value.trim();
                    this.updateCurlCommand(jsonContent);
                    this.showToast('cURL command refreshed!', 'success');
                });
            }
        }
    }

    getCurrentApiKey() {
        // Try to get current API key
        if (window.AuthSystem) {
            const apiKey = window.AuthSystem.getApiKey();
            if (apiKey) return apiKey;
        }
        
        // Fallback to localStorage
        const storedApiKey = localStorage.getItem('rcs_api_key');
        if (storedApiKey) return storedApiKey;
        
        // Final fallback
        return 'YOUR_API_KEY';
    }

    setupExampleButtons() {
        const exampleButtons = document.querySelectorAll('.example-btn');
        const jsonInput = document.getElementById('jsonInput');
        
        if (!jsonInput) return;
        
        const examples = {
            text: {
                type: "text",
                text: "Hello! This is a simple RCS text message. 👋",
                sender: "business"
            },
            richCard: {
                type: "richCard",
                title: "iPhone 15 Pro",
                description: "Experience the titanium iPhone 15 Pro with Action Button, powerful A17 Pro chip, and pro camera system.",
                image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=200&fit=crop",
                actions: [
                    {
                        label: "Buy Now",
                        action: "buy_iphone",
                        type: "primary"
                    },
                    {
                        label: "Learn More",
                        action: "learn_more",
                        type: "secondary"
                    }
                ],
                sender: "business"
            },
            coffeeCard: {
                type: "richCard",
                title: "Coffee Time ☕",
                description: "Start your morning with the perfect cup of coffee. Fresh roasted beans delivered to your door.",
                image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&h=200&fit=crop",
                actions: [
                    {
                        label: "Order Coffee",
                        action: "order_coffee",
                        type: "primary"
                    },
                    {
                        label: "View Menu",
                        action: "view_menu",
                        type: "secondary"
                    }
                ],
                sender: "business"
            },
            media: {
                type: "media",
                mediaType: "image",
                url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop",
                text: "Stunning mountain landscape from Unsplash 🏔️",
                sender: "business"
            },
            video: {
                type: "media",
                mediaType: "video",
                url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
                text: "Big Buck Bunny - Sample video clip 🎬",
                sender: "business"
            },
            carousel: {
                type: "carousel",
                cards: [
                    {
                        title: "iPhone 15 Pro",
                        description: "Titanium design with A17 Pro chip",
                        image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300&h=200&fit=crop",
                        actions: [
                            { label: "Buy Now", action: "buy_iphone", type: "primary" },
                            { label: "Learn More", action: "learn_more", type: "secondary" }
                        ]
                    },
                    {
                        title: "MacBook Pro",
                        description: "M3 chip delivers exceptional performance",
                        image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300&h=200&fit=crop",
                        actions: [
                            { label: "Configure", action: "configure_mac", type: "primary" },
                            { label: "Compare", action: "compare_mac", type: "secondary" }
                        ]
                    },
                    {
                        title: "iPad Air",
                        description: "Light, versatile, and powerful",
                        image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=200&fit=crop",
                        actions: [
                            { label: "Shop iPad", action: "shop_ipad", type: "primary" },
                            { label: "Accessories", action: "ipad_accessories", type: "secondary" }
                        ]
                    },
                    {
                        title: "Apple Watch",
                        description: "Your health companion on your wrist",
                        image: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=300&h=200&fit=crop",
                        actions: [
                            { label: "Buy Watch", action: "buy_watch", type: "primary" },
                            { label: "Try On", action: "try_watch", type: "secondary" }
                        ]
                    }
                ],
                sender: "business"
            },
            suggestedActions: {
                type: "text",
                text: "What would you like to do today?",
                suggestions: [
                    {
                        action: {
                            text: "📱 View Products",
                            postbackData: "view_products"
                        }
                    },
                    {
                        action: {
                            text: "🛒 Place Order",
                            postbackData: "place_order"
                        }
                    },
                    {
                        action: {
                            text: "📞 Contact Support",
                            postbackData: "contact_support"
                        }
                    },
                    {
                        action: {
                            text: "📍 Find Store",
                            postbackData: "find_store"
                        }
                    }
                ],
                sender: "business"
            }
        };
        
        exampleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const exampleType = button.getAttribute('data-example');
                const example = examples[exampleType];
                
                if (example) {
                    // Format JSON with proper indentation
                    const formattedJson = JSON.stringify(example, null, 2);
                    jsonInput.value = formattedJson;
                    
                    // Trigger input event to update curl command
                    jsonInput.dispatchEvent(new Event('input'));
                    
                    // Show success feedback
                    this.showToast(`${button.textContent} example loaded!`, 'success');
                    
                    // Scroll to JSON input
                    jsonInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        });
    }

    setupServerConfig() {
        const serverUrlInput = document.getElementById('rcsServerUrl');
        const authTokenInput = document.getElementById('authToken');
        const testServerBtn = document.getElementById('testServerBtn');
        const saveServerBtn = document.getElementById('saveServerBtn');
        const serverStatus = document.getElementById('serverStatus');
        const toggleHeader = document.getElementById('serverConfigToggle');
        const content = document.getElementById('serverConfigContent');
        
        if (!serverUrlInput || !testServerBtn || !saveServerBtn) {
            return;
        }
        
        // Setup collapsible functionality
        if (toggleHeader && content) {
            toggleHeader.addEventListener('click', (e) => {
                e.preventDefault();
                const isExpanded = content.style.display === 'block';
                
                if (isExpanded) {
                    // Collapse
                    toggleHeader.classList.remove('expanded');
                    content.style.display = 'none';
                } else {
                    // Expand
                    toggleHeader.classList.add('expanded');
                    content.style.display = 'block';
                }
            });
            
            // Initialize as collapsed
            toggleHeader.classList.remove('expanded');
            content.style.display = 'none';
        }
        
        // Load saved configuration
        this.loadServerConfig();
        
        // Test server connection
        testServerBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await this.testServerConnection();
        });
        
        // Save server configuration
        saveServerBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveServerConfig();
        });
        
        // Auto-save on input change (debounced)
        let saveTimeout;
        [serverUrlInput, authTokenInput].forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    this.saveServerConfig(false); // Silent save
                }, 1000);
            });
        });
    }
    
    loadServerConfig() {
        const config = this.getServerConfig();
        const serverUrlInput = document.getElementById('rcsServerUrl');
        const authTokenInput = document.getElementById('authToken');
        
        if (serverUrlInput && config.serverUrl) {
            serverUrlInput.value = config.serverUrl;
        }
        if (authTokenInput && config.authToken) {
            authTokenInput.value = config.authToken;
        }
    }
    
    getServerConfig() {
        try {
            const config = localStorage.getItem('rcs_server_config');
            return config ? JSON.parse(config) : {};
        } catch (error) {
            console.error('Error loading server config:', error);
            return {};
        }
    }
    
    saveServerConfig(showToast = true) {
        const serverUrlInput = document.getElementById('rcsServerUrl');
        const authTokenInput = document.getElementById('authToken');
        
        const config = {
            serverUrl: serverUrlInput?.value?.trim() || '',
            authToken: authTokenInput?.value?.trim() || '',
            lastUpdated: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('rcs_server_config', JSON.stringify(config));
            if (showToast) {
                this.showToast('Server configuration saved!', 'success');
            }
        } catch (error) {
            console.error('Error saving server config:', error);
            if (showToast) {
                this.showToast('Error saving configuration', 'error');
            }
        }
    }
    
    async testServerConnection() {
        const config = this.getServerConfig();
        const serverStatus = document.getElementById('serverStatus');
        const testBtn = document.getElementById('testServerBtn');
        
        if (!config.serverUrl) {
            this.showServerStatus('Please enter a server URL first', 'error');
            return;
        }
        
        // Show loading state
        if (testBtn) {
            testBtn.disabled = true;
            testBtn.textContent = 'Testing...';
        }
        
        try {
            // Test with a simple ping payload
            const testPayload = {
                type: 'ping',
                timestamp: new Date().toISOString(),
                source: 'rcs_emulator_test'
            };
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (config.authToken) {
                headers['Authorization'] = config.authToken.startsWith('Bearer ') 
                    ? config.authToken 
                    : `Bearer ${config.authToken}`;
            }
            
            const response = await fetch(config.serverUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(testPayload)
            });
            
            if (response.ok) {
                this.showServerStatus(`✅ Connection successful (${response.status})`, 'success');
            } else {
                this.showServerStatus(`❌ Server responded with ${response.status}: ${response.statusText}`, 'error');
            }
            
        } catch (error) {
            console.error('Server test error:', error);
            this.showServerStatus(`❌ Connection failed: ${error.message}`, 'error');
        } finally {
            // Reset button state
            if (testBtn) {
                testBtn.disabled = false;
                testBtn.textContent = 'Test Connection';
            }
        }
    }
    
    showServerStatus(message, type) {
        const serverStatus = document.getElementById('serverStatus');
        if (!serverStatus) return;
        
        serverStatus.textContent = message;
        serverStatus.className = `server-status ${type}`;
        serverStatus.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            serverStatus.style.display = 'none';
        }, 5000);
    }
    
    // Method to send user interactions to configured server
    async sendUserInteraction(interactionData) {
        const config = this.getServerConfig();
        
        if (!config.serverUrl) {
            console.log('No server configured, interaction not sent:', interactionData);
            return;
        }
        
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (config.authToken) {
                headers['Authorization'] = config.authToken.startsWith('Bearer ') 
                    ? config.authToken 
                    : `Bearer ${config.authToken}`;
            }
            
            const response = await fetch(config.serverUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    ...interactionData,
                    timestamp: new Date().toISOString(),
                    sessionId: this.getSessionId()
                })
            });
            
            if (!response.ok) {
                console.error('Failed to send interaction:', response.status, response.statusText);
            } else {
                console.log('User interaction sent successfully:', interactionData);
            }
            
        } catch (error) {
            console.error('Error sending user interaction:', error);
        }
    }
    
    getSessionId() {
        let sessionId = localStorage.getItem('rcs_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('rcs_session_id', sessionId);
        }
        return sessionId;
    }

    setupCopyButtons() {
        // Handle API key copy buttons
        const copyButtons = document.querySelectorAll('#copyApiKey, #copySettingsApiKey');
        copyButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const apiKeyElement = btn.previousElementSibling || btn.parentElement.querySelector('code');
                if (apiKeyElement) {
                    const apiKey = apiKeyElement.textContent;
                    await this.copyToClipboard(apiKey, 'API key copied to clipboard!');
                }
            });
        });
    }

    async copyToClipboard(text, successMessage = 'Copied to clipboard!') {
        try {
            await navigator.clipboard.writeText(text);
            this.showToast(successMessage, 'success');
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast(successMessage, 'success');
        }
    }

    showToast(message, type = 'info') {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    setupUserDropdown() {
        const userTrigger = document.getElementById('userMenuTrigger');
        const userDropdown = document.getElementById('userDropdownMenu');
        
        if (userTrigger && userDropdown) {
            console.log('Setting up user dropdown');
            
            userTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('User menu clicked');
                
                if (userDropdown.classList.contains('active')) {
                    this.closeUserDropdown();
                } else {
                    this.openUserDropdown();
                }
            });

            // Close on outside click
            document.addEventListener('click', () => {
                this.closeUserDropdown();
            });

            // Handle logout
            const logoutBtn = document.getElementById('logoutAction');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleLogout();
                });
            }
        }
    }

    showSection(sectionId) {
        console.log('Showing section:', sectionId);
        
        // Hide all sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            console.log('Section shown:', sectionId);
        } else {
            console.error('Section not found:', sectionId);
        }

        // Update nav active states
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
        });

        const activeNav = document.querySelector(`[data-section="${sectionId}"]`);
        if (activeNav) {
            activeNav.classList.add('active');
        }
    }

    openUserDropdown() {
        const userTrigger = document.getElementById('userMenuTrigger');
        const userDropdown = document.getElementById('userDropdownMenu');
        
        if (userTrigger && userDropdown) {
            userTrigger.classList.add('active');
            userDropdown.classList.add('active');
        }
    }

    closeUserDropdown() {
        const userTrigger = document.getElementById('userMenuTrigger');
        const userDropdown = document.getElementById('userDropdownMenu');
        
        if (userTrigger && userDropdown) {
            userTrigger.classList.remove('active');
            userDropdown.classList.remove('active');
        }
    }

    handleLogout() {
        console.log('Logging out...');
        // Clear any stored data
        localStorage.clear();
        // Redirect to login
        window.location.href = 'login.html';
    }

    loadUserData() {
        // Try to get data from AuthSystem first
        let userData = null;
        let apiKey = null;
        
        if (window.AuthSystem) {
            userData = window.AuthSystem.getCurrentUser();
            apiKey = window.AuthSystem.getApiKey();
        }
        
        // Fallback to localStorage if AuthSystem not available
        if (!userData || !apiKey) {
            const storedUserData = localStorage.getItem('rcs_user');
            const storedApiKey = localStorage.getItem('rcs_api_key');
            
            if (storedUserData) {
                try {
                    userData = JSON.parse(storedUserData);
                } catch (e) {
                    console.error('Error parsing stored user data:', e);
                }
            }
            
            if (storedApiKey) {
                apiKey = storedApiKey;
            }
        }
        
        // Generate API key if none found
        if (!apiKey) {
            apiKey = 'rcs_demo_key_12345';
            localStorage.setItem('rcs_api_key', apiKey);
        }
        
        // Set user data in UI
        const userElements = {
            userInitial: document.getElementById('userInitial'),
            userName: document.getElementById('userName'),
            userInitialLarge: document.getElementById('userInitialLarge'),
            userNameLarge: document.getElementById('userNameLarge')
        };

        if (userData) {
            Object.entries(userElements).forEach(([key, el]) => {
                if (el) {
                    if (key.includes('Initial')) {
                        el.textContent = userData.username.charAt(0).toUpperCase();
                    } else {
                        el.textContent = userData.username;
                    }
                }
            });
        } else {
            // Default fallback
            Object.entries(userElements).forEach(([key, el]) => {
                if (el) {
                    if (key.includes('Initial')) {
                        el.textContent = 'U';
                    } else {
                        el.textContent = 'user';
                    }
                }
            });
        }

        // Set API key
        const apiKeyElements = document.querySelectorAll('#apiKeyDisplay, #settingsApiKey');
        apiKeyElements.forEach(el => {
            if (el) {
                el.textContent = apiKey;
            }
        });
        
        // Delayed update as backup
        setTimeout(() => {
            const delayedElements = document.querySelectorAll('#apiKeyDisplay, #settingsApiKey');
            delayedElements.forEach(el => {
                if (el && el.textContent === 'Loading...') {
                    el.textContent = apiKey;
                }
            });
        }, 1000);

        // Set message count
        const messagesCount = document.getElementById('messagesCount');
        if (messagesCount) {
            messagesCount.textContent = this.messageCount;
        }
        
        // Set login time if available
        const loginTime = localStorage.getItem('rcs_login_time');
        if (loginTime) {
            const loginTimeEl = document.getElementById('loginTime');
            if (loginTimeEl) {
                const date = new Date(loginTime);
                loginTimeEl.textContent = date.toLocaleString();
            }
        }
        
        // Update curl command after loading user data
        setTimeout(() => {
            this.updateCurlCommandDisplay();
        }, 100);
    }

    updateCurlCommandDisplay() {
        const curlCommand = document.getElementById('curlCommand');
        if (curlCommand) {
            const jsonInput = document.getElementById('jsonInput');
            const jsonContent = jsonInput ? jsonInput.value.trim() : '';
            this.updateCurlCommand(jsonContent);
        }
    }

    updateCurlCommand(jsonContent = '') {
        console.log('updateCurlCommand called with:', jsonContent.substring(0, 50));
        
        const curlCommand = document.getElementById('curlCommand');
        const curlNote = document.getElementById('curlNote');
        
        console.log('Elements in updateCurlCommand:', {
            curlCommand: !!curlCommand,
            curlNote: !!curlNote
        });
        
        if (!curlCommand) {
            console.error('curlCommand element not found');
            return;
        }
        
        const apiKey = this.getCurrentApiKey();
        console.log('Using API key:', apiKey.substring(0, 10) + '...');
        
        // Get the current URL base (works for both localhost and deployed)
        const baseUrl = window.location.origin;
        console.log('Using base URL:', baseUrl);
        
        let jsonData;
        let isValidJson = true;
        
        if (jsonContent) {
            try {
                // Validate JSON but keep original formatting
                JSON.parse(jsonContent);
                jsonData = jsonContent; // Use exact user input
                console.log('Using exact user JSON input');
            } catch (e) {
                // Invalid JSON - use standard fallback
                isValidJson = false;
                jsonData = JSON.stringify({
                    "type": "text",
                    "text": "Hello from RCS!",
                    "sender": "business"
                }, null, 2);
                console.log('Invalid JSON, using fallback');
            }
        } else {
            // Empty field - use standard fallback
            jsonData = JSON.stringify({
                "type": "text",
                "text": "Hello from RCS!",
                "sender": "business"
            }, null, 2);
            console.log('Empty JSON, using default');
        }
        
        // Format the curl command with proper escaping and line breaks
        // Escape single quotes in JSON data for shell compatibility
        const escapedJsonData = jsonData.replace(/'/g, "'\\''");
        
        const curlCmd = `curl -X POST ${baseUrl}/api/rcs/send \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${escapedJsonData}'`;
        
        console.log('Setting curl command text');
        curlCommand.textContent = curlCmd;
        
        // Update visual indicators and note text
        const curlSection = document.querySelector('.curl-command-section');
        if (curlSection && curlNote) {
            if (jsonContent && !isValidJson) {
                curlSection.classList.add('json-invalid');
                curlNote.innerHTML = '⚠️ Invalid JSON detected - showing fallback example';
            } else if (jsonContent && isValidJson) {
                curlSection.classList.remove('json-invalid');
                curlNote.innerHTML = '✅ Using your exact JSON input';
            } else {
                curlSection.classList.remove('json-invalid');
                curlNote.innerHTML = '💡 The command updates automatically when you modify the JSON above';
            }
        }
        
        console.log('updateCurlCommand completed');
    }

    setupSSE() {
        // Simplified SSE setup
        console.log('SSE setup skipped for now');
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing dashboard');
    try {
        window.dashboard = new Dashboard();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});

// Also initialize if DOM is already loaded
if (document.readyState !== 'loading') {
    console.log('DOM already loaded, initializing dashboard immediately');
    try {
        window.dashboard = new Dashboard();
    } catch (error) {
        console.error('Error initializing dashboard (immediate):', error);
    }
}

// Add a manual initialization function for debugging
window.initDashboard = function() {
    console.log('Manual dashboard initialization');
    try {
        window.dashboard = new Dashboard();
        console.log('Dashboard initialized successfully');
    } catch (error) {
        console.error('Manual initialization error:', error);
    }
};

// Add a manual curl setup function for debugging
window.setupCurl = function() {
    console.log('Manual curl setup');
    if (window.dashboard) {
        window.dashboard.setupCurlCommand();
    } else {
        console.error('Dashboard not initialized');
    }
};
