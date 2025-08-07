# Grand Warden ROFL Bridge - Official ROFL Container
FROM rust:1.82-slim as builder

# Install system dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy simplified dependency file for testing
COPY Cargo.simple.toml ./Cargo.toml

# Create a dummy main.rs to build dependencies
RUN mkdir src && echo "fn main() {}" > src/main.rs

# Build dependencies (this will create Cargo.lock)
RUN cargo build --release && rm -rf src

# Copy simplified source code for testing
COPY src/main.simple.rs ./src/main.rs

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r rofl && useradd -r -g rofl -u 1000 rofl

# Set working directory
WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/grand-warden-rofl ./grand-warden-rofl

# Create necessary directories
RUN mkdir -p /app/logs /app/data && \
    chown -R rofl:rofl /app

# Switch to non-root user
USER rofl

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Expose ports
EXPOSE 8080 9090

# Set environment variables
ENV RUST_LOG=info
ENV RUST_BACKTRACE=1

# Run the application
CMD ["./grand-warden-rofl"]