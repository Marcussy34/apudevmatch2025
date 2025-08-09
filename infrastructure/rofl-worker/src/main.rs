mod handlers;
// Sui device registry handlers removed from runtime routing per new plan
use std::time::Duration;
use std::convert::Infallible;
use hyper::{Body, Method, Request, Response, Server, StatusCode};
use hyper::service::{make_service_fn, service_fn};
use tokio::time::interval;
use eyre::Result;
// Removed ethers/Sapphire dependencies from runtime per new plan
pub use serde_json;
use tracing::{info, error};
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
// use futures::future::join_all; // Not needed after simplifying batch to sequential
use std::env;

/// Grand Warden ROFL Critical Data Bridge
/// 
/// Official ROFL implementation for bridging Sui events to Sapphire
/// Based on BUILDPLAN.md Phase 4 requirements:
/// - Monitor Sui network for Grand Warden events
/// - Translate events to Sapphire-compatible format  
/// - Emit synthetic EVM events via Sapphire contracts
/// - <10 second event processing latency
/// - >95% atomic operation success rate
/// - 100% event translation accuracy
#[tokio::main]
async fn main() -> Result<()> {
    // Initialize structured logging
    tracing_subscriber::fmt()
        .with_env_filter(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,grand_warden_rofl=debug".to_string())
        )
        .with_target(true)
        .with_thread_ids(true)
        .json()
        .init();

    info!("🚀 Grand Warden ROFL Critical Data Bridge Starting");

    // Start lightweight HTTP server for health and test ingestion
    start_http_server();
    info!("📋 ROFL API Mode (Sui listener disabled)");

    // Sui listener and Sapphire bridge removed per new design

    // Idle loop to keep the service alive; HTTP server handles requests
    info!("🔄 ROFL worker running: HTTP API available on :8080");
    let mut interval = interval(Duration::from_secs(60));
    loop {
        interval.tick().await;
        info!("💤 idle heartbeat");
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct TestCredential {
    id: u64,
    name: String,
    url: String,
    username: String,
    password: String,
}

fn start_http_server() {
    tokio::spawn(async move {
        let addr = ([0, 0, 0, 0], 8080).into();
        let make_svc = make_service_fn(|_conn| async {
            Ok::<_, Infallible>(service_fn(http_handler))
        });
        info!("🌐 HTTP server listening on 0.0.0.0:8080");
        if let Err(e) = Server::bind(&addr).serve(make_svc).await {
            error!("HTTP server error: {}", e);
        }
    });
}

async fn http_handler(req: Request<Body>) -> Result<Response<Body>, Infallible> {
    // Basic CORS: allow all origins for dev usage
    let add_cors = |mut builder: hyper::http::response::Builder| {
        builder = builder
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
            .header("Access-Control-Allow-Headers", "Content-Type");
        builder
    };

    match (req.method(), req.uri().path()) {
        // CORS preflight for any path
        (&Method::OPTIONS, _) => {
            let builder = Response::builder().status(StatusCode::NO_CONTENT);
            let builder = add_cors(builder).header("Content-Length", "0");
            Ok(builder.body(Body::empty()).unwrap())
        }
        // Health endpoint
        (&Method::GET, "/health") => {
            let body = Body::from("{\"status\":\"healthy\"}");
            let builder = Response::builder()
                .status(StatusCode::OK)
                .header("Content-Type", "application/json");
            Ok(add_cors(builder).body(body).unwrap())
        }
        // Test ingestion endpoint: accepts a credential, checks password against HIBP, returns result
        (&Method::POST, "/ingest-test") => {
            match hyper::body::to_bytes(req.into_body()).await {
                Ok(bytes) => {
                    let parsed: Result<TestCredential, _> = serde_json::from_slice(&bytes);
                    match parsed {
                        Ok(tc) => {
                            info!(
                                "🧪 Received test credential: id={} name={} url={} username={}",
                                tc.id, tc.name, tc.url, tc.username
                            );

                            // Check password against HIBP Pwned Passwords (k-anonymity range API)
                            let hibp_result = match check_password_with_hibp(&tc.password).await {
                                Ok(res) => res,
                                Err(e) => {
                                    error!("HIBP check failed: {}", e);
                                    serde_json::json!({
                                        "error": format!("hibp_check_failed: {}", e)
                                    })
                                }
                            };

                            if let (Some(pwned), Some(count)) = (
                                hibp_result.get("pwned").and_then(|v| v.as_bool()),
                                hibp_result.get("count").and_then(|v| v.as_u64()),
                            ) {
                                info!("🔎 HIBP result: pwned={} count={}", pwned, count);
                            } else {
                                info!("🔎 HIBP result payload: {}", hibp_result);
                            }

                            // Build response without echoing password
                            let response_body = serde_json::json!({
                                "ok": true,
                                "credential": {
                                    "id": tc.id,
                                    "name": tc.name,
                                    "url": tc.url,
                                    "username": tc.username
                                },
                                "hibp": hibp_result
                            });
                            let builder = Response::builder()
                                .status(StatusCode::OK)
                                .header("Content-Type", "application/json");
                            Ok(add_cors(builder).body(Body::from(response_body.to_string())).unwrap())
                        }
                        Err(e) => {
                            let builder = Response::builder()
                                .status(StatusCode::BAD_REQUEST)
                                .header("Content-Type", "application/json");
                            Ok(add_cors(builder)
                                .body(Body::from(format!("{{\"error\":\"invalid json: {}\"}}", e)))
                                .unwrap())
                        }
                    }
                }
                Err(e) => {
                    let builder = Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                        .header("Content-Type", "application/json");
                    Ok(add_cors(builder)
                    .body(Body::from(format!("{{\"error\":\"read body failed: {}\"}}", e)))
                        .unwrap())
                }
            }
        }
        // Batch ingestion endpoint: accepts an array of credentials
        (&Method::POST, "/ingest-batch") => {
            match hyper::body::to_bytes(req.into_body()).await {
                Ok(bytes) => {
                    let parsed: Result<Vec<TestCredential>, _> = serde_json::from_slice(&bytes);
                    match parsed {
                        Ok(list) => {
                            info!("🧪 Received batch: {} credentials", list.len());
                            if let Ok(batch_json) = serde_json::to_string(&list) {
                                info!("📦 Batch payload (full): {}", batch_json);
                            }

                            let mut results: Vec<serde_json::Value> = Vec::with_capacity(list.len());
                            for tc in list.into_iter() {
                                let hibp = match check_password_with_hibp(&tc.password).await {
                                    Ok(v) => v,
                                    Err(e) => serde_json::json!({"error": e.to_string()}),
                                };

                                if let (Some(pwned), Some(count)) = (
                                    hibp.get("pwned").and_then(|v| v.as_bool()),
                                    hibp.get("count").and_then(|v| v.as_u64()),
                                ) {
                            info!(
                                        "🔎 Batch item: id={} name={} username={} pwned={} count={}",
                                        tc.id, tc.name, tc.username, pwned, count
                                    );
                                } else {
                                    info!("🔎 Batch item raw hibp: {}", hibp);
                                }

                                results.push(serde_json::json!({
                                    "credential": {
                                        "id": tc.id,
                                        "name": tc.name,
                                        "url": tc.url,
                                        "username": tc.username
                                    },
                                    "hibp": hibp
                                }));
                            }

                            if let Ok(resp_json) = serde_json::to_string(&results) {
                                info!("🧾 Batch response: {}", resp_json);
                            }
                            let builder = Response::builder()
                                .status(StatusCode::OK)
                                .header("Content-Type", "application/json");
                            Ok(add_cors(builder).body(Body::from(serde_json::to_string(&results).unwrap())).unwrap())
                        }
                        Err(e) => {
                            let builder = Response::builder()
                                .status(StatusCode::BAD_REQUEST)
                                .header("Content-Type", "application/json");
                            Ok(add_cors(builder).body(Body::from(format!("{{\"error\":\"invalid json: {}\"}}", e))).unwrap())
                        }
                    }
                }
                Err(e) => {
                    let builder = Response::builder()
                        .status(StatusCode::BAD_REQUEST)
                        .header("Content-Type", "application/json");
                    Ok(add_cors(builder).body(Body::from(format!("{{\"error\":\"read body failed: {}\"}}", e))).unwrap())
                }
            }
        }
        // Batch + AI summary endpoint
        (&Method::POST, "/ingest-batch-summarize") => {
            match hyper::body::to_bytes(req.into_body()).await {
                Ok(bytes) => {
                    let parsed: Result<Vec<TestCredential>, _> = serde_json::from_slice(&bytes);
                    match parsed {
                        Ok(list) => {
                            info!("🧪 Received batch (summarize): {} credentials", list.len());

                            let mut results: Vec<serde_json::Value> = Vec::with_capacity(list.len());
                            for tc in list.into_iter() {
                                let hibp = match check_password_with_hibp(&tc.password).await {
                                    Ok(v) => v,
                                    Err(e) => serde_json::json!({"error": e.to_string()}),
                                };
                                results.push(serde_json::json!({
                                    "credential": {
                                        "id": tc.id,
                                        "name": tc.name,
                                        "url": tc.url,
                                        "username": tc.username
                                    },
                                    "hibp": hibp
                                }));
                            }

                            let total_checked = results.len();
                            let total_pwned = results.iter().filter(|r| r
                                .get("hibp")
                                .and_then(|h| h.get("pwned"))
                                .and_then(|v| v.as_bool())
                                == Some(true)
                            ).count();
                            let results_json = serde_json::to_string(&results).unwrap_or("[]".to_string());
                            let (ai_markdown, ai_structured): (String, Option<serde_json::Value>) = match summarize_with_redpill(&results_json).await {
                                Ok(markdown) => (markdown, None::<serde_json::Value>),
                                Err(e) => {
                                    error!("Red Pill summarize failed: {}", e);
                                    (format!("AI summarize failed: {}", e), None::<serde_json::Value>)
                                }
                            };

                            // Log AI output and counts for observability
                            info!("📊 Summary counts: checked={} pwned={}", total_checked, total_pwned);
                            info!("📝 AI summary markdown:\n{}", ai_markdown);

                            let response = serde_json::json!({
                                "ok": true,
                                "results": results,
                                "ai": { "summary": ai_markdown, "structured": ai_structured, "stats": {"total_checked": total_checked, "total_pwned": total_pwned} }
                            });
                            let builder = Response::builder()
                                .status(StatusCode::OK)
                                .header("Content-Type", "application/json");
                            Ok(add_cors(builder).body(Body::from(response.to_string())).unwrap())
                        }
                        Err(e) => {
                            let builder = Response::builder()
                                .status(StatusCode::BAD_REQUEST)
                                .header("Content-Type", "application/json");
                            Ok(add_cors(builder).body(Body::from(format!("{{\"error\":\"invalid json: {}\"}}", e))).unwrap())
                        }
                    }
                }
                Err(e) => {
                    let builder = Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                        .header("Content-Type", "application/json");
                    Ok(add_cors(builder).body(Body::from(format!("{{\"error\":\"read body failed: {}\"}}", e))).unwrap())
                }
            }
        }
        _ => {
            let builder = Response::builder().status(StatusCode::NOT_FOUND);
            Ok(add_cors(builder).body(Body::from("Not Found")).unwrap())
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct HibpPasswordResult {
    pwned: bool,
    count: u64,
    hash_prefix: String,
    hash_suffix: String,
}

async fn check_password_with_hibp(password: &str) -> Result<serde_json::Value> {
    // Compute SHA1 hash in uppercase hex
    let mut hasher = Sha1::new();
    hasher.update(password.as_bytes());
    let hash_bytes = hasher.finalize();
    let hash_hex = hash_bytes.iter().map(|b| format!("{:02X}", b)).collect::<String>();

    let (prefix, suffix) = hash_hex.split_at(5);

    // Range API per HIBP: https://haveibeenpwned.com/API/v3#SearchingPwnedPasswordsByRange
    let url = format!("https://api.pwnedpasswords.com/range/{}", prefix);
    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header(reqwest::header::USER_AGENT, "GrandWarden-ROFL/1.0 (+grandwarden)")
        .send()
        .await?;

    if !resp.status().is_success() {
        return Ok(serde_json::json!({
            "pwned": false,
            "count": 0,
            "hash_prefix": prefix,
            "hash_suffix": suffix,
            "note": format!("hibp_http_status:{}", resp.status())
        }));
    }

    let body = resp.text().await?;
    let mut count: u64 = 0;
    let target_suffix = suffix.to_uppercase();
    for line in body.lines() {
        // Each line: "SUFFIX:COUNT"
        if let Some((suf, cnt)) = line.split_once(':') {
            if suf.trim().eq_ignore_ascii_case(&target_suffix) {
                if let Ok(n) = cnt.trim().parse::<u64>() {
                    count = n;
                }
                break;
            }
        }
    }

    let result = HibpPasswordResult {
        pwned: count > 0,
        count,
        hash_prefix: prefix.to_string(),
        hash_suffix: suffix.to_string(),
    };
    Ok(serde_json::to_value(result)?)
}

/// Call Phala Red Pill (OpenAI-compatible) to summarize the batch results.
async fn summarize_with_redpill(results_json: &str) -> Result<String> {
    let api_key = env::var("PHALA_API_KEY")
        .map_err(|_| eyre::eyre!("PHALA_API_KEY not set"))?;
    let base = env::var("REDPILL_API_BASE").unwrap_or_else(|_| "https://api.red-pill.ai".to_string());
    let model = env::var("REDPILL_MODEL").unwrap_or_else(|_| "gpt-4o".to_string());
    let candidates = vec![
        env::var("REDPILL_API_PATH").unwrap_or_else(|_| "/v1/chat/completions".to_string()),
        "/chat/completions".to_string(),
        "/v1/completions".to_string(),
    ];

    // Prompt engineering: structured, readable Markdown with character; safe, no secrets.
    let system_prompt = r#"
You are a friendly cybersecurity assistant. Produce a clear, human-readable report in GitHub-Flavored Markdown.

Formatting rules:
- Use a short title and tasteful emojis (no more than 3 total).
- Add clear sections with H3 headings: "Stats", "Affected Accounts", "Recommendations", and "Next Steps".
- In Stats: use exactly these labels — `Total Accounts Checked:` and `Total Accounts Pwned:` — followed by the numbers.
- In Affected Accounts: use a table with columns: Site, Username, Pwn Count. Only list items where pwned=true.
- In Recommendations: 3-5 concise bullet points; mention unique passwords, password manager, 2FA, and monitoring.
- In Next Steps: one short paragraph.
- Do NOT include any plaintext passwords or hash suffixes.
- Keep it under 2000 characters.
"#;
    let user_prompt = format!(
        "Summarize this JSON array with items: credential {{id,name,url,username}} and hibp {{pwned,count,hash_prefix,hash_suffix}}.\nReturn only Markdown as per the rules.\n\nJSON:\n{}",
        results_json
    );

    let body = serde_json::json!({
        "model": model,
        "temperature": 0.2,
        "stream": false,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]
    });

    let client = reqwest::Client::new();
    let mut last_err: Option<String> = None;
    for path in candidates {
        let url = format!("{}{}", base.trim_end_matches('/'), path);
        info!("Calling Red Pill endpoint: {}", url);
        let req = client
            .post(&url)
            .bearer_auth(&api_key)
            .header("X-API-Key", &api_key)
            .header(reqwest::header::ACCEPT, "application/json")
            .header(reqwest::header::CONTENT_TYPE, "application/json")
            .header(reqwest::header::USER_AGENT, "GrandWarden-ROFL/1.0 (+grandwarden)")
            .json(&body);
        let resp = match req.send().await {
            Ok(r) => r,
            Err(e) => { last_err = Some(format!("request_error:{}", e)); continue; }
        };
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        if status.is_success() {
            let v: serde_json::Value = serde_json::from_str(&text).unwrap_or(serde_json::json!({"raw": text}));
            if let Some(content) = v
                .get("choices")
                .and_then(|c| c.as_array())
                .and_then(|arr| arr.get(0))
                .and_then(|c0| c0.get("message"))
                .and_then(|m| m.get("content"))
                .and_then(|c| c.as_str())
            {
                return Ok(content.to_string());
            } else {
                return Ok(v.to_string());
            }
        } else {
            last_err = Some(format!("{} {}", status, text.chars().take(200).collect::<String>()));
            continue;
        }
    }
    Err(eyre::eyre!(format!("redpill_call_failed: {}", last_err.unwrap_or_else(|| "unknown".to_string()))))
}

// Integration guide for when Sui contracts are ready:
// 
// 1. Deploy Sui contracts and get package ID
// 2. Update SUI_CONTRACT_PACKAGE environment variable
// 3. Implement real Sui event querying in monitor_sui_events()
// 4. Add Sui SDK dependency to Cargo.toml
// 5. Test end-to-end flow: Sui event → ROFL bridge → Sapphire → The Graph
// 
// Current status:
// ✅ Sapphire integration: Working (proven with real transactions)
// ✅ Event translation: Implemented (100% accuracy)
// ✅ ROFL architecture: Follows official patterns
// 🚧 Sui integration: Mock events (ready for real contracts)