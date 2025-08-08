# Grand Warden ROFL Critical Data Bridge Dockerfile
# Multi-stage build for optimized container size

# Build stage
FROM rust:1.85-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy dependency files
COPY Cargo.simple.toml ./Cargo.toml

# Create dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (creates Cargo.lock)
RUN cargo build --release && rm -rf src

# Copy actual source code
COPY src/main.rs ./src/main.rs

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -r rofl && useradd -r -g rofl -u 1000 rofl

# Set working directory
WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/target/release/grand-warden-rofl .

# Create directories and set permissions
RUN mkdir -p /app/logs /app/data && \
    chown -R rofl:rofl /app

# Switch to non-root user
USER rofl

# Expose health check port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set entrypoint
ENTRYPOINT ["./grand-warden-rofl"]