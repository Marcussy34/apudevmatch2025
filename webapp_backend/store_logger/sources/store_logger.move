module store_logger::store_logger {
    use sui::object::UID;
    use sui::transfer;
    use sui::tx_context::TxContext;
    use std::string::{Self, String};
    use sui::event;

    /// Event emitted when credentials are stored
    public struct CredentialStoreEvent has copy, drop {
        user_address: address,
        walrus_blob_id: String,
        walrus_cid: String,
        timestamp: u64,
    }

    /// Capability for logging events
    public struct LogCap has key {
        id: UID,
    }

    /// Initialize the module by creating and transferring the LogCap
    fun init(ctx: &mut TxContext) {
        let log_cap = LogCap {
            id: object::new(ctx),
        };
        transfer::transfer(log_cap, tx_context::sender(ctx));
    }

    /// Create a new LogCap for the caller
    public entry fun create_log_cap(ctx: &mut TxContext) {
        let log_cap = LogCap {
            id: object::new(ctx),
        };
        transfer::transfer(log_cap, tx_context::sender(ctx));
    }

    /// Log a credential storage event
    public entry fun log_credential_store(
        _log_cap: &LogCap,
        user_address: address,
        walrus_blob_id: vector<u8>,
        walrus_cid: vector<u8>,
        ctx: &mut TxContext
    ) {
        let event = CredentialStoreEvent {
            user_address,
            walrus_blob_id: string::utf8(walrus_blob_id),
            walrus_cid: string::utf8(walrus_cid),
            timestamp: tx_context::epoch(ctx),
        };
        
        // Emit the event
        event::emit(event);
    }
}


