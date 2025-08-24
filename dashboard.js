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
        
        // Setup curl command after a short delay to ensure DOM is ready
        setTimeout(() => {
            this.setupCurlCommand();
        }, 1000);
        
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
        
        // Show default section
        this.showSection('emulator');
    }

    setupCurlCommand() {
        console.log('Setting up curl command...');
        
        const jsonInput = document.getElementById('jsonInput');
        const curlCommand = document.getElementById('curlCommand');
        const copyCurlBtn = document.getElementById('copyCurlBtn');
        
        console.log('Elements found:', {
            jsonInput: !!jsonInput,
            curlCommand: !!curlCommand,
            copyCurlBtn: !!copyCurlBtn
        });
        
        if (jsonInput && curlCommand) {
            console.log('Setting up curl command listeners...');
            
            // Update curl command when JSON changes
            const updateCurlCommand = () => {
                console.log('Updating curl command...');
                const jsonContent = jsonInput.value.trim();
                console.log('JSON content:', jsonContent.substring(0, 50) + '...');
                this.updateCurlCommand(jsonContent);
            };
            
            // Update on input change with debouncing
            let timeout;
            jsonInput.addEventListener('input', () => {
                console.log('JSON input changed');
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
            
            // Handle refresh button for debugging
            const refreshCurlBtn = document.getElementById('refreshCurlBtn');
            if (refreshCurlBtn) {
                refreshCurlBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('Manual refresh triggered');
                    const jsonContent = jsonInput.value.trim();
                    this.updateCurlCommand(jsonContent);
                    this.showToast('cURL command refreshed!', 'success');
                });
            }
            
            console.log('Curl command setup complete');
        } else {
            console.error('Required elements not found for curl setup');
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
        if (apiKey) {
            const apiKeyElements = document.querySelectorAll('#apiKeyDisplay, #settingsApiKey');
            apiKeyElements.forEach(el => {
                if (el) el.textContent = apiKey;
            });
            console.log('API key loaded:', apiKey.substring(0, 8) + '...');
        } else {
            console.warn('No API key found');
            // Set a demo key as fallback
            const demoApiKey = 'demo-api-key-12345';
            const apiKeyElements = document.querySelectorAll('#apiKeyDisplay, #settingsApiKey');
            apiKeyElements.forEach(el => {
                if (el) el.textContent = demoApiKey;
            });
        }

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
        const curlCmd = `curl -X POST http://localhost:3000/api/rcs/send \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonData}'`;
        
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded (deferred), initializing dashboard');
        try {
            window.dashboard = new Dashboard();
        } catch (error) {
            console.error('Error initializing dashboard (deferred):', error);
        }
    });
} else {
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
