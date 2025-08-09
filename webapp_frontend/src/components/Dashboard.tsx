import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Linkedin,
  Users,
  Coins,
} from "lucide-react";
import AddPasswordModal, { NewPasswordData } from "./AddPasswordModal";
import AutofillStatus from "./AutofillStatus";
import { ToastProps } from "./Toast";
import {
  checkWalBalance,
  completeWalExchange,
  writeCredentialsToWalrus,
  encryptOnlyPrecheck,
  checkWalBalanceByType,
  discoverWalrusTargets,
} from "../services/backend-integration";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignTransaction,
} from "@mysten/dapp-kit";

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

const Dashboard: React.FC<DashboardProps> = ({ onSignOut, addToast }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(
    new Set()
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [walBalance, setWalBalance] = useState<{
    hasTokens: boolean;
    balance: string;
  } | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { mutateAsync: signTransaction } = useSignTransaction();

  const [passwordList, setPasswordList] = useState<PasswordEntry[]>([
    {
      id: 1,
      name: "Gmail",
      url: "gmail.com",
      username: "john.doe@gmail.com",
      password: "MySecure2023!",
      icon: Mail,
      color: "bg-red-500",
      lastUsed: "2 hours ago",
    },
    {
      id: 2,
      name: "GitHub",
      url: "github.com",
      username: "johndoe_dev",
      password: "CodeMaster#456",
      icon: Github,
      color: "bg-gray-800",
      lastUsed: "1 day ago",
    },
    {
      id: 3,
      name: "LinkedIn",
      url: "linkedin.com",
      username: "john.doe@professional.com",
      password: "Network2024!",
      icon: Linkedin,
      color: "bg-blue-600",
      lastUsed: "1 day ago",
    },
    {
      id: 4,
      name: "Amazon",
      url: "amazon.com",
      username: "john.doe@email.com",
      password: "Shop2023$ecure",
      icon: ShoppingCart,
      color: "bg-orange-500",
      lastUsed: "3 days ago",
    },
    {
      id: 5,
      name: "Facebook",
      url: "facebook.com",
      username: "john.doe.social",
      password: "Social2024#",
      icon: Users,
      color: "bg-blue-500",
      lastUsed: "2 days ago",
    },
  ]);

  // Check WAL balance when user account changes
  useEffect(() => {
    if (currentAccount?.address) {
      checkUserWalBalance();
    }
  }, [currentAccount?.address]);

  const checkUserWalBalance = async (): Promise<{
    hasTokens: boolean;
    balance: string;
  } | null> => {
    if (!currentAccount?.address) return null;

    setIsCheckingBalance(true);
    try {
      const balance = await checkWalBalance(currentAccount.address);
      setWalBalance(balance);
      console.log("🪙 WAL balance checked:", balance);
      return balance;
    } catch (error) {
      console.error("❌ Failed to check WAL balance:", error);
      const fallback = { hasTokens: false, balance: "0" };
      setWalBalance(fallback);
      return fallback;
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const handleDiscoverTargets = async () => {
    if (!currentAccount?.address) {
      addToast({
        type: "warning",
        title: "Connect Wallet",
        message: "Connect your wallet to discover Walrus move targets",
        duration: 4000,
      });
      return;
    }
    try {
      const targets = await discoverWalrusTargets(currentAccount.address);
      console.log("[Enoki Allow-List] Discovered Walrus targets:", targets);
      addToast({
        type: "info",
        title: "Walrus Targets",
        message:
          targets.length > 0
            ? `${targets[0]}${targets.length > 1 ? ", ..." : ""}`
            : "No targets found",
        duration: 6000,
      });
    } catch (e) {
      addToast({
        type: "error",
        title: "Discovery Failed",
        message: e instanceof Error ? e.message : "Unable to discover targets",
        duration: 5000,
      });
    }
  };

  const handleWalExchange = async (): Promise<boolean> => {
    if (!currentAccount?.address) {
      addToast({
        type: "error",
        title: "No Wallet Connected",
        message: "Please connect your wallet first",
        duration: 5000,
      });
      return false;
    }

    setIsExchanging(true);
    try {
      console.log("🪙 Starting WAL exchange for:", currentAccount.address);

      // Use the signAndExecuteTransaction hook to complete WAL exchange
      const result = await completeWalExchange(
        currentAccount.address,
        signAndExecuteTransaction,
        100_000_000 // Request ~0.1 WAL (increase from 0.002)
      );

      console.log("✅ WAL exchange completed:", result.digest);

      addToast({
        type: "success",
        title: "WAL Exchange Successful!",
        message: "You now have WAL tokens for storage",
        duration: 5000,
      });

      // Refresh balance
      await checkUserWalBalance();
      return true; // Indicate success
    } catch (error) {
      console.error("❌ WAL exchange failed:", error);
      addToast({
        type: "error",
        title: "WAL Exchange Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to exchange SUI for WAL tokens",
        duration: 5000,
      });
      return false; // Indicate failure
    } finally {
      setIsExchanging(false);
    }
  };

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

  const handleAddPassword = async (newPasswordData: NewPasswordData) => {
    try {
      console.log("🔐 Storing credential in Walrus:", newPasswordData.name);

      // Check if user has WAL tokens
      if (!walBalance?.hasTokens) {
        console.log(
          "🪙 No WAL tokens detected, starting automatic exchange..."
        );

        addToast({
          type: "info",
          title: "Getting WAL Tokens...",
          message:
            "Automatically exchanging SUI for WAL tokens to enable storage",
          duration: 4000,
        });

        // Automatically trigger WAL exchange
        try {
          const exchangeResult = await handleWalExchange();

          if (exchangeResult) {
            // Exchange successful, wait a moment for balance to update
            console.log(
              "✅ WAL exchange completed, waiting for balance update..."
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Re-check balance to ensure we have tokens
            await checkUserWalBalance();

            if (!walBalance?.hasTokens) {
              addToast({
                type: "warning",
                title: "Balance Update Required",
                message: "Please wait a moment and try again",
                duration: 5000,
              });
              return;
            }

            console.log("✅ WAL tokens confirmed, now storing credential...");

            addToast({
              type: "success",
              title: "WAL Tokens Acquired!",
              message: "Now storing your credential securely",
              duration: 3000,
            });
          } else {
            // Exchange failed or was cancelled
            addToast({
              type: "warning",
              title: "WAL Exchange Required",
              message: "Please get WAL tokens first to store credentials",
              duration: 5000,
            });
            return;
          }
        } catch (exchangeError) {
          console.error("❌ Automatic WAL exchange failed:", exchangeError);
          addToast({
            type: "error",
            title: "WAL Exchange Failed",
            message: "Please try getting WAL tokens manually first",
            duration: 5000,
          });
          return;
        }
      }

      // Prepare credential data for encryption (handled by backend encrypt-only)
      const credentialData = {
        site: newPasswordData.url,
        username: newPasswordData.username,
        password: newPasswordData.password,
      };

      // Refresh balance and pre-check WAL estimate
      const freshBalance = await checkUserWalBalance();
      const pre = await encryptOnlyPrecheck(credentialData);
      // Check balance for the exact WAL coin type used by Walrus register
      const exactTypeBalance = currentAccount?.address
        ? await checkWalBalanceByType(currentAccount.address)
        : 0n;
      const estimatedBaseUnits = BigInt(
        pre.estimatedWalBaseUnits ??
          Math.round(pre.estimatedWalHuman * 1_000_000_000).toString()
      );
      // include buffer (~register + overhead): 2x (certify is SUI-only per docs)
      const requiredBaseUnits = estimatedBaseUnits * 2n;
      const haveBaseUnits =
        exactTypeBalance > 0n
          ? exactTypeBalance
          : freshBalance
          ? BigInt(freshBalance.balance)
          : walBalance
          ? BigInt(walBalance.balance)
          : 0n;
      const neededHuman = Number(requiredBaseUnits) / 1_000_000_000;
      const haveHuman = Number(haveBaseUnits) / 1_000_000_000;

      // Always show info toast with estimate
      addToast({
        type: "info",
        title: "WAL Estimate",
        message: `Estimated ~${(Number(pre.estimatedWalHuman) || 0).toFixed(
          2
        )} WAL base; ~${neededHuman.toFixed(
          2
        )} WAL with overhead; you have ${haveHuman.toFixed(
          2
        )} WAL (current coin type)`,
        duration: 4000,
      });

      if (haveBaseUnits < requiredBaseUnits) {
        addToast({
          type: "warning",
          title: "More WAL Needed",
          message: `Need about ${neededHuman.toFixed(
            2
          )} WAL with overhead; you have ${haveHuman.toFixed(
            2
          )}. Use 'Get More WAL Tokens' first.`,
          duration: 6000,
        });
        return;
      }

      // Store credential in Walrus from the frontend via upload relay
      if (!currentAccount?.address) throw new Error("No wallet address");
      let blobId: string | undefined;
      try {
        const res = await writeCredentialsToWalrus(
          credentialData,
          currentAccount.address,
          signTransaction,
          pre.ciphertextB64,
          signAndExecuteTransaction
        );
        if (!res || !res.blobId) {
          console.error("[Walrus] writeCredentialsToWalrus returned:", res);
          throw new Error("Store flow returned no blobId");
        }
        blobId = res.blobId;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (
          msg.includes("Not enough coins of type") ||
          msg.includes("satisfy requested balance")
        ) {
          addToast({
            type: "warning",
            title: "Insufficient WAL",
            message:
              "Not enough WAL for register/certify. Use 'Get More WAL Tokens' and try again.",
            duration: 6000,
          });
          return;
        }
        throw e;
      }
      console.log("✅ Credential stored successfully. BlobId:", blobId);

      // Add to local state for UI display
      const { icon, color } = getIconForUrl(newPasswordData.url);

      const newPassword: PasswordEntry = {
        id: Math.max(...passwordList.map((p) => p.id), 0) + 1,
        name: newPasswordData.name,
        url: newPasswordData.url,
        username: newPasswordData.username,
        password: newPasswordData.password,
        icon,
        color,
        lastUsed: "Just now",
      };

      setPasswordList((prev) => [newPassword, ...prev]);

      addToast({
        type: "success",
        title: "Password Stored Securely!",
        message: `${
          newPasswordData.name
        } stored in Walrus (blobId: ${blobId.slice(0, 10)}...)`,
        duration: 4000,
      });
    } catch (error) {
      console.error("❌ Failed to store credential:", error);
      addToast({
        type: "error",
        title: "Storage Failed",
        message:
          error instanceof Error
            ? error.message
            : "Failed to store credential securely",
        duration: 5000,
      });
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

  return (
    <div className="flex-1 flex flex-col overflow-hidden container mx-auto max-w-4xl">
      {/* WAL Token Status */}
      {currentAccount?.address && (
        <div className="p-4 border-b border-cyber-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coins className="w-5 h-5 text-cyber-400" strokeWidth={1.5} />
              <span className="text-cyber-300 text-sm">
                WAL Tokens:{" "}
                {isCheckingBalance ? "Checking..." : walBalance?.balance || "0"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleWalExchange}
                disabled={isExchanging}
                className="cyber-button-secondary flex items-center space-x-2 px-3 py-1.5 text-sm"
              >
                {isExchanging ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Exchanging...</span>
                  </>
                ) : (
                  <>
                    <Coins className="w-4 h-4" strokeWidth={1.5} />
                    <span>
                      {walBalance?.hasTokens
                        ? "Get More WAL Tokens"
                        : "Get WAL Tokens"}
                    </span>
                  </>
                )}
              </button>
              <button
                onClick={handleDiscoverTargets}
                className="cyber-button-secondary px-3 py-1.5 text-sm"
                title="Discover Walrus Move Call Targets"
              >
                Discover Targets
              </button>
            </div>
          </div>
        </div>
      )}

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
          <span>Add New Password</span>
        </button>
      </div>

      {/* Passwords List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
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
