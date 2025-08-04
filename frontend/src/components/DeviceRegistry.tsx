import React, { useState } from 'react'
import { ArrowLeft, Smartphone, Monitor, Tablet, Shield, MoreVertical, Check, X, Clock, MapPin, Wifi, Chrome, Lock, AlertTriangle } from 'lucide-react'

interface Device {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet'
  os: string
  browser: string
  location: string
  ip: string
  lastActive: string
  status: 'active' | 'trusted' | 'suspicious' | 'revoked'
  isCurrent: boolean
  fingerprint: string
  permissions: string[]
}

interface DeviceRegistryProps {
  onBack: () => void
}

const DeviceRegistry: React.FC<DeviceRegistryProps> = ({ onBack }) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null)
  const [showRevokeModal, setShowRevokeModal] = useState<string | null>(null)

  const devices: Device[] = [
    {
      id: '1',
      name: 'Personal Laptop',
      type: 'desktop',
      os: 'Windows 10',
      browser: 'Chrome 118',
      location: 'New York, US',
      ip: '192.168.1.45',
      lastActive: 'Active now',
      status: 'active',
      isCurrent: true,
      fingerprint: 'fp_a1b2c3d4e5f6',
      permissions: ['Password Vault', 'Wallet Vault', 'Recovery Kit']
    },
    {
      id: '2',
      name: 'iPhone 14 Pro',
      type: 'mobile',
      os: 'iOS 17.1',
      browser: 'Safari 17',
      location: 'New York, US',
      ip: '192.168.1.67',
      lastActive: '2 hours ago',
      status: 'trusted',
      isCurrent: false,
      fingerprint: 'fp_g7h8i9j0k1l2',
      permissions: ['Password Vault', 'Emergency Access']
    },
    {
      id: '3',
      name: 'Work MacBook',
      type: 'desktop',
      os: 'macOS Sonoma',
      browser: 'Chrome 118',
      location: 'New York, US',
      ip: '10.0.1.125',
      lastActive: '1 day ago',
      status: 'trusted',
      isCurrent: false,
      fingerprint: 'fp_m3n4o5p6q7r8',
      permissions: ['Password Vault']
    },
    {
      id: '4',
      name: 'Unknown Device',
      type: 'desktop',
      os: 'Linux Ubuntu',
      browser: 'Firefox 119',
      location: 'London, UK',
      ip: '185.199.108.153',
      lastActive: '3 days ago',
      status: 'suspicious',
      isCurrent: false,
      fingerprint: 'fp_s9t0u1v2w3x4',
      permissions: []
    },
    {
      id: '5',
      name: 'Old iPad',
      type: 'tablet',
      os: 'iPadOS 16.7',
      browser: 'Safari 16',
      location: 'Boston, US',
      ip: '74.125.224.72',
      lastActive: '2 weeks ago',
      status: 'revoked',
      isCurrent: false,
      fingerprint: 'fp_y5z6a7b8c9d0',
      permissions: []
    }
  ]

  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'mobile': return <Smartphone className="w-5 h-5" strokeWidth={1.5} />
      case 'desktop': return <Monitor className="w-5 h-5" strokeWidth={1.5} />
      case 'tablet': return <Tablet className="w-5 h-5" strokeWidth={1.5} />
    }
  }

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'active': return { bg: 'bg-green-500', text: 'text-green-400', badge: 'bg-green-900/30 border-green-500/30' }
      case 'trusted': return { bg: 'bg-blue-500', text: 'text-blue-400', badge: 'bg-blue-900/30 border-blue-500/30' }
      case 'suspicious': return { bg: 'bg-orange-500', text: 'text-orange-400', badge: 'bg-orange-900/30 border-orange-500/30' }
      case 'revoked': return { bg: 'bg-red-500', text: 'text-red-400', badge: 'bg-red-900/30 border-red-500/30' }
    }
  }

  const handleRevokeDevice = (deviceId: string) => {
    setShowRevokeModal(null)
    // In real app, this would call an API
    console.log(`Revoking device: ${deviceId}`)
  }

  const handleTrustDevice = (deviceId: string) => {
    // In real app, this would call an API
    console.log(`Trusting device: ${deviceId}`)
  }

  const trustedDevicesCount = devices.filter(d => d.status === 'active' || d.status === 'trusted').length
  const suspiciousDevicesCount = devices.filter(d => d.status === 'suspicious').length

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
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-cyber-100">Device Registry</h2>
                <p className="text-xs text-cyber-400">{trustedDevicesCount} trusted devices • {suspiciousDevicesCount} need attention</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="px-3 py-1.5 text-xs font-medium text-cyber-300 hover:text-cyber-100 
                           border border-cyber-600 hover:border-cyber-500 rounded-md transition-colors">
              Add Device
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 border-b border-cyber-700/50">
        <div className="grid grid-cols-3 gap-3">
          <div className="cyber-border rounded-lg p-3 text-center">
            <div className="w-2 h-2 bg-green-400 rounded-full mx-auto mb-2"></div>
            <p className="text-cyber-100 font-semibold">{trustedDevicesCount}</p>
            <p className="text-cyber-400 text-xs">Trusted</p>
          </div>
          <div className="cyber-border rounded-lg p-3 text-center">
            <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mb-2"></div>
            <p className="text-cyber-100 font-semibold">{suspiciousDevicesCount}</p>
            <p className="text-cyber-400 text-xs">Suspicious</p>
          </div>
          <div className="cyber-border rounded-lg p-3 text-center">
            <div className="w-2 h-2 bg-red-400 rounded-full mx-auto mb-2"></div>
            <p className="text-cyber-100 font-semibold">1</p>
            <p className="text-cyber-400 text-xs">Revoked</p>
          </div>
        </div>
      </div>

      {/* Device List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {devices.map((device) => {
            const statusColors = getStatusColor(device.status)
            const isExpanded = selectedDevice === device.id
            
            return (
              <div key={device.id} className="cyber-border rounded-lg transition-all duration-200">
                {/* Device Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-cyber-700/20 transition-colors"
                  onClick={() => setSelectedDevice(isExpanded ? null : device.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 bg-cyber-700 rounded-lg flex items-center justify-center ${statusColors.text}`}>
                        {getDeviceIcon(device.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-cyber-100 font-medium">{device.name}</h3>
                          {device.isCurrent && (
                            <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 text-xs rounded-full font-medium">
                              Current
                            </span>
                          )}
                          <div className={`px-2 py-0.5 border rounded-full ${statusColors.badge}`}>
                            <span className={`text-xs font-medium capitalize ${statusColors.text}`}>
                              {device.status}
                            </span>
                          </div>
                        </div>
                        <p className="text-cyber-400 text-sm">{device.os} • {device.browser}</p>
                        <div className="flex items-center space-x-4 text-xs text-cyber-500 mt-1">
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3" strokeWidth={1.5} />
                            <span>{device.location}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" strokeWidth={1.5} />
                            <span>{device.lastActive}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {device.status === 'suspicious' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTrustDevice(device.id)
                          }}
                          className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                          title="Trust device"
                        >
                          <Check className="w-3 h-3" strokeWidth={2} />
                        </button>
                      )}
                      
                      {device.status !== 'revoked' && !device.isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowRevokeModal(device.id)
                          }}
                          className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                          title="Revoke device"
                        >
                          <X className="w-3 h-3" strokeWidth={2} />
                        </button>
                      )}
                      
                      <button className="p-1.5 hover:bg-cyber-700 rounded-md transition-colors">
                        <MoreVertical className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-cyber-700/50 p-4 bg-cyber-800/30">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Technical Details */}
                      <div>
                        <h4 className="text-cyber-200 font-medium text-sm mb-3">Technical Details</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cyber-500">IP Address:</span>
                            <span className="text-cyber-300 font-mono">{device.ip}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-500">Fingerprint:</span>
                            <span className="text-cyber-300 font-mono">{device.fingerprint}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-500">Browser:</span>
                            <span className="text-cyber-300">{device.browser}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cyber-500">Operating System:</span>
                            <span className="text-cyber-300">{device.os}</span>
                          </div>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div>
                        <h4 className="text-cyber-200 font-medium text-sm mb-3">Permissions</h4>
                        {device.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {device.permissions.map((permission, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-cyber-700 text-cyber-300 text-xs rounded-md"
                              >
                                {permission}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-cyber-500 text-xs">No permissions granted</p>
                        )}
                      </div>

                      {/* Security Recommendations */}
                      {device.status === 'suspicious' && (
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                          <div className="flex items-start space-x-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400 mt-0.5" strokeWidth={1.5} />
                            <div>
                              <h5 className="text-orange-200 font-medium text-sm">Security Warning</h5>
                              <p className="text-orange-300 text-xs mt-1">
                                This device accessed your account from an unusual location. 
                                Review the activity and trust or revoke access.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Security Tips */}
      <div className="p-4 border-t border-cyber-700/50">
        <div className="cyber-border rounded-lg p-3 bg-cyber-800/30">
          <div className="flex items-start space-x-2">
            <Lock className="w-4 h-4 text-primary-400 mt-0.5" strokeWidth={1.5} />
            <div>
              <h4 className="text-primary-200 font-medium text-sm">Security Best Practices</h4>
              <p className="text-cyber-400 text-xs mt-1">
                Regularly review your trusted devices. Revoke access for devices you no longer use or recognize.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      {showRevokeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRevokeModal(null)} />
          
          <div className="relative w-full max-w-sm bg-cyber-900 border border-cyber-600/50 rounded-xl shadow-cyber-lg">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-cyber-100 font-semibold">Revoke Device Access</h3>
                  <p className="text-cyber-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-cyber-300 text-sm mb-6">
                This device will no longer be able to access your Grand Warden vault. 
                The user will need to sign in again and verify their identity.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRevokeModal(null)}
                  className="flex-1 cyber-button-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRevokeDevice(showRevokeModal)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Revoke Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeviceRegistry