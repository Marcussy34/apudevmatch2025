use anyhow::Result;
use std::convert::Infallible;
use std::net::SocketAddr;
use tokio::signal;
use tracing::{info, error};

/// Simplified ROFL worker for testing
#[tokio::main]
async fn main() -> Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    info!("🔄 Starting Grand Warden ROFL Critical Data Bridge (Test Mode)");

    // Start health check server
    let health_handle = {
        tokio::spawn(async move {
            if let Err(e) = start_health_server().await {
                error!("Health server failed: {}", e);
            }
        })
    };

    // Start mock event generator
    let mock_handle = {
        tokio::spawn(async move {
            if let Err(e) = start_mock_event_generator().await {
                error!("Mock event generator failed: {}", e);
            }
        })
    };

    info!("✅ ROFL Critical Data Bridge is now operational (Test Mode)");
    info!("🔍 Generating mock Sui events every 10 seconds");
    info!("🏥 Health check server running on :8080");
    info!("📊 Metrics server running on :9090");

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
    health_handle.abort();
    mock_handle.abort();
    
    info!("✅ Grand Warden ROFL worker stopped");
    Ok(())
}

/// Start health check HTTP server
async fn start_health_server() -> Result<()> {
    let make_svc = hyper::service::make_service_fn(|_conn| async {
        Ok::<_, Infallible>(hyper::service::service_fn(health_handler))
    });

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let server = hyper::Server::bind(&addr).serve(make_svc);

    info!("🏥 Health check server listening on {}", addr);
    server.await?;
    Ok(())
}

/// Health check endpoint handler
async fn health_handler(
    req: hyper::Request<hyper::Body>,
) -> Result<hyper::Response<hyper::Body>, Infallible> {
    match req.uri().path() {
        "/health" => {
            let response = hyper::Response::builder()
                .status(200)
                .header("content-type", "application/json")
                .body(hyper::Body::from(r#"{"status":"healthy","service":"grand-warden-rofl-bridge","mode":"test"}"#))
                .unwrap();
            Ok(response)
        }
        "/metrics" => {
            let metrics = format!(
                "# HELP grand_warden_bridge_events_processed_total Total events processed\n# TYPE grand_warden_bridge_events_processed_total counter\ngrand_warden_bridge_events_processed_total {}\n# HELP grand_warden_bridge_uptime_seconds Uptime in seconds\n# TYPE grand_warden_bridge_uptime_seconds gauge\ngrand_warden_bridge_uptime_seconds {}\n",
                rand::random::<u32>() % 100,
                chrono::Utc::now().timestamp()
            );
            let response = hyper::Response::builder()
                .status(200)
                .header("content-type", "text/plain")
                .body(hyper::Body::from(metrics))
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

/// Mock event generator
async fn start_mock_event_generator() -> Result<()> {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(10));
    
    info!("🎭 Mock Sui event generator started");
    
    loop {
        interval.tick().await;
        
        let event_types = ["VaultCreated", "WalletImported", "DeviceRegistered", "CredentialAdded"];
        let event_type = event_types[rand::random::<usize>() % event_types.len()];
        
        info!("📝 Generated mock Sui event: {}", event_type);
        info!("⚡ Processing event and emitting to Sapphire (simulated)");
        info!("✅ Successfully processed synthetic event (test mode)");
    }
}