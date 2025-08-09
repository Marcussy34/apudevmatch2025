# Grand Warden 🛡️👑

Proactive, privacy-preserving password security built on SUI.

Grand Warden is a security-focused application that safeguards user credentials by combining decentralized storage, strong encryption, confidential AI analysis, and on-chain attestations:

- Secure, decentralized storage with Walrus
- Robust client-side encryption with Seal
- Private, in-enclave password analysis by an LLM running inside a ROFL trusted execution environment
- Continuous breach monitoring against global leak databases
- Actionable, human-friendly security reports
- A SUI-bound NFT that represents your current risk posture (High Risk / Low Risk / Safe) and is shown on your dashboard

This turns a traditional password manager into a proactive cybersecurity tool while keeping plaintext credentials confined to trusted execution and never exposed to the app backend.

## How it works

- Encryption and storage: Password entries are encrypted locally using Seal and stored via Walrus. Data remains private and decentralized.
- Confidential AI evaluation: A ROFL worker runs an LLM inside a secure environment to assess password strength, risky patterns, and hygiene, without exfiltrating secrets.
- Breach monitoring: The system checks global breach datasets to determine if any stored credentials appear in recent or historical leaks, and raises timely alerts.
- Security report: The AI produces concise recommendations to improve password security.
- On-chain risk badge: The platform mints a non-fungible token on SUI representing the user’s risk level. The badge is bound to the user’s SUI account and displayed in the UI.

## Repository structure

```
apudevmatch2025/
├── docs/                    # Design docs and guides
├── frontend/                # Browser extension (React/Vite) app
├── webapp/                  # Next.js demo/marketing + dashboard UI
├── webapp_frontend/         # Vite-based alternate UI (experimental)
├── infrastructure/
│   └── oasis/
│       ├── contracts/       # Solidity contracts (legacy/prototyping)
│       ├── rofl-worker/     # ROFL secure worker (LLM analysis)
│       └── scripts/         # Tooling & deployment helpers
├── SUI-contracts/
│   └── device_registry/     # Move modules for SUI (e.g., device registry)
└── README.md
```

## Getting started

Prerequisites: Node.js 18+ (or 20+), npm or pnpm, a modern browser.

- Frontend (extension)
  1. `cd frontend`
  2. `npm install`
  3. `npm run dev`
  4. Load the built extension in your browser’s extension developer mode (see `frontend/README.md`).

- Web app (dashboard)
  1. `cd webapp`
  2. `npm install`
  3. `npm run dev`

- ROFL worker
  - See `infrastructure/oasis/rofl-worker/README.md` for build and deployment.

- SUI Move modules
  - See `SUI-contracts/device_registry/` for Move sources and tooling.

## Security and privacy

- Plaintext credentials never leave trusted execution (ROFL) and are not visible to operators.
- Password data is end-to-end encrypted with Seal and stored on Walrus.
- Breach checks are performed in a privacy-preserving manner; reports contain only relevant metadata and recommendations.
- The SUI NFT risk badge is an attestation of security posture, not a leak of sensitive data.

## Documentation

- High-level design and component overviews live in `docs/`.
- See `docs/BACKEND_SUI_WALRUS_SEAL_DESIGN.md` and `docs/FRONTEND_COMPONENTS.md` for deeper technical details.

---

Work in progress: APIs and on-chain components may evolve as the SUI-bound risk NFT and ROFL-based analysis mature.
