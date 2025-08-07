use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::{ChainConfig, SuiConfig, SapphireConfig, RetryConfig};

/// Main configuration structure for ROFL worker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    /// Sui network configuration
    pub sui: SuiConfig,
    
    /// Sapphire network configuration  
    pub sapphire: SapphireConfig,
    
    /// All supported chains
    pub chains: HashMap<String, ChainConfig>,
    
    /// Event processing queue configuration
    pub queue: QueueConfig,
    
    /// Retry and failure handling
    pub retry: RetryConfig,
    
    /// Security and attestation
    pub security: SecurityConfig,
    
    /// Monitoring and metrics
    pub monitoring: MonitoringConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QueueConfig {
    /// Maximum queue size before dropping events
    pub max_size: usize,
    
    /// Batch size for processing events
    pub batch_size: usize,
    
    /// Processing interval in milliseconds
    pub processing_interval_ms: u64,
    
    /// Priority levels for different event types
    pub priority_mapping: HashMap<String, u8>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityConfig {
    /// TEE attestation enabled
    pub attestation_enabled: bool,
    
    /// Secure communication settings
    pub secure_comms: bool,
    
    /// Audit logging enabled
    pub audit_logging: bool,
    
    /// Encryption key for secure storage
    pub encryption_key: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MonitoringConfig {
    /// Metrics collection enabled
    pub metrics_enabled: bool,
    
    /// Metrics port
    pub metrics_port: u16,
    
    /// Health check interval in seconds
    pub health_check_interval_secs: u64,
    
    /// Alert thresholds
    pub alert_thresholds: AlertThresholds,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlertThresholds {
    /// Maximum event processing latency in seconds before alerting
    pub max_latency_secs: u64,
    
    /// Maximum queue size before alerting
    pub max_queue_size: usize,
    
    /// Minimum success rate before alerting (0.0 - 1.0)
    pub min_success_rate: f64,
}

impl Config {
    /// Load configuration from environment and config files
    pub fn load() -> Result<Self> {
        dotenv::dotenv().ok();
        
        let config = config::Config::builder()
            .add_source(config::Environment::with_prefix("ROFL"))
            .add_source(config::File::with_name("rofl-config").required(false))
            .build()
            .context("Failed to build configuration")?;
            
        let config: Config = config
            .try_deserialize()
            .context("Failed to deserialize configuration")?;
            
        Ok(config)
    }
    
    /// Get default configuration for development
    pub fn default_dev() -> Self {
        Self {
            sui: SuiConfig::default_testnet(),
            sapphire: SapphireConfig::default_testnet(),
            chains: HashMap::new(),
            queue: QueueConfig {
                max_size: 10000,
                batch_size: 50,
                processing_interval_ms: 1000,
                priority_mapping: Self::default_priority_mapping(),
            },
            retry: RetryConfig::default(),
            security: SecurityConfig {
                attestation_enabled: false, // Disabled for dev
                secure_comms: true,
                audit_logging: true,
                encryption_key: None,
            },
            monitoring: MonitoringConfig {
                metrics_enabled: true,
                metrics_port: 9090,
                health_check_interval_secs: 30,
                alert_thresholds: AlertThresholds {
                    max_latency_secs: 10,
                    max_queue_size: 5000,
                    min_success_rate: 0.95,
                },
            },
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

impl Default for Config {
    fn default() -> Self {
        Self::default_dev()
    }
}