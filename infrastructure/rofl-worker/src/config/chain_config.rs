use serde::{Deserialize, Serialize};

/// Configuration for blockchain connections
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChainConfig {
    pub chain_id: u64,
    pub rpc_url: String,
    pub ws_url: Option<String>,
    pub block_confirmation_count: u32,
    pub max_retries: u32,
    pub request_timeout_secs: u64,
}

/// Sui-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]  
pub struct SuiConfig {
    /// Sui RPC endpoint
    pub rpc_url: String,
    
    /// Sui WebSocket endpoint for real-time events
    pub ws_url: Option<String>,
    
    /// Grand Warden package object ID on Sui
    pub package_id: String,
    
    /// Module names to monitor
    pub modules: Vec<String>,
    
    /// Event types to monitor
    pub event_types: Vec<String>,
    
    /// Polling interval in seconds for RPC queries
    pub polling_interval_secs: u64,
    
    /// Maximum number of events to fetch per query
    pub max_events_per_query: u32,
    
    /// Starting cursor for event queries (empty = start from latest)
    pub start_cursor: Option<String>,
}

/// Sapphire-specific configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SapphireConfig {
    /// Sapphire Testnet RPC URL
    pub rpc_url: String,
    
    /// Sapphire WebSocket URL
    pub ws_url: Option<String>,
    
    /// Chain ID for Sapphire Testnet
    pub chain_id: u64,
    
    /// Private key for the ROFL worker (encrypted)
    pub private_key: String,
    
    /// Contract addresses for synthetic event emission
    pub contracts: SapphireContracts,
    
    /// Gas limit for transactions
    pub gas_limit: u64,
    
    /// Gas price in wei
    pub gas_price: u64,
    
    /// Maximum concurrent transactions
    pub max_concurrent_txs: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SapphireContracts {
    /// AtomicVaultManager contract for coordinating operations
    pub atomic_vault_manager: String,
    
    /// GrandWardenVault for password vault events
    pub grand_warden_vault: String,
    
    /// WalletVault for wallet-related events
    pub wallet_vault: String,
    
    /// DeviceRegistry for device events
    pub device_registry: String,
    
    /// RecoveryManager for recovery operations
    pub recovery_manager: String,
    
    /// MultiChainRPC for cross-chain operations
    pub multi_chain_rpc: String,
}

impl SuiConfig {
    pub fn default_testnet() -> Self {
        Self {
            rpc_url: "https://fullnode.testnet.sui.io:443".to_string(),
            ws_url: Some("wss://fullnode.testnet.sui.io:443".to_string()),
            package_id: "".to_string(), // Will be set once Sui contracts are deployed
            modules: vec![
                "grand_warden_vault".to_string(),
                "wallet_vault".to_string(),
                "device_registry".to_string(),
            ],
            event_types: vec![
                "VaultCreated".to_string(),
                "WalletImported".to_string(),
                "DeviceRegistered".to_string(),
                "CredentialAdded".to_string(),
                "VaultBlobUpdated".to_string(),
                "SecurityAlert".to_string(),
            ],
            polling_interval_secs: 5,
            max_events_per_query: 100,
            start_cursor: None,
        }
    }
}

impl SapphireConfig {
    pub fn default_testnet() -> Self {
        Self {
            rpc_url: "https://testnet.sapphire.oasis.dev".to_string(),
            ws_url: Some("wss://testnet.sapphire.oasis.dev/ws".to_string()),
            chain_id: 23295,
            private_key: std::env::var("ROFL_PRIVATE_KEY")
                .unwrap_or_else(|_| "0x0000000000000000000000000000000000000000000000000000000000000001".to_string()),
            contracts: SapphireContracts {
                atomic_vault_manager: "0x811182419a4e4F419ec100ac0Cd63fc1Fef2810C".to_string(),
                grand_warden_vault: "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE".to_string(),
                wallet_vault: "0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82".to_string(),
                device_registry: "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d".to_string(),
                recovery_manager: "0x58fF6e3d3D76053F2B13327A6399ECD25E363818".to_string(),
                multi_chain_rpc: "0x2bcaA2dDbAE6609Cbd63D3a4B3dd0af881759472".to_string(),
            },
            gas_limit: 1000000,
            gas_price: 1000000000, // 1 gwei
            max_concurrent_txs: 10,
        }
    }
}