import React, { useState } from 'react'
import { ArrowLeft, AlertTriangle, Shield, Clock, Check, X, ExternalLink } from 'lucide-react'

interface AlertItem {
  id: number
  type: 'breach' | 'suspicious' | 'security'
  website: string
  title: string
  description: string
  timestamp: string
  isRead: boolean
  severity: 'high' | 'medium' | 'low'
}

interface AlertsProps {
  onBack: () => void
}

const Alerts: React.FC<AlertsProps> = ({ onBack }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 1,
      type: 'breach',
      website: 'Adobe',
      title: 'Password leaked in data breach',
      description: 'Your Adobe account password was found in a recent data breach. Change your password immediately to secure your account.',
      timestamp: '2 minutes ago',
      isRead: false,
      severity: 'high'
    },
    {
      id: 2,
      type: 'suspicious',
      website: 'LinkedIn',
      title: 'Suspicious login attempt detected',
      description: 'Someone tried to access your LinkedIn account from an unrecognized device in Russia. Review your account security.',
      timestamp: '1 hour ago',
      isRead: false,
      severity: 'high'
    },
    {
      id: 3,
      type: 'security',
      website: 'GitHub',
      title: 'Weak password detected',
      description: 'Your GitHub password is considered weak and may be vulnerable. Consider using our password generator for a stronger alternative.',
      timestamp: '3 hours ago',
      isRead: true,
      severity: 'medium'
    }
  ])

  const markAsRead = (id: number) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isRead: true } : alert
    ))
  }

  const dismissAlert = (id: number) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'breach':
        return <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
      case 'suspicious':
        return <Shield className="w-5 h-5 text-orange-400" strokeWidth={1.5} />
      case 'security':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" strokeWidth={1.5} />
    }
  }

  const getAlertColors = (severity: AlertItem['severity'], isRead: boolean) => {
    const opacity = isRead ? '20' : '30'
    switch (severity) {
      case 'high':
        return {
          border: `border-red-500/${opacity}`,
          bg: `bg-red-900/${opacity}`,
          accent: 'bg-red-500'
        }
      case 'medium':
        return {
          border: `border-orange-500/${opacity}`,
          bg: `bg-orange-900/${opacity}`,
          accent: 'bg-orange-500'
        }
      case 'low':
        return {
          border: `border-yellow-500/${opacity}`,
          bg: `bg-yellow-900/${opacity}`,
          accent: 'bg-yellow-500'
        }
    }
  }

  const unreadCount = alerts.filter(alert => !alert.isRead).length

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
              <div className="relative">
                <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
                </div>
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{unreadCount}</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-cyber-100">Security Alerts</h2>
                <p className="text-xs text-cyber-400">
                  {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All alerts reviewed'}
                </p>
              </div>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={() => setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })))}
              className="px-3 py-1.5 text-xs font-medium text-cyber-300 hover:text-cyber-100 
                       border border-cyber-600 hover:border-cyber-500 rounded-md transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto p-4">
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const colors = getAlertColors(alert.severity, alert.isRead)
              
              return (
                <div
                  key={alert.id}
                  className={`
                    ${colors.border} ${colors.bg} border rounded-lg p-4 transition-all duration-200
                    ${!alert.isRead ? 'shadow-lg' : ''} hover:bg-opacity-40
                  `}
                >
                  {/* Alert Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-cyber-100 font-semibold text-sm">
                            {alert.website}
                          </h3>
                          <div className={`w-2 h-2 ${colors.accent} rounded-full`} />
                          {!alert.isRead && (
                            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                          )}
                        </div>
                        
                        <h4 className={`font-medium text-sm mb-2 ${
                          alert.severity === 'high' ? 'text-red-200' :
                          alert.severity === 'medium' ? 'text-orange-200' : 'text-yellow-200'
                        }`}>
                          {alert.title}
                        </h4>
                        
                        <p className="text-cyber-300 text-xs leading-relaxed">
                          {alert.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => dismissAlert(alert.id)}
                      className="flex-shrink-0 p-1 hover:bg-cyber-700 rounded transition-colors ml-2"
                      title="Dismiss alert"
                    >
                      <X className="w-4 h-4 text-cyber-400 hover:text-cyber-200" strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Alert Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-cyber-700/30">
                    <div className="flex items-center space-x-2 text-xs text-cyber-500">
                      <Clock className="w-3 h-3" strokeWidth={1.5} />
                      <span>{alert.timestamp}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        className="px-3 py-1.5 text-xs font-medium text-cyber-300 hover:text-primary-300 
                                 hover:bg-cyber-700/50 rounded-md transition-colors flex items-center space-x-1.5"
                      >
                        <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                        <span>View Details</span>
                      </button>

                      {!alert.isRead && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs 
                                   font-medium rounded-md transition-colors flex items-center space-x-1.5"
                        >
                          <Check className="w-3 h-3" strokeWidth={1.5} />
                          <span>Mark as Read</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          // Empty State
          <div className="text-center py-16">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl"></div>
              <div className="relative bg-cyber-800 border-2 border-green-500/30 rounded-full p-3">
                <Shield className="w-10 h-10 text-green-400" strokeWidth={1} />
              </div>
            </div>
            <h3 className="text-cyber-300 text-lg font-medium mb-2">
              All Clear!
            </h3>
            <p className="text-cyber-500 text-sm max-w-xs mx-auto leading-relaxed">
              No security alerts at this time. We're actively monitoring your accounts for any threats.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {alerts.length > 0 && (
        <div className="p-4 border-t border-cyber-700/50">
          <div className="text-center">
            <p className="text-cyber-500 text-xs mb-3">
              Stay protected with real-time monitoring
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-cyber-400">
              <Shield className="w-3 h-3" strokeWidth={1.5} />
              <span>Powered by The Graph network</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Alerts