import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, User, LogOut, Lock, Bell, Smartphone, Download, Cloud, Key, MousePointer } from 'lucide-react'

interface SettingsProps {
  onSignOut?: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onSignOut }) => {
  const navigate = useNavigate()

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
          <h1 className="text-xl font-semibold text-cyber-100">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-8">
          {/* Account */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-cyber-100">Account</h2>
            
            <div className="cyber-border rounded-lg overflow-hidden">
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <User className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Profile</p>
                  <p className="text-xs text-cyber-400">Manage your account details</p>
                </div>
              </div>
              
              <div 
                className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer border-t border-cyber-700/50"
                onClick={() => navigate('/devices')}
              >
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Smartphone className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Devices</p>
                  <p className="text-xs text-cyber-400">Manage connected devices</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer border-t border-cyber-700/50">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Lock className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Master Password</p>
                  <p className="text-xs text-cyber-400">Change your master password</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Security */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-cyber-100">Security</h2>
            
            <div className="cyber-border rounded-lg overflow-hidden">
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Shield className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Two-Factor Authentication</p>
                  <p className="text-xs text-cyber-400">Add an extra layer of security</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer border-t border-cyber-700/50">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Bell className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Security Alerts</p>
                  <p className="text-xs text-cyber-400">Manage notification preferences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-cyber-100">Features</h2>
            
            <div className="cyber-border rounded-lg overflow-hidden">
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <MousePointer className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Autofill</p>
                  <p className="text-xs text-cyber-400">Configure autofill settings</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer border-t border-cyber-700/50">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Key className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Password Generator</p>
                  <p className="text-xs text-cyber-400">Customize password generation rules</p>
                </div>
              </div>
            </div>
          </div>

          {/* Data */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-cyber-100">Data</h2>
            
            <div className="cyber-border rounded-lg overflow-hidden">
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Cloud className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Sync</p>
                  <p className="text-xs text-cyber-400">Manage vault synchronization</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 hover:bg-cyber-700/20 transition-colors cursor-pointer border-t border-cyber-700/50">
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Download className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-cyber-200">Export</p>
                  <p className="text-xs text-cyber-400">Export your vault data</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sign Out */}
          {onSignOut && (
            <div className="pt-4">
              <button 
                onClick={onSignOut}
                className="w-full cyber-border hover:bg-red-900/20 border-red-800/30 text-red-400 rounded-lg p-4 flex items-center justify-center space-x-2 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" strokeWidth={1.5} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings