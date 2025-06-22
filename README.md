# 🔍 Visual Element Inspector - Chrome Extension

**Enhanced element inspection with CSS extraction and screenshot functionality**

A powerful Chrome extension that allows you to inspect any element on any webpage, extract its CSS styles, capture screenshots, and get detailed DOM information - all with a simple click.

## ✨ Features

### 🎯 **Precise Element Selection**
- Hover over any element to see it highlighted with visual feedback
- Click to inspect and automatically copy detailed information to clipboard
- Works on any website, including localhost and development servers

### 🎨 **Complete CSS Extraction**
- Automatically extracts all computed CSS styles for selected elements
- Formats styles as clean, ready-to-use CSS code
- Includes all important properties: layout, typography, colors, effects, and more

### 📸 **High-Quality Screenshots**
- Capture pixel-perfect screenshots of individual elements
- Supports transparency and maintains original quality
- Screenshots are automatically copied to clipboard for immediate use

### 🧭 **Smart DOM Navigation**
- Generates CSS selectors, XPath, and DOM paths
- Shows element context and sibling relationships
- Perfect for locating elements in your code

### 📊 **Container Intelligence**
- Automatically detects large containers and main sections
- Provides structural summaries instead of overwhelming HTML dumps
- Shows child element statistics and nesting information

### ⌨️ **Easy Activation**
- **Click the extension icon** to activate the inspector on any page
- **Keyboard shortcut**: `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Shift+I` (Mac)
- `Escape` key to deactivate inspection mode

## 🚀 Installation

### Option 1: Install from Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Visual Element Inspector"  
3. Click "Add to Chrome"

### Option 2: Install as Developer Extension (Current)
1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. Pin the extension to your toolbar for easy access

## 🎯 How to Use

### **Activate the Inspector**
1. **Method 1**: Click the 🔍 extension icon in your Chrome toolbar
2. **Method 2**: Press `Ctrl+Shift+I` (Windows/Linux) or `Cmd+Shift+I` (Mac)

### **Inspect Elements**
1. **Left-click** any element to inspect it (for non-interactive elements)
2. **Right-click** interactive elements (buttons, dropdowns, links) to inspect without interfering
3. Element information is **automatically copied to clipboard**
4. Use the 📸 button to capture a screenshot of the last inspected element

### **Interactive vs Non-Interactive Elements**
- **Non-interactive elements** (divs, spans, text): Left-click to inspect
- **Interactive elements** (buttons, links, forms): Right-click to inspect without triggering their action
- The inspector intelligently detects element types and shows appropriate tooltips

## 📋 What Gets Copied

When you inspect an element, the following information is automatically copied to your clipboard:

```markdown
# 🎨 Element Inspection

**URL:** https://example.com
**Selector:** `div.container`

## 🧭 Element Location in Code
### DOM Path
```css
body > main > div.container:nth-of-type(1)
```

### XPath  
```xpath
/html/body/main/div[1]
```

## 🎨 CSS Styles
```css
div.container {
  display: flex;
  flex-direction: column;
  background-color: rgb(255, 255, 255);
  padding: 20px;
  border-radius: 8px;
  /* ... all computed styles ... */
}
```

## 📝 HTML Structure
```html
<div class="container">
  <!-- Element content -->
</div>
```
```

## 🔧 Advanced Features

### **Container Intelligence**
- Automatically detects main containers and page sections
- Provides structural summaries for large elements instead of overwhelming HTML
- Shows child element statistics and composition

### **CSS Extraction**
- Extracts all computed styles, not just inline styles
- Filters out default values to show only meaningful properties
- Formats as clean, ready-to-use CSS

### **Smart Screenshot Capture**  
- High-quality element screenshots with transparency support
- 2x scale for crisp results on high-DPI displays
- Automatically copied to clipboard for immediate use

### **Developer-Friendly Output**
- Multiple selector formats (CSS, XPath, DOM path)
- Element context and positioning information
- Sibling relationships and DOM hierarchy

## 🛠️ Technical Details

- **Manifest Version**: 3 (Latest Chrome Extension format)
- **Permissions**: Active tab, scripting
- **Dependencies**: html2canvas (loaded dynamically)  
- **Compatibility**: Chrome 88+, Edge 88+

## 📝 Changelog

### v6.0.0
- Enhanced interactive element detection
- Right-click inspection for interactive elements
- Improved background script with error handling
- Better keyboard shortcut support
- Container intelligence for large elements
- Streamlined activation via extension icon click

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Made with ❤️ for developers who need to inspect web elements efficiently** 