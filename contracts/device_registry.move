module grandwarden::device_registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use std::string::{Self, String};

    /// Device information stored on Sui
    public struct DeviceInfo has key, store {
        id: UID,
        owner: address,           // zkLogin address
        device_name: String,      // Human-readable device name
        device_id: String,        // Unique device identifier
        location: String,         // Device location (city, country, etc.)
        registered_at: u64,       // Timestamp when device was registered
    }

    /// Event emitted when a device is registered
    public struct DeviceRegistered has copy, drop {
        owner: address,           // zkLogin address
        device_id: String,        // Unique device identifier
        device_name: String,      // Human-readable device name
        location: String,         // Device location
        registered_at: u64,       // Registration timestamp
    }

    /// Register a new device for a zkLogin user
    public fun register_device(
        device_name: String,
        device_id: String,
        location: String,
        owner: address,           // zkLogin address passed as parameter
        ctx: &mut TxContext
    ): DeviceInfo {
        let current_time = tx_context::epoch(ctx);

        // Create device info
        let device_info = DeviceInfo {
            id: object::new(ctx),
            owner,
            device_name,
            device_id,
            location,
            registered_at: current_time,
        };

        // Emit registration event for ROFL to listen
        event::emit(DeviceRegistered {
            owner,
            device_id,
            device_name,
            location,
            registered_at: current_time,
        });

        device_info
    }

    /// Get device owner
    public fun get_device_owner(device_info: &DeviceInfo): address {
        device_info.owner
    }

    /// Get device name
    public fun get_device_name(device_info: &DeviceInfo): String {
        device_info.device_name
    }

    /// Get device ID
    public fun get_device_id(device_info: &DeviceInfo): String {
        device_info.device_id
    }

    /// Get device location
    public fun get_device_location(device_info: &DeviceInfo): String {
        device_info.location
    }
}
