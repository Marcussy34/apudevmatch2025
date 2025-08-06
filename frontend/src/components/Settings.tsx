import React, { useState } from 'react'
import { Shield, Lock, AlertTriangle, LogOut, ArrowLeft, Check, Smartphone, KeySquare, User } from 'lucide-react'

interface SettingsProps {
  onBack: () => void
  onSignOut: () => void
  onDeviceRegistry?: () => void
  zkLoginState?: {
    isLoggedIn: boolean
    userAddress?: string
    userInfo?: any
    jwtToken?: string
  }
}

interface ToggleProps {
  id: string
  label: string
  description: string
  enabled: boolean
  onChange: (enabled: boolean) => void
  icon: React.ComponentType<any>
}

const Toggle: React.FC<ToggleProps> = ({ id, label, description, enabled, onChange, icon: IconComponent }) => {
  return (
    <div className="cyber-border rounded-lg p-4 hover:bg-cyber-700/20 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            <div className="w-8 h-8 bg-cyber-700 rounded-lg flex items-center justify-center">
              <IconComponent className="w-4 h-4 text-primary-400" strokeWidth={1.5} />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <label htmlFor={id} className="block text-cyber-100 font-medium text-sm cursor-pointer">
              {label}
            </label>
            <p className="text-cyber-400 text-xs mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          <button
            id={id}
            onClick={() => onChange(!enabled)}
            className={`
              relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:ring-offset-2 focus:ring-offset-cyber-900
              ${enabled ? 'bg-primary-600' : 'bg-cyber-600'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 rounded-full bg-white shadow-lg transform transition-transform duration-200
                ${enabled ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
            {enabled && (
              <Check className="absolute left-1.5 top-1 w-3 h-3 text-white" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

const Settings: React.FC<SettingsProps> = ({ onBack, onSignOut, onDeviceRegistry, zkLoginState }) => {
  const [settings, setSettings] = useState({
    autoLock: true,
    requireLogin: false,
    breachAlerts: true,
  })

  const handleToggleChange = (key: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSignOut = () => {
    // You could add a confirmation dialog here
    onSignOut()
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyber-700/50">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-cyber-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-cyber-400 hover:text-cyber-200" strokeWidth={1.5} />
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyber-100">Settings</h2>
              <p className="text-xs text-cyber-400">Manage your security preferences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Security Options Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
            <h3 className="text-cyber-100 font-semibold">Security Options</h3>
          </div>

          <div className="space-y-3">
            <Toggle
              id="auto-lock"
              label="Auto-lock after 10 minutes"
              description="Automatically lock your vault when inactive to protect your passwords"
              enabled={settings.autoLock}
              onChange={(value) => handleToggleChange('autoLock', value)}
              icon={Lock}
            />

            <Toggle
              id="require-login"
              label="Require login on each browser session"
              description="Sign in every time you open a new browser session for maximum security"
              enabled={settings.requireLogin}
              onChange={(value) => handleToggleChange('requireLogin', value)}
              icon={Shield}
            />

            <Toggle
              id="breach-alerts"
              label="Enable breach alerts"
              description="Get notified if any of your saved accounts appear in data breaches"
              enabled={settings.breachAlerts}
              onChange={(value) => handleToggleChange('breachAlerts', value)}
              icon={AlertTriangle}
            />
          </div>
        </div>

        {/* Device Management Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Smartphone className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
            <h3 className="text-cyber-100 font-semibold">Device Management</h3>
          </div>

          <div className="cyber-border rounded-lg p-4 hover:bg-cyber-700/20 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-cyber-100 font-medium text-sm">Trusted Devices</h4>
                <p className="text-cyber-400 text-xs mt-1">
                  Manage devices that can access your vault
                </p>
              </div>
              <button
                onClick={onDeviceRegistry}
                className="px-4 py-2 cyber-button-secondary text-sm flex items-center space-x-2"
              >
                <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                <span>Manage</span>
              </button>
            </div>
          </div>
        </div>

        {/* zkLogin Information */}
        {zkLoginState && zkLoginState.isLoggedIn && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <KeySquare className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              <h3 className="text-cyber-100 font-semibold">zkLogin Authentication</h3>
            </div>

            <div className="cyber-border rounded-lg p-4 bg-cyber-800/30">
              <div className="space-y-4">
                {/* User Info */}
                {zkLoginState.userInfo && (
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-cyber-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-cyber-100 text-sm font-medium">User Profile</h4>
                      <p className="text-cyber-400 text-xs mt-1 break-all">
                        {zkLoginState.userInfo.name || zkLoginState.userInfo.email || zkLoginState.userInfo.sub}
                      </p>
                      <p className="text-cyber-500 text-xs mt-0.5">
                        Authenticated via {zkLoginState.userInfo.iss?.includes('google') ? 'Google' : 'OAuth Provider'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Sui Address */}
                {zkLoginState.userAddress && (
                  <div className="flex items-start space-x-3">
                    <KeySquare className="w-5 h-5 text-cyber-400 flex-shrink-0 mt-1" strokeWidth={1.5} />
                    <div>
                      <h4 className="text-cyber-100 text-sm font-medium">Sui Wallet Address</h4>
                      <div className="flex items-center space-x-1 mt-1">
                        <p className="text-cyber-400 text-xs break-all font-mono bg-cyber-800 p-1.5 rounded">
                          {zkLoginState.userAddress}
                        </p>
                        <button 
                          className="p-1 hover:bg-cyber-700 rounded" 
                          onClick={() => {
                            navigator.clipboard.writeText(zkLoginState.userAddress || '')
                            // You could show a toast here
                          }}
                          title="Copy address"
                        >
                          <Check className="w-4 h-4 text-primary-400" strokeWidth={1.5} />
                        </button>
                      </div>
                      <p className="text-cyber-500 text-xs mt-1.5">
                        Your zkLogin Wallet is securely linked to your account
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Account Section */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <LogOut className="w-5 h-5 text-cyber-400" strokeWidth={1.5} />
            <h3 className="text-cyber-100 font-semibold">Account</h3>
          </div>

          <div className="cyber-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-cyber-100 font-medium text-sm">Sign Out</h4>
                <p className="text-cyber-400 text-xs mt-1">
                  You'll need to sign in again to access your vault
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* App Info Section */}
        <div className="space-y-4">
          <div className="cyber-border rounded-lg p-4 bg-cyber-800/30">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mx-auto">
                <Shield className="w-6 h-6 text-primary-400" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-cyber-100 font-medium">Grand Warden</h4>
                <p className="text-cyber-400 text-xs">Version 1.0.0</p>
              </div>
              <div className="flex items-center justify-center space-x-2 text-xs text-cyber-500 mt-3">
                <Shield className="w-3 h-3" strokeWidth={1.5} />
                <span>Your passwords are encrypted and secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings