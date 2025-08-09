import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, ShieldAlert, ShieldCheck, Info, Bell, BellOff } from 'lucide-react'

const Alerts: React.FC = () => {
  const navigate = useNavigate()
  
  // Sample alert data (in a real app, this would come from an API/state)
  const alerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Password Breach Detected',
      description: 'Your LinkedIn password was found in a data breach. Please change it immediately.',
      date: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'warning',
      title: 'Weak Password',
      description: 'Your password for Amazon is weak. Consider updating it for better security.',
      date: '1 day ago',
      read: false
    },
    {
      id: 3,
      type: 'info',
      title: 'Password Expires Soon',
      description: 'Your work account password will expire in 3 days.',
      date: '2 days ago',
      read: true
    },
    {
      id: 4,
      type: 'success',
      title: 'Password Updated',
      description: 'Your Gmail password was successfully updated.',
      date: '1 week ago',
      read: true
    }
  ]
  
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert className="w-6 h-6 text-red-500" strokeWidth={1.5} />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-500" strokeWidth={1.5} />
      case 'info':
        return <Info className="w-6 h-6 text-blue-500" strokeWidth={1.5} />
      case 'success':
        return <ShieldCheck className="w-6 h-6 text-green-500" strokeWidth={1.5} />
      default:
        return <AlertTriangle className="w-6 h-6 text-cyber-400" strokeWidth={1.5} />
    }
  }
  
  const getAlertColorClass = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-800/30 bg-red-900/10'
      case 'warning':
        return 'border-yellow-800/30 bg-yellow-900/10'
      case 'info':
        return 'border-blue-800/30 bg-blue-900/10'
      case 'success':
        return 'border-green-800/30 bg-green-900/10'
      default:
        return ''
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
          <h1 className="text-xl font-semibold text-cyber-100">Security Alerts</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          <button className="cyber-border p-2 hover:bg-cyber-700/30 rounded-lg transition-colors">
            <BellOff className="w-5 h-5 text-cyber-400" strokeWidth={1.5} />
          </button>
          <button className="cyber-button-secondary py-2 px-3 text-sm">
            Mark All Read
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-4">
          {/* Alert Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="cyber-border rounded-lg p-3 text-center">
              <div className="inline-flex p-2 bg-red-900/20 rounded-lg mb-2">
                <ShieldAlert className="w-5 h-5 text-red-500" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-cyber-200">Critical</p>
              <p className="text-lg font-semibold text-cyber-100">2</p>
            </div>
            
            <div className="cyber-border rounded-lg p-3 text-center">
              <div className="inline-flex p-2 bg-yellow-900/20 rounded-lg mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-cyber-200">Warnings</p>
              <p className="text-lg font-semibold text-cyber-100">1</p>
            </div>
            
            <div className="cyber-border rounded-lg p-3 text-center">
              <div className="inline-flex p-2 bg-blue-900/20 rounded-lg mb-2">
                <Info className="w-5 h-5 text-blue-500" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-cyber-200">Info</p>
              <p className="text-lg font-semibold text-cyber-100">3</p>
            </div>
            
            <div className="cyber-border rounded-lg p-3 text-center">
              <div className="inline-flex p-2 bg-green-900/20 rounded-lg mb-2">
                <ShieldCheck className="w-5 h-5 text-green-500" strokeWidth={1.5} />
              </div>
              <p className="text-xs font-medium text-cyber-200">Resolved</p>
              <p className="text-lg font-semibold text-cyber-100">8</p>
            </div>
          </div>
          
          {/* Active Alerts */}
          <h2 className="text-lg font-medium text-cyber-100 mb-3">Active Alerts</h2>
          
          {alerts.map((alert) => (
            <div 
              key={alert.id}
              className={`cyber-border rounded-lg p-4 ${getAlertColorClass(alert.type)} ${!alert.read ? 'border-l-4' : ''}`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-0.5">
                  {getAlertIcon(alert.type)}
                </div>
                
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-cyber-100">
                      {alert.title}
                    </h3>
                    <span className="text-xs text-cyber-500">
                      {alert.date}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-cyber-300">
                    {alert.description}
                  </p>
                  
                  {/* Action buttons */}
                  <div className="mt-3 flex items-center space-x-2">
                    {alert.type === 'critical' && (
                      <button className="cyber-button py-1 px-3 text-xs">
                        Fix Now
                      </button>
                    )}
                    {alert.type === 'warning' && (
                      <button className="cyber-button py-1 px-3 text-xs">
                        Review
                      </button>
                    )}
                    <button className="cyber-button-secondary py-1 px-3 text-xs">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Empty State */}
          {alerts.length === 0 && (
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-green-500/10 rounded-full blur-xl"></div>
                <div className="relative bg-cyber-800 border-2 border-green-500/20 rounded-full p-3">
                  <ShieldCheck className="w-10 h-10 text-green-500" strokeWidth={1} />
                </div>
              </div>
              <h3 className="text-cyber-100 font-medium text-lg">All Clear!</h3>
              <p className="text-cyber-400 text-sm mt-2 max-w-xs mx-auto">
                No security alerts detected. Your passwords and accounts appear to be safe.
              </p>
            </div>
          )}
          
          {/* Alert Settings Prompt */}
          <div className="mt-8 cyber-border bg-cyber-800/50 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-cyber-100">
                  Notification Preferences
                </h3>
                <p className="text-xs text-cyber-400 mt-1">
                  Configure which types of security alerts you want to receive
                </p>
              </div>
              <div className="ml-auto">
                <button className="cyber-button-secondary py-1 px-3 text-xs">
                  Configure
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Alerts