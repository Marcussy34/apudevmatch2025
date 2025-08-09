import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Smartphone, Laptop, Tablet, Monitor, Clock, CheckCircle, XCircle, MoreVertical } from 'lucide-react'
import DeviceRegistryTester from './DeviceRegistryTester'

const DeviceRegistry: React.FC = () => {
  const navigate = useNavigate()

  // Sample device data
  const devices = [
    {
      id: '1',
      name: 'MacBook Pro',
      type: 'laptop',
      lastActive: 'Now',
      status: 'current',
      location: 'New York, USA',
      browser: 'Chrome 118',
      os: 'macOS 13.1',
      addedDate: '3 months ago'
    },
    {
      id: '2',
      name: 'iPhone 15',
      type: 'smartphone',
      lastActive: '2 hours ago',
      status: 'active',
      location: 'New York, USA',
      browser: 'Safari Mobile',
      os: 'iOS 17.1',
      addedDate: '2 months ago'
    },
    {
      id: '3',
      name: 'Work PC',
      type: 'desktop',
      lastActive: '3 days ago',
      status: 'active',
      location: 'New York, USA',
      browser: 'Firefox 119',
      os: 'Windows 11',
      addedDate: '1 month ago'
    },
    {
      id: '4',
      name: 'Old iPad',
      type: 'tablet',
      lastActive: '3 weeks ago',
      status: 'inactive',
      location: 'Boston, USA',
      browser: 'Safari 15',
      os: 'iPadOS 15.4',
      addedDate: '6 months ago'
    }
  ]

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'laptop':
        return <Laptop className="w-6 h-6 text-cyber-400" strokeWidth={1.5} />
      case 'smartphone':
        return <Smartphone className="w-6 h-6 text-cyber-400" strokeWidth={1.5} />
      case 'tablet':
        return <Tablet className="w-6 h-6 text-cyber-400" strokeWidth={1.5} />
      case 'desktop':
        return <Monitor className="w-6 h-6 text-cyber-400" strokeWidth={1.5} />
      default:
        return <Smartphone className="w-6 h-6 text-cyber-400" strokeWidth={1.5} />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'current':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/20 text-green-400">
            <CheckCircle className="w-3 h-3 mr-1" strokeWidth={2} />
            Current
          </span>
        )
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/20 text-blue-400">
            Active
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyber-700/50 text-cyber-300">
            Inactive
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden container mx-auto max-w-4xl">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-cyber-700/50">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 cyber-border hover:bg-cyber-700/30 rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-cyber-400" strokeWidth={1.5} />
          </button>
          <h1 className="text-xl font-semibold text-cyber-100">Device Registry</h1>
        </div>
        
        <button className="cyber-button-secondary py-2 px-3 text-sm">
          Add Device
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {/* Info box */}
          <div className="cyber-border bg-primary-900/5 border-primary-700/20 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <Smartphone className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-cyber-100">
                  Device Management
                </h3>
                <p className="mt-1 text-sm text-cyber-300">
                  These are devices that can access your vault. You can revoke access for any device that you don't recognize.
                </p>
              </div>
            </div>
          </div>
          
          {/* Current Device */}
          <div>
            <h2 className="text-lg font-medium text-cyber-100 mb-3">Current Device</h2>
            <div className="cyber-border rounded-lg p-4 bg-cyber-700/10 border-primary-700/20">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-cyber-700/50 rounded-lg flex items-center justify-center">
                    <Laptop className="w-6 h-6 text-primary-400" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-cyber-100 font-medium">MacBook Pro</h3>
                    {getStatusBadge('current')}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center text-xs text-cyber-400 space-x-4">
                    <span className="flex items-center">
                      <Clock className="w-3 h-3 mr-1" strokeWidth={1.5} />
                      Now
                    </span>
                    <span>Chrome 118</span>
                    <span>macOS 13.1</span>
                    <span>New York, USA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Other Devices */}
          <div>
            <h2 className="text-lg font-medium text-cyber-100 mb-3">Other Devices</h2>
            <div className="space-y-3">
              {devices.filter(d => d.status !== 'current').map((device) => (
                <div key={device.id} className="cyber-border rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-cyber-700/50 rounded-lg flex items-center justify-center">
                        {getDeviceIcon(device.type)}
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-cyber-100 font-medium">{device.name}</h3>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(device.status)}
                          <button className="p-1 hover:bg-cyber-700 rounded transition-colors">
                            <MoreVertical className="w-4 h-4 text-cyber-500" strokeWidth={1.5} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center text-xs text-cyber-400 space-x-4">
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" strokeWidth={1.5} />
                          {device.lastActive}
                        </span>
                        <span>{device.browser}</span>
                        <span>{device.os}</span>
                        <span>{device.location}</span>
                      </div>
                      <div className="mt-3">
                        <button className="text-xs text-red-400 hover:text-red-300 transition-colors">
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recovery Options */}
          <div className="pt-4">
            <h2 className="text-lg font-medium text-cyber-100 mb-3">Recovery Options</h2>
            <div className="cyber-border rounded-lg p-5">
              <p className="text-sm text-cyber-300 mb-4">
                Configure recovery options in case you lose access to all your devices.
              </p>
              <button className="cyber-button w-full py-2.5">
                Configure Recovery Kit
              </button>
            </div>
          </div>

          {/* On-chain Contract Tester */}
          <div className="pt-6">
            <h2 className="text-lg font-medium text-cyber-100 mb-3">On-chain Device Registry Tester</h2>
            <div className="cyber-border rounded-lg">
              <DeviceRegistryTester />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceRegistry