use anyhow::{Context, Result};
use std::sync::Arc;
use tokio::signal;
use tracing::{info, warn, error};

mod config;
mod monitoring;
mod bridging;
mod processing;
mod security;

use config::RoflConfig;
use monitoring::sui_monitor::SuiMonitor;
use bridging::sapphire_bridge::SapphireBridge;
use processing::event_queue::EventQueue;

/// Main ROFL worker entry point
/// Coordinates the Critical Data Bridge between Sui and Sapphire
#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    info!("🔄 Starting Grand Warden ROFL Critical Data Bridge");

    // Load ROFL configuration from environment and secrets
    let config = RoflConfig::load().context("Failed to load ROFL configuration")?;
    info!("📋 ROFL configuration loaded successfully");
    info!("🌐 Sui RPC: {}", config.sui.rpc_url);
    info!("⚡ Sapphire RPC: {}", config.sapphire.rpc_url);
    info!("📊 Metrics enabled: {}", config.monitoring.metrics_enabled);

    // Initialize core components
    let event_queue = Arc::new(EventQueue::new(config.queue.clone()).await?);
    let sapphire_bridge = Arc::new(SapphireBridge::new(config.sapphire.clone()).await?);
    let sui_monitor = Arc::new(SuiMonitor::new(config.sui.clone(), event_queue.clone()).await?);

    info!("🚀 All components initialized successfully");

    // Start all services
    let sui_handle = {
        let sui_monitor = sui_monitor.clone();
        tokio::spawn(async move {
            if let Err(e) = sui_monitor.start_monitoring().await {
                error!("Sui monitoring failed: {}", e);
            }
        })
    };

    let bridge_handle = {
        let sapphire_bridge = sapphire_bridge.clone();
        let event_queue = event_queue.clone();
        tokio::spawn(async move {
            if let Err(e) = sapphire_bridge.start_processing(event_queue).await {
                error!("Sapphire bridge processing failed: {}", e);
            }
        })
    };

    let queue_handle = {
        let event_queue = event_queue.clone();
        tokio::spawn(async move {
            if let Err(e) = event_queue.start_processing().await {
                error!("Event queue processing failed: {}", e);
            }
        })
    };

    // Start health check server
    let health_handle = {
        tokio::spawn(async move {
            if let Err(e) = start_health_server().await {
                error!("Health server failed: {}", e);
            }
        })
    };

    info!("✅ ROFL Critical Data Bridge is now operational");
    info!("🔍 Monitoring Sui network for Grand Warden events");
    info!("⚡ Ready to emit synthetic Sapphire events");
    info!("🏥 Health check server running on :8080");

    // Wait for shutdown signal
    match signal::ctrl_c().await {
        Ok(()) => {
            info!("🛑 Shutdown signal received, stopping ROFL worker");
        }
        Err(err) => {
            error!("Unable to listen for shutdown signal: {}", err);
        }
    }

    // Graceful shutdown
    warn!("🔄 Initiating graceful shutdown...");
    
    // Cancel all tasks
    sui_handle.abort();
    bridge_handle.abort();
    queue_handle.abort();
    health_handle.abort();

    // Allow tasks to finish
    tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
    
    info!("✅ Grand Warden ROFL worker stopped");
    Ok(())
}

/// Start health check HTTP server for container health monitoring
async fn start_health_server() -> Result<()> {
    use std::convert::Infallible;
    use std::net::SocketAddr;

    // Simple HTTP server for health checks
    let make_svc = hyper::service::make_service_fn(|_conn| async {
        Ok::<_, Infallible>(hyper::service::service_fn(health_handler))
    });

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let server = hyper::Server::bind(&addr).serve(make_svc);

    info!("🏥 Health check server listening on {}", addr);

    if let Err(e) = server.await {
        error!("Health server error: {}", e);
    }

    Ok(())
}

/// Health check endpoint handler
async fn health_handler(
    req: hyper::Request<hyper::Body>,
) -> Result<hyper::Response<hyper::Body>, Infallible> {
    match req.uri().path() {
        "/health" => {
            // Simple health check - could be enhanced with actual health metrics
            let response = hyper::Response::builder()
                .status(200)
                .header("content-type", "application/json")
                .body(hyper::Body::from(r#"{"status":"healthy","service":"grand-warden-rofl-bridge"}"#))
                .unwrap();
            Ok(response)
        }
        "/metrics" => {
            // Metrics endpoint (placeholder)
            let response = hyper::Response::builder()
                .status(200)
                .header("content-type", "text/plain")
                .body(hyper::Body::from("# HELP grand_warden_bridge_events_processed_total Total events processed\n# TYPE grand_warden_bridge_events_processed_total counter\ngrand_warden_bridge_events_processed_total 0\n"))
                .unwrap();
            Ok(response)
        }
        _ => {
            let response = hyper::Response::builder()
                .status(404)
                .body(hyper::Body::from("Not Found"))
                .unwrap();
            Ok(response)
        }
    }
}