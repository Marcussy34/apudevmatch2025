module grandwarden::device_registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    // ===== STRUCTS =====

    /// Device information stored on Sui
    public struct DeviceInfo has key, store {
        id: UID,
        owner: address,           // zkLogin address
        device_name: String,      // Human-readable device name
        device_id: String,        // Unique device identifier
        registered_at: u64,       // Timestamp when device was registered
        status: u8,              // 0=Active, 1=Revoked, 2=Suspended
        last_accessed: u64,      // Last access timestamp
    }

    /// Registry to track all devices for a user
    public struct DeviceRegistry has key, store {
        id: UID,
        owner: address,           // zkLogin address
        devices: Table<String, DeviceInfo>, // device_id -> DeviceInfo
        total_devices: u64,
    }

    // ===== CONSTANTS =====

    const DEVICE_STATUS_ACTIVE: u8 = 0;
    const DEVICE_STATUS_REVOKED: u8 = 1;
    const DEVICE_STATUS_SUSPENDED: u8 = 2;

    // ===== EVENTS =====

    /// Event emitted when a device is registered
    public struct DeviceRegistered has copy, drop {
        owner: address,           // zkLogin address
        device_id: String,        // Unique device identifier
        device_name: String,      // Human-readable device name
        registered_at: u64,       // Registration timestamp
    }

    /// Event emitted when a device is revoked
    public struct DeviceRevoked has copy, drop {
        owner: address,           // zkLogin address
        device_id: String,        // Device identifier
        revoked_at: u64,         // Revocation timestamp
    }

    /// Event emitted when a device is suspended
    public struct DeviceSuspended has copy, drop {
        owner: address,           // zkLogin address
        device_id: String,        // Device identifier
        suspended_at: u64,       // Suspension timestamp
    }

    /// Event emitted when a device is reactivated
    public struct DeviceReactivated has copy, drop {
        owner: address,           // zkLogin address
        device_id: String,        // Device identifier
        reactivated_at: u64,     // Reactivation timestamp
    }

    /// Event emitted when device access is recorded
    public struct DeviceAccessed has copy, drop {
        owner: address,           // zkLogin address
        device_id: String,        // Device identifier
        accessed_at: u64,        // Access timestamp
    }

    // ===== FUNCTIONS =====

    /// Register a new device for a zkLogin user
    /// This function is called by the backend/frontend that holds the ephemeral key
    public fun register_device(
        device_name: String,
        device_id: String,
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
            registered_at: current_time,
            status: DEVICE_STATUS_ACTIVE,
            last_accessed: current_time,
        };

        // Emit registration event for ROFL to listen
        event::emit(DeviceRegistered {
            owner,
            device_id,
            device_name,
            registered_at: current_time,
        });

        device_info
    }

    /// Add device to user's registry
    public fun add_device_to_registry(
        registry: &mut DeviceRegistry,
        device_info: DeviceInfo,
        ctx: &mut TxContext
    ) {
        let device_id = device_info.device_id;
        
        // Add to registry
        table::add(&mut registry.devices, device_id, device_info);
        registry.total_devices = registry.total_devices + 1;
    }

    /// Create a new device registry for a zkLogin user
    /// This function is called by the backend/frontend that holds the ephemeral key
    public fun create_device_registry(
        owner: address,           // zkLogin address passed as parameter
        ctx: &mut TxContext
    ): DeviceRegistry {
        DeviceRegistry {
            id: object::new(ctx),
            owner,
            devices: table::new(ctx),
            total_devices: 0,
        }
    }

    /// Revoke a device (owner only)
    /// This function is called by the backend/frontend that holds the ephemeral key
    public fun revoke_device(
        registry: &mut DeviceRegistry,
        device_id: String,
        caller: address,          // zkLogin address of the caller
        ctx: &TxContext
    ) {
        assert!(registry.owner == caller, 0);

        let device_info = table::borrow_mut(&mut registry.devices, device_id);
        device_info.status = DEVICE_STATUS_REVOKED;

        // Emit revocation event for ROFL
        event::emit(DeviceRevoked {
            owner: caller,
            device_id,
            revoked_at: tx_context::epoch(ctx),
        });
    }

    /// Suspend a device (owner only)
    /// This function is called by the backend/frontend that holds the ephemeral key
    public fun suspend_device(
        registry: &mut DeviceRegistry,
        device_id: String,
        caller: address,          // zkLogin address of the caller
        ctx: &TxContext
    ) {
        assert!(registry.owner == caller, 0);

        let device_info = table::borrow_mut(&mut registry.devices, device_id);
        device_info.status = DEVICE_STATUS_SUSPENDED;

        // Emit suspension event for ROFL
        event::emit(DeviceSuspended {
            owner: caller,
            device_id,
            suspended_at: tx_context::epoch(ctx),
        });
    }

    /// Reactivate a suspended device (owner only)
    /// This function is called by the backend/frontend that holds the ephemeral key
    public fun reactivate_device(
        registry: &mut DeviceRegistry,
        device_id: String,
        caller: address,          // zkLogin address of the caller
        ctx: &TxContext
    ) {
        assert!(registry.owner == caller, 0);

        let device_info = table::borrow_mut(&mut registry.devices, device_id);
        device_info.status = DEVICE_STATUS_ACTIVE;

        // Emit reactivation event for ROFL
        event::emit(DeviceReactivated {
            owner: caller,
            device_id,
            reactivated_at: tx_context::epoch(ctx),
        });
    }

    /// Record device access (can be called by any authorized party)
    public fun record_device_access(
        registry: &mut DeviceRegistry,
        device_id: String,
        ctx: &TxContext
    ) {
        let device_info = table::borrow_mut(&mut registry.devices, device_id);
        let current_time = tx_context::epoch(ctx);
        device_info.last_accessed = current_time;

        // Emit access event for ROFL
        event::emit(DeviceAccessed {
            owner: registry.owner,
            device_id,
            accessed_at: current_time,
        });
    }

    // ===== VIEW FUNCTIONS =====

    /// Get device info by ID
    public fun get_device_info(
        registry: &DeviceRegistry,
        device_id: String
    ): &DeviceInfo {
        table::borrow(&registry.devices, device_id)
    }

    /// Check if device exists
    public fun device_exists(
        registry: &DeviceRegistry,
        device_id: String
    ): bool {
        table::contains(&registry.devices, device_id)
    }

    /// Get total number of devices for user
    public fun get_total_devices(registry: &DeviceRegistry): u64 {
        registry.total_devices
    }

    /// Get device status
    public fun get_device_status(device_info: &DeviceInfo): u8 {
        device_info.status
    }

    /// Check if device is active
    public fun is_device_active(device_info: &DeviceInfo): bool {
        device_info.status == DEVICE_STATUS_ACTIVE
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

    /// Get registration timestamp
    public fun get_registered_at(device_info: &DeviceInfo): u64 {
        device_info.registered_at
    }

    /// Get last accessed timestamp
    public fun get_last_accessed(device_info: &DeviceInfo): u64 {
        device_info.last_accessed
    }
}
