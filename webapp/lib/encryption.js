import {
  WalrusClient,
  WalrusFile,
  TESTNET_WALRUS_PACKAGE_CONFIG,
} from "@mysten/walrus";
import { Transaction } from "@mysten/sui/transactions";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const DEFAULT_WALRUS_WASM_URL =
  "https://unpkg.com/@mysten/walrus-wasm@latest/web/walrus_wasm_bg.wasm";

export async function getWalrusWasmUrl() {
  return process.env.NEXT_PUBLIC_WALRUS_WASM_URL || DEFAULT_WALRUS_WASM_URL;
}

export async function ensureWalBalance(
  userAddress,
  suiClient,
  signAndExecuteTransaction,
  amountMist
) {
  const EXCHANGE_ID = TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[3];
  if (!EXCHANGE_ID) throw new Error("No exchange id in testnet config");
  const obj = await suiClient.getObject({
    id: EXCHANGE_ID,
    options: { showType: true },
  });
  const objType = obj?.data?.type;
  if (!objType) throw new Error("Exchange object missing type");
  const pkgId = objType.split("::")[0];

  const tx = new Transaction();
  tx.setSenderIfNotSet(userAddress);
  const [suiForExchange] = tx.splitCoins(tx.gas, [amountMist]);
  const [walCoin] = tx.moveCall({
    package: pkgId,
    module: "wal_exchange",
    function: "exchange_for_wal",
    arguments: [
      tx.object(EXCHANGE_ID),
      suiForExchange,
      tx.pure.u64(amountMist),
    ],
  });
  tx.mergeCoins(tx.gas, [suiForExchange]);
  tx.transferObjects([walCoin], tx.pure.address(userAddress));
  const res = await signAndExecuteTransaction({ transaction: tx });
  return res.digest;
}

export async function storeEncryptedViaRelay(
  encrypted,
  ownerAddress,
  suiClient,
  signAndExecuteTransaction,
  opts = {}
) {
  const relayHost =
    opts.relayHost ?? "https://upload-relay.testnet.walrus.space";
  const tipMax = opts.tipMax ?? 10_000;
  const epochs = opts.epochs ?? 1;
  const deletable = opts.deletable ?? true;

  const wasmUrl = await getWalrusWasmUrl();

  // Ensure we pass a SuiClient recognized as testnet/mainnet by Walrus
  const clientForWalrus = (() => {
    try {
      const n = suiClient?.options?.network;
      if (n === "testnet") return suiClient;
    } catch {}
    const url =
      process.env.NEXT_PUBLIC_SUI_RPC_URL || getFullnodeUrl("testnet");
    return new SuiClient({
      url,
      network: url.includes("testnet") ? "testnet" : "mainnet",
    });
  })();

  const relayClient = clientForWalrus.$extend(
    WalrusClient.experimental_asClientExtension({
      wasmUrl: wasmUrl,
      uploadRelay: { host: relayHost, sendTip: { max: tipMax } },
    })
  );

  const flow = relayClient.walrus.writeFilesFlow({
    files: [
      WalrusFile.from({
        contents: new Uint8Array(encrypted),
        identifier: "credential.json",
      }),
    ],
  });
  await flow.encode();

  const registerTx = flow.register({ epochs, owner: ownerAddress, deletable });
  const reg = await signAndExecuteTransaction({ transaction: registerTx });

  await flow.upload({ digest: reg.digest });

  const certifyTx = flow.certify();
  const cert = await signAndExecuteTransaction({ transaction: certifyTx });

  const files = await flow.listFiles();
  const blobId = files[0]?.blobId ?? null;
  return { registerDigest: reg.digest, certifyDigest: cert.digest, blobId };
}
