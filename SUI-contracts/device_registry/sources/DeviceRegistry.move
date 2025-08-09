module grandwarden::device_registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::event;
    use sui::table::{Self, Table};
    use std::string::{Self, String};

    struct DeviceInfo has key, store {
        id: UID,
        owner: address,
        device_name: String,
        device_id: String,
        registered_at: u64,
        status: u8,
        last_accessed: u64,
    }

    struct DeviceRegistry has key, store {
        id: UID,
        owner: address,
        devices: Table<String, DeviceInfo>,
        total_devices: u64,
    }

    const DEVICE_STATUS_ACTIVE: u8 = 0;
    const DEVICE_STATUS_REVOKED: u8 = 1;
    const DEVICE_STATUS_SUSPENDED: u8 = 2;

    struct DeviceRegistered has copy, drop {
        owner: address,
        device_id: String,
        device_name: String,
        registered_at: u64,
    }

    struct DeviceRevoked has copy, drop {
        owner: address,
        device_id: String,
        revoked_at: u64,
    }

    struct DeviceSuspended has copy, drop {
        owner: address,
        device_id: String,
        suspended_at: u64,
    }

    struct DeviceReactivated has copy, drop {
        owner: address,
        device_id: String,
        reactivated_at: u64,
    }

    struct DeviceAccessed has copy, drop {
        owner: address,
        device_id: String,
        accessed_at: u64,
    }

    public fun register_device(
        device_name: String,
        device_id: String,
        owner: address,
        ctx: &mut TxContext
    ): DeviceInfo {
        let now = tx_context::epoch(ctx);
        // Emit event first using copies of input variables
        event::emit(DeviceRegistered { owner, device_id: copy device_id, device_name: copy device_name, registered_at: now });
        let info = DeviceInfo {
            id: object::new(ctx),
            owner,
            device_name,
            device_id,
            registered_at: now,
            status: DEVICE_STATUS_ACTIVE,
            last_accessed: now,
        };
        info
    }

    public fun add_device_to_registry(
        registry: &mut DeviceRegistry,
        device_info: DeviceInfo,
        _ctx: &mut TxContext
    ) {
        let did = device_info.device_id;
        table::add(&mut registry.devices, did, device_info);
        registry.total_devices = registry.total_devices + 1;
    }

    public fun create_device_registry(owner: address, ctx: &mut TxContext): DeviceRegistry {
        DeviceRegistry { id: object::new(ctx), owner, devices: table::new(ctx), total_devices: 0 }
    }

    public fun revoke_device(registry: &mut DeviceRegistry, device_id: String, caller: address, ctx: &TxContext) {
        assert!(registry.owner == caller, 0);
        let device = table::borrow_mut(&mut registry.devices, device_id);
        device.status = DEVICE_STATUS_REVOKED;
        event::emit(DeviceRevoked { owner: caller, device_id, revoked_at: tx_context::epoch(ctx) });
    }

    public fun suspend_device(registry: &mut DeviceRegistry, device_id: String, caller: address, ctx: &TxContext) {
        assert!(registry.owner == caller, 0);
        let device = table::borrow_mut(&mut registry.devices, device_id);
        device.status = DEVICE_STATUS_SUSPENDED;
        event::emit(DeviceSuspended { owner: caller, device_id, suspended_at: tx_context::epoch(ctx) });
    }

    public fun reactivate_device(registry: &mut DeviceRegistry, device_id: String, caller: address, ctx: &TxContext) {
        assert!(registry.owner == caller, 0);
        let device = table::borrow_mut(&mut registry.devices, device_id);
        device.status = DEVICE_STATUS_ACTIVE;
        event::emit(DeviceReactivated { owner: caller, device_id, reactivated_at: tx_context::epoch(ctx) });
    }

    public fun record_device_access(registry: &mut DeviceRegistry, device_id: String, ctx: &TxContext) {
        let device = table::borrow_mut(&mut registry.devices, device_id);
        let now = tx_context::epoch(ctx);
        device.last_accessed = now;
        event::emit(DeviceAccessed { owner: registry.owner, device_id, accessed_at: now });
    }
}