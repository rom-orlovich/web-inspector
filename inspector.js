// 🔍 VISUAL ELEMENT INSPECTOR - v6.0 (ENHANCED WITH CSS EXTRACTION)
// This version includes CSS/SCSS extraction and improved screenshot functionality.
// Perform a hard refresh (Ctrl+Shift+R) before running this script.

(function() {
    console.log('🔍 Loading Enhanced Visual Element Inspector with CSS Extraction...');

    // Use extension's local html2canvas resource instead of external URL
    // This bypasses CSP restrictions since it's loaded from the extension itself
    let HTML2CANVAS_URL = '';  // Will be set dynamically based on extension context

    // Clean up any existing inspector to prevent conflicts
    if (window.visualInspector) {
        window.visualInspector.destroy();
    }

    // Function to load html2canvas from extension's web accessible resources (bypassing CSP)
    function loadScript() {
        return new Promise((resolve, reject) => {
            if (window.html2canvas) return resolve(); // Already loaded
            
            // Try three approaches to load html2canvas, in order of preference
            tryExtensionResourceLoad()
                .catch(() => tryRuntimeGetUrlLoad())
                .catch(() => tryDirectInlineLoad())
                .then(resolve)
                .catch(reject);
        });
    }
    
    // Method 1: Check if we're in an extension context with web accessible resources
    function tryExtensionResourceLoad() {
        return new Promise((resolve, reject) => {
            try {
                // Check if we have access to chrome extension API
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
                    const scriptURL = chrome.runtime.getURL('html2canvas.min.js');
                    injectScriptFile(scriptURL, resolve, reject);
                    console.log('Loading html2canvas from extension URL:', scriptURL);
                } else {
                    reject(new Error('Not in extension context'));
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    
    // Method 2: Try to get URL via message passing (for content scripts)
    function tryRuntimeGetUrlLoad() {
        return new Promise((resolve, reject) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    chrome.runtime.sendMessage({ action: 'getHtml2CanvasUrl' }, response => {
                        if (response && response.url) {
                            injectScriptFile(response.url, resolve, reject);
                            console.log('Loading html2canvas via messaging URL:', response.url);
                        } else {
                            reject(new Error('Failed to get URL via messaging'));
                        }
                    });
                } else {
                    reject(new Error('Runtime messaging not available'));
                }
            } catch (e) {
                reject(e);
            }
        });
    }
    
    // Method 3: Try direct injection as last resort
    function tryDirectInlineLoad() {
        return new Promise((resolve) => {
            console.warn('Using fallback direct script injection method');
            // For this to work, you would need the actual html2canvas code here
            // This is not ideal but serves as a last resort
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
            script.onload = resolve;
            script.onerror = () => {
                console.error('All html2canvas loading methods failed');
                resolve(); // Resolve anyway to allow inspector to function without screenshots
            };
            document.head.appendChild(script);
        });
    }
    
    // Helper to inject a script from a URL
    function injectScriptFile(url, onSuccess, onError) {
        const script = document.createElement('script');
        script.src = url;
        script.onload = onSuccess;
        script.onerror = onError;
        document.head.appendChild(script);
    }
    
    function tryFallbacks(urls, index, resolve, reject) {
        if (index >= urls.length) {
            reject(new Error('All script loading attempts failed. Screenshots will not be available.'));
            return;
        }
        
        const script = document.createElement('script');
        script.src = urls[index];
        script.onload = resolve;
        script.onerror = () => tryFallbacks(urls, index + 1, resolve, reject);
        document.head.appendChild(script);
    }

    // CSS for all inspector UI elements
    const css = `
        .visual-inspector-toolbar { position: fixed !important; bottom: 20px !important; left: 50% !important; transform: translateX(-50%) !important; background: rgba(255, 255, 255, 0.95) !important; border: 1px solid rgba(0, 0, 0, 0.1) !important; border-radius: 25px !important; padding: 8px 16px !important; display: flex !important; align-items: center !important; gap: 8px !important; z-index: 999999 !important; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important; backdrop-filter: blur(20px) !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
        .visual-inspector-toolbar-btn { background: none !important; border: none !important; padding: 8px 12px !important; border-radius: 16px !important; font-size: 13px !important; font-weight: 500 !important; color: #374151 !important; cursor: pointer !important; display: flex !important; align-items: center !important; gap: 6px !important; transition: all 0.2s ease !important; user-select: none !important; }
        .visual-inspector-toolbar-btn:hover { background: rgba(0, 0, 0, 0.05) !important; }
        .visual-inspector-toolbar-btn.active { background: #3b82f6 !important; color: white !important; }
        .visual-inspector-toolbar-btn .icon { font-size: 16px !important; }
        .visual-inspector-separator { width: 1px !important; height: 24px !important; background: rgba(0, 0, 0, 0.1) !important; margin: 0 4px !important; }
        .visual-inspector-highlight { position: absolute !important; background: rgba(102, 126, 234, 0.25) !important; border: 3px solid #667eea !important; pointer-events: none !important; z-index: 999998 !important; box-sizing: border-box !important; border-radius: 6px !important; animation: visual-inspector-highlight-pulse 1.5s infinite !important; }
        @keyframes visual-inspector-highlight-pulse { 0% { opacity: 0.8; } 50% { opacity: 0.4; } 100% { opacity: 0.8; } }
        .visual-inspector-tooltip { position: absolute !important; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; padding: 12px 18px !important; border-radius: 10px !important; font-size: 14px !important; z-index: 999999 !important; pointer-events: none !important; box-shadow: 0 6px 20px rgba(0,0,0,0.3) !important; max-width: 350px !important; font-family: Arial, sans-serif !important; font-weight: bold !important; backdrop-filter: blur(10px) !important; }
        .visual-inspector-modal { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; background: rgba(0,0,0,0.85) !important; z-index: 1000000 !important; display: flex !important; align-items: center !important; justify-content: center !important; padding: 20px !important; box-sizing: border-box !important; backdrop-filter: blur(5px) !important; }
        .visual-inspector-dialog { background: white !important; padding: 30px !important; border-radius: 20px !important; max-width: 700px !important; max-height: 95% !important; overflow-y: auto !important; box-shadow: 0 25px 80px rgba(0,0,0,0.4) !important; position: relative !important; font-family: Arial, sans-serif !important; color: #333 !important; }
        .visual-inspector-title { margin-top: 0 !important; padding-right: 60px !important; font-size: 24px !important; color: #333 !important; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; -webkit-background-clip: text !important; -webkit-text-fill-color: transparent !important; font-weight: bold !important; }
        .visual-inspector-close { position: absolute !important; top: 25px !important; right: 25px !important; background: linear-gradient(135deg, #dc3545 0%, #c82333 100%) !important; color: white !important; border: none !important; padding: 12px 16px !important; border-radius: 10px !important; cursor: pointer !important; font-size: 18px !important; font-weight: bold !important; transition: all 0.3s ease !important; }
        .visual-inspector-close:hover { transform: scale(1.1) !important; box-shadow: 0 4px 15px rgba(220, 53, 69, 0.4) !important; }
        .visual-inspector-screenshot { width: 100% !important; max-width: 450px !important; border-radius: 12px !important; box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important; margin: 20px 0 !important; border: 3px solid #e9ecef !important; transition: transform 0.3s ease !important; }
        .visual-inspector-screenshot:hover { transform: scale(1.02) !important; }
        .visual-inspector-info { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%) !important; padding: 25px !important; border-radius: 12px !important; margin: 20px 0 !important; border-left: 6px solid #667eea !important; }
        .visual-inspector-buttons { margin: 30px 0 !important; display: flex !important; gap: 15px !important; flex-wrap: wrap !important; justify-content: center !important; }
        .visual-inspector-btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; color: white !important; border: none !important; padding: 18px 30px !important; border-radius: 12px !important; cursor: pointer !important; font-weight: bold !important; font-size: 15px !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3) !important; }
        .visual-inspector-btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4) !important; }
        .visual-inspector-btn-success { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%) !important; color: white !important; border: none !important; padding: 18px 30px !important; border-radius: 12px !important; cursor: pointer !important; font-size: 15px !important; font-weight: bold !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 4px 15px rgba(17, 153, 142, 0.3) !important; }
        .visual-inspector-btn-success:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 25px rgba(17, 153, 142, 0.4) !important; }
        .visual-inspector-btn-secondary { background: linear-gradient(135deg, #6c757d 0%, #495057 100%) !important; color: white !important; border: none !important; padding: 18px 30px !important; border-radius: 12px !important; cursor: pointer !important; font-size: 15px !important; font-weight: bold !important; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3) !important; }
        .visual-inspector-btn-secondary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 25px rgba(108, 117, 125, 0.4) !important; }
        .visual-inspector-btn-disabled { background: #6c757d !important; cursor: not-allowed !important; opacity: 0.6 !important; }
        .visual-inspector-notification { position: fixed !important; bottom: 90px !important; left: 50% !important; transform: translateX(-50%) !important; background: rgba(45, 55, 72, 0.95) !important; color: white !important; padding: 12px 18px !important; border-radius: 20px !important; z-index: 1000001 !important; font-size: 13px !important; box-shadow: 0 8px 25px rgba(0,0,0,0.2) !important; max-width: 300px !important; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; font-weight: 500 !important; animation: fadeInOut 3s ease-in-out forwards; backdrop-filter: blur(20px) !important; border: 1px solid rgba(255, 255, 255, 0.1) !important; text-align: center !important; }
        .visual-inspector-notification.success { background: rgba(34, 197, 94, 0.95) !important; }
        .visual-inspector-notification.error { background: rgba(239, 68, 68, 0.95) !important; }
        @keyframes fadeInOut { 0% { opacity: 0; transform: translateX(-50%) translateY(-20px); } 10% { opacity: 1; transform: translateX(-50%) translateY(0); } 90% { opacity: 1; transform: translateX(-50%) translateY(0); } 100% { opacity: 0; transform: translateX(-50%) translateY(-20px); } }
        .visual-inspector-css-section { background: #f8f9fa !important; border: 2px solid #e9ecef !important; border-radius: 12px !important; padding: 20px !important; margin: 15px 0 !important; }
        .visual-inspector-css-section h4 { margin-top: 0 !important; color: #667eea !important; font-size: 16px !important; }
        .visual-inspector-css-code { background: #2d3748 !important; color: #e2e8f0 !important; padding: 15px !important; border-radius: 8px !important; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important; font-size: 13px !important; overflow-x: auto !important; white-space: pre !important; }
        .visual-inspector-location-section { background: linear-gradient(135deg, #e8f4fd 0%, #d6eaff 100%) !important; border: 2px solid #b3d7ff !important; border-radius: 12px !important; padding: 20px !important; margin: 15px 0 !important; }
        .visual-inspector-location-section h4 { margin-top: 0 !important; color: #0066cc !important; font-size: 16px !important; }
        .visual-inspector-breadcrumb { background: #f8f9fa !important; padding: 12px !important; border-radius: 6px !important; font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important; font-size: 12px !important; color: #495057 !important; border: 1px solid #dee2e6 !important; margin: 8px 0 !important; overflow-x: auto !important; }
        .visual-inspector-location-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 15px !important; margin-top: 15px !important; }
        .visual-inspector-location-item { background: white !important; padding: 12px !important; border-radius: 8px !important; border: 1px solid #e9ecef !important; }
        .visual-inspector-location-label { font-weight: bold !important; color: #495057 !important; font-size: 12px !important; margin-bottom: 4px !important; }
        .visual-inspector-location-value { font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important; font-size: 13px !important; color: #0066cc !important; }
    `;
    const styleSheet = document.createElement('style');
    styleSheet.textContent = css;
    document.head.appendChild(styleSheet);

    window.visualInspector = {
        active: false,
        toolbar: null,
        selectBtn: null,
        screenshotBtn: null,
        styleSheet: styleSheet,
        currentNotification: null,
        boundHandleClick: null,
        boundHandleMouseOver: null,
        boundHandleKeyDown: null,
        lastElement: null,
        lastData: null,

        async init() {
            this.boundHandleClick = this._handleClick.bind(this);
            this.boundHandleMouseOver = this._handleMouseOver.bind(this);
            this.boundHandleKeyDown = this._handleKeyDown.bind(this);
            this.showNotification('Loading screenshot library...');
            try {
                await loadScript(HTML2CANVAS_URL);
                this.hasScreenshotSupport = true;
                this.showNotification('✅ Inspector Ready with screenshots!', 'success');
              
            } catch (e) {
                console.warn('Screenshot library failed to load:', e.message);
                this.hasScreenshotSupport = false;
                this.showNotification('⚠️ Inspector Ready (screenshots disabled due to CSP)', 'default');
            }
            
            // Always create toolbar and setup events, even without screenshots
            this.createToolbar();
            this.setupEvents();
        },

        createToolbar() {
            this.toolbar = document.createElement('div');
            this.toolbar.className = 'visual-inspector-toolbar';
            
            // Select element button
            this.selectBtn = document.createElement('button');
            this.selectBtn.className = 'visual-inspector-toolbar-btn';
            this.selectBtn.innerHTML = '<span class="icon">🎯</span> Select element';
            this.selectBtn.onclick = (e) => { e.stopPropagation(); this.handleSelectElement(); };
            
            // Separator
            const separator = document.createElement('div');
            separator.className = 'visual-inspector-separator';
            
            // Screenshot button
            this.screenshotBtn = document.createElement('button');
            this.screenshotBtn.className = 'visual-inspector-toolbar-btn';
            this.screenshotBtn.innerHTML = '<span class="icon">📸</span> Screenshot';
            this.screenshotBtn.onclick = (e) => { e.stopPropagation(); this.takeScreenshot(); };
            this.screenshotBtn.disabled = true;
            this.screenshotBtn.style.opacity = '0.5';
            
            this.toolbar.appendChild(this.selectBtn);
            this.toolbar.appendChild(separator);
            this.toolbar.appendChild(this.screenshotBtn);
            
            document.body.appendChild(this.toolbar);
        },
        
        setupEvents() { 
            document.addEventListener('keydown', this.boundHandleKeyDown); 
            this.boundHandleContextMenu = this._handleContextMenu.bind(this);
        },
        _handleKeyDown(e) { if (e.key === 'Escape') this.deactivate(); },
        
        handleSelectElement() {
            if (this.active) {
                this.deactivate();
            } else {
                this.activate();
            }
        },
        
        activate() {
            if (this.active) return;
            this.active = true;
            this.selectBtn.innerHTML = '<span class="icon">🎯</span> Inspecting...';
            this.selectBtn.classList.add('active');
            document.addEventListener('mouseover', this.boundHandleMouseOver, true);
            // Only listen for right-click (contextmenu) events
            document.addEventListener('contextmenu', this.boundHandleContextMenu, true);
            this.showNotification('🎯 Right-click to inspect elements');
        },
        
        deactivate() {
            if (!this.active) return;
            this.active = false;
            this.selectBtn.innerHTML = '<span class="icon">🎯</span> Select element';
            this.selectBtn.classList.remove('active');
            this.removeHighlight();
            document.removeEventListener('mouseover', this.boundHandleMouseOver, true);
            // Only remove contextmenu listener since we're not adding click listener anymore
            document.removeEventListener('contextmenu', this.boundHandleContextMenu, true);
        },

        _handleMouseOver(e) {
            if (this.isInspectorElement(e.target)) return;
            this.createHighlight(e.target);
        },

        async _handleContextMenu(e) {
            if (this.isInspectorElement(e.target)) return;
            e.preventDefault();
            e.stopPropagation();
            
            this.removeHighlight();
            this.showNotification('🎨 Element captured via right-click!');
            
            try {
                this.lastElement = e.target;
                this.lastData = await this.extractDataWithScreenshot(e.target);
                this.enableButtons();
                this.copyTextOnly(this.formatForChat(this.lastData));
                // Don't auto-deactivate on right-click to allow multiple inspections
            } catch (error) {
                console.error('Data extraction failed:', error);
                this.showNotification('❌ Capture failed.', 'error');
            }
        },
        
        async _handleClick(e) {
            if (this.isInspectorElement(e.target)) return;
            
            // Check if this is an interactive element that should maintain its behavior
            const isInteractive = this.isInteractiveElement(e.target);
            
            if (isInteractive) {
                // For interactive elements, let the interaction happen first, then capture
                this.showNotification('🎯 Interactive element - capturing after interaction...');
                
                // Use a longer delay to allow dropdown/interaction to complete
                setTimeout(async () => {
                    try {
                        this.removeHighlight();
                        
                        // Try to find expanded dropdown content
                        let elementToCapture = e.target;
                        const expandedContent = this.findExpandedDropdownContent(e.target);
                        if (expandedContent) {
                            elementToCapture = expandedContent;
                            this.showNotification('🎨 Capturing expanded dropdown content!');
                        }
                        
                        this.lastElement = elementToCapture;
                        this.lastData = await this.extractDataWithScreenshot(elementToCapture);
                        this.enableButtons();
                        this.showNotification('🎨 Interactive element captured!');
                        this.copyTextOnly(this.formatForChat(this.lastData));
                        // Don't auto-deactivate for interactive elements to allow multiple captures
                    } catch (error) {
                        console.error('Data extraction failed:', error);
                        this.showNotification('❌ Capture failed.', 'error');
                    }
                }, 500); // Longer delay (500ms) to allow dropdown to open completely
                
                return; // Let the normal click behavior happen first
            }
            
            // For non-interactive elements, prevent default and capture immediately
            e.preventDefault();
            e.stopPropagation();
            this.removeHighlight();
            this.showNotification('🎨 Element captured!');
            try {
                this.lastElement = e.target;
                this.lastData = await this.extractDataWithScreenshot(e.target);
                this.enableButtons();
                this.deactivate();
                // Automatically copy full content
                this.copyTextOnly(this.formatForChat(this.lastData));
            } catch (error) {
                console.error('Data extraction failed:', error);
                this.showNotification('❌ Capture failed.', 'error');
                this.deactivate();
            }
        },
        
        isInspectorElement: (el) => el.closest('.visual-inspector-toolbar, .visual-inspector-notification'),

        isInteractiveElement(element) {
            // First check for form elements that definitely need their click behavior
            const formElements = ['select', 'input', 'textarea', 'button'];
            if (formElements.includes(element.tagName.toLowerCase())) {
                return true;
            }
            
            // Check for links
            if (element.tagName.toLowerCase() === 'a' && element.href) {
                return true;
            }
            
            // Check for elements with interactive roles
            const interactiveRoles = ['button', 'menuitem', 'option', 'tab', 'checkbox', 'radio'];
            if (interactiveRoles.includes(element.getAttribute('role'))) {
                return true;
            }
            
            // Check for elements with click handlers
            if (element.onclick || element.getAttribute('onclick')) {
                return true;
            }
            
            // Check for dropdown-related attributes
            if (element.hasAttribute('aria-haspopup') || 
                element.hasAttribute('data-toggle') || 
                element.hasAttribute('data-bs-toggle')) {
                return true;
            }
            
            // Check if element is inside a dropdown
            if (element.closest('select, .dropdown, .dropdown-menu, [role="menu"], [role="listbox"]')) {
                return true;
            }
            
            // Check for common interactive classes (be more specific)
            const elementClasses = (element.className?.toString() || '').toLowerCase();
            const interactivePatterns = [
                /\bbtn\b/, /\bbutton\b/, /\bdropdown\b/, /\bmenu\b/, 
                /\btoggle\b/, /\bclickable\b/, /\binteractive\b/
            ];
            
            for (const pattern of interactivePatterns) {
                if (pattern.test(elementClasses)) {
                    return true;
                }
            }
            
            // Check if element has tabindex (focusable)
            const tabindex = element.getAttribute('tabindex');
            if (tabindex !== null && tabindex !== '-1') {
                return true;
            }
            
            return false;
        },

        findExpandedDropdownContent(triggerElement) {
            // Look for various types of expanded dropdown content
            
            // For HTML select elements, we can't capture the native dropdown
            if (triggerElement.tagName.toLowerCase() === 'select') {
                return null;
            }
            
            // Look for Bootstrap/custom dropdowns
            const possibleSelectors = [
                '.dropdown-menu.show',
                '.dropdown-menu[style*="display: block"]',
                '.dropdown-menu[style*="display:block"]',
                '[aria-expanded="true"] + .dropdown-menu',
                '[aria-expanded="true"] ~ .dropdown-menu',
                '.dropdown.show .dropdown-menu',
                '.open .dropdown-menu'
            ];
            
            // Check if the trigger element has an associated dropdown
            for (const selector of possibleSelectors) {
                const dropdown = document.querySelector(selector);
                if (dropdown && this.isDropdownRelatedTo(dropdown, triggerElement)) {
                    return dropdown;
                }
            }
            
            // Look for dropdown content near the trigger element
            const parent = triggerElement.closest('.dropdown, .select, .menu-container');
            if (parent) {
                const dropdownContent = parent.querySelector('.dropdown-menu, .menu, .options, .dropdown-content');
                if (dropdownContent && this.isVisible(dropdownContent)) {
                    return dropdownContent;
                }
            }
            
            // Look for any visible dropdown menu that appeared recently
            const allDropdowns = document.querySelectorAll('.dropdown-menu, .menu, .options, .dropdown-content, [role="menu"], [role="listbox"]');
            for (const dropdown of allDropdowns) {
                if (this.isVisible(dropdown) && this.isNearElement(dropdown, triggerElement)) {
                    return dropdown;
                }
            }
            
            return null;
        },

        isDropdownRelatedTo(dropdown, triggerElement) {
            // Check if dropdown is controlled by the trigger element
            const triggerId = triggerElement.id;
            const triggerAriaControls = triggerElement.getAttribute('aria-controls');
            
            if (triggerId && dropdown.getAttribute('aria-labelledby') === triggerId) {
                return true;
            }
            
            if (triggerAriaControls && dropdown.id === triggerAriaControls) {
                return true;
            }
            
            // Check if they're in the same dropdown container
            const triggerContainer = triggerElement.closest('.dropdown, .select, .menu-container');
            const dropdownContainer = dropdown.closest('.dropdown, .select, .menu-container');
            
            return triggerContainer && triggerContainer === dropdownContainer;
        },

        isVisible(element) {
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && 
                   style.visibility !== 'hidden' && 
                   style.opacity !== '0' &&
                   element.offsetWidth > 0 && 
                   element.offsetHeight > 0;
        },

        isNearElement(dropdown, triggerElement) {
            const dropdownRect = dropdown.getBoundingClientRect();
            const triggerRect = triggerElement.getBoundingClientRect();
            
            // Check if dropdown is positioned near the trigger (within 200px)
            const distance = Math.sqrt(
                Math.pow(dropdownRect.left - triggerRect.left, 2) + 
                Math.pow(dropdownRect.top - triggerRect.bottom, 2)
            );
            
            return distance < 200;
        },

        enableButtons() {
            this.screenshotBtn.disabled = false;
            this.screenshotBtn.style.opacity = '1';
        },

        async takeScreenshot() {
            if (!this.lastElement) return;
            
            if (!this.hasScreenshotSupport) {
                this.showNotification('📸 Screenshots unavailable due to site security policy', 'error');
                return;
            }
            
            try {
                const screenshot = await this.captureElementScreenshot(this.lastElement);
                await this.copyImageOnly(screenshot);
            } catch (error) {
                this.showNotification('❌ Screenshot failed', 'error');
            }
        },

        createHighlight(element) {
            this.removeHighlight();
            const rect = element.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.className = 'visual-inspector-highlight';
            highlight.style.cssText = `top:${rect.top + window.scrollY}px; left:${rect.left + window.scrollX}px; width:${rect.width}px; height:${rect.height}px;`;
            
            const tooltip = document.createElement('div');
            tooltip.className = 'visual-inspector-tooltip';
            
            // Check if element is interactive and add appropriate message
            const isInteractive = this.isInteractiveElement(element);
            const elementInfo = `${element.tagName.toLowerCase()}${element.className ? '.' + element.className.toString().split(' ')[0] : ''}`;
            
            if (isInteractive) {
                tooltip.innerHTML = `${elementInfo}<br><small>🖱️ Right-click to inspect</small>`;
            } else {
                tooltip.innerHTML = `${elementInfo}<br><small>🖱️ Right-click to inspect</small>`;
            }
            
            tooltip.style.cssText = `top:${Math.max(10, rect.top + window.scrollY - 50)}px; left:${Math.max(10, rect.left + window.scrollX)}px;`;
            document.body.appendChild(highlight);
            document.body.appendChild(tooltip);
            this._highlightEl = highlight;
            this._tooltipEl = tooltip;
        },

        removeHighlight() {
            if (this._highlightEl) this._highlightEl.remove();
            if (this._tooltipEl) this._tooltipEl.remove();
        },

        async captureElementScreenshot(element) {
            if (!window.html2canvas) throw new Error("html2canvas is not loaded.");
            const canvas = await window.html2canvas(element, { 
                allowTaint: true, 
                useCORS: true, 
                backgroundColor: null, 
                logging: false,
                scale: 2,
                width: element.offsetWidth,
                height: element.offsetHeight
            });
            return canvas.toDataURL('image/png');
        },

        extractComputedStyles(element) {
            const computedStyles = window.getComputedStyle(element);
            const importantStyles = [
                'display', 'position', 'top', 'right', 'bottom', 'left',
                'width', 'height', 'margin', 'padding', 'border', 'border-radius',
                'background', 'background-color', 'background-image', 'background-size',
                'color', 'font-family', 'font-size', 'font-weight', 'line-height',
                'text-align', 'text-decoration', 'opacity', 'visibility',
                'z-index', 'overflow', 'transform', 'transition', 'animation',
                'box-shadow', 'flex', 'grid', 'justify-content', 'align-items'
            ];

            const styles = {};
            importantStyles.forEach(prop => {
                const value = computedStyles.getPropertyValue(prop);
                if (value && value !== 'none' && value !== 'initial' && value !== 'auto' && value !== 'normal') {
                    styles[prop] = value;
                }
            });

            return styles;
        },

        generateXPath(element) {
            if (element === document.body) return '/html/body';
            
            const ix = Array.from(element.parentNode.childNodes)
                .filter(node => node.nodeType === 1)
                .indexOf(element) + 1;
            
            const tagName = element.tagName.toLowerCase();
            const xpath = this.generateXPath(element.parentNode) + '/' + tagName + '[' + ix + ']';
            return xpath;
        },

        getDOMPath(element) {
            const path = [];
            let current = element;
            
            while (current && current !== document.body) {
                let selector = current.tagName.toLowerCase();
                
                if (current.id) {
                    selector += '#' + current.id;
                    path.unshift(selector);
                    break; // ID is unique, we can stop here
                } else if (current.className) {
                    const classes = current.className.toString().split(' ').filter(c => c.trim());
                    if (classes.length > 0) {
                        selector += '.' + classes.join('.');
                    }
                }
                
                // Add index if there are multiple siblings with same tag
                const siblings = Array.from(current.parentNode?.children || [])
                    .filter(sibling => sibling.tagName === current.tagName);
                if (siblings.length > 1) {
                    const index = siblings.indexOf(current) + 1;
                    selector += `:nth-of-type(${index})`;
                }
                
                path.unshift(selector);
                current = current.parentNode;
            }
            
            return path.join(' > ');
        },

        getElementLocation(element) {
            const parent = element.parentElement;
            const siblings = parent ? Array.from(parent.children) : [];
            const elementIndex = siblings.indexOf(element);
            const totalSiblings = siblings.length;
            
            return {
                parent: parent ? {
                    tag: parent.tagName.toLowerCase(),
                    id: parent.id || null,
                    className: parent.className || null,
                    selector: this.getSelector(parent)
                } : null,
                siblingIndex: elementIndex + 1,
                totalSiblings: totalSiblings,
                isFirstChild: elementIndex === 0,
                isLastChild: elementIndex === totalSiblings - 1,
                xpath: this.generateXPath(element),
                domPath: this.getDOMPath(element)
            };
        },

        formatStylesAsCSS(styles, selector) {
            let css = `${selector} {\n`;
            Object.entries(styles).forEach(([prop, value]) => {
                css += `  ${prop}: ${value};\n`;
            });
            css += `}`;
            return css;
        },

        async extractDataWithScreenshot(element) {
            const basicData = this.extractBasicData(element);
            const computedStyles = this.extractComputedStyles(element);
            const cssCode = this.formatStylesAsCSS(computedStyles, basicData.selector);
            const locationData = this.getElementLocation(element);
            
            // Add special handling for select elements
            if (element.tagName.toLowerCase() === 'select') {
                basicData.selectInfo = this.getSelectElementInfo(element);
            }
            
            // Skip screenshot if not supported
            if (!this.hasScreenshotSupport) {
                return { ...basicData, screenshot: null, hasScreenshot: false, styles: computedStyles, cssCode, location: locationData };
            }
            
            try {
                const screenshot = await this.captureElementScreenshot(element);
                return { ...basicData, screenshot, hasScreenshot: true, styles: computedStyles, cssCode, location: locationData };
            } catch (error) {
                console.error("Screenshot capture error:", error);
                this.showNotification('⚠️ Screenshot failed, but styles captured.', 'error');
                return { ...basicData, screenshot: null, hasScreenshot: false, styles: computedStyles, cssCode, location: locationData };
            }
        },

        getSelectElementInfo(selectElement) {
            const options = Array.from(selectElement.options);
            const selectedOption = selectElement.selectedOptions[0];
            
            return {
                selectedValue: selectElement.value,
                selectedText: selectedOption ? selectedOption.text : '',
                selectedIndex: selectElement.selectedIndex,
                totalOptions: options.length,
                allOptions: options.map(option => ({
                    value: option.value,
                    text: option.text,
                    selected: option.selected
                }))
            };
        },

        extractBasicData(element) {
            const isMainContainer = this.isMainContainer(element);
            
            return {
                tag: element.tagName.toLowerCase(),
                html: isMainContainer ? this.getContainerSummary(element) : this.cleanHTML(element.outerHTML),
                selector: this.getSelector(element),
                url: window.location.href,
                text: element.innerText?.trim() || '',
                isMainContainer: isMainContainer,
                containerStats: isMainContainer ? this.getContainerStats(element) : null
            };
        },

        isMainContainer(element) {
            const childCount = element.children.length;
            const textLength = element.outerHTML.length;
            const tagName = element.tagName.toLowerCase();
            const hasContainerClass = /container|wrapper|main|content|page|layout|grid|feed|list/.test(element.className?.toString() || '');
            const hasContainerId = /container|wrapper|main|content|page|layout|root/.test(element.id || '');
            
            // Consider it a main container if:
            return (
                childCount > 10 ||                           // Many children
                textLength > 10000 ||                        // Large content
                tagName === 'main' ||                        // Semantic main
                tagName === 'body' ||                        // Body element
                hasContainerClass ||                         // Container-like class
                hasContainerId ||                            // Container-like ID
                element.getAttribute('role') === 'main'      // ARIA main role
            );
        },

        getContainerStats(element) {
            const stats = {
                totalChildren: element.children.length,
                directChildren: Array.from(element.children).length,
                textContent: element.textContent.length,
                htmlSize: element.outerHTML.length,
                nestingDepth: this.getNestingDepth(element),
                childTypes: {}
            };

            // Count child element types
            Array.from(element.children).forEach(child => {
                const type = `${child.tagName.toLowerCase()}${child.className ? '.' + child.className.toString().split(' ')[0] : ''}`;
                stats.childTypes[type] = (stats.childTypes[type] || 0) + 1;
            });

            return stats;
        },

        getNestingDepth(element) {
            let depth = 0;
            let current = element;
            while (current.children.length > 0) {
                depth++;
                current = current.children[0];
                if (depth > 10) break; // Prevent infinite loops
            }
            return depth;
        },

        getContainerSummary(element) {
            const stats = this.getContainerStats(element);
            const childTypesEntries = Object.entries(stats.childTypes)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10); // Top 10 child types

            let summary = `<!-- MAIN CONTAINER SUMMARY -->\n`;
            summary += `<!-- Total children: ${stats.totalChildren} -->\n`;
            summary += `<!-- Content size: ${Math.round(stats.htmlSize / 1024)}KB -->\n`;
            summary += `<!-- Nesting depth: ${stats.nestingDepth} levels -->\n\n`;

            summary += `<${element.tagName.toLowerCase()}`;
            
            // Add main attributes
            if (element.id) summary += ` id="${element.id}"`;
            if (element.className) {
                const classNameStr = element.className.toString();
                const shortClass = classNameStr.length > 100 
                    ? classNameStr.substring(0, 100) + '...' 
                    : classNameStr;
                summary += ` class="${shortClass}"`;
            }
            
            // Add other important attributes
            ['role', 'data-testid', 'aria-label'].forEach(attr => {
                if (element.hasAttribute(attr)) {
                    summary += ` ${attr}="${element.getAttribute(attr)}"`;
                }
            });
            
            summary += `>\n\n`;

            // Show structure summary
            summary += `  <!-- CHILD ELEMENT BREAKDOWN -->\n`;
            childTypesEntries.forEach(([type, count]) => {
                summary += `  <!-- ${count}x ${type} -->\n`;
            });
            summary += `\n`;

            // Show first few actual children (simplified)
            const sampleChildren = Array.from(element.children).slice(0, 3);
            sampleChildren.forEach((child, index) => {
                summary += `  <!-- SAMPLE CHILD ${index + 1} -->\n`;
                const childHtml = this.cleanHTML(child.outerHTML);
                if (childHtml.length > 500) {
                    const simplified = childHtml.substring(0, 300) + '\n    <!-- ... child content truncated ... -->\n  ' + this.getClosingTag(child);
                    summary += `  ${simplified}\n\n`;
                } else {
                    summary += `  ${childHtml}\n\n`;
                }
            });

            if (stats.totalChildren > 3) {
                summary += `  <!-- ... and ${stats.totalChildren - 3} more children ... -->\n\n`;
            }

            summary += `</${element.tagName.toLowerCase()}>`;
            
            return summary;
        },

        getClosingTag(element) {
            return `</${element.tagName.toLowerCase()}>`;
        },

        cleanHTML(html) {
            // If too large, apply smart truncation first (before SVG cleaning to avoid parsing errors)
            if (html.length > 5000) {
                return this.smartTruncateHTML(html);
            }
            
            // Clean up long attributes for smaller content
            return html
                .replace(/\sd="[^"]{200,}"/g, ' d="M0,0"')
                .replace(/\spath="[^"]{200,}"/g, ' path="M0,0"')
                .replace(/\spoints="[^"]{200,}"/g, ' points="0,0"')
                .replace(/\sstyle="[^"]{300,}"/g, ' style="/* long styles truncated */"')
                .replace(/\sclass="[^"]{200,}"/g, ' class="truncated-classes"');
        },

        smartTruncateHTML(html) {
            try {
                // First clean problematic SVG attributes before parsing
                let safeHtml = html
                    .replace(/\sd="[^"]{200,}"/g, ' d="M0,0"')
                    .replace(/\spath="[^"]{200,}"/g, ' path="M0,0"')
                    .replace(/\spoints="[^"]{200,}"/g, ' points="0,0"')
                    .replace(/\sstyle="[^"]{300,}"/g, ' style="/* truncated */"')
                    .replace(/\sclass="[^"]{200,}"/g, ' class="truncated"');

                // Create a temporary container to parse HTML
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = safeHtml;
                
                // Find repeated elements
                const processedElement = this.limitRepeatedElements(tempDiv);
                
                return processedElement.innerHTML;
            } catch (error) {
                console.error('Smart truncation failed:', error);
                // Fallback to simple truncation with SVG cleaning
                let fallbackHtml = html
                    .replace(/\sd="[^"]{50,}"/g, ' d="M0,0"')
                    .replace(/\spath="[^"]{50,}"/g, ' path="M0,0"')
                    .replace(/\spoints="[^"]{50,}"/g, ' points="0,0"');
                return fallbackHtml.substring(0, 5000) + '\n<!-- ... content truncated due to parsing error ... -->';
            }
        },

        limitRepeatedElements(container) {
            const children = Array.from(container.children);
            if (children.length <= 5) return container;

            // Group children by tag + class signature
            const groups = new Map();
            children.forEach((child, index) => {
                const signature = `${child.tagName.toLowerCase()}.${child.className?.toString() || ''}`;
                if (!groups.has(signature)) {
                    groups.set(signature, []);
                }
                groups.get(signature).push({ element: child, index });
            });

            // Find groups with more than 5 elements
            const result = document.createElement(container.tagName);
            result.className = container.className;
            result.id = container.id;

            // Copy attributes
            for (let attr of container.attributes) {
                if (attr.name !== 'class' && attr.name !== 'id') {
                    result.setAttribute(attr.name, attr.value);
                }
            }

            let processedIndices = new Set();

            groups.forEach((items, signature) => {
                if (items.length > 5) {
                    // Add first 5 elements
                    for (let i = 0; i < 5; i++) {
                        const clonedElement = items[i].element.cloneNode(true);
                        // Recursively process child elements
                        this.limitRepeatedElements(clonedElement);
                        result.appendChild(clonedElement);
                        processedIndices.add(items[i].index);
                    }
                    
                    // Add summary comment
                    const remainingCount = items.length - 5;
                    const summary = document.createComment(` ... and ${remainingCount} more similar ${signature} elements`);
                    result.appendChild(summary);
                    
                    // Mark remaining as processed
                    for (let i = 5; i < items.length; i++) {
                        processedIndices.add(items[i].index);
                    }
                } else {
                    // Add all elements from small groups
                    items.forEach(item => {
                        if (!processedIndices.has(item.index)) {
                            const clonedElement = item.element.cloneNode(true);
                            this.limitRepeatedElements(clonedElement);
                            result.appendChild(clonedElement);
                            processedIndices.add(item.index);
                        }
                    });
                }
            });

            return result;
        },

        getSelector(element) {
            if (element.id) return '#' + element.id;
            let selector = element.tagName.toLowerCase();
            if (element.className) {
                const classes = element.className.toString().split(' ').filter(c => c.trim());
                if (classes.length > 0) {
                    selector += '.' + classes.join('.');
                }
            }
            return selector;
        },



        async copyTextOnly(text) {
             try {
                await navigator.clipboard.writeText(text);
                this.showNotification('✅ Copied!', 'success');
            } catch (e) { this.showNotification('❌ Copy failed', 'error'); }
        },

        async copyImageOnly(imageDataUrl) {
            try {
                if (!imageDataUrl) throw new Error("No image data");
                const response = await fetch(imageDataUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                this.showNotification('✅ Screenshot copied!', 'success');
            } catch(e) { this.showNotification('❌ Screenshot failed', 'error'); }
        },

        formatLocationInfo(data) {
            return `# 🧭 Element Location in Code

**URL:** ${data.url}
**Element:** \`${data.selector}\`

## 🗺️ How to Find This Element

### DOM Path (CSS Selector Chain)
\`\`\`css
${data.location.domPath}
\`\`\`

### XPath
\`\`\`xpath
${data.location.xpath}
\`\`\`

### Element Context
- **Parent Element:** \`${data.location.parent ? data.location.parent.selector : 'None (root)'}\`
- **Sibling Position:** ${data.location.siblingIndex} of ${data.location.totalSiblings} children
- **Position Type:** ${data.location.isFirstChild ? 'First Child' : data.location.isLastChild ? 'Last Child' : 'Middle Child'}
- **Search Hint:** Look for \`${data.tag}\`${data.text ? ` containing "${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"` : ''}

### Code Search Tips
1. Search for the element ID: \`${data.selector.includes('#') ? data.selector : 'No ID available'}\`
2. Search for class names: \`${data.selector.includes('.') ? data.selector.split('.').slice(1).join(' ') : 'No classes available'}\`
3. Search for text content: "${data.text ? data.text.substring(0, 30) : 'No text content'}"
4. Look in parent: \`${data.location.parent ? data.location.parent.selector : 'Document root'}\`

---
*Generated by Enhanced Visual Element Inspector v6.0*`;
        },

        formatForChat(data) {
            const isContainer = data.isMainContainer;
            let content = `# 🎨 ${isContainer ? 'Main Container' : 'Element'} Inspection

**URL:** ${data.url}
**Selector:** \`${data.selector}\`
${data.text ? `**Text Content:** ${data.text.substring(0, 200)}${data.text.length > 200 ? '...' : ''}` : ''}`;

            if (isContainer && data.containerStats) {
                content += `

## 📊 Container Statistics
- **Total Children:** ${data.containerStats.totalChildren}
- **Content Size:** ${Math.round(data.containerStats.htmlSize / 1024)}KB
- **Nesting Depth:** ${data.containerStats.nestingDepth} levels
- **Child Element Types:**`;
                
                Object.entries(data.containerStats.childTypes)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .forEach(([type, count]) => {
                        content += `\n  - ${count}x \`${type}\``;
                    });
            }

            // Add select element information if available
            if (data.selectInfo) {
                content += `

## 📋 Select Element Details
- **Selected Value:** \`${data.selectInfo.selectedValue}\`
- **Selected Text:** "${data.selectInfo.selectedText}"
- **Selected Index:** ${data.selectInfo.selectedIndex}
- **Total Options:** ${data.selectInfo.totalOptions}

### All Options:`;
                data.selectInfo.allOptions.forEach((option, index) => {
                    const marker = option.selected ? '✅' : '  ';
                    content += `\n${marker} ${index}: "${option.text}" (value: \`${option.value}\`)`;
                });
            }

            content += `

## 🧭 Element Location in Code

### DOM Path
\`\`\`css
${data.location.domPath}
\`\`\`

### XPath
\`\`\`xpath
${data.location.xpath}
\`\`\`

### Context Information
- **Parent:** \`${data.location.parent ? data.location.parent.selector : 'None (root)'}\`
- **Position:** ${data.location.siblingIndex} of ${data.location.totalSiblings} children (${data.location.isFirstChild ? 'First' : data.location.isLastChild ? 'Last' : 'Middle'})

## 🎨 CSS Styles
\`\`\`css
${data.cssCode}
\`\`\`

## 📝 ${isContainer ? 'Container Structure Summary' : 'HTML Structure'}
\`\`\`html
${data.html}
\`\`\`

---
*Captured with Enhanced Visual Element Inspector v6.0. ${isContainer ? 'Main container detected - showing structural summary.' : 'Screenshot copied separately if available.'}*`;

            return content;
        },

        escapeHtml(unsafe) {
            if (!unsafe) return '';
            return unsafe
                 .replace(/&/g, "&amp;")
                 .replace(/</g, "&lt;")
                 .replace(/>/g, "&gt;")
                 .replace(/"/g, "&quot;")
                 .replace(/'/g, "&#039;");
            },

        showNotification(message, type = 'default') {
            if (this.currentNotification) this.currentNotification.remove();
            const notification = document.createElement('div');
            notification.className = `visual-inspector-notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            this.currentNotification = notification;
            setTimeout(() => { if (this.currentNotification === notification) notification.remove(); }, 4000);
        },

        destroy() {
            this.deactivate();
            if (this.toolbar) this.toolbar.remove();
            if (this.styleSheet) this.styleSheet.remove();
            document.removeEventListener('keydown', this.boundHandleKeyDown);
            if (this.boundHandleContextMenu) {
                document.removeEventListener('contextmenu', this.boundHandleContextMenu, true);
            }
            if (window.visualInspector === this) delete window.visualInspector;
            console.log('🎨 Visual Inspector destroyed');
        }
    };
    
    window.visualInspector.init();
})();