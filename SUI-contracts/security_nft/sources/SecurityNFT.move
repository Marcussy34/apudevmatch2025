module grandwarden::security_nft {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::url::{Self, Url};
    use std::string::{Self, String};
    use sui::event;

    /// The Security NFT representing a security audit snapshot
    struct SecurityNFT has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: Url,
        total_checked: u64,
        total_pwned: u64,
        created_at: u64,
        creator: address,
    }

    /// Event emitted when a Security NFT is minted
    struct SecurityNFTMinted has copy, drop {
        nft_id: address,
        creator: address,
        name: String,
        total_checked: u64,
        total_pwned: u64,
        created_at: u64,
    }

    /// Mint a new Security NFT with security audit data
    public entry fun mint_security_nft(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        total_checked: u64,
        total_pwned: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let created_at = tx_context::epoch(ctx);
        
        let nft = SecurityNFT {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            image_url: url::new_unsafe_from_bytes(image_url),
            total_checked,
            total_pwned,
            created_at,
            creator: sender,
        };

        let nft_id = object::uid_to_address(&nft.id);

        // Emit event
        event::emit(SecurityNFTMinted {
            nft_id,
            creator: sender,
            name: nft.name,
            total_checked,
            total_pwned,
            created_at,
        });

        // Transfer the NFT to the creator
        transfer::public_transfer(nft, sender);
    }

    /// Get the name of the NFT
    public fun name(nft: &SecurityNFT): String {
        nft.name
    }

    /// Get the description of the NFT
    public fun description(nft: &SecurityNFT): String {
        nft.description
    }

    /// Get the image URL of the NFT
    public fun image_url(nft: &SecurityNFT): Url {
        nft.image_url
    }

    /// Get the total checked count
    public fun total_checked(nft: &SecurityNFT): u64 {
        nft.total_checked
    }

    /// Get the total pwned count
    public fun total_pwned(nft: &SecurityNFT): u64 {
        nft.total_pwned
    }

    /// Get the creation timestamp
    public fun created_at(nft: &SecurityNFT): u64 {
        nft.created_at
    }

    /// Get the creator address
    public fun creator(nft: &SecurityNFT): address {
        nft.creator
    }

    /// Transfer the NFT to a new owner
    public entry fun transfer_nft(
        nft: SecurityNFT,
        recipient: address,
        _ctx: &mut TxContext
    ) {
        transfer::public_transfer(nft, recipient);
    }
}
