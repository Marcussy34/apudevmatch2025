import React, { useState } from 'react'
import { Search, Plus, Key, Settings as SettingsIcon, Eye, EyeOff, Copy, Globe, Github, Mail, ShoppingCart, Briefcase, AlertTriangle, Wallet, BarChart3, Linkedin, Users } from 'lucide-react'
import AddPasswordModal, { NewPasswordData } from './AddPasswordModal'
import ToastContainer from './ToastContainer'
import Settings from './Settings'
import Alerts from './Alerts'
import WalletVault from './WalletVault'
import DeviceRegistry from './DeviceRegistry'
import Analytics from './Analytics'
import AutofillStatus from './AutofillStatus'
import { ToastProps } from './Toast'

interface PasswordEntry {
  id: number
  name: string
  url: string
  username: string
  password: string
  icon: React.ComponentType<any>
  color: string
  lastUsed: string
}

interface DashboardProps {
  onSignOut?: () => void
  zkLoginState?: {
    isLoggedIn: boolean
    userAddress?: string
    userInfo?: any
    jwtToken?: string
  }
}

const Dashboard: React.FC<DashboardProps> = ({ onSignOut, zkLoginState }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'alerts' | 'wallet' | 'devices' | 'analytics'>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const [passwordList, setPasswordList] = useState<PasswordEntry[]>([
    { 
      id: 1, 
      name: 'Gmail', 
      url: 'gmail.com', 
      username: 'john.doe@gmail.com', 
      password: 'MySecure2023!',
      icon: Mail,
      color: 'bg-red-500',
      lastUsed: '2 hours ago'
    },
    { 
      id: 2, 
      name: 'GitHub', 
      url: 'github.com', 
      username: 'johndoe_dev', 
      password: 'CodeMaster#456',
      icon: Github,
      color: 'bg-gray-800',
      lastUsed: '1 day ago'
    },
    { 
      id: 3, 
      name: 'LinkedIn', 
      url: 'linkedin.com', 
      username: 'john.doe@professional.com', 
      password: 'Network2024!',
      icon: Linkedin,
      color: 'bg-blue-600',
      lastUsed: '1 day ago'
    },
    { 
      id: 4, 
      name: 'Amazon', 
      url: 'amazon.com', 
      username: 'john.doe@email.com', 
      password: 'Shop2023$ecure',
      icon: ShoppingCart,
      color: 'bg-orange-500',
      lastUsed: '3 days ago'
    },
    { 
      id: 5, 
      name: 'Facebook', 
      url: 'facebook.com', 
      username: 'john.doe.social', 
      password: 'Social2024#',
      icon: Users,
      color: 'bg-blue-500',
      lastUsed: '2 days ago'
    },
  ])

  const addToast = (toast: Omit<ToastProps, 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getIconForUrl = (url: string): { icon: React.ComponentType<any>, color: string } => {
    const domain = url.toLowerCase()
    if (domain.includes('gmail') || domain.includes('google')) {
      return { icon: Mail, color: 'bg-red-500' }
    } else if (domain.includes('github')) {
      return { icon: Github, color: 'bg-gray-800' }
    } else if (domain.includes('amazon')) {
      return { icon: ShoppingCart, color: 'bg-orange-500' }
    } else if (domain.includes('linkedin')) {
      return { icon: Globe, color: 'bg-indigo-600' }
    } else if (domain.includes('facebook') || domain.includes('instagram')) {
      return { icon: Globe, color: 'bg-blue-600' }
    } else if (domain.includes('work') || domain.includes('company')) {
      return { icon: Briefcase, color: 'bg-blue-600' }
    } else {
      return { icon: Globe, color: 'bg-cyber-600' }
    }
  }

  const handleAddPassword = (newPasswordData: NewPasswordData) => {
    const { icon, color } = getIconForUrl(newPasswordData.url)
    
    const newPassword: PasswordEntry = {
      id: Math.max(...passwordList.map(p => p.id), 0) + 1,
      name: newPasswordData.name,
      url: newPasswordData.url,
      username: newPasswordData.username,
      password: newPasswordData.password,
      icon,
      color,
      lastUsed: 'Just now'
    }

    setPasswordList(prev => [newPassword, ...prev])
    
    addToast({
      type: 'success',
      title: 'Password Saved!',
      message: `${newPasswordData.name} has been added to your vault`,
      duration: 3000
    })
  }

  const togglePasswordVisibility = (id: number) => {
    const newVisiblePasswords = new Set(visiblePasswords)
    if (newVisiblePasswords.has(id)) {
      newVisiblePasswords.delete(id)
    } else {
      newVisiblePasswords.add(id)
    }
    setVisiblePasswords(newVisiblePasswords)
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      console.log(`${type} copied to clipboard`)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const filteredPasswords = passwordList.filter(password =>
    password.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    password.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
    password.username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSignOut = () => {
    if (onSignOut) {
      onSignOut()
    }
  }

  // Render Settings view
  if (currentView === 'settings') {
    return (
      <Settings 
        onBack={() => setCurrentView('dashboard')}
        onSignOut={handleSignOut}
        onDeviceRegistry={() => setCurrentView('devices')}
        zkLoginState={zkLoginState}
      />
    )
  }

  // Render Alerts view
  if (currentView === 'alerts') {
    return (
      <Alerts 
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Render Wallet Vault view
  if (currentView === 'wallet') {
    return (
      <WalletVault 
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Render Device Registry view
  if (currentView === 'devices') {
    return (
      <DeviceRegistry 
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Render Analytics view
  if (currentView === 'analytics') {
    return (
      <Analytics 
        onBack={() => setCurrentView('dashboard')}
      />
    )
  }

  // Render Dashboard view
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
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
              onClick={() => setCurrentView('analytics')}
              className="p-2.5 cyber-border hover:bg-cyber-700/30 rounded-lg transition-all duration-200 group"
              title="Analytics Dashboard"
            >
              <BarChart3 className="w-5 h-5 text-cyber-400 group-hover:text-primary-400" strokeWidth={1.5} />
            </button>
            
            <button
              onClick={() => setCurrentView('alerts')}
              className="relative p-2.5 cyber-border hover:bg-cyber-700/30 rounded-lg transition-all duration-200 group"
              title="Security Alerts"
            >
              <AlertTriangle className="w-5 h-5 text-cyber-400 group-hover:text-orange-400" strokeWidth={1.5} />
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
            const IconComponent = password.icon
            const isPasswordVisible = visiblePasswords.has(password.id)
            const obfuscatedPassword = '••••••••••••'
            
            return (
              <div
                key={password.id}
                className="cyber-border rounded-lg p-4 hover:bg-cyber-700/30 transition-all duration-200 group"
              >
                {/* Header with icon and site info */}
                <div className="flex items-start space-x-3 mb-3">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 ${password.color} rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <IconComponent className="w-5 h-5 text-white" strokeWidth={1.5} />
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
                      <p className="text-cyber-500 text-xs uppercase font-medium tracking-wide">Username</p>
                      <p className="text-cyber-200 text-sm truncate font-mono">
                        {password.username}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(password.username, 'Username')}
                      className="p-1 hover:bg-cyber-700 rounded transition-colors"
                      title="Copy username"
                    >
                      <Copy className="w-3 h-3 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Password */}
                  <div className="flex items-center justify-between bg-cyber-800/30 rounded-md p-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-cyber-500 text-xs uppercase font-medium tracking-wide">Password</p>
                      <p className="text-cyber-200 text-sm font-mono">
                        {isPasswordVisible ? password.password : obfuscatedPassword}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => togglePasswordVisibility(password.id)}
                        className="p-1 hover:bg-cyber-700 rounded transition-colors"
                        title={isPasswordVisible ? 'Hide password' : 'Show password'}
                      >
                        {isPasswordVisible ? (
                          <EyeOff className="w-3 h-3 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                        ) : (
                          <Eye className="w-3 h-3 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(password.password, 'Password')}
                        className="p-1 hover:bg-cyber-700 rounded transition-colors"
                        title="Copy password"
                      >
                        <Copy className="w-3 h-3 text-cyber-400 hover:text-primary-400" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
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
              {searchQuery ? 'No passwords found' : 'No saved passwords yet'}
            </h3>
            <p className="text-cyber-500 text-sm max-w-xs mx-auto leading-relaxed">
              {searchQuery 
                ? 'Try adjusting your search terms or check the spelling' 
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
            onClick={() => setCurrentView('wallet')}
            className="cyber-button flex items-center justify-center space-x-2 py-2.5"
          >
            <Wallet className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-sm">Wallet Vault</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('settings')}
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

      {/* Toast Notifications */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  )
}

export default Dashboard