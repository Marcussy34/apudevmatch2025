import React, { useState } from "react";
import { Shield } from "lucide-react";
import { ConnectButton } from "@mysten/dapp-kit";

interface LoginPromptProps {
  onLoginClick: () => void;
}

// (Removed unused mock address helpers)

const LoginPrompt: React.FC<LoginPromptProps> = ({ }) => {


  const [loginError] = useState<string | null>(null);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="cyber-border rounded-xl p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-primary-500/10 mb-4">
            <Shield className="w-10 h-10 text-primary-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-cyber-100">
            Welcome to Grand Warden
          </h1>
          <p className="text-cyber-400 mt-2">Secure your digital life</p>
        </div>

        {/* Wallet Connect CTA replacing social login */}
        <div className="mb-6">
          <p className="text-sm text-center text-cyber-300 mb-3">
            Connect your Sui wallet
          </p>
          <div className="flex items-center justify-center">
            <ConnectButton />
          </div>
        </div>

        {loginError && (
          <p className="text-sm text-red-400 text-center mb-4">{loginError}</p>
        )}

        </div>
      </div>
  );
};

export default LoginPrompt;
