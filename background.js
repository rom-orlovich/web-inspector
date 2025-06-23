// Background service worker for Visual Element Inspector Chrome Extension
// Handles extension icon clicks and provides keyboard shortcuts

console.log('🔍 Visual Element Inspector background script loaded');

// Add detailed logging for keyboard shortcuts
chrome.runtime.onInstalled.addListener(async () => {
    console.log('Extension installed/updated - checking commands...');
    try {
        const commands = await chrome.commands.getAll();
        console.log('Available commands:', commands);
        
        commands.forEach(command => {
            console.log(`Command: ${command.name}, Shortcut: ${command.shortcut || 'Not set'}, Description: ${command.description}`);
        });
    } catch (error) {
        console.error('Failed to get commands:', error);
    }
});

// Handle extension icon clicks with error checking
if (chrome.action && chrome.action.onClicked) {
    chrome.action.onClicked.addListener(async (tab) => {
        console.log('Extension icon clicked for tab:', tab.id);
        
        try {
            // Send message to content script to toggle inspector
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleInspector' });
            
            if (response && response.success) {
                console.log('Inspector toggled successfully via extension icon');
            } else {
                throw new Error('Content script not responding');
            }
        } catch (error) {
            console.error('Failed to toggle inspector via extension icon:', error);
            
            // Show error notification
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: showErrorNotification,
                    args: ['Failed to activate inspector. Please refresh the page and try again.']
                });
            } catch (notificationError) {
                console.error('Failed to show error notification:', notificationError);
            }
        }
    });
} else {
    console.error('chrome.action.onClicked is not available. Extension may not be properly loaded.');
}

// Handle keyboard shortcut commands with error checking
if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener(async (command) => {
        console.log('🎯 KEYBOARD SHORTCUT PRESSED! Command received:', command);
        console.log('🎯 Command type:', typeof command);
        console.log('🎯 All available commands:');
        
        // List all commands for debugging
        try {
            const allCommands = await chrome.commands.getAll();
            allCommands.forEach(cmd => {
                console.log(`  - ${cmd.name}: ${cmd.shortcut || 'Not set'}`);
            });
        } catch (e) {
            console.error('Could not get commands:', e);
        }
        
        if (command === 'toggle-inspector') {
            console.log('🎯 Toggle Inspector command matched! Getting active tab...');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (tab) {
                console.log('🎯 Active tab found:', tab.id, tab.url);
                try {
                    console.log('🎯 Sending toggleInspector message to content script...');
                    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleInspector' });
                    
                    if (response && response.success) {
                        console.log('🎯 Inspector toggled successfully via keyboard shortcut');
                    } else {
                        console.log('🎯 Content script not responding to keyboard shortcut');
                    }
                } catch (error) {
                    console.error('🎯 Failed to toggle inspector via keyboard shortcut:', error);
                    // Try to inject content script if connection failed
                    await ensureContentScriptInjected(tab.id, 'toggleInspector');
                }
            } else {
                console.log('🎯 No active tab found');
            }
        } else {
            console.log('🎯 Command did not match any known commands:', command);
        }
    });
    console.log('🎯 Keyboard shortcut listener registered successfully');
} else {
    console.error('🎯 chrome.commands.onCommand is not available.');
}

// All inspector functionality is now handled by the content script
// Background script only handles extension icon clicks and installation events

// Function to show error notification (executed in page context)
function showErrorNotification(message) {
    showNotification(message, 'error');
}

// Generic notification function (executed in page context)
function showNotification(message, type = 'default') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.visual-inspector-bg-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'visual-inspector-bg-notification';
    notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${type === 'error' ? 'rgba(239, 68, 68, 0.95)' : type === 'success' ? 'rgba(34, 197, 94, 0.95)' : 'rgba(45, 55, 72, 0.95)'} !important;
        color: white !important;
        padding: 12px 18px !important;
        border-radius: 8px !important;
        z-index: 1000001 !important;
        font-size: 14px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        font-weight: 500 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        backdrop-filter: blur(10px) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        max-width: 300px !important;
        animation: slideInFromRight 0.3s ease-out !important;
    `;
    
    // Add animation keyframes if not already present
    if (!document.querySelector('#bg-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'bg-notification-styles';
        style.textContent = `
            @keyframes slideInFromRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Visual Element Inspector installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        // Open help page on first install
        chrome.tabs.create({
            url: 'help.html'
        });
    }
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('Visual Element Inspector extension started');
});

// Add message handler for html2canvas URL requests - helps bypass CSP restrictions
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Message received in background:', request.action);
    
    // Handle request for HTML2Canvas URL
    if (request.action === 'getHtml2CanvasUrl') {
        try {
            const html2canvasUrl = chrome.runtime.getURL('html2canvas.min.js');
            console.log('Providing html2canvas URL:', html2canvasUrl);
            sendResponse({ success: true, url: html2canvasUrl });
        } catch (error) {
            console.error('Error providing html2canvas URL:', error);
            sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open for async response
    }
    
    // Handle request to inject HTML2Canvas directly
    if (request.action === 'injectHtml2Canvas') {
        try {
            // Use scripting API to inject the file directly
            // This bypasses CSP since extensions can inject scripts
            chrome.scripting.executeScript({
                target: { tabId: sender.tab.id },
                files: ['html2canvas.min.js']
            }).then(() => {
                console.log('Successfully injected html2canvas via scripting API');
                sendResponse({ success: true });
            }).catch(error => {
                console.error('Failed to inject html2canvas:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
        } catch (error) {
            console.error('Error setting up html2canvas injection:', error);
            sendResponse({ success: false, error: error.message });
            return false;
        }
    }
});

// Helper function to ensure content script is injected
async function ensureContentScriptInjected(tabId, action) {
    try {
        console.log('🎯 Attempting to inject content script into tab:', tabId);
        
        // Try to inject the content script
        await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        });
        
        console.log('🎯 Content script injected successfully');
        
        // Wait a moment for the script to initialize
        setTimeout(async () => {
            try {
                console.log('🎯 Retrying action after content script injection:', action);
                const response = await chrome.tabs.sendMessage(tabId, { action: action });
                
                if (response && response.success) {
                    console.log('🎯 Action executed successfully after injection:', action);
                } else {
                    console.log('🎯 Action still not responding after injection:', action);
                }
            } catch (retryError) {
                console.error('🎯 Failed to execute action after injection:', action, retryError);
                
                // Show error notification to user
                await chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: showErrorNotification,
                    args: [`Failed to activate inspector. Please refresh the page and try again.`]
                });
            }
        }, 100); // Wait 100ms for content script to initialize
        
    } catch (injectionError) {
        console.error('🎯 Failed to inject content script:', injectionError);
        
        // Show error notification to user
        try {
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: showErrorNotification,
                args: [`Extension cannot run on this page. Try on a regular webpage.`]
            });
        } catch (notificationError) {
            console.error('🎯 Failed to show error notification:', notificationError);
        }
    }
} 