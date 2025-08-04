# Getting Started - Grand Warden Chrome Extension

This guide will help you set up and run the Grand Warden password manager Chrome extension on your local machine.

## 📋 Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Google Chrome** browser
- **Git** (optional, for version control)

## 🚀 Setup Instructions

### 1. Clone/Download the Project
```bash
# If using Git
git clone [repository-url]
cd apudevmatch2025/frontend

# Or download and extract the ZIP file, then navigate to the frontend folder
```

### 2. Install Dependencies
```bash
cd frontend
npm install
```

This will install all required packages including React, TailwindCSS, Vite, and other dependencies.

### 3. Build the Extension
```bash
npm run build
```

This creates a `dist` folder with the compiled extension files that Chrome can load.

## 🔧 Loading Extension in Chrome

### 1. Open Chrome Extensions Page
- Open Google Chrome
- Go to `chrome://extensions/`
- Or click the three dots menu → More Tools → Extensions

### 2. Enable Developer Mode
- Toggle "Developer mode" ON in the top-right corner

### 3. Load the Extension
- Click "Load unpacked"
- Navigate to your project folder: `apudevmatch2025/frontend/dist`
- Select the `dist` folder (NOT the `frontend` folder)
- Click "Select Folder"

### 4. Test the Extension
- You should see "Grand Warden" appear in your extensions list
- Click the Grand Warden icon in your Chrome toolbar
- The extension popup should open with the social login screen
- Try clicking "Sign in with Google" or "Sign in with Facebook" to see the loading states
- After signing in, explore the comprehensive Grand Warden prototype:

  **Password Vault (Main Dashboard):**
  - View 5 sample password entries (Gmail, GitHub, Amazon, Work Portal, LinkedIn)
  - Click the eye icon to reveal/hide passwords
  - Use the copy buttons to copy usernames and passwords
  - Test the search functionality by typing in the search bar
  - Click "Add New Password" to open the add password modal:
    - Fill out the form fields (all required)
    - Try the "Generate Strong" password button
    - Test form validation by leaving fields empty
    - See the success toast notification after saving

  **Wallet Vault:**
  - Click "Wallet Vault" to access the Web3 wallet management
  - Switch between 3 mock wallets (Ethereum, Sui, Polygon)
  - View wallet balances, addresses, and transaction history
  - Toggle between Overview, Transactions, and Security tabs
  - See security scoring and wallet protection features

  **Analytics Dashboard:**
  - Click the chart icon to access comprehensive analytics
  - View network metrics, security scores, and usage statistics
  - Switch between Overview, Security, Usage, and Breaches tabs
  - See "The Graph" network status and real-time data simulation
  - Review recent data breaches and security events

  **Security Alerts:**
  - Click the triangle with red badge to view security alerts
  - See 3 sample alerts: breach warning, suspicious login, weak password
  - Use "Mark as Read" buttons to mark individual alerts as resolved
  - Use "Mark All Read" to clear all unread notifications
  - Dismiss alerts using the X button on each card

  **Settings & Device Management:**
  - Click "Settings" to access security preferences
  - Toggle security options (auto-lock, require login, breach alerts)
  - Click "Manage" under Trusted Devices to access Device Registry
  - View 5 mock devices with different security statuses
  - Trust/revoke device access and view device details
  - Use the "Sign Out" button to return to login screen

  **Smart Auto-Fill Functionality:**
  - **Test with demo page**: Open `dist/autofill-demo.html` in Chrome after installing the extension
  - Navigate to any login page (GitHub, Gmail, LinkedIn, Amazon, Facebook, etc.)
  - **See blue icons** automatically appear inside username and password fields (always visible)
  - **Click any icon** to instantly auto-fill the matching credential (no selection needed!)
  - Extension **auto-detects** the site with advanced matching:
    - GitHub → fills GitHub credentials
    - LinkedIn (any subdomain) → fills LinkedIn credentials  
    - Facebook/Meta domains → fills Facebook credentials
    - Gmail/Google accounts → fills Gmail credentials
  - **Debug mode**: Check browser console for detailed matching logs
  - **Only shows dropdown** if multiple credentials match the same site
  - Watch realistic typing animation as credentials are filled
  - Success notification appears in top-right corner after autofill
  - Extension badge shows number of available credentials for current site
  - Autofill status is displayed in the popup dashboard with real-time updates

  **Automatic Password Saving:**
  - **Login to any new website** with credentials not yet saved
  - **Submit the login form** (click login/sign-in button)
  - Extension **automatically detects** the form submission
  - **Save prompt appears** in top-right corner asking to save credentials
  - **Three options**: "Save", "Never" (for this site), "Not Now"
  - **Auto-dismisses** after 15 seconds if no action taken
  - **Password updates**: If you change a password, extension offers to update it
  - **Smart detection**: Only prompts for actual login forms with valid credentials
  - **No manual action** required - everything happens automatically!

## 🛠️ Development Workflow

### Making Changes
1. **Edit React code** in the `src/` folder
2. **Rebuild the extension:**
   ```bash
   npm run build
   ```
3. **Refresh the extension** in Chrome:
   - Go to `chrome://extensions/`
   - Find "Grand Warden"
   - Click the refresh icon 🔄

### Development Server (Optional)
For faster development, you can run a development server:
```bash
npm run dev
```
This opens the extension in your browser at `http://localhost:5173/` for testing, but you'll still need to build and load it as an extension for full Chrome integration.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx            # Extension header with logo
│   │   ├── LoginPrompt.tsx       # Social login screen
│   │   ├── Dashboard.tsx         # Main password interface with navigation
│   │   ├── Settings.tsx          # Settings page with security options
│   │   ├── Alerts.tsx            # Security alerts and breach warnings page  
│   │   ├── WalletVault.tsx       # Multi-chain Web3 wallet management
│   │   ├── DeviceRegistry.tsx    # Trusted device management and security
│   │   ├── Analytics.tsx         # Comprehensive analytics dashboard
│   │   ├── AutofillStatus.tsx    # Autofill status and controls
│   │   ├── AddPasswordModal.tsx  # Modal form for adding passwords
│   │   ├── Toast.tsx             # Individual toast notification
│   │   ├── ToastContainer.tsx    # Toast management system
│   │   └── Footer.tsx            # Help/About/Contact links
│   ├── content.ts               # Content script for web page form detection
│   ├── background.ts            # Background service worker
│   ├── App.tsx                  # Main app component with auth state
│   ├── main.tsx                 # React entry point
│   └── index.css                # TailwindCSS styles and components
├── public/
│   ├── manifest.json            # Chrome extension manifest
│   └── hello_extensions.png     # Extension icon (temporary)
├── dist/                        # Built extension files (created after npm run build)
├── index.html                   # Extension popup HTML
└── package.json                 # Dependencies and scripts
```

## 🎨 Extension Features

## 🎯 **Complete Grand Warden Prototype Features**

### **🔐 Core Security Suite**
- **Social Login**: Google and Facebook authentication with loading states and zkLogin simulation
- **Password Vault**: Secure display of credentials with reveal/hide functionality
- **Autofill System**: Intelligent form detection and secure credential autofill
- **Wallet Vault**: Multi-chain Web3 wallet management (EVM, Sui, Polygon)
- **Device Registry**: Trusted device management with security monitoring
- **Security Alerts**: Real-time breach warnings and threat notifications

### **📊 Analytics & Monitoring**
- **Analytics Dashboard**: Comprehensive security metrics powered by "The Graph"
- **Usage Statistics**: Network activity, user engagement, and feature adoption
- **Security Scoring**: Real-time security assessment and recommendations  
- **Breach Intelligence**: Live data breach monitoring and impact assessment
- **Performance Metrics**: Query latency, uptime monitoring, and system health

### **🛠️ Advanced Features**
- **Always-Visible Icons**: Small blue icons always visible inside login fields (no hover required)
- **Instant Auto-Fill**: Single click automatically fills the best matching credential
- **Smart Site Detection**: Advanced algorithm matches credentials to current website automatically
- **Intelligent Dropdowns**: Only shows selection when multiple credentials match (rare)
- **Automatic Save Detection**: Detects form submissions and prompts to save new credentials
- **Password Update Prompts**: Automatically offers to update changed passwords
- **Zero-Click Saving**: No need to manually open extension - save prompts appear automatically
- **Domain Matching**: Intelligent matching of saved credentials to current websites
- **Cross-Site Compatibility**: Works on any website with `!important` CSS overrides
- **Add Password Modal**: Comprehensive form with validation and password generation
- **Settings Management**: Security preferences with toggle switches and device control
- **Alert Management**: Mark as read, dismiss, and bulk actions for security notifications
- **Multi-Chain Support**: EVM and Sui blockchain wallet support with transaction history
- **Transaction Security**: Signing interface with phishing detection (simulated)

### **💎 User Experience**
- **Form Validation**: Real-time field validation with visual error indicators
- **Password Generator**: Built-in strong password generator with security scoring
- **Toast Notifications**: Success and error feedback system throughout the app
- **Copy to Clipboard**: One-click copying of usernames, passwords, and addresses
- **Search & Filter**: Real-time search through saved credentials and transaction history
- **Brand Icons**: Color-coded icons for different services and blockchain networks
- **Navigation**: Smooth transitions between all dashboard views (6 total screens)
- **Notification Badges**: Visual indicators for unread alerts and autofill opportunities
- **Content Script Integration**: Runs on all web pages to detect login opportunities
- **Background Service Worker**: Manages credentials and inter-component communication
- **Extension Badge**: Shows available credential count for current website
- **In-Field Icons**: Subtle icons that appear inside input fields like modern password managers
- **Professional Dropdowns**: Credential selection with avatars, usernames, and smooth hover effects
- **The Graph Integration UI**: Real-time data feed simulation and network status
- **Modern UI**: Cyber-themed dark design with blue accents and alert color coding
- **Responsive**: Optimized for 380x500px Chrome extension popup
- **User-friendly**: No Web3 terminology for non-technical users (zkLogin abstracted)
- **Professional**: Clean animations, smooth transitions, and enterprise-grade design
- **Security Focused**: Obfuscated passwords, security scoring, and threat intelligence

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. "Failed to load extension" error
- **Problem**: Extension won't load in Chrome
- **Solution**: Make sure you're selecting the `dist` folder, not the `frontend` folder

#### 2. "Could not load icon" error
- **Problem**: Icon file not found
- **Solution**: Run `npm run build` to ensure all files are copied to `dist`

#### 3. "PostCSS config error"
- **Problem**: CSS compilation fails
- **Solution**: The postcss.config.js should use `module.exports` (already fixed)

#### 4. Extension appears but shows blank page
- **Problem**: Build files not loading properly
- **Solution**: 
  ```bash
  # Clear and rebuild
  rm -rf dist node_modules
  npm install
  npm run build
  ```

#### 5. Changes not appearing
- **Problem**: Extension not updating after code changes
- **Solution**: 
  1. Run `npm run build`
  2. Go to `chrome://extensions/`
  3. Click refresh icon on Grand Warden extension

#### 6. Node.js version issues
- **Problem**: Build fails with Node.js errors
- **Solution**: Ensure you're using Node.js 16+ (`node --version`)

## 📝 Available Scripts

- `npm run dev` - Start development server at localhost:5173
- `npm run build` - Build extension for Chrome loading
- `npm run preview` - Preview built files locally

## 🔄 Making Updates

When you make changes to the code:

1. **Save your changes** in the `src/` folder
2. **Rebuild the extension:**
   ```bash
   npm run build
   ```
3. **Refresh in Chrome:**
   - Go to `chrome://extensions/`
   - Click the refresh button on Grand Warden

## 🆘 Need Help?

If you encounter issues:
1. Check this troubleshooting section
2. Ensure all prerequisites are installed
3. Try deleting `node_modules` and `dist` folders, then run:
   ```bash
   npm install
   npm run build
   ```
4. Check the browser console for error messages (F12)

## 🏗️ Next Steps

Once the extension is loaded successfully:
- Click "Sign In Securely" to see the dashboard
- Test the search functionality
- Try the footer links (Help, About, Contact)
- Ready for backend integration with SUI zkLogin!

---

**Project**: Grand Warden - Secure Password Manager  
**Framework**: React + TypeScript + TailwindCSS  
**Target**: Chrome Extension Manifest V3