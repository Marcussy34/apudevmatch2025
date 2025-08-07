use anyhow::{Context, Result};
use std::sync::Arc;
use tokio::time::{interval, Duration};
use tracing::{debug, error, info, warn};
use serde_json::Value;

use crate::config::SuiConfig;
use crate::processing::event_queue::EventQueue;

/// Sui network monitor for Grand Warden events
pub struct SuiMonitor {
    config: SuiConfig,
    event_queue: Arc<EventQueue>,
    client: reqwest::Client,
    current_cursor: Option<String>,
    is_running: bool,
}

/// Represents a Sui event from the network
#[derive(Debug, Clone)]
pub struct SuiEvent {
    pub id: String,
    pub package_id: String,
    pub module_name: String,
    pub event_type: String,
    pub sender: String,
    pub timestamp: u64,
    pub data: Value,
    pub tx_digest: String,
}

/// Mock Sui event for development (until real Sui contracts are ready)
#[derive(Debug, Clone)]
pub struct MockSuiEvent {
    pub event_type: String,
    pub user_address: String,
    pub data: MockEventData,
    pub timestamp: u64,
}

#[derive(Debug, Clone)]
pub enum MockEventData {
    VaultCreated {
        vault_id: String,
        walrus_cid: String,
    },
    WalletImported {
        wallet_id: String,
        wallet_name: String,
        supported_chains: Vec<u8>,
    },
    DeviceRegistered {
        device_id: String,
        device_name: String,
        device_address: String,
    },
    CredentialAdded {
        vault_id: String,
        domain: String,
        username: String,
    },
    VaultBlobUpdated {
        vault_id: String,
        new_cid: String,
        sui_tx_hash: String,
    },
}

impl SuiMonitor {
    /// Create new Sui monitor instance
    pub async fn new(config: SuiConfig, event_queue: Arc<EventQueue>) -> Result<Self> {
        let client = reqwest::Client::new();
        
        Ok(Self {
            config,
            event_queue,
            client,
            current_cursor: None,
            is_running: false,
        })
    }
    
    /// Start monitoring Sui network for events
    pub async fn start_monitoring(&mut self) -> Result<()> {
        info!("🔍 Starting Sui network monitoring");
        info!("📡 RPC endpoint: {}", self.config.rpc_url);
        
        self.is_running = true;
        
        // For now, we'll use mock events until Sui contracts are deployed
        if self.config.package_id.is_empty() {
            warn!("📝 Sui package ID not set, using mock events for development");
            self.run_mock_event_generator().await?;
        } else {
            self.run_real_event_monitor().await?;
        }
        
        Ok(())
    }
    
    /// Generate mock Sui events for development and testing
    async fn run_mock_event_generator(&self) -> Result<()> {
        let mut interval = interval(Duration::from_secs(self.config.polling_interval_secs));
        
        info!("🎭 Mock Sui event generator started");
        
        while self.is_running {
            interval.tick().await;
            
            // Generate a random mock event
            if let Some(mock_event) = self.generate_mock_event() {
                debug!("📝 Generated mock Sui event: {:?}", mock_event.event_type);
                
                // Queue the event for processing
                if let Err(e) = self.event_queue.enqueue_sui_event(mock_event).await {
                    error!("Failed to queue mock Sui event: {}", e);
                }
            }
        }
        
        Ok(())
    }
    
    /// Monitor real Sui network (when contracts are deployed)
    async fn run_real_event_monitor(&self) -> Result<()> {
        let mut interval = interval(Duration::from_secs(self.config.polling_interval_secs));
        
        info!("🌐 Real Sui event monitoring started");
        info!("📦 Package ID: {}", self.config.package_id);
        
        while self.is_running {
            interval.tick().await;
            
            match self.fetch_events().await {
                Ok(events) => {
                    if !events.is_empty() {
                        info!("📥 Fetched {} events from Sui", events.len());
                        
                        for event in events {
                            if let Err(e) = self.process_sui_event(event).await {
                                error!("Failed to process Sui event: {}", e);
                            }
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to fetch Sui events: {}", e);
                }
            }
        }
        
        Ok(())
    }
    
    /// Fetch events from Sui network
    async fn fetch_events(&self) -> Result<Vec<SuiEvent>> {
        // This is a placeholder for real Sui event fetching
        // Will be implemented when Sui contracts are ready
        
        let query = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1,
            "method": "suix_queryEvents",
            "params": {
                "query": {
                    "Package": self.config.package_id
                },
                "cursor": self.current_cursor,
                "limit": self.config.max_events_per_query,
                "descending_order": false
            }
        });
        
        let response = self.client
            .post(&self.config.rpc_url)
            .json(&query)
            .send()
            .await
            .context("Failed to send Sui RPC request")?;
            
        let result: Value = response.json().await
            .context("Failed to parse Sui RPC response")?;
            
        // Parse the events from the response
        // This is placeholder code - actual parsing depends on Sui contract structure
        Ok(Vec::new())
    }
    
    /// Process a Sui event and queue it for bridging
    async fn process_sui_event(&self, event: SuiEvent) -> Result<()> {
        debug!("Processing Sui event: {}", event.event_type);
        
        // Filter events we care about
        if !self.config.event_types.contains(&event.event_type) {
            debug!("Ignoring irrelevant event type: {}", event.event_type);
            return Ok(());
        }
        
        // Convert to mock format for consistent processing
        let mock_event = self.convert_to_mock_event(event)?;
        
        // Queue for processing
        self.event_queue.enqueue_sui_event(mock_event).await
            .context("Failed to queue Sui event")?;
            
        Ok(())
    }
    
    /// Convert real Sui event to mock format (for consistent processing)
    fn convert_to_mock_event(&self, event: SuiEvent) -> Result<MockSuiEvent> {
        let event_data = match event.event_type.as_str() {
            "VaultCreated" => MockEventData::VaultCreated {
                vault_id: event.data["vault_id"].as_str().unwrap_or_default().to_string(),
                walrus_cid: event.data["walrus_cid"].as_str().unwrap_or_default().to_string(),
            },
            "WalletImported" => MockEventData::WalletImported {
                wallet_id: event.data["wallet_id"].as_str().unwrap_or_default().to_string(),
                wallet_name: event.data["wallet_name"].as_str().unwrap_or_default().to_string(),
                supported_chains: vec![1], // Default to Ethereum
            },
            _ => {
                warn!("Unknown event type: {}", event.event_type);
                return Err(anyhow::anyhow!("Unknown event type: {}", event.event_type));
            }
        };
        
        Ok(MockSuiEvent {
            event_type: event.event_type,
            user_address: event.sender,
            data: event_data,
            timestamp: event.timestamp,
        })
    }
    
    /// Generate mock events for development
    fn generate_mock_event(&self) -> Option<MockSuiEvent> {
        use rand::Rng;
        
        let mut rng = rand::thread_rng();
        let event_types = &[
            "VaultCreated",
            "WalletImported", 
            "DeviceRegistered",
            "CredentialAdded",
            "VaultBlobUpdated",
        ];
        
        // 30% chance to generate an event each polling cycle
        if rng.gen::<f64>() > 0.3 {
            return None;
        }
        
        let event_type = event_types[rng.gen_range(0..event_types.len())].to_string();
        let user_address = format!("0x{:040x}", rng.gen::<u64>());
        let timestamp = chrono::Utc::now().timestamp() as u64;
        
        let data = match event_type.as_str() {
            "VaultCreated" => MockEventData::VaultCreated {
                vault_id: format!("vault_{}", rng.gen::<u32>()),
                walrus_cid: format!("bafybei{}", rng.gen::<u64>()),
            },
            "WalletImported" => MockEventData::WalletImported {
                wallet_id: format!("wallet_{}", rng.gen::<u32>()),
                wallet_name: format!("MyWallet{}", rng.gen::<u32>()),
                supported_chains: vec![1, 137, 56], // ETH, Polygon, BSC
            },
            "DeviceRegistered" => MockEventData::DeviceRegistered {
                device_id: format!("device_{}", rng.gen::<u32>()),
                device_name: format!("Device{}", rng.gen::<u32>()),
                device_address: format!("0x{:040x}", rng.gen::<u64>()),
            },
            "CredentialAdded" => MockEventData::CredentialAdded {
                vault_id: format!("vault_{}", rng.gen::<u32>()),
                domain: format!("example{}.com", rng.gen::<u32>()),
                username: format!("user{}", rng.gen::<u32>()),
            },
            "VaultBlobUpdated" => MockEventData::VaultBlobUpdated {
                vault_id: format!("vault_{}", rng.gen::<u32>()),
                new_cid: format!("bafybei{}", rng.gen::<u64>()),
                sui_tx_hash: format!("0x{:064x}", rng.gen::<u64>()),
            },
            _ => return None,
        };
        
        Some(MockSuiEvent {
            event_type,
            user_address,
            data,
            timestamp,
        })
    }
    
    /// Stop monitoring
    pub fn stop(&mut self) {
        info!("🛑 Stopping Sui monitoring");
        self.is_running = false;
    }
}