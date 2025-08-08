import express, { Request, Response } from "express";
import cors from "cors";
import { CredentialService } from "./credential-service";

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize credential service
const credentialService = new CredentialService();

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Grand Warden Backend API is running" });
});

// Store credentials (simplified - no zkLogin complexity)
app.post("/api/store-credentials", async (req: Request, res: Response) => {
  try {
    console.log("🔐 Received credential storage request");

    const { credentials, userAddress } = req.body;

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

    // Store credentials
    console.log("🔐 Starting credential storage process...");
    const result = await credentialService.storeCredentials(
      credentials,
      userAddress
    );

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

// Build WAL exchange transaction for Enoki signing
app.post(
  "/api/walrus/exchange/prepare",
  async (req: Request, res: Response) => {
    try {
      const { userAddress, amountMist } = req.body;

      if (!userAddress) {
        return res.status(400).json({
          error: "Missing userAddress",
        });
      }

      console.log(
        "🪙 [prepare] Building WAL exchange transaction for:",
        userAddress
      );

      const { txBytes } = await credentialService.buildWalExchangeTransaction(
        userAddress,
        amountMist ? BigInt(amountMist) : 1_000_000n
      );

      console.log(
        "✅ [prepare] WAL exchange transaction prepared successfully"
      );
      res.json({ success: true, data: { txBytes } });
    } catch (error) {
      console.error("❌ [prepare] Error preparing WAL exchange:", error);
      res.status(500).json({
        error: "Failed to prepare WAL exchange",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Submit signed WAL exchange transaction
app.post("/api/walrus/exchange/submit", async (req: Request, res: Response) => {
  try {
    const { txBytes, signature } = req.body;

    if (!txBytes || !signature) {
      return res.status(400).json({
        error: "Missing txBytes or signature",
      });
    }

    console.log("📤 [submit] Submitting signed WAL exchange transaction...");

    const result = await credentialService.submitSignedTransaction(
      txBytes,
      signature
    );

    console.log("✅ [submit] WAL exchange completed successfully");
    res.json({ success: true, data: { digest: result.digest } });
  } catch (error) {
    console.error("❌ [submit] Error submitting WAL exchange:", error);
    res.status(500).json({
      error: "Failed to submit WAL exchange",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Check WAL token balance
app.get(
  "/api/walrus/balance/:userAddress",
  async (req: Request, res: Response) => {
    try {
      const { userAddress } = req.params;

      if (!userAddress) {
        return res.status(400).json({
          error: "Missing userAddress",
        });
      }

      console.log("🪙 [balance] Checking WAL tokens for:", userAddress);

      const { hasTokens, balance } = await credentialService.checkWalTokens(
        userAddress
      );

      res.json({
        success: true,
        data: {
          hasTokens,
          balance: balance.toString(),
        },
      });
    } catch (error) {
      console.error("❌ [balance] Error checking WAL balance:", error);
      res.status(500).json({
        error: "Failed to check WAL balance",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get service status
app.get("/api/status", (req: Request, res: Response) => {
  const status = credentialService.getStatus();
  res.json({
    status: "ok",
    ...status,
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Grand Warden Backend API running on port ${port}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📝 API docs: http://localhost:${port}/api/status`);
});
