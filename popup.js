document.addEventListener('DOMContentLoaded', function() {
    const activateBtn = document.getElementById('activateBtn');
    const helpBtn = document.getElementById('helpBtn');

    const status = document.getElementById('status');

    // Activate Inspector
    activateBtn.addEventListener('click', async function() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Update status
            status.textContent = 'Activating inspector...';
            activateBtn.textContent = '⏳ Activating...';
            
            // Send message to content script to toggle inspector
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleInspector' });
            
            if (response && response.success) {
                // Update UI
                status.textContent = '✅ Inspector activated! Close this popup and start inspecting elements.';
                activateBtn.innerHTML = '<span class="icon">✅</span>Inspector Active';
                activateBtn.style.background = 'rgba(34, 197, 94, 0.9)';
                
                // Auto-close popup after a short delay
                setTimeout(() => {
                    window.close();
                }, 1500);
            } else {
                throw new Error('Content script not responding');
            }
            
        } catch (error) {
            console.error('Failed to activate inspector:', error);
            status.textContent = '❌ Failed to activate inspector. Try using Ctrl+Shift+L instead.';
            activateBtn.innerHTML = '<span class="icon">🎯</span>Activate Inspector';
        }
    });

    // Help button
    helpBtn.addEventListener('click', function() {
        chrome.tabs.create({
            url: 'help.html'
        });
    });



    // Check if inspector is already active
    checkInspectorStatus();

    async function checkInspectorStatus() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                    if (window.visualInspector) {
                        return {
                            exists: true,
                            active: window.visualInspector.active
                        };
                    }
                    return { exists: false, active: false };
                }
            });
            
            const result = results[0].result;
            if (result.exists) {
                if (result.active) {
                    status.textContent = '✅ Inspector is active - Press Ctrl+Shift+L to toggle';
                    activateBtn.innerHTML = '<span class="icon">⏸️</span>Deactivate Inspector';
                } else {
                    status.textContent = '🔄 Inspector loaded but inactive - Click to activate';
                    activateBtn.innerHTML = '<span class="icon">▶️</span>Activate Inspector';
                }
            } else {
                status.textContent = '💡 Press Ctrl+Shift+L or click button to start';
                activateBtn.innerHTML = '<span class="icon">🎯</span>Activate Inspector';
            }
        } catch (error) {
            // Content script might not be loaded yet
            status.textContent = '💡 Press Ctrl+Shift+L or click button to start';
            activateBtn.innerHTML = '<span class="icon">🎯</span>Activate Inspector';
        }
    }
}); 