use serde::{Deserialize, Serialize};
use std::time::Duration;

/// Retry and failure handling configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetryConfig {
    /// Maximum number of retry attempts
    pub max_retries: u32,
    
    /// Initial backoff delay in milliseconds
    pub initial_backoff_ms: u64,
    
    /// Maximum backoff delay in milliseconds  
    pub max_backoff_ms: u64,
    
    /// Backoff multiplier for exponential backoff
    pub backoff_multiplier: f64,
    
    /// Jitter factor to add randomness (0.0 - 1.0)
    pub jitter_factor: f64,
    
    /// Timeout for individual operations in seconds
    pub operation_timeout_secs: u64,
    
    /// Circuit breaker configuration
    pub circuit_breaker: CircuitBreakerConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitBreakerConfig {
    /// Enable circuit breaker
    pub enabled: bool,
    
    /// Failure threshold to open circuit
    pub failure_threshold: u32,
    
    /// Time window for failure counting in seconds
    pub time_window_secs: u64,
    
    /// Recovery timeout in seconds before trying to close circuit
    pub recovery_timeout_secs: u64,
}

impl Default for RetryConfig {
    fn default() -> Self {
        Self {
            max_retries: 3,
            initial_backoff_ms: 1000,
            max_backoff_ms: 30000,
            backoff_multiplier: 2.0,
            jitter_factor: 0.1,
            operation_timeout_secs: 60,
            circuit_breaker: CircuitBreakerConfig::default(),
        }
    }
}

impl Default for CircuitBreakerConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            failure_threshold: 5,
            time_window_secs: 300, // 5 minutes
            recovery_timeout_secs: 60,
        }
    }
}

impl RetryConfig {
    /// Calculate backoff delay with jitter
    pub fn backoff_delay(&self, attempt: u32) -> Duration {
        let delay_ms = (self.initial_backoff_ms as f64 
            * self.backoff_multiplier.powi(attempt as i32))
            .min(self.max_backoff_ms as f64);
            
        // Add jitter
        let jitter = delay_ms * self.jitter_factor * rand::random::<f64>();
        let final_delay = delay_ms + jitter;
        
        Duration::from_millis(final_delay as u64)
    }
}