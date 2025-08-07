use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::env;
use std::fs;

use super::{ChainConfig, SuiConfig, SapphireConfig, RetryConfig};

/// ROFL-compatible configuration that reads from environment and ROFL secrets
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoflConfig {
    /// Sui network configuration
    pub sui: SuiConfig,
    
    /// Sapphire network configuration  
    pub sapphire: SapphireConfig,
    
    /// Event processing queue configuration
    pub queue: QueueConfig,
    
    /// Retry and failure handling
    pub retry: RetryConfig,
    
    /// Security and attestation (managed by ROFL)
    pub security: SecurityConfig,
    
    /// Monitoring and metrics
    pub monitoring: MonitoringConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueConfig {
    pub max_size: usize,
    pub batch_size: usize,
    pub processing_interval_ms: u64,
    pub priority_mapping: HashMap<String, u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    pub attestation_enabled: bool,
    pub secure_comms: bool,
    pub audit_logging: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    pub metrics_enabled: bool,
    pub metrics_port: u16,
    pub health_check_interval_secs: u64,
    pub alert_thresholds: AlertThresholds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertThresholds {
    pub max_latency_secs: u64,
    pub max_queue_size: usize,
    pub min_success_rate: f64,
}

impl RoflConfig {
    /// Load configuration from ROFL environment and secrets
    pub fn load() -> Result<Self> {
        // Load configuration from environment variables (set in rofl.yaml)
        let sui_config = SuiConfig {
            rpc_url: env::var("SUI_RPC_URL")
                .unwrap_or_else(|_| "https://fullnode.testnet.sui.io:443".to_string()),
            ws_url: env::var("SUI_WS_URL").ok(),
            package_id: env::var("SUI_PACKAGE_ID").unwrap_or_default(),
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
            polling_interval_secs: env::var("SUI_POLLING_INTERVAL_SECS")
                .unwrap_or_else(|_| "5".to_string())
                .parse().unwrap_or(5),
            max_events_per_query: env::var("SUI_MAX_EVENTS_PER_QUERY")
                .unwrap_or_else(|_| "100".to_string())
                .parse().unwrap_or(100),
            start_cursor: None,
        };

        let sapphire_config = SapphireConfig {
            rpc_url: env::var("SAPPHIRE_RPC_URL")
                .unwrap_or_else(|_| "https://testnet.sapphire.oasis.dev".to_string()),
            ws_url: env::var("SAPPHIRE_WS_URL").ok(),
            chain_id: env::var("SAPPHIRE_CHAIN_ID")
                .unwrap_or_else(|_| "23295".to_string())
                .parse().unwrap_or(23295),
            // Load private key from ROFL secret
            private_key: Self::load_rofl_secret("sapphire_private_key")?,
            contracts: crate::config::chain_config::SapphireContracts {
                atomic_vault_manager: env::var("CONTRACT_ATOMIC_VAULT_MANAGER")
                    .unwrap_or_else(|_| "0x811182419a4e4F419ec100ac0Cd63fc1Fef2810C".to_string()),
                grand_warden_vault: env::var("CONTRACT_GRAND_WARDEN_VAULT")
                    .unwrap_or_else(|_| "0xB6B183a041D077d5924b340EBF41EE4546fE0bcE".to_string()),
                wallet_vault: env::var("CONTRACT_WALLET_VAULT")
                    .unwrap_or_else(|_| "0x3B7dd63D236bDB0Fd85d556d2AC70e2746cF5F82".to_string()),
                device_registry: env::var("CONTRACT_DEVICE_REGISTRY")
                    .unwrap_or_else(|_| "0x9ec3B09A3cDc7Dd2ba8fB8F6e9Bd6C04DDfBCd2d".to_string()),
                recovery_manager: env::var("CONTRACT_RECOVERY_MANAGER")
                    .unwrap_or_else(|_| "0x58fF6e3d3D76053F2B13327A6399ECD25E363818".to_string()),
                multi_chain_rpc: env::var("CONTRACT_MULTI_CHAIN_RPC")
                    .unwrap_or_else(|_| "0x2bcaA2dDbAE6609Cbd63D3a4B3dd0af881759472".to_string()),
            },
            gas_limit: env::var("SAPPHIRE_GAS_LIMIT")
                .unwrap_or_else(|_| "1000000".to_string())
                .parse().unwrap_or(1000000),
            gas_price: env::var("SAPPHIRE_GAS_PRICE")
                .unwrap_or_else(|_| "1000000000".to_string())
                .parse().unwrap_or(1000000000),
            max_concurrent_txs: 10,
        };

        let queue_config = QueueConfig {
            max_size: env::var("QUEUE_MAX_SIZE")
                .unwrap_or_else(|_| "10000".to_string())
                .parse().unwrap_or(10000),
            batch_size: env::var("QUEUE_BATCH_SIZE")
                .unwrap_or_else(|_| "50".to_string())
                .parse().unwrap_or(50),
            processing_interval_ms: env::var("QUEUE_PROCESSING_INTERVAL_MS")
                .unwrap_or_else(|_| "1000".to_string())
                .parse().unwrap_or(1000),
            priority_mapping: Self::default_priority_mapping(),
        };

        let monitoring_config = MonitoringConfig {
            metrics_enabled: env::var("METRICS_ENABLED")
                .unwrap_or_else(|_| "true".to_string())
                .parse().unwrap_or(true),
            metrics_port: env::var("METRICS_PORT")
                .unwrap_or_else(|_| "9090".to_string())
                .parse().unwrap_or(9090),
            health_check_interval_secs: env::var("HEALTH_CHECK_INTERVAL_SECS")
                .unwrap_or_else(|_| "30".to_string())
                .parse().unwrap_or(30),
            alert_thresholds: AlertThresholds {
                max_latency_secs: env::var("MAX_LATENCY_SECS")
                    .unwrap_or_else(|_| "10".to_string())
                    .parse().unwrap_or(10),
                max_queue_size: env::var("MAX_QUEUE_SIZE")
                    .unwrap_or_else(|_| "5000".to_string())
                    .parse().unwrap_or(5000),
                min_success_rate: env::var("MIN_SUCCESS_RATE")
                    .unwrap_or_else(|_| "0.95".to_string())
                    .parse().unwrap_or(0.95),
            },
        };

        Ok(Self {
            sui: sui_config,
            sapphire: sapphire_config,
            queue: queue_config,
            retry: RetryConfig::default(),
            security: SecurityConfig {
                attestation_enabled: true, // Always enabled in ROFL
                secure_comms: true,
                audit_logging: true,
            },
            monitoring: monitoring_config,
        })
    }

    /// Load secret from ROFL secret management system
    fn load_rofl_secret(secret_name: &str) -> Result<String> {
        // In ROFL environment, secrets are mounted as files
        let secret_path = format!("/run/secrets/{}", secret_name);
        
        match fs::read_to_string(&secret_path) {
            Ok(content) => Ok(content.trim().to_string()),
            Err(_) => {
                // Fallback to environment variable for development
                env::var(&format!("ROFL_{}", secret_name.to_uppercase()))
                    .or_else(|_| env::var(secret_name))
                    .context(format!("Failed to load secret: {}", secret_name))
            }
        }
    }

    fn default_priority_mapping() -> HashMap<String, u8> {
        let mut mapping = HashMap::new();
        
        // User flow events get highest priority
        mapping.insert("VaultCreated".to_string(), 1);
        mapping.insert("WalletImported".to_string(), 1);
        mapping.insert("CredentialAdded".to_string(), 1);
        
        // Device and security events get high priority
        mapping.insert("DeviceRegistered".to_string(), 2);
        mapping.insert("SecurityAlert".to_string(), 2);
        
        // System events get normal priority
        mapping.insert("SystemHealth".to_string(), 5);
        
        mapping
    }
}