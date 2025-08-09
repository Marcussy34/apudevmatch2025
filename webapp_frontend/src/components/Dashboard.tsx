import React, { useState } from "react";
// SuiClient is not used directly here after refactor; keep getFullnodeUrl via helper module
// import removed to satisfy linter
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
} from "@mysten/dapp-kit";
import { useNavigate } from "react-router-dom";
// SealClient direct usage was replaced by helper; import removed to satisfy linter
import {
  ensureWalBalance,
  getSuiClient,
  storeEncryptedViaRelay,
} from "../lib/encryption";
import {
  getAllUserCredentialsViaProxy,
  getCredentialByBlobIdViaProxy,
} from "../lib/decryption";
import { addBlobRef, getBlobRefs } from "../lib/blobIds";
import {
  Search,
  Plus,
  Key,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  Copy,
  Globe,
  Github,
  Mail,
  ShoppingCart,
  Briefcase,
  AlertTriangle,
  Wallet,
  BarChart3,
} from "lucide-react";
import AddPasswordModal, { NewPasswordData } from "./AddPasswordModal";
import AutofillStatus from "./AutofillStatus";
import { ToastProps } from "./Toast";
import { getAllowlistedKeyServers, SealClient } from "@mysten/seal";
import AISummary from "./AISummary";

interface PasswordEntry {
  id: number;
  name: string;
  url: string;
  username: string;
  password: string;
  icon: React.ComponentType<any>;
  color: string;
  lastUsed: string;
}

interface DashboardProps {
  onSignOut?: () => void;
  addToast: (toast: Omit<ToastProps, "onClose" | "id">) => void;
}

// EXCHANGE_ID handled inside helper ensureWalBalance

const Dashboard: React.FC<DashboardProps> = ({ addToast }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(
    new Set()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const navigate = useNavigate();

  const [passwordList, setPasswordList] = useState<PasswordEntry[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const getIconForUrl = (
    url: string
  ): { icon: React.ComponentType<any>; color: string } => {
    const domain = url.toLowerCase();
    if (domain.includes("gmail") || domain.includes("google")) {
      return { icon: Mail, color: "bg-red-500" };
    } else if (domain.includes("github")) {
      return { icon: Github, color: "bg-gray-800" };
    } else if (domain.includes("amazon")) {
      return { icon: ShoppingCart, color: "bg-orange-500" };
    } else if (domain.includes("linkedin")) {
      return { icon: Globe, color: "bg-indigo-600" };
    } else if (domain.includes("facebook") || domain.includes("instagram")) {
      return { icon: Globe, color: "bg-blue-600" };
    } else if (domain.includes("work") || domain.includes("company")) {
      return { icon: Briefcase, color: "bg-blue-600" };
    } else {
      return { icon: Globe, color: "bg-cyber-600" };
    }
  };

  const account = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [isRetrieving, setIsRetrieving] = useState(false);

  // const WAL_EXCHANGE_ID = (import.meta as any).env?.VITE_WAL_EXCHANGE_ID as
  //   | string
  //   | undefined;
  const WAL_EXCHANGE_MIST: bigint = (() => {
    const raw = String(
      (import.meta as any).env?.VITE_WAL_EXCHANGE_MIST ?? "100000000"
    );
    const cleaned = raw.replace(/[_\s]/g, "");
    return BigInt(cleaned);
  })();

  // WAL exchange is provided by helper ensureWalBalance

  const handleAddPassword = async (newPasswordData: NewPasswordData) => {
    try {
      const address = account?.address || null;
      if (address) {
        const payload = {
          name: newPasswordData.name,
          url: newPasswordData.url,
          username: newPasswordData.username,
          password: newPasswordData.password,
          createdAt: new Date().toISOString(),
        };

        const suiClient = getSuiClient();
        // Build a time-eligible id (TLE): past timestamp (ms) as little-endian u64
        const pastMs = Date.now() - 60_000;
        const buf = new ArrayBuffer(8);
        new DataView(buf).setBigUint64(0, BigInt(pastMs), true);
        const idHex =
          "0x" +
          Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

        const seal = new SealClient({
          suiClient,
          serverConfigs: getAllowlistedKeyServers("testnet").map(
            (id: string) => ({ objectId: id, weight: 1 })
          ),
        });
        const { encryptedObject } = await seal.encrypt({
          threshold: 2,
          packageId: (import.meta as any).env?.VITE_SEAL_PACKAGE_ID || "0x0",
          id: idHex,
          data: new TextEncoder().encode(JSON.stringify(payload)),
        });

        // Ensure the user has WAL by exchanging some SUI (best-effort)
        try {
          const digest = await ensureWalBalance(
            address,
            suiClient,
            signAndExecuteTransaction,
            WAL_EXCHANGE_MIST
          );
          addToast({
            type: "info",
            title: "Exchanged SUI → WAL",
            message: `Tx: ${digest}`,
            duration: 5000,
          });
        } catch (ex) {
          // Continue even if exchange fails; user may already have WAL
          // eslint-disable-next-line no-console
          console.warn("WAL exchange skipped/failed:", ex);
        }

        addToast({
          type: "info",
          title: "Walrus",
          message: "Uploading via relay...",
          duration: 4000,
        });
        const { registerDigest, certifyDigest, blobId } =
          await storeEncryptedViaRelay(
            new Uint8Array(encryptedObject),
            address,
            suiClient,
            signAndExecuteTransaction,
            { epochs: 1, deletable: true, tipMax: 10000 }
          );
        addToast({
          type: "info",
          title: "Walrus Register",
          message: `Tx: ${registerDigest}`,
          duration: 6000,
        });
        addToast({
          type: "success",
          title: "Encrypted & Stored",
          message: `Tx: ${certifyDigest}`,
          duration: 6000,
        });
        if (blobId) {
          addBlobRef(address, { blobId, idHex });
          addToast({
            type: "success",
            title: "Walrus Blob",
            message: `Blob ID: ${blobId}`,
            duration: 6000,
          });

          // Immediately retrieve, decrypt and display the newly stored credential
          try {
            addToast({
              type: "info",
              title: "Retrieving",
              message: "Fetching and decrypting your new credential...",
              duration: 4000,
            });
            const r = await getCredentialByBlobIdViaProxy(
              blobId,
              address,
              signPersonalMessage,
              idHex
            );
            const j = r.json;
            if (j && j.name && j.url && j.username && j.password) {
              const { icon, color } = getIconForUrl(j.url);
              setPasswordList((prev) => [
                {
                  id: Math.max(0, ...prev.map((p) => p.id)) + 1,
                  name: j.name,
                  url: j.url,
                  username: j.username,
                  password: j.password,
                  icon,
                  color,
                  lastUsed: "Just now",
                },
                ...prev,
              ]);
              addToast({
                type: "success",
                title: "Credential Ready",
                message: `Added ${j.name}`,
                duration: 5000,
              });
            }
          } catch (err: any) {
            const msg = String(err?.message || err);
            if (
              msg.includes("blob_not_certified") ||
              msg.includes("BlobNotCertified")
            ) {
              addToast({
                type: "warning",
                title: "Not yet certified",
                message:
                  "It may take a moment to certify. Use Retrieve later if needed.",
                duration: 6000,
              });
            } else {
              addToast({
                type: "error",
                title: "Auto-retrieve failed",
                message: msg,
                duration: 6000,
              });
            }
          }
        }
      }
    } catch (e: any) {
      addToast({
        type: "error",
        title: "Encrypt/Upload failed",
        message: String(e?.message || e),
        duration: 6000,
      });
      // eslint-disable-next-line no-console
      console.error("Seal/Walrus error:", e);
    }

    // Do not display immediately; will appear after user clicks "Retrieve Credentials"
  };

  const handleRetrieveCredentials = async () => {
    try {
      if (!account?.address) {
        addToast({
          type: "warning",
          title: "Connect Wallet",
          message: "Connect your wallet to retrieve",
          duration: 4000,
        });
        return;
      }
      if (isRetrieving) return;
      setIsRetrieving(true);
      addToast({
        type: "info",
        title: "Retrieving",
        message: "Fetching and decrypting...",
        duration: 4000,
      });
      let results: Array<{ json?: any; text: string }> = [];
      const storedRefs = getBlobRefs(account.address);
      if (storedRefs.length) {
        for (const ref of storedRefs) {
          try {
            const r = await getCredentialByBlobIdViaProxy(
              ref.blobId,
              account.address,
              signPersonalMessage,
              ref.idHex
            );
            results.push({ json: r.json, text: r.text });
          } catch (err: any) {
            // skip failing blobId but log for visibility
            // eslint-disable-next-line no-console
            console.warn(
              "Retrieve by blobId failed",
              ref.blobId,
              String(err?.message || err)
            );
          }
        }
      } else {
        results = await getAllUserCredentialsViaProxy(
          account.address,
          signPersonalMessage
        );
      }
      let added = 0;
      const nextList = [...passwordList];
      for (const r of results) {
        const j = r.json;
        if (j && j.name && j.url && j.username && j.password) {
          const { icon, color } = getIconForUrl(j.url);
          nextList.unshift({
            id: Math.max(0, ...nextList.map((p) => p.id)) + 1,
            name: j.name,
            url: j.url,
            username: j.username,
            password: j.password,
            icon,
            color,
            lastUsed: "Just now",
          });
          added++;
        }
      }
      setPasswordList(nextList);
      addToast({
        type: "success",
        title: "Retrieved",
        message: `${added} credential(s) loaded`,
        duration: 5000,
      });
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (msg.includes("blob_not_certified")) {
        addToast({
          type: "warning",
          title: "Not yet certified",
          message: "Try again shortly; certify tx may still be finalizing.",
          duration: 6000,
        });
      } else {
        addToast({
          type: "error",
          title: "Retrieve failed",
          message: msg,
          duration: 6000,
        });
      }
      // eslint-disable-next-line no-console
      console.error("Retrieve error:", e);
    } finally {
      setIsRetrieving(false);
    }
  };

  const togglePasswordVisibility = (id: number) => {
    const newVisiblePasswords = new Set(visiblePasswords);
    if (newVisiblePasswords.has(id)) {
      newVisiblePasswords.delete(id);
    } else {
      newVisiblePasswords.add(id);
    }
    setVisiblePasswords(newVisiblePasswords);
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);

      addToast({
        type: "info",
        title: "Copied",
        message: `${type} copied to clipboard`,
        duration: 2000,
      });
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  const filteredPasswords = passwordList.filter(
    (password) =>
      password.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  /* Unused helper retained for future debugging
  const sendTestPayload = async () => {
    const payload = {
      id: 1,
      name: 'Gmail',
      url: 'gmail.com',
      username: 'john.doe@gmail.com',
      password: 'johndoe'
    }
    try {
      const roflUrl = import.meta.env.VITE_ROFL_ENDPOINT || 'http://localhost:8080/ingest-test'
      const res = await fetch(roflUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json().catch(() => null)
      if (data?.hibp) {
        const status = data.hibp.pwned ? `Pwned ${data.hibp.count} times` : 'Not found in HIBP'
        addToast({ type: 'success', title: 'ROFL Response', message: status, duration: 3500 })
      } else {
        addToast({ type: 'success', title: 'Sent to ROFL', message: 'Test payload sent successfully', duration: 2500 })
      }
    } catch (e: any) {
      addToast({ type: 'error', title: 'Send failed', message: e?.message || 'Unknown error', duration: 3000 })
    }
  }

  const sendBatchPayload = async () => {
    const batch = passwordList.slice(0, 5).map(p => ({
      id: p.id,
      name: p.name,
      url: p.url,
      username: p.username,
      password: p.password,
    }))
    try {
      const roflUrl = (import.meta.env.VITE_ROFL_BATCH_ENDPOINT as string) || 'http://localhost:8080/ingest-batch'
      const res = await fetch(roflUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch)
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const pwnedCount = Array.isArray(data) ? data.filter((r: any) => r?.hibp?.pwned).length : 0
      addToast({ type: 'success', title: 'Batch checked', message: `${pwnedCount} of ${batch.length} pwned`, duration: 4000 })
    } catch (e: any) {
      addToast({ type: 'error', title: 'Batch failed', message: e?.message || 'Unknown error', duration: 3000 })
    }
  }
  */

  const sendBatchAndSummarize = async () => {
    const batch = passwordList.slice(0, 5).map((p) => ({
      id: p.id,
      name: p.name,
      url: p.url,
      username: p.username,
      password: p.password,
    }));
    try {
      const roflUrl =
        (import.meta.env.VITE_ROFL_SUMMARY_ENDPOINT as string) ||
        "http://localhost:8080/ingest-batch-summarize";
      const res = await fetch(roflUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const summary = data?.ai?.summary || "No AI summary";
      setAiSummary(summary);
    } catch (e: any) {
      addToast({
        type: "error",
        title: "Summary failed",
        message: e?.message || "Unknown error",
        duration: 3000,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden container mx-auto max-w-4xl">
      {/* Search and Add Section */}
      <div className="p-4 space-y-4">
        {/* Search Bar with Alerts Button */}
        <div className="flex items-center space-x-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-cyber-400" />
            <input
              type="text"
              placeholder="Search passwords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cyber-input w-full pl-10 pr-4 py-2.5"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => navigate("/analytics")}
              className="p-2.5 cyber-border hover:bg-cyber-700/30 rounded-lg transition-all duration-200 group"
              title="Analytics Dashboard"
            >
              <BarChart3
                className="w-5 h-5 text-cyber-400 group-hover:text-primary-400"
                strokeWidth={1.5}
              />
            </button>

            <button
              onClick={() => navigate("/alerts")}
              className="relative p-2.5 cyber-border hover:bg-cyber-700/30 rounded-lg transition-all duration-200 group"
              title="Security Alerts"
            >
              <AlertTriangle
                className="w-5 h-5 text-cyber-400 group-hover:text-orange-400"
                strokeWidth={1.5}
              />
              {/* Notification Badge */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">2</span>
              </div>
            </button>
          </div>
        </div>

        {/* Autofill Status */}
        <AutofillStatus />

        {/* Add Password Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="cyber-button w-full flex items-center justify-center space-x-3 py-3"
        >
          <Plus className="w-5 h-5" strokeWidth={2} />
          <span>Add Credentials</span>
        </button>

        {/* Retrieve Credentials Button */}
        <button
          onClick={handleRetrieveCredentials}
          disabled={isRetrieving}
          className="cyber-button-secondary w-full flex items-center justify-center space-x-3 py-3 disabled:opacity-50"
        >
          <Key className="w-5 h-5" strokeWidth={2} />
          <span>{isRetrieving ? "Retrieving…" : "Retrieve Credentials"}</span>
        </button>

        {/* AI Test Button */}
        {/* <button
          onClick={sendTestPayload}
          className="cyber-button-secondary w-full flex items-center justify-center space-x-3 py-3"
        >
          <span>AI (Send Test Payload)</span>
        </button> */}

        {/* AI Batch Button */}
        {/* <button
          onClick={sendBatchPayload}
          className="cyber-button-secondary w-full flex items-center justify-center space-x-3 py-3"
        >
          <span>AI (Send Batch of Credentials)</span>
        </button> */}

        {/* AI Summary Button */}
        <button
          onClick={sendBatchAndSummarize}
          className="cyber-button w-full flex items-center justify-center space-x-3 py-3"
        >
          <span>Batch Password Analyzer</span>
        </button>
      </div>

      {/* Passwords List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {aiSummary && (
          <div className="mb-4">
            <AISummary summary={aiSummary} onClose={() => setAiSummary(null)} />
          </div>
        )}
        <div className="space-y-3">
          {filteredPasswords.map((password) => {
            const IconComponent = password.icon;
            const isPasswordVisible = visiblePasswords.has(password.id);
            const obfuscatedPassword = "••••••••••••";

            return (
              <div
                key={password.id}
                className="cyber-border rounded-lg p-4 hover:bg-cyber-700/30 transition-all duration-200 group"
              >
                {/* Header with icon and site info */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    <div
                      className={`w-10 h-10 ${password.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}
                    >
                      <IconComponent
                        className="w-5 h-5 text-white"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-cyber-100 font-semibold text-sm truncate">
                        {password.name}
                      </h3>
                      <span className="text-cyber-500 text-xs">
                        {password.lastUsed}
                      </span>
                    </div>
                    <p className="text-cyber-400 text-xs truncate mt-1">
                      {password.url}
                    </p>
                  </div>
                </div>

                {/* Credentials section */}
                <div className="space-y-2">
                  {/* Username */}
                  <div className="flex items-center justify-between bg-cyber-800/30 rounded-md p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-cyber-500 text-xs uppercase font-medium tracking-wide">
                        Username
                      </p>
                      <p className="text-cyber-200 text-sm truncate font-mono">
                        {password.username}
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        copyToClipboard(password.username, "Username")
                      }
                      className="p-1 hover:bg-cyber-700 rounded transition-colors"
                      title="Copy username"
                    >
                      <Copy
                        className="w-3 h-3 text-cyber-400 hover:text-primary-400"
                        strokeWidth={1.5}
                      />
                    </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between bg-cyber-800/30 rounded-md p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-cyber-500 text-xs uppercase font-medium tracking-wide">
                        Password
                      </p>
                      <p className="text-cyber-200 text-sm font-mono">
                        {isPasswordVisible
                          ? password.password
                          : obfuscatedPassword}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => togglePasswordVisibility(password.id)}
                        className="p-1 hover:bg-cyber-700 rounded transition-colors"
                        title={
                          isPasswordVisible ? "Hide password" : "Show password"
                        }
                      >
                        {isPasswordVisible ? (
                          <EyeOff
                            className="w-3 h-3 text-cyber-400 hover:text-primary-400"
                            strokeWidth={1.5}
                          />
                        ) : (
                          <Eye
                            className="w-3 h-3 text-cyber-400 hover:text-primary-400"
                            strokeWidth={1.5}
                          />
                        )}
                      </button>
                      <button
                        onClick={() =>
                          copyToClipboard(password.password, "Password")
                        }
                        className="p-1 hover:bg-cyber-700 rounded transition-colors"
                        title="Copy password"
                      >
                        <Copy
                          className="w-3 h-3 text-cyber-400 hover:text-primary-400"
                          strokeWidth={1.5}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredPasswords.length === 0 && (
          <div className="text-center py-16">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-cyber-600/20 rounded-full blur-xl"></div>
              <div className="relative bg-cyber-800 border-2 border-cyber-600/30 rounded-full p-3">
                <Key className="w-10 h-10 text-cyber-500" strokeWidth={1} />
              </div>
            </div>
            <h3 className="text-cyber-300 text-lg font-medium mb-2">
              {searchQuery ? "No passwords found" : "No saved passwords yet"}
            </h3>
            <p className="text-cyber-500 text-sm max-w-xs mx-auto leading-relaxed">
              {searchQuery
                ? "Try adjusting your search terms or check the spelling"
                : 'Click "Add New Password" above to start building your secure vault'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="cyber-button mt-6 inline-flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" strokeWidth={2} />
                <span>Add Your First Password</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-cyber-700/50">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate("/wallet")}
            className="cyber-button flex items-center justify-center space-x-2 py-2.5"
          >
            <Wallet className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-sm">Wallet Vault</span>
          </button>

          <button
            onClick={() => navigate("/settings")}
            className="cyber-button-secondary flex items-center justify-center space-x-2 py-2.5"
          >
            <SettingsIcon className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </div>

      {/* Add Password Modal */}
      <AddPasswordModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddPassword}
      />
    </div>
  );
};

export default Dashboard;
