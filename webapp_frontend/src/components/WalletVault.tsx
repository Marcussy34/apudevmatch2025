import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Wallet, Plus, Eye, EyeOff, Copy, ExternalLink, CheckCheck, User } from 'lucide-react'
import { useCurrentAccount } from '@mysten/dapp-kit'

// Function to format address with ellipsis
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

const WalletVault: React.FC = () => {
  const navigate = useNavigate()
  const currentAccount = useCurrentAccount()
  const [suiWalletAddress, setSuiWalletAddress] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  
  useEffect(() => {
    setSuiWalletAddress(currentAccount?.address ?? null)
    const storedProvider = localStorage.getItem('zkLoginProvider')
    setProvider(storedProvider)
  }, [currentAccount])
  
  const handleCopyAddress = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden container mx-auto max-w-4xl">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-cyber-700/50">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/dashboard')}
            className="p-2 cyber-border hover:bg-cyber-700/30 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-cyber-400" strokeWidth={1.5} />
          </button>
          <h1 className="text-xl font-semibold text-cyber-100">Wallet Vault</h1>
        </div>
      </div>

      {/* Wallet Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {/* zkLogin Info Card */}
          {suiWalletAddress && (
            <div className="cyber-border rounded-lg p-5 bg-gradient-to-br from-primary-900/10 to-cyber-800/50 border-primary-700/30">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-cyber-700/50 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-400" strokeWidth={1.5} />
                  </div>
                  <div className="ml-3">
                    <div className="flex items-center">
                      <h3 className="text-cyber-100 font-semibold">zkLogin Identity</h3>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${provider === 'google' ? 'bg-red-900/20 text-red-400' : 'bg-blue-900/20 text-blue-400'}`}>
                        {provider === 'google' ? 'Google' : 'Facebook'}
                      </span>
                    </div>
                    <p className="text-cyber-400 text-xs">Seed-phrase-free authentication</p>
                  </div>
                </div>
              </div>
              
              {/* SUI Address Display */}
              <div className="p-3 rounded-lg bg-cyber-800/50 mb-4">
                <p className="text-xs text-cyber-400 mb-1">SUI Wallet Address</p>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-cyber-100 font-mono break-all">{suiWalletAddress}</p>
                  <div className="flex space-x-1 ml-2">
                    <button 
                      className="p-1 hover:bg-cyber-700 rounded transition-colors"
                      onClick={() => suiWalletAddress && handleCopyAddress(suiWalletAddress)}
                    >
                      {copied ? (
                        <CheckCheck className="w-4 h-4 text-green-400" strokeWidth={1.5} />
                      ) : (
                        <Copy className="w-4 h-4 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                      )}
                    </button>
                    <button className="p-1 hover:bg-cyber-700 rounded transition-colors">
                      <ExternalLink className="w-4 h-4 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-cyber-800/30 p-3 rounded-lg">
                  <p className="text-xs text-cyber-400">SUI Balance</p>
                  <p className="text-xl font-semibold text-cyber-100">100.00 SUI</p>
                  <p className="text-xs text-cyber-400">≈ $105.36</p>
                </div>
                <div className="bg-cyber-800/30 p-3 rounded-lg">
                  <p className="text-xs text-cyber-400">Transactions</p>
                  <p className="text-xl font-semibold text-cyber-100">12</p>
                  <p className="text-xs text-cyber-400">Last 7 days</p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button className="cyber-button flex-1 py-2.5 flex items-center justify-center space-x-2">
                  <span>View SUI Explorer</span>
                </button>
                <button className="cyber-button-secondary flex-1 py-2.5 flex items-center justify-center space-x-2">
                  <span>Manage Wallet</span>
                </button>
              </div>
            </div>
          )}
          
          {/* Add Wallet Button */}
          <button 
            className="cyber-button w-full flex items-center justify-center space-x-3 py-3"
          >
            <Plus className="w-5 h-5" strokeWidth={2} />
            <span>Add Wallet</span>
          </button>
          
          {/* Other Wallet Cards */}
          <div className="space-y-4">
            {/* Ethereum Wallet */}
            <div className="cyber-border rounded-lg p-5 bg-gradient-to-br from-blue-900/10 to-purple-900/10 border-blue-800/30">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white font-bold text-xl">Ξ</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-cyber-100 font-semibold">Ethereum</h3>
                    <p className="text-cyber-400 text-xs">Main Account</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-cyber-100 font-semibold">1.245 ETH</p>
                  <p className="text-cyber-400 text-xs">≈ $2,490.32</p>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-cyber-800/50">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-cyber-400 font-mono truncate">0x7F5E...8A21</p>
                  <div className="flex space-x-1">
                    <button className="p-1 hover:bg-cyber-700 rounded transition-colors">
                      <Eye className="w-4 h-4 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                    </button>
                    <button className="p-1 hover:bg-cyber-700 rounded transition-colors">
                      <Copy className="w-4 h-4 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button className="cyber-button flex-1 py-2 flex items-center justify-center space-x-2">
                  <span>View Details</span>
                </button>
                <button className="cyber-button-secondary flex-1 py-2 flex items-center justify-center space-x-2">
                  <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                  <span>Explorer</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Integration Notice */}
          <div className="cyber-border bg-cyber-800/50 rounded-lg p-4 border-primary-700/20">
            <div className="flex items-start">
              <div className="p-1.5 bg-primary-800/20 rounded-md">
                <Wallet className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-cyber-100">
                  Web3 Integration Coming Soon
                </h3>
                <p className="text-xs text-cyber-400 mt-1">
                  This is a preview of the wallet vault. Full Sui zkLogin and Web3 integration coming soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WalletVault