module grandwarden::device_registry {
    use std::string::String;
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::object;
    use sui::table::{Self, Table};
    use sui::clock::{Self, Clock};
    use std::storage; // Move 2024 global storage ops

    /// Struct representing a single device entry (keyed by device_id in the table)
    public struct Device has copy, drop, store {
        device_id: String,
        device_type: String,
        os: String,
        user_agent: String,
        country: String,
        registered_ms: u64,
    }

    /// Per-user device registry object owned by the user
    public struct UserDevices has key, store {
        id: object::UID,
        owner: address,
        devices: Table<String, Device>, // keyed by device_id
    }

    /// Event emitted when a new device is registered
    public struct DeviceRegistered has copy, drop {
        owner: address,
        device_id: String,
        device_type: String,
        os: String,
        country: String,
        registered_ms: u64,
    }

    /// Create an empty registry for the caller (no-op if already exists)
    public entry fun ensure_user_registry(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        if (!storage::exists<UserDevices>(sender)) {
            let devices = table::new<String, Device>(ctx);
            storage::move_to(&sender, UserDevices { id: object::new(ctx), owner: sender, devices })
        }
    }

    /// Register a device for the sender if not already registered.
    /// `device_type`, `os`, `user_agent`, `country` are client-provided best-effort fields.
    public entry fun register_device(
        clock: &Clock,
        device_id: String,
        device_type: String,
        os: String,
        user_agent: String,
        country: String,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let timestamp_ms = clock::timestamp_ms(clock);

        // Ensure registry exists
        if (!storage::exists<UserDevices>(sender)) {
            let devices = table::new<String, Device>(ctx);
            storage::move_to(&sender, UserDevices { id: object::new(ctx), owner: sender, devices })
        };

        let devices_ref = &mut storage::borrow_global_mut<UserDevices>(sender).devices;

        // If already registered, no-op
        if (table::contains<String, Device>(devices_ref, device_id)) {
            return
        };

        let device = Device { device_id: device_id, device_type, os, user_agent, country, registered_ms: timestamp_ms };
        // Insert under the device_id key
        table::add<String, Device>(devices_ref, device_id, device);

        event::emit(DeviceRegistered {
            owner: sender,
            device_id: device_id,
            device_type: device_type,
            os: os,
            country: country,
            registered_ms: timestamp_ms,
        })
    }

    /// Read helpers
    public fun has_registry(owner: address): bool { storage::exists<UserDevices>(owner) }

    public fun has_device(owner: address, device_id: String): bool {
        if (!storage::exists<UserDevices>(owner)) return false;
        let devices_ref = &storage::borrow_global<UserDevices>(owner).devices;
        table::contains<String, Device>(devices_ref, device_id)
    }
}


