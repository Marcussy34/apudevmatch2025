import React, { useState } from 'react'
import { ArrowLeft, Wallet, Plus, Send, ArrowDownLeft, ArrowUpRight, Copy, Eye, EyeOff, Settings, RefreshCw, ExternalLink, TrendingUp, Shield } from 'lucide-react'

interface WalletData {
  id: string
  name: string
  type: 'EVM' | 'SUI'
  address: string
  balance: {
    native: string
    usd: string
  }
  chain: string
  color: string
}

interface Transaction {
  id: string
  type: 'send' | 'receive' | 'contract'
  amount: string
  token: string
  to?: string
  from?: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
  hash: string
  gasUsed?: string
}

interface WalletVaultProps {
  onBack: () => void
}

const WalletVault: React.FC<WalletVaultProps> = ({ onBack }) => {
  const [selectedWallet, setSelectedWallet] = useState<string>('ethereum-main')
  const [showBalance, setShowBalance] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'security'>('overview')

  const wallets: WalletData[] = [
    {
      id: 'ethereum-main',
      name: 'Main Ethereum',
      type: 'EVM',
      address: '0x742d35Cc6648C04532f6fB8C0A9C1aDfE26b24B2',
      balance: { native: '2.45', usd: '5,847.32' },
      chain: 'Ethereum',
      color: 'bg-blue-600'
    },
    {
      id: 'sui-main',
      name: 'Main Sui',
      type: 'SUI',
      address: '0x9c6b8a1f2e4d3c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b',
      balance: { native: '1,248.67', usd: '2,184.91' },
      chain: 'Sui',
      color: 'bg-indigo-600'
    },
    {
      id: 'polygon-defi',
      name: 'DeFi Portfolio',
      type: 'EVM',
      address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      balance: { native: '15,420.89', usd: '14,378.23' },
      chain: 'Polygon',
      color: 'bg-purple-600'
    }
  ]

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'receive',
      amount: '0.5',
      token: 'ETH',
      from: '0x8ba1f109551bD432803012645Hac136c72aBc',
      timestamp: '2 hours ago',
      status: 'completed',
      hash: '0x9c6b8a1f2e4d3c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b',
      gasUsed: '21,000'
    },
    {
      id: '2',
      type: 'send',
      amount: '1000',
      token: 'USDC',
      to: '0x742d35Cc6648C04532f6fB8C0A9C1aDfE26b24B2',
      timestamp: '1 day ago',
      status: 'completed',
      hash: '0x8ba1f109551bD432803012645Hac136c72aBc7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
      gasUsed: '65,000'
    },
    {
      id: '3',
      type: 'contract',
      amount: '2.1',
      token: 'SUI',
      to: '0x...DeFiProtocol',
      timestamp: '3 days ago',
      status: 'completed',
      hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      gasUsed: '145,000'
    },
    {
      id: '4',
      type: 'send',
      amount: '0.25',
      token: 'ETH',
      to: '0x9c6...marketplace',
      timestamp: '1 week ago',
      status: 'pending',
      hash: '0x5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c',
      gasUsed: '42,000'
    }
  ]

  const currentWallet = wallets.find(w => w.id === selectedWallet) || wallets[0]

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'send': return <ArrowUpRight className="w-4 h-4 text-red-400" />
      case 'receive': return <ArrowDownLeft className="w-4 h-4 text-green-400" />
      case 'contract': return <Settings className="w-4 h-4 text-blue-400" />
    }
  }

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400'
      case 'pending': return 'text-yellow-400'
      case 'failed': return 'text-red-400'
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyber-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-cyber-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-cyber-400 hover:text-cyber-200" strokeWidth={1.5} />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 ${currentWallet.color} rounded-lg flex items-center justify-center`}>
                <Wallet className="w-5 h-5 text-white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-cyber-100">Wallet Vault</h2>
                <p className="text-xs text-cyber-400">{currentWallet.name} • {currentWallet.chain}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-cyber-800 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
            </button>
            <button className="p-2 hover:bg-cyber-800 rounded-lg transition-colors">
              <Plus className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Wallet Selector */}
      <div className="p-4 border-b border-cyber-700/50">
        <div className="flex space-x-2 overflow-x-auto">
          {wallets.map((wallet) => (
            <button
              key={wallet.id}
              onClick={() => setSelectedWallet(wallet.id)}
              className={`flex-shrink-0 p-3 rounded-lg border transition-all duration-200 ${
                selectedWallet === wallet.id
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-cyber-600/50 hover:border-cyber-500/50 hover:bg-cyber-800/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 ${wallet.color} rounded-lg flex items-center justify-center`}>
                  <Wallet className="w-4 h-4 text-white" strokeWidth={1.5} />
                </div>
                <div className="text-left">
                  <p className="text-cyber-100 text-sm font-medium">{wallet.name}</p>
                  <p className="text-cyber-400 text-xs">{wallet.type} • {wallet.chain}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Balance Card */}
      <div className="p-4">
        <div className="cyber-border rounded-lg p-4 bg-gradient-to-r from-cyber-800/30 to-cyber-700/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-cyber-400 text-sm">Total Balance</p>
              <div className="flex items-center space-x-3">
                {showBalance ? (
                  <h3 className="text-2xl font-bold text-cyber-100">${currentWallet.balance.usd}</h3>
                ) : (
                  <h3 className="text-2xl font-bold text-cyber-100">••••••</h3>
                )}
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-1 hover:bg-cyber-700 rounded transition-colors"
                >
                  {showBalance ? (
                    <EyeOff className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-cyber-400 text-sm">Native Balance</p>
              <p className="text-cyber-200 font-semibold">
                {showBalance ? `${currentWallet.balance.native} ${currentWallet.type === 'EVM' ? 'ETH' : 'SUI'}` : '•••••'}
              </p>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-center justify-between bg-cyber-800/50 rounded-lg p-3">
            <div className="flex-1 min-w-0">
              <p className="text-cyber-500 text-xs uppercase tracking-wide">Address</p>
              <p className="text-cyber-200 text-sm font-mono truncate">
                {currentWallet.address}
              </p>
            </div>
            <button
              onClick={() => copyAddress(currentWallet.address)}
              className="p-1 hover:bg-cyber-700 rounded transition-colors ml-2"
            >
              <Copy className="w-3 h-3 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <button className="cyber-button-secondary flex items-center justify-center space-x-2 py-3">
              <Send className="w-4 h-4" strokeWidth={1.5} />
              <span>Send</span>
            </button>
            <button className="cyber-button-secondary flex items-center justify-center space-x-2 py-3">
              <ArrowDownLeft className="w-4 h-4" strokeWidth={1.5} />
              <span>Receive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex space-x-1 bg-cyber-800/30 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'transactions', label: 'History', icon: ArrowUpRight },
            { id: 'security', label: 'Security', icon: Shield }
          ].map((tab) => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white'
                    : 'text-cyber-400 hover:text-cyber-200 hover:bg-cyber-700/50'
                }`}
              >
                <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="cyber-border rounded-lg p-3">
                <p className="text-cyber-400 text-xs">24h Change</p>
                <p className="text-green-400 font-semibold">+$127.45</p>
                <p className="text-green-400 text-xs">+2.23%</p>
              </div>
              <div className="cyber-border rounded-lg p-3">
                <p className="text-cyber-400 text-xs">Total Transactions</p>
                <p className="text-cyber-100 font-semibold">147</p>
                <p className="text-cyber-400 text-xs">This month</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h4 className="text-cyber-100 font-medium mb-3">Recent Activity</h4>
              <div className="space-y-2">
                {transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="cyber-border rounded-lg p-3 hover:bg-cyber-700/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-cyber-700 rounded-lg flex items-center justify-center">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <p className="text-cyber-100 text-sm font-medium capitalize">{tx.type}</p>
                          <p className="text-cyber-400 text-xs">{tx.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                          {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                        </p>
                        <p className={`text-xs ${getStatusColor(tx.status)}`}>{tx.status}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-cyber-100 font-medium">Transaction History</h4>
              <button className="text-xs text-primary-400 hover:text-primary-300">
                <ExternalLink className="w-3 h-3 inline mr-1" />
                View on Explorer
              </button>
            </div>
            
            {transactions.map((tx) => (
              <div key={tx.id} className="cyber-border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-cyber-700 rounded-lg flex items-center justify-center">
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-cyber-100 font-medium capitalize">{tx.type} {tx.token}</p>
                      <p className="text-cyber-400 text-xs">{tx.timestamp}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-medium ${tx.type === 'send' ? 'text-red-400' : 'text-green-400'}`}>
                      {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                    </p>
                    <p className={`text-xs ${getStatusColor(tx.status)} capitalize`}>{tx.status}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-xs">
                  {tx.to && (
                    <div className="flex justify-between">
                      <span className="text-cyber-500">To:</span>
                      <span className="text-cyber-300 font-mono">{tx.to.slice(0, 10)}...{tx.to.slice(-8)}</span>
                    </div>
                  )}
                  {tx.from && (
                    <div className="flex justify-between">
                      <span className="text-cyber-500">From:</span>
                      <span className="text-cyber-300 font-mono">{tx.from.slice(0, 10)}...{tx.from.slice(-8)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-cyber-500">Gas Used:</span>
                    <span className="text-cyber-300">{tx.gasUsed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cyber-500">Hash:</span>
                    <span className="text-cyber-300 font-mono">{tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="cyber-border rounded-lg p-4 bg-green-900/20 border-green-500/30">
              <div className="flex items-center space-x-3 mb-3">
                <Shield className="w-5 h-5 text-green-400" strokeWidth={1.5} />
                <h4 className="text-green-200 font-medium">Wallet Security Score</h4>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-1 bg-cyber-800 rounded-full h-2">
                  <div className="bg-green-400 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-green-400 font-semibold">85/100</span>
              </div>
              <p className="text-green-300 text-sm mt-2">Your wallet security is excellent</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-cyber-100 font-medium">Security Features</h4>
              
              {[
                { feature: 'Hardware Wallet Integration', status: 'enabled', desc: 'Ledger device connected' },
                { feature: 'Transaction Signing Protection', status: 'enabled', desc: 'Phishing detection active' },
                { feature: 'Multi-Signature Setup', status: 'disabled', desc: 'Consider enabling for large amounts' },
                { feature: 'Backup & Recovery', status: 'enabled', desc: 'Social recovery configured' }
              ].map((item, index) => (
                <div key={index} className="cyber-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-cyber-100 text-sm font-medium">{item.feature}</p>
                      <p className="text-cyber-400 text-xs">{item.desc}</p>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${
                      item.status === 'enabled' ? 'bg-green-400' : 'bg-yellow-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WalletVault