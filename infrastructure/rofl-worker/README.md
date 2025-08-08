# Grand Warden ROFL Worker - Phase 4 Devnet Ready

The Grand Warden ROFL (Trusted Off-Chain Worker) Worker is a critical data bridge that connects Oasis Sapphire (confidential compute) with Sui blockchain and Walrus storage, enabling secure cross-chain operations for the Grand Warden privacy-first security suite.

## 🏗️ Architecture

```
Sapphire Smart Contracts → ROFL Worker → External APIs (Walrus + Sui)
          ↑                                              ↓
     Event Emission                              HTTP Calls + Results
          ↑                                              ↓
     Result Callbacks ← ROFL Worker ← API Responses ←---┘
```

The ROFL Worker:

1. **Monitors** Sapphire contracts for `WalrusUploadRequested` and `SuiUpdateRequested` events
2. **Executes** HTTP calls to Walrus storage and Sui RPC endpoints
3. **Reports** results back to Sapphire contracts via `reportWalrusUploadResult()` and `reportSuiUpdateResult()`
4. **Ensures** exactly-once processing with idempotency and ordering guarantees
5. **Provides** comprehensive metrics for monitoring and observability

## ✨ Phase 4 Features

### 🔐 Contract Integration

- **abigen! bindings** - Type-safe contract interactions with generated Rust bindings
- **Typed event filters** - Strongly-typed event decoding for `WalrusUploadRequested` and `SuiUpdateRequested`
- **Gas estimation + retries** - Automatic gas estimation with 20% safety margin and exponential backoff

### ⚡ Idempotency & Ordering

- **Event deduplication** - Check `event:{event_id}` in storage before processing
- **Sequence validation** - Maintain per-source `last_seq` and reject out-of-order events
- **Exactly-once semantics** - Guaranteed no duplicate processing across restarts

### 🔄 Persistence & Replay

- **Durable cursors** - `last_sapphire_block` and `last_sui_checkpoint` persist in sled
- **30-minute outage recovery** - Automatic backfill from stored cursor position
- **Crash safety** - All state persisted before processing events

### 🌐 Real HTTP Clients

- **reqwest with retries** - Exponential backoff with jitter, timeout handling
- **Walrus integration** - PUT requests to `/v1/store` endpoint with proper headers
- **Sui RPC integration** - JSON-RPC calls with proper payload formatting
- **Error classification** - Distinguish between retryable and permanent failures

### 📊 Prometheus Metrics

- **metrics_exporter_prometheus** - Official Prometheus integration with PrometheusHandle
- **Comprehensive coverage** - 15+ metrics covering processing, errors, performance
- **Proper labeling** - Consistent labels: `source={sapphire|sui}`, `result={ok|err}`
- **HTTP endpoint** - `/metrics` endpoint for Prometheus scraping

### 🛡️ Reliability

- **Bounded concurrency** - Semaphore-based queue with configurable depth
- **Graceful shutdown** - Flush cursors, await in-flight tasks on SIGINT
- **Circuit breaker pattern** - Automatic backoff on consecutive failures
- **Health monitoring** - `/health` endpoint for liveness checks

## 🚀 Quick Start

### Prerequisites

- Rust 1.70+
- Access to Sapphire Testnet
- Private key with ROSE balance for gas fees

### Setup

1. **Clone and navigate**:

```bash
   cd infrastructure/rofl-worker
```

2. **Configure environment**:

```bash
cp .env.example .env
   # Edit .env with your private key and contract addresses
```

3. **Build**:

```bash
   cargo build --release
```

4. **Run**:

```bash
   cargo run --release
```

### Using the deployment script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh --release --run
```

## 📚 Official Documentation Compliance

This implementation strictly follows official documentation:

- **ethers-rs v2.0**: Event filtering with `query_with_meta()` returns `Vec<(EventStruct, LogMeta)>`, `estimate_gas()` + margin for transactions
- **reqwest v0.11**: Manual status checks with `status.is_success()`, `is_client_error()`, `is_server_error()`, error classification with `is_timeout()`, `is_connect()`
- **metrics-exporter-prometheus v0.13**: `PrometheusBuilder::new().install()` returns `PrometheusHandle`, serve metrics via `handle.render()`
- **Sui JSON-RPC API**: `sui_getLatestCheckpointSequenceNumber` returns string number, parsed to u64
- **Oasis Sapphire**: Dynamic chain ID detection via `client.get_chainid()` instead of hardcoded values

## ⚙️ Configuration

### Required Environment Variables

| Variable                        | Description                                        | Example    |
| ------------------------------- | -------------------------------------------------- | ---------- |
| `SAPPHIRE_PRIVATE_KEY`          | **REQUIRED** - Private key for transaction signing | `0x123...` |
| `CONTRACT_ATOMIC_VAULT_MANAGER` | **REQUIRED** - Deployed contract address           | `0x811...` |

### Optional Configuration

| Variable                    | Default                                 | Description                         |
| --------------------------- | --------------------------------------- | ----------------------------------- |
| `SAPPHIRE_RPC_URL`          | `https://testnet.sapphire.oasis.dev`    | Sapphire RPC endpoint               |
| `SUI_RPC_URL`               | `https://fullnode.testnet.sui.io:443`   | Sui RPC endpoint                    |
| `WALRUS_BASE_URL`           | `https://publisher-devnet.walrus.space` | Walrus storage endpoint             |
| `REQUEST_TIMEOUT_SECS`      | `30`                                    | HTTP request timeout                |
| `MAX_RETRIES`               | `3`                                     | Maximum HTTP retry attempts         |
| `MAX_CONCURRENT_OPERATIONS` | `10`                                    | Concurrent processing limit         |
| `CONFIRMATION_BLOCKS`       | `3`                                     | Blocks to wait for finality         |
| `STORAGE_PATH`              | `./rofl-storage`                        | Persistent storage directory        |
| `METRICS_PORT`              | `3000`                                  | Metrics server port                 |
| `RUST_LOG`                  | `info,grand_warden_rofl=debug`          | Logging configuration               |
| `WALRUS_RESPONSE_CID_KEY`   | `cid`                                   | JSON key for CID in Walrus response |

## 📊 Monitoring

### Metrics Endpoint

- **URL**: `http://localhost:3000/metrics`
- **Format**: Prometheus exposition format
- **Scrape interval**: 15s recommended

### Key Metrics

| Metric                                   | Type      | Description                         |
| ---------------------------------------- | --------- | ----------------------------------- |
| `rofl_events_processed_total`            | Counter   | Events processed by source          |
| `rofl_http_requests_total`               | Counter   | HTTP requests by API and result     |
| `rofl_contract_calls_total`              | Counter   | Contract calls by method and result |
| `rofl_errors_total`                      | Counter   | Errors by type and source           |
| `rofl_last_processed_block`              | Gauge     | Last processed block by source      |
| `rofl_processing_lag_seconds`            | Gauge     | Processing lag by source            |
| `rofl_queue_depth`                       | Gauge     | Current processing queue depth      |
| `rofl_event_processing_duration_seconds` | Histogram | Event processing duration           |
| `rofl_http_request_duration_seconds`     | Histogram | HTTP request duration               |

### Health Check

- **URL**: `http://localhost:3000/health`
- **Response**: `OK` (200) when healthy

## 🧪 Testing

### Unit Tests

```bash
cargo test
```

### Integration Tests

```bash
# With actual contracts deployed
export SAPPHIRE_PRIVATE_KEY=0x...
export CONTRACT_ATOMIC_VAULT_MANAGER=0x...
cargo test --features integration
```

### Linting

```bash
cargo clippy -- -D warnings
```

### Formatting

```bash
cargo fmt --check
```

## 🔧 Development

### Adding New Event Types

1. Update `RoflEventType` enum
2. Add event processing logic in `process_rofl_event()`
3. Add corresponding HTTP client function
4. Update metrics and documentation

### Debugging

```bash
# Enable debug logging
export RUST_LOG=debug,grand_warden_rofl=trace
cargo run

# Check storage state
ls -la ./rofl-storage/
```

### Performance Tuning

- Adjust `MAX_CONCURRENT_OPERATIONS` based on load
- Tune `MAX_BLOCK_RANGE` for optimal batch processing
- Monitor queue depth and processing lag metrics

## 📋 Definition of Done

✅ **Compilation**: `cargo build` and `cargo clippy` pass  
✅ **Event Processing**: Sapphire log decoding works with typed filters  
✅ **Contract Integration**: Contract reports succeed on devnet with proper retries  
✅ **Persistence**: Cursors persist and survive restart with exactly-once replay  
✅ **Metrics**: `/metrics` endpoint exposes Prometheus metrics  
✅ **HTTP Integration**: Real HTTP calls to Walrus and Sui with proper error handling  
✅ **Reliability**: Bounded concurrency, graceful shutdown, comprehensive error handling

## 🏷️ Release Notes

### v1.0.0 - Phase 4 Devnet Ready

- Complete abigen integration with type-safe contract bindings
- Idempotency and ordering guarantees for exactly-once processing
- Real HTTP clients with exponential backoff and proper error classification
- Comprehensive Prometheus metrics with PrometheusHandle integration
- Bounded concurrency and graceful shutdown for production reliability
- Durable cursor persistence with automatic replay/backfill capability

---

**Status**: ✅ Phase 4 Complete - Devnet Ready  
**Next**: Deploy to production ROFL infrastructure and integrate with live contracts
