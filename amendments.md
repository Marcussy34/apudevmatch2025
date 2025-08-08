## Amendments and Fix‑Up Guide

Purpose: a terse, actionable checklist for the next engineer/agent to bring the repo to spec. Items are grouped by phase and include file pointers and acceptance criteria.

### Phase 1 — Smart Contract Foundation

- **Events/ABI freeze audit (all contracts vs subgraph)**

  - Ensure all emitted events (names, arg order/types) exactly match the subgraph schema and ABIs in `grandwarden-subgraph/abis/`.
  - Remove TODO/placeholder event variants and avoid reordering post-deploy.
  - Acceptance: running the subgraph against live contracts yields zero decode/signature mismatch warnings; a checklist of event signatures is committed.

- **TransactionSigned ABI mismatch (choose ONE canonical signature)**

  - Current state:
    - `WalletVault` emits 3‑arg: `TransactionSigned(address user, bytes32 walletId, bytes32 txHash)`.
    - `IVaultEvents` declares 4‑arg: `TransactionSigned(address user, bytes32 walletId, bytes32 txHash, uint8 chainType)`.
    - Subgraph listens for BOTH (3‑arg and 4‑arg).
  - Fix Option A (recommended): standardize on 4‑arg.
    - Edit `infrastructure/oasis/contracts/interfaces/IWalletVault.sol`: change the `TransactionSigned` event to include `uint8 chainType`.
    - Edit `infrastructure/oasis/contracts/WalletVault.sol` in `signTransaction(...)`: change `emit TransactionSigned(msg.sender, walletId, txHash);` to `emit TransactionSigned(msg.sender, walletId, txHash, chainType);`.
    - Rebuild ABIs and update subgraph ABIs if needed.
  - Fix Option B: standardize on 3‑arg.
    - Keep `IWalletVault` as is; remove the 4‑arg handler from the subgraph.
    - Update `IVaultEvents` to the 3‑arg form (and regenerate ABIs), or stop inheriting the 4‑arg event from that interface.
  - Acceptance: one canonical signature across contracts, ABIs, and subgraph; mappings compile and index without decode warnings.

- **Sui signing not implemented (hard blocker for Phase 1 complete)**

  - Current: `WalletVault.signTransaction` returns a mock signature; no Ed25519/Sui path.
  - Fix: implement ONE real Ed25519 path now:
    - Path 1 (Sapphire host‑call): add enclave call for Ed25519 signing and expose a method that returns a Sui‑compatible signature.
    - Path 2 (ROFL TEE signer): extend `infrastructure/rofl-worker` to sign a Sui devnet tx and broadcast via `SUI_RPC_URL`, then mirror digest to Sapphire.
  - Acceptance: one Sui devnet tx signed through the chosen path, with recorded receipt including attestation/nonce; doc the exact CLI used.

- **TEE private data handling (GrandWardenVault) — decryption, no leaks**

  - Current: `getCredential` returns placeholder/plaintext from stored bytes; comments reference TEE-only decrypt.
  - Fix: perform real in-enclave decrypt of credential password and never emit sensitive data in events. Ensure only view paths expose decrypted bytes and only to the owner; avoid logging secrets.
  - Acceptance: tests prove decrypted value differs from stored bytes and matches expected after encrypt→store→decrypt; no event contains password material.

- **Device signature verification (DeviceRegistry)**

  - Current: `authenticateDevice` uses mock verification (`keccak256(signature) != 0`).
  - Fix: verify signature against the stored device public key (or hash) with a real curve check; reject invalid signatures; record auth attempt results.
  - Acceptance: tests pass for valid signature and fail for invalid/forged signatures; auth history records accuracy.

- **Real RPC usage in TEE (MultiChainRPC)**

  - Current: balances, nonces, gas price, and generic calls are simulated.
  - Fix: perform real HTTP(s) RPC calls from within the enclave with timeouts/retries and optional caching; preserve the `whenNotPaused` guard.
  - Acceptance: integration tests hit configured RPCs and return plausible values; retry/timeout paths covered; caching verified.

- **Atomic ops are mocked**

  - Files: `infrastructure/oasis/contracts/AtomicVaultManager.sol`, `GrandWardenVault.sol`.
  - Fix: replace mocks with real calls:
    - Step 1: real Walrus upload → persist CID.
    - Step 2: real Sui pointer update → capture `suiTxHash`.
    - Step 3: finalize; on failure run rollback that invalidates the Walrus provisional.
  - Acceptance: tests cover happy path and forced failure (Walrus fail, Sui fail) with `OperationRolledBack` when applicable.

- **Access controls and safety**

  - Add `whenNotPaused`/role checks to any public event‑emit endpoints used by ROFL mirroring.
  - Add `ReentrancyGuard` where external calls/state transitions can be reentered.
  - Consider an allowlist (or on‑chain attestation verify) for mirror caller.
  - Acceptance: negative tests prove blocked when paused/unauthorized; no reentrancy warnings.

- **Perf & coverage**
  - Add latency tests for signature turnaround (include RPC/network effects if feasible) and define KPI extraction (p95 < 2s).
  - Add coverage tooling (solidity‑coverage) and target >90% including failure cases (bad attestation, dup emits, rollback).

### Phase 2 — Subgraph Integration

- **Emulator receipts bug**

  - File: `infrastructure/subgraph/docker/emulator/index.js`.
  - Issue: inside `getBlockReceipts`, logs array is overwritten per log.
  - Fix: build a `normalizedLogs` array and assign once: `txReceipt.logs = normalizedLogs;`.
  - Acceptance: graph‑node indexes without decode errors; historical and latest receipts work.

- **Enable non‑fatal errors**

  - File: `infrastructure/subgraph/grandwarden-subgraph/subgraph.yaml`.
  - Fix: add `features: [nonFatalErrors]` under each `mapping` (if supported by your node version).
  - Acceptance: transient decode errors do not halt indexing; logs show non‑fatal handling.

- **Reorg/lag handling**

  - Add a temporary toggle in emulator to drop/alter receipts for N blocks; provide a test or script to simulate a small reorg.
  - Acceptance: subgraph reconverges without double counts after reorg simulation.

- **Latency evidence**

  - Provide a recorded run where WS subscriptions deliver events <2s p95 from tx mined; include raw logs/metrics and a short note in `TEST_RESULTS.md`.

- **Stable chain identity**

  - File: `infrastructure/subgraph/docker/emulator/index.js`.
  - Fix: ensure `eth_chainId` returns a stable value (e.g., `0x5afe`) and is consistent across restarts; proxy other calls unchanged.
  - Acceptance: Graph Node treats the network as stable; queries across restarts don’t create split deployments.

### Phase 4 — ROFL Sui Mirror

- **Identity & trust**

  - Add attestation verification or an explicit on‑chain allowlist for the mirror caller.
  - Contracts that accept mirrored calls should verify caller identity (attested TLS/MRENCLAVE or signed claims).

- **Idempotency & ordering**

  - Introduce `eventId` (e.g., hash of source tx/seq) and a per‑source monotonically increasing `seq`.
  - Contracts reject duplicates or out‑of‑order deliveries; add unit tests.

- **Replay/backfill**

  - Persist last processed cursor in ROFL; on restart backfill the window exactly‑once.
  - Add a 30‑minute outage drill; document results.

- **Schema stability**

  - Add `payload.version` to mirrored payloads so future evolution doesn’t break consumers.

- **Observability**
  - Expose metrics (mirror lag, queue depth, success rate, failure reasons) and simple alert thresholds.

### Quick Proof Tasks (1h each)

- Reorg drill: emulator drops receipts for N blocks → re‑enable → confirm no double‑count, subgraph converges.
- Outage drill: stop ROFL 30 min → resume → confirm no gaps or dupes.
- Sui sign demo: produce and broadcast one Sui devnet tx via attested path; attach receipt + attestation info.

### Before Phase 1.5 + Phase 3

- Freeze exact Walrus/Seal CID/ACL APIs and ROFL mirrored event IDs (names/args) now.
- Frontend: implement a tiny explicit state machine for the 3‑phase atomic vault update with compensations and user‑visible progress.

### File‑by‑File Fix Map

- `infrastructure/oasis/contracts/interfaces/IWalletVault.sol`

  - Align `TransactionSigned` event with chosen canonical signature.

- `infrastructure/oasis/contracts/WalletVault.sol`

  - Update `emit TransactionSigned(...)` to match canonical signature.
  - Replace mock signing with real Ed25519 (if using Sapphire path, otherwise wire via ROFL flow).

- `infrastructure/oasis/contracts/AtomicVaultManager.sol`

  - Implement real Walrus upload + Sui pointer update; finalize/rollback paths; extend tests.

- `infrastructure/subgraph/docker/emulator/index.js`

  - Fix logs normalization (do not overwrite the logs array).

- `infrastructure/subgraph/grandwarden-subgraph/subgraph.yaml`

  - Add `features: [nonFatalErrors]` under each mapping; keep only the event signature(s) you support.

- `infrastructure/rofl-worker/src/main.rs`
  - Add idempotency (eventId/seq), ordering checks, durable cursor, metrics; integrate Sui client and signer where marked TODO/mock.

### Acceptance Summary

- One canonical `TransactionSigned` signature across contracts/ABI/subgraph.
- One working Ed25519 Sui signing path with demo.
- Atomic ops execute real Walrus→Sui flow with rollback and tests.
- Emulator receipts fixed; subgraph has non‑fatal errors enabled; reorg drill passes.
- ROFL mirror enforces identity, idempotency, ordering, and has replay + metrics.
