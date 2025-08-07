use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, error};

/// Audit event types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditEventType {
    EventProcessed,
    TransactionSent,
    TransactionConfirmed,
    TransactionFailed,
    SecurityAlert,
    ConfigurationChange,
    SystemStart,
    SystemStop,
}

/// Audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditLogEntry {
    pub timestamp: u64,
    pub event_type: AuditEventType,
    pub user_address: Option<String>,
    pub transaction_hash: Option<String>,
    pub details: serde_json::Value,
    pub severity: AuditSeverity,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AuditSeverity {
    Info,
    Warning,
    Error,
    Critical,
}

/// Security audit logger
pub struct AuditLogger {
    enabled: bool,
    entries: Arc<Mutex<Vec<AuditLogEntry>>>,
}

impl AuditLogger {
    pub fn new(enabled: bool) -> Self {
        Self {
            enabled,
            entries: Arc::new(Mutex::new(Vec::new())),
        }
    }
    
    /// Log an audit event
    pub async fn log_event(
        &self,
        event_type: AuditEventType,
        user_address: Option<String>,
        transaction_hash: Option<String>,
        details: serde_json::Value,
        severity: AuditSeverity,
    ) -> Result<()> {
        if !self.enabled {
            return Ok(());
        }
        
        let entry = AuditLogEntry {
            timestamp: chrono::Utc::now().timestamp() as u64,
            event_type: event_type.clone(),
            user_address: user_address.clone(),
            transaction_hash: transaction_hash.clone(),
            details,
            severity: severity.clone(),
        };
        
        // Add to in-memory log
        let mut entries = self.entries.lock().await;
        entries.push(entry.clone());
        
        // Log to standard logging as well
        match severity {
            AuditSeverity::Info => {
                info!("📋 AUDIT: {:?} - User: {:?}, TX: {:?}", 
                    event_type, user_address, transaction_hash);
            }
            AuditSeverity::Warning => {
                info!("⚠️ AUDIT WARNING: {:?} - User: {:?}, TX: {:?}", 
                    event_type, user_address, transaction_hash);
            }
            AuditSeverity::Error => {
                error!("❌ AUDIT ERROR: {:?} - User: {:?}, TX: {:?}", 
                    event_type, user_address, transaction_hash);
            }
            AuditSeverity::Critical => {
                error!("🚨 AUDIT CRITICAL: {:?} - User: {:?}, TX: {:?}", 
                    event_type, user_address, transaction_hash);
            }
        }
        
        Ok(())
    }
    
    /// Get recent audit entries
    pub async fn get_recent_entries(&self, limit: usize) -> Vec<AuditLogEntry> {
        let entries = self.entries.lock().await;
        entries.iter()
            .rev()
            .take(limit)
            .cloned()
            .collect()
    }
    
    /// Clear audit log
    pub async fn clear(&self) -> Result<()> {
        let mut entries = self.entries.lock().await;
        entries.clear();
        info!("📋 Audit log cleared");
        Ok(())
    }
}