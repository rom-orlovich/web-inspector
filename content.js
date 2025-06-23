// Content script for Visual Element Inspector Chrome Extension
// This script runs on every page and provides keyboard shortcuts

console.log('🔍 Visual Element Inspector content script loaded');

// Keyboard shortcuts are handled by the manifest commands and background script
// This provides better integration with Chrome's extension system

function toggleInspector() {
    // Check if inspector is currently visible by looking for its toolbar in the DOM
    const existingToolbar = document.querySelector('.visual-inspector-toolbar');

    if (existingToolbar) {
        // Inspector is visible, destroy it completely
        if (window.visualInspector) {
            window.visualInspector.destroy();
        } else {
            // Fallback: remove toolbar manually if inspector object doesn't exist
            existingToolbar.remove();
        }
        showNotification('🔍 Inspector deactivated - Press Cmd+Shift+L to reactivate');
    } else {
        // Inspector not visible, load and show it
        if (window.visualInspector) {
            // Inspector object exists but toolbar is hidden, reinitialize
            window.visualInspector.init().then(() => {
                window.visualInspector.activate();
                showNotification('🎯 Inspector activated - Click elements to inspect or press Escape to deactivate');
            });
        } else {
            // Inspector not loaded at all, load it fresh
            loadInspector();
        }
    }
}

function loadInspector() {
    // First, preload html2canvas to bypass CSP
    preloadHtml2Canvas().then(() => {
        // Remove any existing inspector script tags
        const existingScripts = document.querySelectorAll('script[src*="inspector.js"]');
        existingScripts.forEach(script => script.remove());

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inspector.js');
        script.onload = function () {
            console.log('🔍 Visual Element Inspector loaded via keyboard shortcut');
            // Initialize the inspector
            setTimeout(() => {
                if (window.visualInspector) {
                    // Let the inspector know where to find html2canvas
                    window.HTML2CANVAS_URL = chrome.runtime.getURL('html2canvas.min.js');
                    window.visualInspector.init().then(() => {
                        showNotification('✅ Inspector loaded! Press Cmd+Shift+L to toggle');
                    });
                }
            }, 100);
        };
        script.onerror = function () {
            console.error('❌ Failed to load Visual Element Inspector');
            showNotification('❌ Failed to load inspector');
        };

        document.head.appendChild(script);
    }).catch(error => {
        console.error('Failed to preload html2canvas:', error);
        showNotification('❌ Unable to load screenshot capability due to CSP restrictions');

        // Load inspector anyway without html2canvas
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inspector.js');
        document.head.appendChild(script);
    });
}

// Preload html2canvas before loading the inspector
// This helps bypass CSP restrictions
function preloadHtml2Canvas() {
    return new Promise((resolve, reject) => {
        // Try to inject html2canvas directly via content script
        // This will bypass CSP since content scripts operate in an isolated world
        const html2canvasUrl = chrome.runtime.getURL('html2canvas.min.js');

        // Try method 1: Direct injection via extension URL
        try {
            const script = document.createElement('script');
            script.src = html2canvasUrl;
            script.onload = () => {
                console.log('✅ Successfully preloaded html2canvas');
                resolve();
            };
            script.onerror = (e) => {
                console.warn('Failed to load html2canvas directly:', e);
                // Try method 2: Use scripting API via background script
                tryBackgroundScriptInjection(resolve, reject);
            };
            document.head.appendChild(script);
        } catch (error) {
            console.warn('Error in direct html2canvas injection:', error);
            // Try method 2: Use scripting API via background script
            tryBackgroundScriptInjection(resolve, reject);
        }
    });
}

// Helper for using background script to inject html2canvas
function tryBackgroundScriptInjection(resolve, reject) {
    chrome.runtime.sendMessage({ action: 'injectHtml2Canvas' }, response => {
        if (chrome.runtime.lastError) {
            console.error('Error in background script injection:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
        } else if (response && response.success) {
            console.log('✅ Successfully injected html2canvas via background script');
            resolve();
        } else {
            console.error('Background script injection failed:', response?.error || 'Unknown error');
            reject(new Error(response?.error || 'Unknown error in html2canvas injection'));
        }
    });
}

function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: rgba(45, 55, 72, 0.95) !important;
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

    // Add animation keyframes
    if (!document.querySelector('#inspector-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'inspector-notification-styles';
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

// Listen for messages from popup and background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleInspector') {
        toggleInspector();
        sendResponse({ success: true });
    } else if (request.action === 'toggleSelectMode') {
        toggleSelectMode();
        sendResponse({ success: true });
    } else if (request.action === 'takeScreenshot') {
        takeScreenshot();
        sendResponse({ success: true });
    }
});

function toggleSelectMode() {
    if (window.visualInspector) {
        console.log('🎯 toggleSelectMode called');
        // Inspector exists, toggle the select mode (which is the activate/deactivate)
        if (window.visualInspector.active) {
            window.visualInspector.deactivate();
            showNotification('🎯 Select mode deactivated');
        } else {
            window.visualInspector.activate();
            showNotification('🎯 Select mode activated - Click elements to inspect');
        }
    } else {
        // Inspector not loaded, load it and activate select mode
        loadInspectorWithSelectMode();
    }
}

function takeScreenshot() {
    if (window.visualInspector && window.visualInspector.lastElement) {
        // Take screenshot of the last selected element
        window.visualInspector.takeScreenshot();
        showNotification('📸 Taking screenshot of selected element...');
    } else if (window.visualInspector) {
        showNotification('❌ No element selected. Select an element first to take screenshot.');
    } else {
        showNotification('❌ Inspector not active. Activate inspector first.');
    }
}

function loadInspectorWithSelectMode() {
    // First, preload html2canvas to bypass CSP
    preloadHtml2Canvas().then(() => {
        // Remove any existing inspector script tags first
        const existingScripts = document.querySelectorAll('script[src*="inspector.js"]');
        existingScripts.forEach(script => script.remove());

        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inspector.js');
        script.onload = function () {
            console.log('🔍 Visual Element Inspector loaded via select mode shortcut');
            // Wait a bit for the inspector to initialize, then activate select mode
            setTimeout(() => {
                if (window.visualInspector) {
                    // Let the inspector know where to find html2canvas
                    window.HTML2CANVAS_URL = chrome.runtime.getURL('html2canvas.min.js');
                    window.visualInspector.init().then(() => {
                        window.visualInspector.activate();
                        showNotification('🎯 Inspector loaded in select mode! Click elements to inspect');
                    });
                }
            }, 100);
        };
        script.onerror = function () {
            console.error('❌ Failed to load Visual Element Inspector');
            showNotification('❌ Failed to load inspector');
        };

        document.head.appendChild(script);
    }).catch(error => {
        console.error('Failed to preload html2canvas:', error);
        showNotification('❌ CSP blocked screenshots, but inspector will work');

        // Load inspector anyway without html2canvas
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('inspector.js');
        script.onload = function () {
            setTimeout(() => {
                if (window.visualInspector) {
                    window.visualInspector.init().then(() => {
                        window.visualInspector.activate();
                    });
                }
            }, 100);
        };
        document.head.appendChild(script);
    });
} 