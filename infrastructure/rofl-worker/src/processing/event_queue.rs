use anyhow::{Context, Result};
use std::collections::{HashMap, VecDeque};
use tokio::sync::{Mutex, mpsc};
use tracing::{debug, warn, error};

use crate::config::QueueConfig;
use crate::monitoring::sui_monitor::MockSuiEvent;

/// Priority-based event queue for processing Sui events
pub struct EventQueue {
    config: QueueConfig,
    queues: Mutex<HashMap<u8, VecDeque<MockSuiEvent>>>,
    sender: mpsc::UnboundedSender<MockSuiEvent>,
    receiver: Mutex<mpsc::UnboundedReceiver<MockSuiEvent>>,
    stats: Mutex<QueueStats>,
}

#[derive(Debug, Default)]
struct QueueStats {
    total_enqueued: u64,
    total_dequeued: u64,
    total_dropped: u64,
    current_size: usize,
    priority_counts: HashMap<u8, usize>,
}

impl EventQueue {
    /// Create new priority-based event queue
    pub async fn new(config: QueueConfig) -> Result<Self> {
        let (sender, receiver) = mpsc::unbounded_channel();
        
        Ok(Self {
            config,
            queues: Mutex::new(HashMap::new()),
            sender,
            receiver: Mutex::new(receiver),
            stats: Mutex::new(QueueStats::default()),
        })
    }
    
    /// Enqueue a Sui event for processing
    pub async fn enqueue_sui_event(&self, event: MockSuiEvent) -> Result<()> {
        // Get priority for this event type
        let priority = self.config.priority_mapping
            .get(&event.event_type)
            .copied()
            .unwrap_or(5); // Default priority
        
        debug!("📥 Queueing event: {} (priority {})", event.event_type, priority);
        
        let mut stats = self.stats.lock().await;
        
        // Check if queue is full
        if stats.current_size >= self.config.max_size {
            warn!("🚫 Queue is full, dropping event: {}", event.event_type);
            stats.total_dropped += 1;
            return Err(anyhow::anyhow!("Queue is full"));
        }
        
        // Add to priority queue
        let mut queues = self.queues.lock().await;
        let priority_queue = queues.entry(priority).or_insert_with(VecDeque::new);
        priority_queue.push_back(event.clone());
        
        // Update stats
        stats.total_enqueued += 1;
        stats.current_size += 1;
        *stats.priority_counts.entry(priority).or_insert(0) += 1;
        
        // Send to channel for immediate processing if needed
        if let Err(_) = self.sender.send(event) {
            error!("Failed to send event to processing channel");
        }
        
        Ok(())
    }
    
    /// Dequeue the highest priority event
    pub async fn dequeue_sui_event(&self) -> Result<Option<MockSuiEvent>> {
        let mut queues = self.queues.lock().await;
        let mut stats = self.stats.lock().await;
        
        // Find highest priority queue with events (lower number = higher priority)
        let mut priorities: Vec<_> = queues.keys().copied().collect();
        priorities.sort();
        
        for priority in priorities {
            if let Some(queue) = queues.get_mut(&priority) {
                if let Some(event) = queue.pop_front() {
                    debug!("📤 Dequeuing event: {} (priority {})", event.event_type, priority);
                    
                    // Update stats
                    stats.total_dequeued += 1;
                    stats.current_size = stats.current_size.saturating_sub(1);
                    if let Some(count) = stats.priority_counts.get_mut(&priority) {
                        *count = count.saturating_sub(1);
                    }
                    
                    return Ok(Some(event));
                }
            }
        }
        
        Ok(None)
    }
    
    /// Start the event processing loop
    pub async fn start_processing(&self) -> Result<()> {
        debug!("🔄 Starting event queue processing loop");
        
        let processing_interval = tokio::time::Duration::from_millis(
            self.config.processing_interval_ms
        );
        
        let mut interval = tokio::time::interval(processing_interval);
        
        loop {
            interval.tick().await;
            
            // Process a batch of events
            for _ in 0..self.config.batch_size {
                match self.dequeue_sui_event().await {
                    Ok(Some(_event)) => {
                        // Event dequeued successfully - it will be processed by the bridge
                        // The actual processing is handled by SapphireBridge
                    }
                    Ok(None) => {
                        // No more events to process
                        break;
                    }
                    Err(e) => {
                        error!("Error dequeuing event: {}", e);
                        break;
                    }
                }
            }
            
            // Log stats periodically
            if rand::random::<f64>() < 0.1 { // 10% chance
                self.log_stats().await;
            }
        }
    }
    
    /// Get current queue statistics
    pub async fn get_stats(&self) -> QueueStats {
        self.stats.lock().await.clone()
    }
    
    /// Log queue statistics
    async fn log_stats(&self) {
        let stats = self.stats.lock().await;
        debug!("📊 Queue Stats - Size: {}, Enqueued: {}, Dequeued: {}, Dropped: {}", 
            stats.current_size, stats.total_enqueued, stats.total_dequeued, stats.total_dropped);
            
        if !stats.priority_counts.is_empty() {
            let priority_info: Vec<String> = stats.priority_counts
                .iter()
                .map(|(priority, count)| format!("P{}:{}", priority, count))
                .collect();
            debug!("📊 Priority distribution: {}", priority_info.join(", "));
        }
    }
    
    /// Clear all queues (for testing/emergency)
    pub async fn clear(&self) {
        let mut queues = self.queues.lock().await;
        let mut stats = self.stats.lock().await;
        
        queues.clear();
        stats.current_size = 0;
        stats.priority_counts.clear();
        
        warn!("🗑️ Event queue cleared");
    }
    
    /// Get current queue size
    pub async fn size(&self) -> usize {
        self.stats.lock().await.current_size
    }
}

impl Clone for QueueStats {
    fn clone(&self) -> Self {
        Self {
            total_enqueued: self.total_enqueued,
            total_dequeued: self.total_dequeued,
            total_dropped: self.total_dropped,
            current_size: self.current_size,
            priority_counts: self.priority_counts.clone(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    use crate::monitoring::sui_monitor::MockEventData;
    
    #[tokio::test]
    async fn test_event_queue_priority() {
        let config = Config::default();
        let queue = EventQueue::new(config.queue).await.unwrap();
        
        // Create events with different priorities
        let high_priority_event = MockSuiEvent {
            event_type: "VaultCreated".to_string(), // Priority 1
            user_address: "0x123".to_string(),
            data: MockEventData::VaultCreated {
                vault_id: "test".to_string(),
                walrus_cid: "test_cid".to_string(),
            },
            timestamp: 1234567890,
        };
        
        let low_priority_event = MockSuiEvent {
            event_type: "SystemHealth".to_string(), // Priority 5
            user_address: "0x123".to_string(),
            data: MockEventData::VaultCreated {
                vault_id: "test".to_string(),
                walrus_cid: "test_cid".to_string(),
            },
            timestamp: 1234567890,
        };
        
        // Queue low priority first
        queue.enqueue_sui_event(low_priority_event).await.unwrap();
        queue.enqueue_sui_event(high_priority_event).await.unwrap();
        
        // High priority should come out first
        let first_event = queue.dequeue_sui_event().await.unwrap().unwrap();
        assert_eq!(first_event.event_type, "VaultCreated");
        
        let second_event = queue.dequeue_sui_event().await.unwrap().unwrap();
        assert_eq!(second_event.event_type, "SystemHealth");
    }
}