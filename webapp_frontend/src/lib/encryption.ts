import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { SealClient, getAllowlistedKeyServers } from "@mysten/seal";
import { Transaction } from "@mysten/sui/transactions";
import {
  TESTNET_WALRUS_PACKAGE_CONFIG,
  WalrusClient,
  WalrusFile,
} from "@mysten/walrus";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import walrusWasmUrl from "@mysten/walrus-wasm/web/walrus_wasm_bg.wasm?url";

const SEAL_PACKAGE_ID = (import.meta as any).env
  ?.VITE_SEAL_PACKAGE_ID as string;
const SEAL_POLICY_ID = (import.meta as any).env?.VITE_SEAL_POLICY_ID as string;

export function getSuiClient(): SuiClient {
  return new SuiClient({
    url:
      (import.meta as any).env?.VITE_SUI_RPC_URL || getFullnodeUrl("testnet"),
    network: "testnet",
  });
}

export async function encryptWithSeal(
  payload: Uint8Array,
  suiClient?: SuiClient
): Promise<Uint8Array> {
  const client = suiClient ?? getSuiClient();
  const seal = new SealClient({
    suiClient: client,
    serverConfigs: getAllowlistedKeyServers("testnet").map((id) => ({
      objectId: id,
      weight: 1,
    })),
  });
  const { encryptedObject } = await seal.encrypt({
    threshold: 2,
    packageId: SEAL_PACKAGE_ID || "0x0",
    id: SEAL_POLICY_ID || "0x0",
    data: payload,
  });
  return encryptedObject;
}

export async function ensureWalBalance(
  userAddress: string,
  suiClient: SuiClient,
  signAndExecuteTransaction: (args: {
    transaction: Transaction;
  }) => Promise<{ digest: string }>,
  amountMist: bigint
): Promise<string> {
  const EXCHANGE_ID = TESTNET_WALRUS_PACKAGE_CONFIG.exchangeIds[3];
  if (!EXCHANGE_ID) throw new Error("No exchange id in testnet config");
  const obj = await suiClient.getObject({
    id: EXCHANGE_ID,
    options: { showType: true },
  });
  const objType = (obj as any)?.data?.type as string | undefined;
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
  }) as any;
  tx.mergeCoins(tx.gas, [suiForExchange]);
  tx.transferObjects([walCoin], tx.pure.address(userAddress));
  const res = await signAndExecuteTransaction({ transaction: tx });
  return res.digest;
}

export async function storeEncryptedViaRelay(
  encrypted: Uint8Array,
  ownerAddress: string,
  suiClient: SuiClient,
  signAndExecuteTransaction: (args: {
    transaction: Transaction;
  }) => Promise<{ digest: string }>,
  opts?: {
    epochs?: number;
    deletable?: boolean;
    relayHost?: string;
    tipMax?: number;
  }
): Promise<{
  registerDigest: string;
  certifyDigest: string;
  blobId: string | null;
}> {
  const relayHost =
    opts?.relayHost ?? "https://upload-relay.testnet.walrus.space";
  const tipMax = opts?.tipMax ?? 10_000;
  const epochs = opts?.epochs ?? 1;
  const deletable = opts?.deletable ?? true;

  const relayClient = (suiClient as any).$extend(
    WalrusClient.experimental_asClientExtension({
      wasmUrl: walrusWasmUrl,
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
