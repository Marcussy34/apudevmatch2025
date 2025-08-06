import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, LogOut, User, Copy, CheckCheck } from 'lucide-react'

interface HeaderProps {
  isLoggedIn?: boolean;
  onSignOut?: () => void;
  userProfile?: { name: string; email: string; suiAddress: string; provider: string } | null;
}

// Function to format address with ellipsis
const formatAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const Header: React.FC<HeaderProps> = ({ isLoggedIn, onSignOut, userProfile }) => {
  const [copied, setCopied] = useState(false)

  const handleCopyAddress = () => {
    if (userProfile?.suiAddress) {
      navigator.clipboard.writeText(userProfile.suiAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  return (
    <header className="p-4 border-b border-cyber-700/50 bg-cyber-800/90 backdrop-blur-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-3">
          <Shield className="w-6 h-6 text-primary-400" />
          <span className="text-xl font-bold text-cyber-100">Grand Warden</span>
        </Link>
        
        {isLoggedIn && userProfile && (
          <div className="flex items-center space-x-4">
            {/* User Info Display */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="cyber-border rounded-full p-2 bg-cyber-700/30">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full ${userProfile.provider.includes('Google') ? 'bg-red-500' : 'bg-blue-500'} mr-2`}></div>
                  <span className="text-xs font-mono text-cyber-300">
                    {formatAddress(userProfile.suiAddress)}
                  </span>
                  <button 
                    onClick={handleCopyAddress}
                    className="ml-2 text-cyber-400 hover:text-cyber-200 transition-colors"
                    title="Copy address"
                  >
                    {copied ? (
                      <CheckCheck className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="cyber-border rounded-full p-1 bg-cyber-700/30">
                <User className="w-6 h-6 text-primary-400" strokeWidth={1.5} />
              </div>
            </div>

            {/* Sign Out Button */}
            <button 
              onClick={handleSignOut}
              className="cyber-button-secondary p-2 flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header