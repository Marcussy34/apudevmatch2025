#[test_only]
module grandwarden::device_registry_tests {
    use std::string::{Self, String};
    use sui::test_scenario::{Self as scenario, Scenario};
    use sui::transfer;

    use grandwarden::device_registry::{Self, DeviceRegistry, DeviceInfo};

    #[test]
    public fun test_create_registry() {
        let mut sc: Scenario = scenario::begin(@0xA11CE);
        let ctx = scenario::ctx(&mut sc);

        let owner = @0xA11CE;
        let registry: DeviceRegistry = device_registry::create_device_registry(owner, ctx);

        // Validate initial state
        assert!(device_registry::get_total_devices(&registry) == 0, 1);

        // Move object into storage so it does not need 'drop'
        transfer::public_transfer(registry, owner);
        scenario::end(sc);
    }

    #[test]
    public fun test_register_and_add_device() {
        let mut sc: Scenario = scenario::begin(@0xBEEF);
        let ctx = scenario::ctx(&mut sc);

        let owner = @0xBEEF;
        let mut registry: DeviceRegistry = device_registry::create_device_registry(owner, ctx);

        // Create independent Strings from byte literals whenever we need to reuse values
        let device_id_for_create: String = string::utf8(b"device-001");
        let device_name: String = string::utf8(b"Pixel 8");

        let info: DeviceInfo = device_registry::register_device(device_name, device_id_for_create, owner, ctx);
        device_registry::add_device_to_registry(&mut registry, info, ctx);

        assert!(device_registry::get_total_devices(&registry) == 1, 3);
        assert!(device_registry::device_exists(&registry, string::utf8(b"device-001")), 4);

        // Verify info accessible and active
        let di_ref = device_registry::get_device_info(&registry, string::utf8(b"device-001"));
        assert!(device_registry::is_device_active(di_ref), 5);

        // Move object into storage so it does not need 'drop'
        transfer::public_transfer(registry, owner);
        scenario::end(sc);
    }

    #[test]
    public fun test_revoke_suspend_reactivate() {
        let mut sc: Scenario = scenario::begin(@0xC0FFEE);
        let ctx = scenario::ctx(&mut sc);

        let owner = @0xC0FFEE;
        let mut registry: DeviceRegistry = device_registry::create_device_registry(owner, ctx);

        let device_id_for_create: String = string::utf8(b"device-xyz");
        let device_name: String = string::utf8(b"MacBook Pro");
        let info: DeviceInfo = device_registry::register_device(device_name, device_id_for_create, owner, ctx);
        device_registry::add_device_to_registry(&mut registry, info, ctx);

        // Revoke
        device_registry::revoke_device(&mut registry, string::utf8(b"device-xyz"), owner, ctx);
        let di_ref1 = device_registry::get_device_info(&registry, string::utf8(b"device-xyz"));
        assert!(device_registry::get_device_status(di_ref1) == 1, 6); // REVOKED

        // Suspend
        device_registry::suspend_device(&mut registry, string::utf8(b"device-xyz"), owner, ctx);
        let di_ref2 = device_registry::get_device_info(&registry, string::utf8(b"device-xyz"));
        assert!(device_registry::get_device_status(di_ref2) == 2, 7); // SUSPENDED

        // Reactivate
        device_registry::reactivate_device(&mut registry, string::utf8(b"device-xyz"), owner, ctx);
        let di_ref3 = device_registry::get_device_info(&registry, string::utf8(b"device-xyz"));
        assert!(device_registry::get_device_status(di_ref3) == 0, 8); // ACTIVE

        // Record access and ensure last_accessed is at least the registration time
        device_registry::record_device_access(&mut registry, string::utf8(b"device-xyz"), ctx);
        let di_ref4 = device_registry::get_device_info(&registry, string::utf8(b"device-xyz"));
        assert!(device_registry::get_last_accessed(di_ref4) >= device_registry::get_registered_at(di_ref4), 9);

        // Move object into storage so it does not need 'drop'
        transfer::public_transfer(registry, owner);
        scenario::end(sc);
    }
}


