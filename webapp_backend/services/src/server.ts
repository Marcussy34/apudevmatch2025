import express, { Request, Response } from "express";
import cors from "cors";
import { CredentialService } from "./credential-service";
import { Transaction } from "@mysten/sui/transactions";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize credential service
const credentialService = new CredentialService();
let requestCounter = 0;
const recentRequests = new Map<string, number>(); // Track recent requests by user address

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Grand Warden Backend API is running" });
});

// Store credentials with zkLogin integration
app.post("/api/store-credentials", async (req: Request, res: Response) => {
  try {
    console.log("🔐 Received credential storage request");

    const { credentials, zkLoginParams } = req.body;

    if (!credentials) {
      return res.status(400).json({
        error: "Missing credentials data",
      });
    }

    // Validate credentials
    if (!credentials.site || !credentials.username || !credentials.password) {
      return res.status(400).json({
        error: "Missing required credential fields (site, username, password)",
      });
    }

    // Set zkLogin parameters if provided
    if (zkLoginParams) {
      console.log("🔑 Setting zkLogin parameters...");
      console.log("💰 zkLogin Address:", zkLoginParams.userProfile.suiAddress);
      console.log("👤 User:", zkLoginParams.userProfile.name);

      try {
        credentialService.setZkLoginParams(zkLoginParams);
      } catch (error) {
        console.error("❌ Failed to set zkLogin parameters:", error);
        return res.status(400).json({
          error: "Invalid zkLogin parameters",
        });
      }
    } else {
      console.log("⚠️ No zkLogin parameters provided - using simulation mode");
    }

    // Store credentials
    console.log("🔐 Starting credential storage process...");
    const result = await credentialService.storeCredentials(credentials);

    console.log("✅ Credential storage completed successfully");
    res.json({
      success: true,
      data: result,
      message: "Credentials stored successfully",
    });
  } catch (error) {
    console.error("❌ Error storing credentials:", error);
    res.status(500).json({
      error: "Failed to store credentials",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Get service status
app.get("/api/status", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    walletAddress: credentialService.getWalletAddress(),
    hasZkLoginParams: credentialService["zkLoginParams"] !== undefined,
  });
});

// Register zkLogin parameters (without storing credentials)
app.post("/api/register-zklogin", async (req: Request, res: Response) => {
  try {
    requestCounter++;
    console.log("🔑 Registering zkLogin parameters...");
    console.log("🔑 Request #:", requestCounter);
    console.log("🔑 Request timestamp:", new Date().toISOString());
    console.log("🔑 Request ID:", Math.random().toString(36).substr(2, 9));

    const { zkLoginParams } = req.body;

    if (!zkLoginParams) {
      return res.status(400).json({
        error: "Missing zkLogin parameters",
      });
    }

    // Rate limiting: Check if this user has made a request recently
    const userAddress = zkLoginParams.userProfile.suiAddress;
    const now = Date.now();
    const lastRequest = recentRequests.get(userAddress);

    if (lastRequest && now - lastRequest < 5000) {
      // 5 second cooldown
      console.log(
        "⚠️ Rate limited: User",
        userAddress,
        "requested too recently"
      );
      return res.status(429).json({
        error: "Too many requests. Please wait a moment.",
        message: "Rate limited - please wait 5 seconds between requests",
      });
    }

    // Update last request time
    recentRequests.set(userAddress, now);

    // Set zkLogin parameters
    await credentialService.setZkLoginParams(zkLoginParams);

    console.log("✅ zkLogin parameters registered successfully");
    console.log("💰 Address:", zkLoginParams.userProfile.suiAddress);
    console.log("👤 User:", zkLoginParams.userProfile.name);

    res.json({
      success: true,
      message: "zkLogin parameters registered successfully",
      data: {
        walletAddress: credentialService.getWalletAddress(),
        hasZkLoginParams: true,
      },
    });
  } catch (error) {
    console.error("❌ Failed to register zkLogin parameters:", error);
    res.status(500).json({
      error: "Failed to register zkLogin parameters",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Grand Warden Backend API running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📝 API docs: http://localhost:${port}/api/status`);
});

// Prepare WAL exchange transaction (returns tx bytes)
app.post(
  "/api/walrus/exchange/prepare",
  async (req: Request, res: Response) => {
    try {
      const { senderAddress, amountMist } = req.body;

      console.log(
        "🪙 [prepare] Starting WAL exchange preparation for:",
        senderAddress
      );

      // Step 1: Fund the zkLogin address first
      console.log("💰 [prepare] Funding zkLogin address...");
      await credentialService.fundZkLoginAddress(senderAddress);

      // Step 2: Build the exchange transaction
      console.log("🔨 [prepare] Building exchange transaction...");
      const { txBytes } = await credentialService.buildWalExchangeTransaction({
        senderAddress,
        amountMist,
      });

      console.log(
        "✅ [prepare] WAL exchange transaction prepared successfully"
      );
      res.json({ success: true, txBytes });
    } catch (error) {
      console.error("❌ [prepare] Error preparing WAL exchange:", error);
      res.status(500).json({
        error: "Failed to prepare WAL exchange",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Submit zkLogin-signed transaction
app.post("/api/walrus/exchange/submit", async (req: Request, res: Response) => {
  try {
    const { txBytes, zkLoginSignature } = req.body;
    if (!txBytes || !zkLoginSignature) {
      return res
        .status(400)
        .json({ error: "Missing txBytes or zkLoginSignature" });
    }
    const result = await credentialService.submitZkLoginSignedTransaction({
      txBytes,
      zkLoginSignature,
    });
    res.json({ success: true, digest: result.digest });
  } catch (error) {
    res.status(500).json({
      error: "Failed to submit zkLogin transaction",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Build on-chain logging transaction for zkLogin signing
app.post("/api/logging/prepare", async (req: Request, res: Response) => {
  try {
    const { blobId, cid, userAddress } = req.body;

    if (!blobId || !cid || !userAddress) {
      return res.status(400).json({
        error: "Missing required fields: blobId, cid, userAddress",
      });
    }

    console.log(
      "⛓️ [logging/prepare] Building on-chain logging transaction..."
    );
    console.log("⛓️ [logging/prepare] Blob ID:", blobId);
    console.log("⛓️ [logging/prepare] User Address:", userAddress);

    // Build the transaction
    const logTx = new Transaction();
    logTx.setSenderIfNotSet(userAddress);

    // Convert strings to bytes for the Move function
    const blobIdBytes = new TextEncoder().encode(blobId);
    const cidBytes = new TextEncoder().encode(cid);
    const userAddressBytes = new TextEncoder().encode(userAddress);

    logTx.moveCall({
      target: `${credentialService["packageId"]}::store_logger::log_credential_store`,
      arguments: [
        logTx.object(credentialService["logCapId"]), // Use existing LogCap
        logTx.pure(userAddressBytes), // user_address
        logTx.pure(blobIdBytes), // walrus_blob_id
        logTx.pure(cidBytes), // walrus_cid
      ],
    });

    logTx.setGasBudget(5_000_000);

    // Build transaction bytes
    const txBytes = await logTx.build({
      client: credentialService["suiClient"],
    });
    const txBytesBase64 = Buffer.from(txBytes).toString("base64");

    console.log("✅ [logging/prepare] Transaction built successfully");
    console.log(
      "📊 [logging/prepare] Transaction bytes length:",
      txBytesBase64.length
    );

    res.json({ success: true, txBytes: txBytesBase64 });
  } catch (error) {
    console.error("❌ [logging/prepare] Error building transaction:", error);
    res.status(500).json({
      error: "Failed to build logging transaction",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Submit zkLogin-signed logging transaction
app.post("/api/logging/submit", async (req: Request, res: Response) => {
  try {
    const { txBytes, zkLoginSignature } = req.body;

    if (!txBytes || !zkLoginSignature) {
      return res.status(400).json({
        error: "Missing txBytes or zkLoginSignature",
      });
    }

    console.log(
      "⛓️ [logging/submit] Submitting zkLogin-signed logging transaction..."
    );

    const result = await credentialService.submitZkLoginSignedTransaction({
      txBytes,
      zkLoginSignature,
    });

    console.log(
      "✅ [logging/submit] Logging transaction submitted successfully"
    );
    console.log("📊 [logging/submit] Transaction digest:", result.digest);

    res.json({ success: true, digest: result.digest });
  } catch (error) {
    console.error("❌ [logging/submit] Error submitting transaction:", error);
    res.status(500).json({
      error: "Failed to submit logging transaction",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
