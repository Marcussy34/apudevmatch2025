use serde_json::Value;
use tracing::info;

#[derive(Debug, Clone)]
pub struct DeviceRegistryEvent {
    pub event_type: String,
    pub user_address: String,
    pub payload: Value,
    pub tx_digest: String,
}

/// Handle DeviceRegistry.* events in a dedicated module.
/// This keeps `main.rs` generic for other contracts.
pub async fn handle_device_registry_event(ev: DeviceRegistryEvent) {
    info!(
        "[device_registry] type={} user={} tx={} payload={}",
        ev.event_type, ev.user_address, ev.tx_digest, ev.payload
    );
}



