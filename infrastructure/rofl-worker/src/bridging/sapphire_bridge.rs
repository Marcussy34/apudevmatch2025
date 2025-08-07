use anyhow::{Context, Result};
use ethers::{
    prelude::*,
    providers::{Provider, Ws, Http},
    signers::{LocalWallet, Signer},
    types::{Address, TransactionRequest, U256},
    core::types::Bytes,
};
use std::sync::Arc;
use tokio::time::{timeout, Duration};
use tracing::{debug, error, info, warn};

use crate::config::SapphireConfig;
use crate::processing::event_queue::EventQueue;
use crate::monitoring::sui_monitor::{MockSuiEvent, MockEventData};

/// Sapphire blockchain bridge for emitting synthetic events
pub struct SapphireBridge {
    config: SapphireConfig,
    provider: Arc<Provider<Http>>,
    wallet: LocalWallet,
    contracts: SapphireContracts,
}

/// Contract interfaces for Sapphire interaction
struct SapphireContracts {
    atomic_vault_manager: Address,
    grand_warden_vault: Address,
    wallet_vault: Address,
    device_registry: Address,
}

/// Sapphire event emission result
#[derive(Debug, Clone)]
pub struct EmissionResult {
    pub success: bool,
    pub tx_hash: Option<H256>,
    pub gas_used: Option<U256>,
    pub error: Option<String>,
}

impl SapphireBridge {
    /// Create new Sapphire bridge instance
    pub async fn new(config: SapphireConfig) -> Result<Self> {
        info!("🔗 Initializing Sapphire bridge");
        info!("🌐 RPC endpoint: {}", config.rpc_url);
        info!("⚡ Chain ID: {}", config.chain_id);

        // Create HTTP provider
        let provider = Provider::<Http>::try_from(&config.rpc_url)
            .context("Failed to create Sapphire provider")?;
        let provider = Arc::new(provider);

        // Create wallet
        let wallet: LocalWallet = config.private_key
            .parse()
            .context("Invalid private key format")?;
        let wallet = wallet.with_chain_id(config.chain_id);

        info!("👤 Wallet address: {:?}", wallet.address());

        // Parse contract addresses
        let contracts = SapphireContracts {
            atomic_vault_manager: config.contracts.atomic_vault_manager
                .parse()
                .context("Invalid AtomicVaultManager address")?,
            grand_warden_vault: config.contracts.grand_warden_vault
                .parse()
                .context("Invalid GrandWardenVault address")?,
            wallet_vault: config.contracts.wallet_vault
                .parse()
                .context("Invalid WalletVault address")?,
            device_registry: config.contracts.device_registry
                .parse()
                .context("Invalid DeviceRegistry address")?,
        };

        info!("📋 Contract addresses loaded:");
        info!("  AtomicVaultManager: {:?}", contracts.atomic_vault_manager);
        info!("  GrandWardenVault: {:?}", contracts.grand_warden_vault);
        info!("  WalletVault: {:?}", contracts.wallet_vault);
        info!("  DeviceRegistry: {:?}", contracts.device_registry);

        Ok(Self {
            config,
            provider,
            wallet,
            contracts,
        })
    }

    /// Start processing events from the queue
    pub async fn start_processing(&self, event_queue: Arc<EventQueue>) -> Result<()> {
        info!("⚡ Starting Sapphire bridge event processing");

        loop {
            match event_queue.dequeue_sui_event().await {
                Ok(Some(sui_event)) => {
                    debug!("🔄 Processing Sui event: {}", sui_event.event_type);

                    let result = self.emit_synthetic_event(sui_event).await;
                    match result {
                        Ok(emission_result) => {
                            if emission_result.success {
                                info!("✅ Successfully emitted synthetic event");
                                debug!("   TX Hash: {:?}", emission_result.tx_hash);
                                debug!("   Gas Used: {:?}", emission_result.gas_used);
                            } else {
                                error!("❌ Failed to emit synthetic event: {:?}", emission_result.error);
                            }
                        }
                        Err(e) => {
                            error!("💥 Error processing Sui event: {}", e);
                        }
                    }
                }
                Ok(None) => {
                    // No events available, wait a bit
                    tokio::time::sleep(Duration::from_millis(100)).await;
                }
                Err(e) => {
                    error!("Failed to dequeue event: {}", e);
                    tokio::time::sleep(Duration::from_secs(1)).await;
                }
            }
        }
    }

    /// Emit synthetic event on Sapphire based on Sui event
    async fn emit_synthetic_event(&self, sui_event: MockSuiEvent) -> Result<EmissionResult> {
        debug!("🎯 Emitting synthetic event for: {}", sui_event.event_type);

        match sui_event.event_type.as_str() {
            "VaultCreated" => self.emit_vault_created(sui_event).await,
            "WalletImported" => self.emit_wallet_imported(sui_event).await,
            "DeviceRegistered" => self.emit_device_registered(sui_event).await,
            "CredentialAdded" => self.emit_credential_added(sui_event).await,
            "VaultBlobUpdated" => self.emit_vault_blob_updated(sui_event).await,
            _ => {
                warn!("Unknown Sui event type: {}", sui_event.event_type);
                Ok(EmissionResult {
                    success: false,
                    tx_hash: None,
                    gas_used: None,
                    error: Some(format!("Unknown event type: {}", sui_event.event_type)),
                })
            }
        }
    }

    /// Emit VaultCreated synthetic event
    async fn emit_vault_created(&self, sui_event: MockSuiEvent) -> Result<EmissionResult> {
        if let MockEventData::VaultCreated { vault_id, walrus_cid } = sui_event.data {
            info!("🔐 Emitting VaultCreated synthetic event");
            debug!("   User: {}", sui_event.user_address);
            debug!("   Vault ID: {}", vault_id);
            debug!("   Walrus CID: {}", walrus_cid);

            // Call GrandWardenVault.emitUserFlowEvent for vault creation
            let user_address: Address = sui_event.user_address.parse()
                .context("Invalid user address")?;

            // Flow type 2 = password save/vault creation
            let flow_type: u8 = 2;
            let step: u8 = 1; // Vault created step
            let success: bool = true;

            // Encode event data
            let event_data = self.encode_vault_created_data(&vault_id, &walrus_cid)?;

            self.call_emit_user_flow_event(
                self.contracts.grand_warden_vault,
                user_address,
                flow_type,
                step,
                success,
                event_data,
            ).await
        } else {
            Err(anyhow::anyhow!("Invalid event data for VaultCreated"))
        }
    }

    /// Emit WalletImported synthetic event
    async fn emit_wallet_imported(&self, sui_event: MockSuiEvent) -> Result<EmissionResult> {
        if let MockEventData::WalletImported { wallet_id, wallet_name, supported_chains } = sui_event.data {
            info!("💰 Emitting WalletImported synthetic event");
            debug!("   User: {}", sui_event.user_address);
            debug!("   Wallet ID: {}", wallet_id);
            debug!("   Wallet Name: {}", wallet_name);

            let user_address: Address = sui_event.user_address.parse()
                .context("Invalid user address")?;

            // Flow type 1 = wallet import
            let flow_type: u8 = 1;
            let step: u8 = 1; // Wallet imported step
            let success: bool = true;

            let event_data = self.encode_wallet_imported_data(&wallet_id, &wallet_name, &supported_chains)?;

            self.call_emit_user_flow_event(
                self.contracts.wallet_vault,
                user_address,
                flow_type,
                step,
                success,
                event_data,
            ).await
        } else {
            Err(anyhow::anyhow!("Invalid event data for WalletImported"))
        }
    }

    /// Emit DeviceRegistered synthetic event
    async fn emit_device_registered(&self, sui_event: MockSuiEvent) -> Result<EmissionResult> {
        if let MockEventData::DeviceRegistered { device_id, device_name, device_address } = sui_event.data {
            info!("📱 Emitting DeviceRegistered synthetic event");

            let user_address: Address = sui_event.user_address.parse()
                .context("Invalid user address")?;

            // Flow type 3 = device registration
            let flow_type: u8 = 3;
            let step: u8 = 1;
            let success: bool = true;

            let event_data = self.encode_device_registered_data(&device_id, &device_name, &device_address)?;

            self.call_emit_user_flow_event(
                self.contracts.device_registry,
                user_address,
                flow_type,
                step,
                success,
                event_data,
            ).await
        } else {
            Err(anyhow::anyhow!("Invalid event data for DeviceRegistered"))
        }
    }

    /// Emit CredentialAdded synthetic event
    async fn emit_credential_added(&self, sui_event: MockSuiEvent) -> Result<EmissionResult> {
        if let MockEventData::CredentialAdded { vault_id, domain, username } = sui_event.data {
            info!("🔑 Emitting CredentialAdded synthetic event");

            let user_address: Address = sui_event.user_address.parse()
                .context("Invalid user address")?;

            // Flow type 2 = password save (credential added is part of password save flow)
            let flow_type: u8 = 2;
            let step: u8 = 2; // Credential added step
            let success: bool = true;

            let event_data = self.encode_credential_added_data(&vault_id, &domain, &username)?;

            self.call_emit_user_flow_event(
                self.contracts.grand_warden_vault,
                user_address,
                flow_type,
                step,
                success,
                event_data,
            ).await
        } else {
            Err(anyhow::anyhow!("Invalid event data for CredentialAdded"))
        }
    }

    /// Emit VaultBlobUpdated synthetic event
    async fn emit_vault_blob_updated(&self, sui_event: MockSuiEvent) -> Result<EmissionResult> {
        if let MockEventData::VaultBlobUpdated { vault_id, new_cid, sui_tx_hash } = sui_event.data {
            info!("📝 Emitting VaultBlobUpdated synthetic event");

            let user_address: Address = sui_event.user_address.parse()
                .context("Invalid user address")?;

            // Flow type 4 = vault update
            let flow_type: u8 = 4;
            let step: u8 = 1;
            let success: bool = true;

            let event_data = self.encode_vault_blob_updated_data(&vault_id, &new_cid, &sui_tx_hash)?;

            self.call_emit_user_flow_event(
                self.contracts.grand_warden_vault,
                user_address,
                flow_type,
                step,
                success,
                event_data,
            ).await
        } else {
            Err(anyhow::anyhow!("Invalid event data for VaultBlobUpdated"))
        }
    }

    /// Call emitUserFlowEvent on a Sapphire contract
    async fn call_emit_user_flow_event(
        &self,
        contract_address: Address,
        user: Address,
        flow_type: u8,
        step: u8,
        success: bool,
        data: Bytes,
    ) -> Result<EmissionResult> {
        debug!("📞 Calling emitUserFlowEvent on contract {:?}", contract_address);

        // Build transaction data for emitUserFlowEvent(address,uint8,uint8,bool,bytes)
        let function_selector = [0x6a, 0x74, 0x23, 0x15]; // emitUserFlowEvent(address,uint8,uint8,bool,bytes)
        
        let mut tx_data = Vec::new();
        tx_data.extend_from_slice(&function_selector);
        
        // Encode parameters
        let encoded = ethers::abi::encode(&[
            ethers::abi::Token::Address(user),
            ethers::abi::Token::Uint(U256::from(flow_type)),
            ethers::abi::Token::Uint(U256::from(step)),
            ethers::abi::Token::Bool(success),
            ethers::abi::Token::Bytes(data.to_vec()),
        ]);
        
        tx_data.extend_from_slice(&encoded);

        // Create transaction
        let tx = TransactionRequest::new()
            .to(contract_address)
            .data(Bytes::from(tx_data))
            .gas(self.config.gas_limit)
            .gas_price(self.config.gas_price);

        // Send transaction
        self.send_transaction(tx).await
    }

    /// Send transaction to Sapphire network
    async fn send_transaction(&self, tx: TransactionRequest) -> Result<EmissionResult> {
        let client = SignerMiddleware::new(
            self.provider.clone(),
            self.wallet.clone(),
        );

        debug!("📤 Sending transaction to Sapphire");

        match timeout(
            Duration::from_secs(self.config.timeout_secs.unwrap_or(30)),
            client.send_transaction(tx, None),
        ).await {
            Ok(Ok(pending_tx)) => {
                debug!("⏳ Transaction sent: {:?}", pending_tx.tx_hash());
                
                // Wait for confirmation
                match timeout(
                    Duration::from_secs(60),
                    pending_tx.await,
                ).await {
                    Ok(Ok(Some(receipt))) => {
                        info!("✅ Transaction confirmed: {:?}", receipt.transaction_hash);
                        Ok(EmissionResult {
                            success: true,
                            tx_hash: Some(receipt.transaction_hash),
                            gas_used: receipt.gas_used,
                            error: None,
                        })
                    }
                    Ok(Ok(None)) => {
                        error!("❌ Transaction failed - no receipt");
                        Ok(EmissionResult {
                            success: false,
                            tx_hash: Some(pending_tx.tx_hash()),
                            gas_used: None,
                            error: Some("No transaction receipt".to_string()),
                        })
                    }
                    Ok(Err(e)) => {
                        error!("❌ Transaction failed: {}", e);
                        Ok(EmissionResult {
                            success: false,
                            tx_hash: Some(pending_tx.tx_hash()),
                            gas_used: None,
                            error: Some(e.to_string()),
                        })
                    }
                    Err(_) => {
                        error!("⏰ Transaction confirmation timeout");
                        Ok(EmissionResult {
                            success: false,
                            tx_hash: Some(pending_tx.tx_hash()),
                            gas_used: None,
                            error: Some("Confirmation timeout".to_string()),
                        })
                    }
                }
            }
            Ok(Err(e)) => {
                error!("❌ Failed to send transaction: {}", e);
                Ok(EmissionResult {
                    success: false,
                    tx_hash: None,
                    gas_used: None,
                    error: Some(e.to_string()),
                })
            }
            Err(_) => {
                error!("⏰ Transaction send timeout");
                Ok(EmissionResult {
                    success: false,
                    tx_hash: None,
                    gas_used: None,
                    error: Some("Send timeout".to_string()),
                })
            }
        }
    }

    // Data encoding methods for different event types
    fn encode_vault_created_data(&self, vault_id: &str, walrus_cid: &str) -> Result<Bytes> {
        let encoded = ethers::abi::encode(&[
            ethers::abi::Token::String(vault_id.to_string()),
            ethers::abi::Token::String(walrus_cid.to_string()),
        ]);
        Ok(Bytes::from(encoded))
    }

    fn encode_wallet_imported_data(&self, wallet_id: &str, wallet_name: &str, supported_chains: &[u8]) -> Result<Bytes> {
        let chain_tokens: Vec<ethers::abi::Token> = supported_chains
            .iter()
            .map(|&chain| ethers::abi::Token::Uint(U256::from(chain)))
            .collect();

        let encoded = ethers::abi::encode(&[
            ethers::abi::Token::String(wallet_id.to_string()),
            ethers::abi::Token::String(wallet_name.to_string()),
            ethers::abi::Token::Array(chain_tokens),
        ]);
        Ok(Bytes::from(encoded))
    }

    fn encode_device_registered_data(&self, device_id: &str, device_name: &str, device_address: &str) -> Result<Bytes> {
        let encoded = ethers::abi::encode(&[
            ethers::abi::Token::String(device_id.to_string()),
            ethers::abi::Token::String(device_name.to_string()),
            ethers::abi::Token::String(device_address.to_string()),
        ]);
        Ok(Bytes::from(encoded))
    }

    fn encode_credential_added_data(&self, vault_id: &str, domain: &str, username: &str) -> Result<Bytes> {
        let encoded = ethers::abi::encode(&[
            ethers::abi::Token::String(vault_id.to_string()),
            ethers::abi::Token::String(domain.to_string()),
            ethers::abi::Token::String(username.to_string()),
        ]);
        Ok(Bytes::from(encoded))
    }

    fn encode_vault_blob_updated_data(&self, vault_id: &str, new_cid: &str, sui_tx_hash: &str) -> Result<Bytes> {
        let encoded = ethers::abi::encode(&[
            ethers::abi::Token::String(vault_id.to_string()),
            ethers::abi::Token::String(new_cid.to_string()),
            ethers::abi::Token::String(sui_tx_hash.to_string()),
        ]);
        Ok(Bytes::from(encoded))
    }
}

// Extension trait for SapphireConfig to add timeout field
impl SapphireConfig {
    fn timeout_secs(&self) -> Option<u64> {
        Some(30) // Default 30 second timeout
    }
}