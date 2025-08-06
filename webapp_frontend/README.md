# Grand Warden Web App

> A privacy-first security suite for managing your passwords and Web3 wallets.

## Overview

Grand Warden is a next-generation security suite designed to protect your entire digital life in one place. This web application provides:

1. **Password Vault** – Zero-knowledge credential manager
2. **Wallet Vault** – Encrypted storage for Web3 keys with enclave-based signing

## Tech Stack

- React
- TypeScript
- Tailwind CSS
- Vite
- React Router
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the webapp_frontend directory
3. Install dependencies

```bash
cd webapp_frontend
npm install
```

### Development

```bash
npm run dev
```

This will start the development server at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Planned Web3 Integrations

- **Sui zkLogin** - Seed-phrase-free onboarding using Google/Apple identity
- **Oasis Sapphire** - Confidential compute & remote-attested key custody
- **The Graph** - Real-time security analytics via GraphQL
- **Walrus + Seal** - Decentralized blob storage & ACL

## Folder Structure

```
webapp_frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   ├── App.tsx         # Main application component with routing
│   ├── main.tsx        # Application entry point
│   └── index.css       # Global styles
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
└── vite.config.ts      # Vite configuration
```