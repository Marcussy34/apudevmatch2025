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

- Aggregates and encrypts your credentials locally—never exposes plaintext to the cloud
- Uses AI (in a secure enclave) to analyze password strength, risky patterns, and hygiene
- Monitors global breach datasets and raises timely alerts if your credentials are found
- Issues a non-fungible risk badge (NFT) on SUI, bound to your account and visible in the UI
- Provides concise, actionable recommendations to improve your security
- Supports seedless onboarding via zkLogin (Google/Facebook)
- All sensitive operations (analysis, signing) happen inside a TEE (ROFL/Sapphire)
- Real-time event mirroring and analytics via The Graph
- Open, auditable architecture—no secrets ever leave trusted execution

---

## 🏗️ System Architecture High-Level Overview

```
User Browser (React UI/Extension)
    ↓
Walrus (Decentralized Storage) ←→ Seal (Encryption)
    ↓
Sui Blockchain (zkLogin, NFT, Device Registry)
    ↓
Oasis Sapphire (TEE, Vault, Wallet)
    ↓
ROFL Worker (Event Mirroring)
    ↓
The Graph (Analytics, Real-time UI)
```

_(Insert architecture diagram here)_

---

## 🛠️ Technology Used

- **Cursor** for code assistance
- **ChatGPT** for code debugging
- **React 18** and **Next.js** for frontend
- **Tailwind CSS** for utility-first styling
- **shadcn/ui** and custom UI components for design
- **Lucide React** for icons
- **GNews API** (for demo news aggregation)
- **Oasis Sapphire** for confidential compute
- **Walrus** for decentralized storage
- **Seal** for client-side encryption
- **Sui Blockchain** for on-chain NFT and device registry
- **OpenAI** for confidential AI analysis (via ROFL)
- **The Graph** for real-time analytics and event subscriptions
- **Docker** for local development and deployment

---

## 🔗 Important Endpoints & Modules

- **Frontend Extension**: `/frontend` (React/Vite, Chrome extension)
- **Web Dashboard**: `/webapp` (Next.js, dashboard UI)
- **ROFL Worker**: `/infrastructure/rofl-worker` (Sui → Sapphire event bridge)
- **Sui Move Modules**: `/SUI-contracts/device_registry/sources/DeviceRegistry.move`
- **Backend Contracts**: `/infrastructure/oasis/contracts/`
- **AI Analysis**: ROFL enclave (see `/infrastructure/rofl-worker/README.md`)
- **Decentralized Storage**: Walrus + Seal integration (see `/docs/BACKEND_SUI_WALRUS_SEAL_DESIGN.md`)
- **Graph Subgraph**: Real-time analytics (see `/docs/PLAN.md`)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (or 20+)
- npm or pnpm
- Docker (for ROFL worker and local Graph node)
- Modern browser

### Frontend (Extension)
1. `cd frontend`
2. `npm install`
3. `npm run dev`
4. Load the built extension in your browser’s extension developer mode (see `frontend/README.md`)

### Web App (Dashboard)
1. `cd webapp`
2. `npm install`
3. `npm run dev`

### ROFL Worker
- See `infrastructure/rofl-worker/README.md` for build and deployment instructions

### SUI Move Modules
- See `SUI-contracts/device_registry/` for Move sources and tooling

---

## 👥 Team Members

- _Derek Liew Qi Jian_ — Project Lead, Front End ([LinkedIn](#) | [Twitter](#))
- _Phen Jing Yuan_ — Backend, zkLogin, Sui, ROFL ([LinkedIn](#))
- _Marcus_ — Infrastructure, Docs, Security ([LinkedIn](#))
- _[Add your name here!]_

---

## 📚 Documentation

- High-level design and component overviews: `docs/`
- Backend, storage, and encryption: `docs/BACKEND_SUI_WALRUS_SEAL_DESIGN.md`
- Frontend components: `docs/FRONTEND_COMPONENTS.md`
- Implementation plan and architecture: `docs/PLAN.md`

---

Work in progress: APIs and on-chain components may evolve as the SUI-bound risk NFT and ROFL-based analysis mature.
