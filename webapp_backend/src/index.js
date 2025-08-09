import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import { fetch } from "undici";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { WalrusClient } from "@mysten/walrus";
// In node, supply wasm url from CDN to avoid bundling issues
const WALRUS_WASM_URL =
  process.env.WALRUS_WASM_URL ||
  "https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const PORT = process.env.PORT || 3001;
const PUBLISHER = process.env.WALRUS_PUBLISHER;
const AGGREGATOR = process.env.WALRUS_AGGREGATOR;
// Note: Encryption is performed client-side with Seal.

// Encrypt credentials JSON using Seal and upload to Walrus
app.post("/api/credentials", async (req, res) => {
  try {
    const { address, epochs = 1, encryptedBase64 } = req.body ?? {};
    if (!address || !encryptedBase64)
      return res
        .status(400)
        .json({ error: "address and encryptedBase64 required" });
    if (!Number.isInteger(epochs) || epochs < 1)
      return res.status(400).json({ error: "epochs must be >= 1" });

    const encryptedBytes = Buffer.from(encryptedBase64, "base64");
    if (!encryptedBytes.length)
      return res.status(400).json({ error: "empty payload" });
    const sha256 = crypto
      .createHash("sha256")
      .update(encryptedBytes)
      .digest("hex");

    const url = `${PUBLISHER}/v1/blobs?epochs=${epochs}&send_object_to=${address}`;
    const upstream = await fetch(url, {
      method: "PUT",
      headers: { "content-type": "application/octet-stream" },
      body: encryptedBytes,
    });
    const bodyText = await upstream.text();
    let info;
    try {
      info = JSON.parse(bodyText);
    } catch {
      info = { raw: bodyText };
    }

    // Log upstream status for debugging
    console.log("[walrus PUT]", upstream.status, info);

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ error: "publisher_error", details: info });
    }

    const blobId =
      info?.newlyCreated?.blobObject?.blobId ||
      info?.alreadyCertified?.blobId ||
      null;

    return res
      .status(200)
      .json({ blobId, walrus: info, integrity: { sha256 } });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    res.status(500).json({ error: e?.message || "failed to encrypt/upload" });
  }
});

app.get("/api/blobs/:id", async (req, res) => {
  const r = await fetch(
    `${AGGREGATOR}/v1/blobs/${encodeURIComponent(req.params.id)}`
  );
  res.status(r.status);
  r.headers.forEach((v, k) => res.setHeader(k, v));
  r.body?.pipe(res);
});

// Read quilt file bytes via Walrus SDK (avoids browser TLS/node issues)
app.get("/api/quilt/:blobId/credential", async (req, res) => {
  const blobId = req.params.blobId;
  const identifier = req.query.ident || "credential.json";
  const attempts = Number(req.query.attempts || 3);
  const delayMs = Number(req.query.delayMs || 1500);
  try {
    const suiClient = new SuiClient({
      url: process.env.SUI_RPC_URL || getFullnodeUrl("testnet"),
      network: "testnet",
    });
    const walrus = new WalrusClient({
      network: "testnet",
      suiClient,
      wasmUrl: WALRUS_WASM_URL,
      storageNodeClientOptions: {
        onError: (err) =>
          console.warn("[walrus read error]", String(err?.message || err)),
        timeout: 60_000,
      },
    });
    let lastErr;
    for (let i = 0; i < attempts; i++) {
      try {
        const blob = await walrus.getBlob({ blobId });
        let files = await blob.files({ identifiers: [String(identifier)] });
        if (!files.length) files = await blob.files();
        const file = files[0];
        const bytes = await file.bytes();
        res.setHeader("content-type", "application/octet-stream");
        return res.status(200).send(Buffer.from(bytes));
      } catch (e) {
        lastErr = e;
        const msg = String(e?.message || e);
        console.warn("[quilt read attempt]", i + 1, "of", attempts, msg);
        if (/not certified/i.test(msg) && i < attempts - 1) {
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        break;
      }
    }
    const message = String(lastErr?.message || lastErr || "read_failed");
    if (/not certified/i.test(message)) {
      return res.status(425).json({ error: "blob_not_certified", message });
    }
    return res.status(500).json({ error: "read_failed", message });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e?.message || "read_failed" });
  }
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on :${PORT}`);
});
