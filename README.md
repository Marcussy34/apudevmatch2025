# Grand Warden 🛡️👑

## Tackling Digital Security in the Age of Data Breaches

Empowering proactive password security: AI-powered risk analysis, decentralized storage, and on-chain trust for everyone.

---

## 🚀 Live Demo

- 👉 [Click here to try it out](#) _(Demo link placeholder)_
- 🎥 [Watch Demo Video](#) _(Video link placeholder)_

---

## 💡 Inspiration: How We Came Up With This Idea

We realized that even the best password managers today leave users exposed to breaches, phishing, and seed loss—often because secrets are stored in ways that can be compromised, or because users are left to interpret security signals on their own. What if there was a way to make password and wallet security proactive, verifiable, and privacy-preserving—so that every user could see their true risk posture, and no secret ever left a trusted enclave?

That question sparked Grand Warden. By combining decentralized storage (Walrus), strong client-side encryption (Seal), confidential AI analysis (ROFL), and on-chain attestations (SUI NFT), we built a platform that:

- Keeps your credentials private and decentralized
- Analyzes password strength and risk in a secure enclave (never exposing secrets)
- Monitors for breaches and alerts you in real time
- Issues a blockchain-bound NFT badge representing your current risk level
- Provides actionable, human-friendly security reports

---

## 🛡️ What is Grand Warden?

Grand Warden is a security-focused application that safeguards user credentials by combining decentralized storage, strong encryption, confidential AI analysis, and on-chain attestations:

- **Secure, decentralized storage** with Walrus
- **Robust client-side encryption** with Seal
- **Private, in-enclave password analysis** by an LLM running inside a ROFL trusted execution environment
- **Continuous breach monitoring** against global leak databases
- **Actionable, human-friendly security reports**
- **A SUI-bound NFT** that represents your current risk posture (High Risk / Low Risk / Safe) and is shown on your dashboard

This turns a traditional password manager into a proactive cybersecurity tool while keeping plaintext credentials confined to trusted execution and never exposed to the app backend.

---

## ✨ Features

- **🔐 Multi-Platform Support**: Chrome extension and web dashboard for seamless cross-device experience
- **🛡️ Zero-Knowledge Security**: Aggregates and encrypts credentials locally—never exposes plaintext to the cloud
- **🧠 Confidential AI Analysis**: Uses AI (in a secure ROFL enclave) to analyze password strength, risky patterns, and hygiene
- **🌐 Breach Monitoring**: Monitors global breach datasets and raises timely alerts if credentials are found
- **🎨 Dynamic NFT Badges**: Issues non-fungible risk badges on SUI, bound to accounts and visible in the UI
- **📊 Actionable Insights**: Provides concise, actionable recommendations to improve security posture
- **🔑 Seedless Onboarding**: Supports zkLogin (Google/Facebook) for frictionless access
- **⚡ Trusted Execution**: All sensitive operations (analysis, signing) happen inside TEE (ROFL/Sapphire)
- **🎭 Interactive UI**: Modern, responsive interface with 3D globe visualization and particle effects
- **📱 Device Registry**: Tracks and manages multiple devices for comprehensive security overview

---

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chrome       │    │   Web Dashboard  │    │   Backend API   │
│   Extension    │◄──►│   (Next.js)      │◄──►│   (Express)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Seal Client   │    │   Walrus Client  │    │   ROFL Worker   │
│   Encryption    │    │   Storage        │    │   Bridge        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   SUI Network   │    │   Sapphire TEE   │    │   AI Analysis   │
│   (zkLogin, NFT)│    │   (Vault, Wallet)│    │   (ROFL Enclave)│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Core Components

- **Frontend Extension** (`/frontend`): Chrome extension with React + Vite, Sapphire encryption demo
- **Web Dashboard** (`/webapp`): Next.js 15 dashboard with 3D visualizations and AI integration
- **Backend API** (`/webapp_backend`): Express.js server for credential storage and retrieval
- **ROFL Worker** (`/infrastructure/rofl-worker`): Rust-based bridge connecting Sui to Sapphire
- **Smart Contracts** (`/SUI-contracts`): Move contracts for Security NFT and device registry
- **Infrastructure** (`/infrastructure`): Docker containers and deployment configurations

---

## 🛠️ Technology Stack

### Frontend
- **React 19** with **Next.js 15** for web dashboard
- **Chrome Extension API** for browser integration
- **Tailwind CSS 4** for utility-first styling
- **shadcn/ui** components for consistent design system
- **Three.js** and **React Three Fiber** for 3D globe visualization
- **Framer Motion** for smooth animations and interactions
- **Lucide React** for modern iconography

### Backend & Infrastructure
- **Express.js** for API server
- **Node.js** with ES modules
- **Docker** for containerization
- **Rust** for ROFL worker (performance-critical components)

### Blockchain & Security
- **Sui Blockchain**: zkLogin, NFT minting, device registry
- **Oasis Sapphire**: Trusted execution environment (TEE)
- **ROFL (Runtime OFfload)**: Official Oasis application for confidential compute
- **Walrus**: Decentralized storage with client-side encryption
- **Seal**: Client-side encryption library for zero-knowledge operations

### AI & Analysis
- **OpenAI API**: Password strength analysis and security insights
- **ROFL Enclave**: Secure AI processing in trusted execution environment
- **Real-time Monitoring**: Continuous security posture assessment

---

## 🔗 Project Structure

```
apudevmatch2025/
├── frontend/                 # Chrome extension (React + Vite)
│   ├── src/
│   │   ├── components/      # Extension UI components
│   │   ├── App.tsx         # Main extension app
│   │   └── background.ts   # Extension background script
│   └── manifest.json       # Extension manifest
├── webapp/                  # Web dashboard (Next.js 15)
│   ├── pages/              # Next.js pages
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── AISummary.jsx  # AI security report component
│   │   ├── AIArtwork.jsx  # AI-generated security artwork
│   │   └── GlobeDemo.jsx  # 3D globe visualization
│   ├── lib/               # Utility libraries
│   │   ├── encryption.js  # Walrus + Seal integration
│   │   ├── decryption.js  # Credential retrieval
│   │   └── blobIds.js     # Storage management
│   └── public/            # Static assets
├── webapp_backend/         # Express.js API server
│   ├── src/index.js       # Main server file
│   └── package.json       # Backend dependencies
├── SUI-contracts/          # Move smart contracts
│   └── security_nft/      # Security NFT contract
│       ├── sources/
│       │   └── SecurityNFT.move  # NFT minting logic
│       └── Move.toml      # Contract configuration
└── infrastructure/         # Deployment & infrastructure
    └── rofl-worker/       # ROFL bridge worker
        ├── src/           # Rust source code
        ├── Dockerfile     # Container configuration
        ├── compose.yaml   # Docker Compose setup
        └── README.md      # Detailed worker documentation
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (or 20+)
- **npm** or **pnpm**
- **Docker** (for ROFL worker and local development)
- **Modern browser** with Chrome extension support
- **Sui testnet wallet** with SUI tokens
- **Sapphire testnet wallet** with ROSE tokens

### 1. Frontend Extension (Chrome)
```bash
cd frontend
npm install
npm run dev
# Load the built extension in Chrome's developer mode
# See frontend/README.md for detailed setup
```

### 2. Web Dashboard
```bash
cd webapp
npm install
npm run dev
# Access at http://localhost:3000
```

### 3. Backend API Server
```bash
cd webapp_backend
npm install
# Copy .env.example to .env and configure
npm run dev
# Server runs on http://localhost:3001
```

### 4. ROFL Worker (Infrastructure)
```bash
cd infrastructure/rofl-worker
# See detailed setup in infrastructure/rofl-worker/README.md
cargo build --release
docker compose up -d
```

### 5. Smart Contracts
```bash
cd SUI-contracts/security_nft
# Deploy to Sui testnet
# See SUI-contracts/README.md for deployment instructions
```

---

## 🔧 Configuration

### Environment Variables

#### Web App Backend (`.env`)
```bash
WALRUS_PUBLISHER=https://publisher-devnet.walrus.space
WALRUS_AGGREGATOR=https://aggregator-devnet.walrus.space
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
```

#### ROFL Worker (`.env`)
```bash
SAPPHIRE_PRIVATE_KEY=0x...          # Required: Sapphire wallet private key
SAPPHIRE_RPC_URL=https://testnet.sapphire.oasis.dev
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
CONTRACT_ATOMIC_VAULT_MANAGER=0x... # Required: Deployed contract address
```

#### Web App Frontend (`.env.local`)
```bash
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.testnet.sui.io:443
NEXT_PUBLIC_WALRUS_WASM_URL=https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm
```

---

## 📊 Current Implementation Status

### ✅ **Completed & Production Ready**
- **Chrome Extension**: Complete with Sapphire encryption demo
- **Web Dashboard**: Full-featured Next.js app with 3D visualizations
- **Backend API**: Express server with Walrus integration
- **ROFL Worker**: Official Oasis application, devnet ready
- **Smart Contracts**: Security NFT contract deployed and tested
- **UI Components**: Complete shadcn/ui component library
- **Encryption**: Walrus + Seal integration working

### 🚧 **In Development**
- **Real-time Event Processing**: Sui → Sapphire bridge integration
- **AI Analysis Pipeline**: ROFL enclave AI processing
- **Device Registry**: Multi-device security management
- **Breach Monitoring**: Real-time credential leak detection

### 🔮 **Planned Features**
- **Mobile App**: React Native companion application
- **Advanced Analytics**: Machine learning security insights
- **Enterprise Features**: Team management and compliance reporting
- **Multi-chain Support**: Ethereum, Polygon, and other networks

---

## 🧪 Testing & Development

### Local Development
```bash
# Start all services
docker compose -f infrastructure/rofl-worker/compose.yaml up -d
cd webapp_backend && npm run dev &
cd webapp && npm run dev &
cd frontend && npm run dev &
```

### Testing
```bash
# Frontend tests
cd webapp && npm run test

# Backend tests
cd webapp_backend && npm run test

# Smart contract tests
cd SUI-contracts/security_nft && sui move test

# ROFL worker tests
cd infrastructure/rofl-worker && cargo test
```

---

## 📚 Documentation

- **ROFL Worker**: `infrastructure/rofl-worker/README.md` - Complete bridge documentation
- **Smart Contracts**: `SUI-contracts/README.md` - Contract deployment and usage
- **Frontend Components**: `webapp/components/README.md` - UI component library
- **API Reference**: `webapp_backend/README.md` - Backend API documentation

---

## 👥 Team Members

- **Derek Liew Qi Jian** — Project Lead, Frontend Development
- **Phen Jing Yuan** — Backend, zkLogin, Sui, ROFL Integration
- **Marcus** — Infrastructure, Documentation, Security Architecture

---

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines and development setup instructions in the respective component directories.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🔗 Links

- **Project Repository**: [GitHub](#)
- **Live Demo**: [Demo Link](#)
- **Documentation**: [Docs](#)
- **Discord**: [Community](#)

---

*Grand Warden - Where security meets innovation in the decentralized age.* 🛡️✨
