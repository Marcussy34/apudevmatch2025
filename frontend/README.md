# Grand Warden - Chrome Extension Frontend

A modern, secure password manager Chrome extension built with React and TailwindCSS.

## Setup & Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Development mode:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

4. **Load in Chrome:**
   - Build the project (`npm run build`)
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `dist` folder

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx        # Extension header with logo
│   │   ├── LoginPrompt.tsx   # Login screen for non-authenticated users
│   │   ├── Dashboard.tsx     # Main password management interface
│   │   └── Footer.tsx        # Footer with help/about/contact links
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # React entry point
│   └── index.css            # TailwindCSS styles and custom components
├── index.html               # Extension popup HTML
├── manifest.json            # Chrome extension manifest
└── package.json             # Dependencies and scripts
```

## Features

- **Modern UI**: Clean, futuristic design with "cyber lock" aesthetics
- **Responsive**: Optimized for Chrome extension popup (380x500px)
- **User-friendly**: No Web3 terminology - designed for non-technical users
- **Professional**: Dark theme with blue accents and smooth animations
- **Accessible**: Proper contrast ratios and semantic HTML

## Technologies

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first styling
- **Vite** - Build tool and dev server
- **Lucide React** - Modern icon library

## Design System

- **Colors**: Cyber-themed dark palette with blue accents
- **Typography**: Inter font for clean, modern text
- **Icons**: Lucide React icons with consistent stroke weights
- **Animations**: Subtle pulse and glow effects for interactive elements
- **Layout**: Fixed 380x500px optimized for Chrome extension popups