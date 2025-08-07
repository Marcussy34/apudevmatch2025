use anyhow::{Context, Result};
use aes_gcm::{Aes256Gcm, Key, Nonce, aead::{Aead, KeyInit, generic_array::GenericArray}};
use rand::{RngCore, thread_rng};
use tracing::debug;

/// Secure communication handler
pub struct SecureComms {
    cipher: Option<Aes256Gcm>,
    enabled: bool,
}

impl SecureComms {
    /// Create new secure communications handler
    pub fn new(encryption_key: Option<&str>, enabled: bool) -> Result<Self> {
        let cipher = if enabled && encryption_key.is_some() {
            let key_bytes = hex::decode(encryption_key.unwrap())
                .context("Invalid encryption key format")?;
            
            if key_bytes.len() != 32 {
                return Err(anyhow::anyhow!("Encryption key must be 32 bytes"));
            }
            
            let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
            Some(Aes256Gcm::new(key))
        } else {
            None
        };
        
        Ok(Self {
            cipher,
            enabled,
        })
    }
    
    /// Encrypt data for secure transmission
    pub fn encrypt(&self, plaintext: &[u8]) -> Result<Vec<u8>> {
        if !self.enabled || self.cipher.is_none() {
            debug!("🔓 Secure comms disabled, returning plaintext");
            return Ok(plaintext.to_vec());
        }
        
        let cipher = self.cipher.as_ref().unwrap();
        
        // Generate random nonce
        let mut nonce_bytes = [0u8; 12];
        thread_rng().fill_bytes(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);
        
        // Encrypt
        let ciphertext = cipher.encrypt(nonce, plaintext)
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;
        
        // Prepend nonce to ciphertext
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&ciphertext);
        
        Ok(result)
    }
    
    /// Decrypt received data
    pub fn decrypt(&self, encrypted_data: &[u8]) -> Result<Vec<u8>> {
        if !self.enabled || self.cipher.is_none() {
            debug!("🔓 Secure comms disabled, returning encrypted data as-is");
            return Ok(encrypted_data.to_vec());
        }
        
        if encrypted_data.len() < 12 {
            return Err(anyhow::anyhow!("Encrypted data too short"));
        }
        
        let cipher = self.cipher.as_ref().unwrap();
        
        // Extract nonce and ciphertext
        let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);
        
        // Decrypt
        cipher.decrypt(nonce, ciphertext)
            .map_err(|e| anyhow::anyhow!("Decryption failed: {}", e))
    }
}