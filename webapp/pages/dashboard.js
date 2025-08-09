import Image from "next/image";
import { Inter } from "next/font/google";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Modal,
  ModalTrigger,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@/components/ui/animated-modal";
import { motion } from "motion/react";
import {
  Shield,
  Key,
  Plus,
  Search,
  Bell,
  Settings,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  TrendingUp,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  Upload,
  MoreHorizontal,
  User,
  Globe,
  Smartphone,
  Laptop,
  Scan,
  Moon,
  Sun,
  X,
  Wallet,
  LogOut,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSignPersonalMessage,
  useSuiClient,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { SealClient, getAllowlistedKeyServers } from "@mysten/seal";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import { ensureWalBalance, storeEncryptedViaRelay } from "@/lib/encryption";
import {
  getAllUserCredentialsViaProxy,
  getCredentialByBlobIdViaProxy,
} from "@/lib/decryption";
import AISummary from "@/components/AISummary";
import { addBlobRef, getBlobRefs } from "@/lib/blobIds";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const interTight = Inter({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  display: "swap",
});

export default function Dashboard() {
  const account = useCurrentAccount();
  const suiClient = useSuiClient();
  const router = useRouter();
  const { mutateAsync: signAndExecuteTransaction } =
    useSignAndExecuteTransaction();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const { mutate: disconnect } = useDisconnectWallet();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [balance, setBalance] = useState(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isCheckingWallet, setIsCheckingWallet] = useState(true);
  const walletDropdownRef = useRef(null);
  const [nftData, setNftData] = useState(null);
  const [isLoadingNfts, setIsLoadingNfts] = useState(false);

  // Form state for Add Password modal
  const [formData, setFormData] = useState({
    siteName: "",
    websiteUrl: "",
    emailUsername: "",
    password: "",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Enable dark mode by default
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Click outside handler for wallet dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (walletDropdownRef.current && !walletDropdownRef.current.contains(event.target)) {
        setShowWalletInfo(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Redirect to index if no wallet connected
  useEffect(() => {
    // Give some time for wallet to connect if it's in the process
    const timer = setTimeout(() => {
      if (!account?.address) {
        router.push("/");
      } else {
        setIsCheckingWallet(false);
      }
    }, 1000); // Wait 1 second to allow for wallet connection

    // If account is already connected, stop checking immediately
    if (account?.address) {
      setIsCheckingWallet(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [account?.address, router]);

  // Fetch balance when account changes
  useEffect(() => {
    if (account?.address) {
      fetchBalance();
      fetchNfts();
    } else {
      setBalance(null);
      setNftData(null);
    }
  }, [account?.address, suiClient]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
  };

  // Basic metrics placeholders (will derive from real list)
  const [passwordList, setPasswordList] = useState([]);
  const securityScore = nftData?.securityScore || 85;
  const totalPasswords = passwordList.length;
  const weakPasswords = 0;
  const breachedPasswords = 0;
  const reusedPasswords = 0;

  const recentPasswords = passwordList;

  const [aiSummary, setAiSummary] = useState(null);

  const sendBatchAndSummarize = async () => {
    try {
      const batch = passwordList.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        username: p.username,
        password: p.password,
      }));
      const res = await fetch(`/api/ingest-batch-summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const info = await res.json();
          msg = info?.error || info?.message || msg;
        } catch {
          try {
            msg = await res.text();
          } catch {}
        }
        alert(`AI summary failed: ${msg}`);
        return;
      }
      const data = await res.json();
      const summary = data?.ai?.summary || "No AI summary";
      setAiSummary(summary);
    } catch (e) {
      console.error("AI summary failed:");
      alert(String(e?.message || e));
    }
  };

  const recentActivity = [
    {
      id: 1,
      action: "Password generated",
      item: "LinkedIn",
      time: "2 hours ago",
      type: "success",
    },
    {
      id: 2,
      action: "Security scan completed",
      item: "All accounts",
      time: "6 hours ago",
      type: "info",
    },
    {
      id: 3,
      action: "Weak password detected",
      item: "Discord",
      time: "1 day ago",
      type: "warning",
    },
    {
      id: 4,
      action: "Breach detected",
      item: "Adobe",
      time: "2 days ago",
      type: "danger",
    },
  ];

  const securityInsights = [
    {
      title: "Update weak passwords",
      description: "Multiple passwords need strengthening",
      action: "Fix now",
      type: "warning",
    },
    {
      title: "Breach detected",
      description: "Certain accounts may be compromised",
      action: "Review",
      type: "danger",
    },
    {
      title: "Enable 2FA",
      description: "0 accounts without two-factor authentication",
      action: "Secure",
      type: "info",
    },
  ];

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleRetrieveCredentials = async () => {
    try {
      if (!account?.address) {
        alert("Connect wallet to retrieve");
        return;
      }
      let aggregated = [];
      const refs = getBlobRefs(account.address);
      if (refs && refs.length) {
        for (const ref of refs) {
          try {
            const r = await getCredentialByBlobIdViaProxy(
              ref.blobId,
              account.address,
              signPersonalMessage,
              ref.idHex
            );
            aggregated.push(r);
          } catch (e) {
            console.warn(
              "retrieve-by-blobId failed",
              ref.blobId,
              String(e?.message || e)
            );
          }
        }
      }
      if (!aggregated.length) {
        aggregated = await getAllUserCredentialsViaProxy(
          account.address,
          signPersonalMessage
        );
      }
      const next = aggregated
        .map((r, idx) => {
          const j = r.json;
          if (!j || !j.name || !j.url || !j.username || !j.password)
            return null;
          return {
            id: idx + 1,
            name: j.name,
            url: j.url,
            username: j.username,
            password: j.password,
            strength: "Strong",
            lastUsed: "Just now",
            device: "laptop",
          };
        })
        .filter(Boolean);
      setPasswordList(next);
      alert(`Retrieved ${next.length} credential(s)`);
    } catch (e) {
      alert(String(e?.message || e));
    }
  };

  const getDeviceIcon = (device) => {
    switch (device) {
      case "laptop":
        return <Laptop className="h-4 w-4" />;
      case "smartphone":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getStrengthColor = (strength) => {
    switch (strength) {
      case "Strong":
        return "success";
      case "Medium":
        return "warning";
      case "Weak":
        return "danger";
      default:
        return "secondary";
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "danger":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  // Form handling functions
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!account?.address) {
      alert("Connect wallet first");
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        name: formData.siteName,
        url: formData.websiteUrl,
        username: formData.emailUsername,
        password: formData.password,
        createdAt: new Date().toISOString(),
      };

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
        serverConfigs: getAllowlistedKeyServers("testnet").map((id) => ({
          objectId: id,
          weight: 1,
        })),
      });
      const { encryptedObject } = await seal.encrypt({
        threshold: 2,
        packageId: process.env.NEXT_PUBLIC_SEAL_PACKAGE_ID || "0x0",
        id: idHex,
        data: new TextEncoder().encode(JSON.stringify(payload)),
      });

      // Best-effort to exchange SUI → WAL so user can pay Walrus tip
      try {
        const WAL_EXCHANGE_MIST = BigInt(
          String(
            process.env.NEXT_PUBLIC_WAL_EXCHANGE_MIST || "100000000"
          ).replace(/[_\s]/g, "")
        );
        await ensureWalBalance(
          account.address,
          suiClient,
          signAndExecuteTransaction,
          WAL_EXCHANGE_MIST
        );
      } catch (ex) {
        console.warn("WAL exchange skipped/failed:", ex);
      }

      const { registerDigest, certifyDigest, blobId } =
        await storeEncryptedViaRelay(
          new Uint8Array(encryptedObject),
          account.address,
          suiClient,
          signAndExecuteTransaction,
          { epochs: 1, deletable: true, tipMax: 10000 }
        );

      if (blobId) addBlobRef(account.address, { blobId, idHex });

      // Reset form
      setFormData({
        siteName: "",
        websiteUrl: "",
        emailUsername: "",
        password: "",
      });
      setShowNewPassword(false);
      alert(
        `Encrypted & stored. Register: ${registerDigest}\nCertify: ${certifyDigest}${
          blobId ? `\nBlob: ${blobId}` : ""
        }`
      );
    } catch (err) {
      console.error("Add credential failed:", err);
      alert(`Failed: ${String(err?.message || err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  // Helper function to truncate wallet address
  const truncateAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Toggle wallet info display
  const toggleWalletInfo = () => {
    setShowWalletInfo(!showWalletInfo);
  };

  // Fetch wallet balance
  const fetchBalance = async () => {
    if (!account?.address || !suiClient) return;
    
    setIsLoadingBalance(true);
    try {
      const balanceData = await suiClient.getBalance({
        owner: account.address,
      });
      // Convert from MIST to SUI
      const suiBalance = Number(balanceData.totalBalance) / Number(MIST_PER_SUI);
      setBalance(suiBalance);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      setBalance(null);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  // Fetch NFTs from wallet
  const fetchNfts = async () => {
    if (!account?.address || !suiClient) return;
    
    setIsLoadingNfts(true);
    try {
      const nfts = [];
      let cursor = null;
      
      do {
        const page = await suiClient.getOwnedObjects({
          owner: account.address,
          cursor: cursor ?? undefined,
          limit: 50,
          options: { 
            showType: true, 
            showContent: true, 
            showDisplay: true 
          },
        });
        
        for (const item of page.data) {
          const objectType = item?.data?.type;
          
          // Check if this is likely an NFT (has display metadata and is not a coin)
          if (objectType && 
              !objectType.includes("::coin::Coin") && 
              !objectType.includes("::blob::Blob") &&
              !objectType.includes("::shared_blob::SharedBlob") &&
              item?.data?.display) {
            
            const display = item.data.display?.data || {};
            const content = item.data.content?.fields || {};
            
            // Only include objects that have NFT-like characteristics
            if (display.name || display.description || display.image_url || content.name) {
              nfts.push({
                id: item.data.objectId,
                type: objectType,
                name: display.name || content.name || "Unnamed NFT",
                description: display.description || content.description || "",
                imageUrl: display.image_url || content.image_url || content.url || "",
                attributes: content,
                display
              });
            }
          }
        }
        
        cursor = page.hasNextPage ? page.nextCursor ?? null : null;
      } while (cursor);
      
      // Set NFT data - only if we found actual NFTs
      if (nfts.length > 0) {
        console.log(`Found ${nfts.length} NFTs:`, nfts);
        setNftData({
          nfts,
          totalCount: nfts.length,
          // Calculate a simple security score based on NFT collection
          securityScore: Math.min(85 + (nfts.length * 2), 98)
        });
      } else {
        console.log("No NFTs found in wallet");
        setNftData(null);
      }
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
      setNftData(null);
    } finally {
      setIsLoadingNfts(false);
    }
  };

  // Handle wallet disconnect
  const handleDisconnect = () => {
    disconnect();
    setShowWalletInfo(false);
    setBalance(null);
    // Redirect to index page after disconnect
    router.push("/");
  };

  // Show loading screen while checking wallet connection
  if (isCheckingWallet) {
    return (
      <div className={`${inter.variable} ${interTight.variable} font-sans min-h-screen bg-background flex items-center justify-center`}>
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking wallet connection...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if no account (will redirect)
  if (!account?.address) {
    return null;
  }

  return (
    <Modal>
      <div
        className={`${inter.variable} ${interTight.variable} font-sans min-h-screen bg-background`}
      >
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6 lg:px-8">
            {/* Logo and brand */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Image
                  src="/logo.png"
                  alt="Grand Warden Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl brand-text text-foreground">
                  Grand Warden
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search passwords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              
              {/* Wallet Display */}
              <div className="relative" ref={walletDropdownRef}>
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors"
                  onClick={toggleWalletInfo}
                >
                  <Avatar>
                    <AvatarImage src="/placeholder-avatar.svg" alt="User" />
                    <AvatarFallback>
                      {account?.address ? account.address.slice(0, 2).toUpperCase() : "MD"}
                    </AvatarFallback>
                  </Avatar>
                  {account?.address && (
                    <div className="hidden sm:block text-sm text-foreground">
                      {truncateAddress(account.address)}
                    </div>
                  )}
                </div>
                
                {/* Wallet Info Dropdown */}
                {showWalletInfo && account?.address && (
                  <div className="absolute right-0 top-full mt-2 w-84 bg-background border border-border rounded-lg shadow-lg z-50">
                    <div className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-foreground">Wallet Connected</h3>
                        <Button variant="ghost" size="icon" onClick={toggleWalletInfo}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Balance Section */}
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Balance</div>
                        <div className="flex items-center gap-2 bg-muted/50 p-3 rounded border">
                          <Wallet className="h-4 w-4 text-primary" />
                          {isLoadingBalance ? (
                            <div className="text-sm text-muted-foreground">Loading...</div>
                          ) : balance !== null ? (
                            <div className="text-sm font-medium">
                              {balance.toFixed(4)} SUI
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Unable to load</div>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-auto h-6 w-6"
                            onClick={fetchBalance}
                            disabled={isLoadingBalance}
                          >
                            <RefreshCw className={`h-3 w-3 ${isLoadingBalance ? 'animate-spin' : ''}`} />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Address</div>
                        <div className="text-sm font-mono bg-muted/50 p-3 rounded border break-words leading-relaxed">
                          {account.address}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Connected to Testnet</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="flex-1 text-xs"
                          onClick={() => {
                            navigator.clipboard.writeText(account.address);
                            // You could add a toast notification here
                          }}
                        >
                          Copy Address
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1 text-xs"
                          onClick={handleDisconnect}
                        >
                          <LogOut className="h-3 w-3 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Welcome section */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <motion.h1
              className="text-3xl md:text-4xl heading-modern text-foreground mb-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
            >
              Welcome back, {account?.address ? truncateAddress(account.address) : 'User'}
            </motion.h1>
          </motion.div>

          {/* NFT Security Status Display - Always show with placeholder when no NFTs */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          >
            <Card className="max-w-md mx-auto">
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  {isLoadingNfts ? (
                    // Loading state
                    <>
                      <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 rounded-lg border-2 border-muted bg-muted/20 backdrop-blur-sm flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 bg-muted animate-pulse rounded"></div>
                        <div className="h-4 bg-muted animate-pulse rounded w-32 mx-auto"></div>
                      </div>
                      <p className="text-muted-foreground">Loading NFT status...</p>
                    </>
                  ) : nftData ? (
                    // NFT found state
                    <>
                      {/* NFT Image */}
                      <div className="relative w-48 h-48 mx-auto">
                        <div
                          className={`absolute inset-0 rounded-lg border-2 ${
                            securityScore > 80
                              ? "bg-gradient-to-br from-green-400/20 to-emerald-600/20 border-green-400/50"
                              : securityScore > 60
                              ? "bg-gradient-to-br from-yellow-400/20 to-orange-600/20 border-yellow-400/50"
                              : "bg-gradient-to-br from-red-400/20 to-red-600/20 border-red-400/50"
                          } backdrop-blur-sm overflow-hidden`}
                        >
                          {/* Actual NFT Image or Fallback */}
                          {nftData.nfts[0]?.imageUrl ? (
                            <div className="absolute inset-0">
                              <Image
                                src={nftData.nfts[0].imageUrl}
                                alt={nftData.nfts[0].name || "NFT"}
                                fill
                                className="object-cover rounded-lg"
                                unoptimized={nftData.nfts[0].imageUrl.startsWith('ipfs://')}
                                onError={(e) => {
                                  // Fallback to shield icon if image fails to load
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-700">
                              <Image
                                src="/placeholder-avatar.svg"
                                alt="NFT Placeholder"
                                fill
                                className="object-cover opacity-10"
                              />
                            </div>
                          )}

                          {/* Central Shield Icon (shows if no image or as overlay) */}
                          {!nftData.nfts[0]?.imageUrl && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Shield
                                className={`h-20 w-20 ${
                                  securityScore > 80
                                    ? "text-green-400"
                                    : securityScore > 60
                                    ? "text-yellow-400"
                                    : "text-red-400"
                                }`}
                              />
                            </div>
                          )}

                          {/* Score overlay */}
                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-black/50 backdrop-blur-sm rounded px-2 py-1 text-center">
                              <span className="text-white text-xs font-medium">
                                {securityScore}% Secure
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* NFT Title & Category */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-foreground">
                          {nftData.nfts[0]?.name || (
                            securityScore > 80
                              ? "Fortress Guardian"
                              : securityScore > 60
                              ? "Shield Bearer"
                              : "Vulnerable Keeper"
                          )}
                        </h3>
                        <Badge
                          variant={
                            securityScore > 80
                              ? "success"
                              : securityScore > 60
                              ? "warning"
                              : "warning"
                          }
                        >
                          Security NFT • Level {Math.floor(securityScore / 20) + 1} • {nftData.totalCount} NFT{nftData.totalCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* NFT Description */}
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        {nftData.nfts[0]?.description || (
                          securityScore > 80
                            ? "Elite password security guardian with exceptional vault protection."
                            : securityScore > 60
                            ? "Reliable security defender with room for improvement."
                            : "Novice security keeper requiring immediate attention."
                        )}
                      </p>
                      
                      {nftData.totalCount > 1 && (
                        <p className="text-xs text-muted-foreground">
                          +{nftData.totalCount - 1} more NFT{nftData.totalCount - 1 !== 1 ? 's' : ''} in collection
                        </p>
                      )}
                    </>
                  ) : (
                    // No NFTs found - placeholder state
                    <>
                      {/* Empty NFT Placeholder */}
                      <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/10 backdrop-blur-sm overflow-hidden">
                          {/* Placeholder background */}
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/20 to-slate-700/20">
                            <Image
                              src="/placeholder-avatar.svg"
                              alt="No NFT Placeholder"
                              fill
                              className="object-cover opacity-5"
                            />
                          </div>

                          {/* Central placeholder icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center space-y-2">
                              <Shield className="h-16 w-16 text-muted-foreground/50 mx-auto" />
                              <div className="text-xs text-muted-foreground/70 font-medium">
                                No NFT Found
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Placeholder Title & Category */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-muted-foreground">
                          No Security NFT
                        </h3>
                      </div>

                      {/* Placeholder Description */}
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        No NFTs found in your wallet. Security status will be displayed when you acquire NFTs that represent your current security level.
                      </p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Security overview cards */}
          <motion.div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Security Score
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-foreground">
                    {securityScore}%
                  </div>
                  <Badge
                    variant={
                      securityScore > 80
                        ? "success"
                        : securityScore > 60
                        ? "warning"
                        : "warning"
                    }
                  >
                    {securityScore > 80
                      ? "Good"
                      : securityScore > 60
                      ? "Fair"
                      : "Poor"}
                  </Badge>
                </div>
                <Progress value={securityScore} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Passwords
                </CardTitle>
                <Key className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {totalPasswords}
                </div>
                <p className="text-xs text-muted-foreground">
                  <TrendingUp className="inline h-3 w-3 mr-1" />
                  0 from last week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Weak Passwords
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {weakPasswords}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Compromised
                </CardTitle>
                <Scan className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {breachedPasswords}
                </div>
                <p className="text-xs text-muted-foreground">
                  Found in data breaches
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            className="grid gap-6 lg:grid-cols-3"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
          >
            {/* Password vault */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="heading-bold">
                        Password Vault
                      </CardTitle>
                      <CardDescription>
                        Manage your stored passwords and credentials
                      </CardDescription>
                    </div>
                    <ModalTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Password
                    </ModalTrigger>
                  </div>
                </CardHeader>
                <CardContent>
                  {aiSummary && (
                    <div className="mb-6">
                      <AISummary
                        summary={aiSummary}
                        onClose={() => setAiSummary(null)}
                      />
                    </div>
                  )}
                  <div className="space-y-4">
                    {recentPasswords.map((password) => (
                      <div
                        key={password.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Key className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-foreground">
                                {password.name}
                              </h4>
                              <Badge
                                variant={getStrengthColor(password.strength)}
                                className="text-xs"
                              >
                                {password.strength}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{password.username}</span>
                              <span>•</span>
                              <span>{password.url}</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                {getDeviceIcon(password.device)}
                                <span>{password.lastUsed}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              togglePasswordVisibility(password.id)
                            }
                          >
                            {showPasswords[password.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="default"
                      className="w-full"
                      onClick={sendBatchAndSummarize}
                    >
                      AI (Batch + Summary)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="heading-bold">Quick Actions</CardTitle>
                  <CardDescription>
                    Common password management tasks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full justify-start"
                    onClick={handleRetrieveCredentials}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Retrieve Credentials
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={sendBatchAndSummarize}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    AI (Batch + Summary)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={fetchNfts}
                    disabled={isLoadingNfts}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingNfts ? 'animate-spin' : ''}`} />
                    Refresh NFT Status
                  </Button>
                </CardContent>
              </Card>

              {/* Security insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="heading-bold">
                    Security Insights
                  </CardTitle>
                  <CardDescription>
                    Recommendations to improve your security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {securityInsights.map((insight, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-foreground">
                            {insight.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {insight.description}
                          </p>
                        </div>
                        <Badge
                          variant={
                            insight.type === "danger"
                              ? "warning"
                              : insight.type === "warning"
                              ? "warning"
                              : insight.type === "info"
                              ? "success"
                              : "success"
                          }
                        >
                          {insight.action}
                        </Badge>
                      </div>
                      {index < securityInsights.length - 1 && <Separator />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </main>

        {/* Add Password Modal */}
        <ModalBody>
          <ModalContent>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Add New Password
              </h2>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    placeholder="e.g., GitHub, Gmail, Netflix"
                    value={formData.siteName}
                    onChange={(e) =>
                      handleInputChange("siteName", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://example.com"
                    value={formData.websiteUrl}
                    onChange={(e) =>
                      handleInputChange("websiteUrl", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailUsername">Email/Username</Label>
                  <Input
                    id="emailUsername"
                    placeholder="your.email@example.com or username"
                    value={formData.emailUsername}
                    onChange={(e) =>
                      handleInputChange("emailUsername", e.target.value)
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter a secure password"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      required
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={toggleNewPasswordVisibility}
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </motion.div>
          </ModalContent>

          <ModalFooter>
            <div className="flex gap-3 w-full justify-end">
              <Button type="submit" onClick={handleFormSubmit}>
                <Key className="h-4 w-4 mr-2" />
                Add Password
              </Button>
            </div>
          </ModalFooter>
        </ModalBody>
      </div>
    </Modal>
  );
}
