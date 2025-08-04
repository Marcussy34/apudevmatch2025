import React, { useState } from 'react'
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Users, Shield, AlertTriangle, Eye, Activity, Globe, Zap, Database } from 'lucide-react'

interface AnalyticsProps {
  onBack: () => void
}

interface MetricCard {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: React.ComponentType<any>
  color: string
}

interface BreachEvent {
  id: string
  service: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  affectedAccounts: number
  discoveredDate: string
  description: string
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'usage' | 'breaches'>('overview')

  const metrics: MetricCard[] = [
    {
      title: 'Total Vaults',
      value: '34,567',
      change: '+12.3%',
      trend: 'up',
      icon: Shield,
      color: 'text-blue-400'
    },
    {
      title: 'Active Users',
      value: '28,941',
      change: '+8.7%',
      trend: 'up',
      icon: Users,
      color: 'text-green-400'
    },
    {
      title: 'Security Alerts',
      value: '147',
      change: '-23.1%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-orange-400'
    },
    {
      title: 'Breach Prevention',
      value: '99.8%',
      change: '+0.2%',
      trend: 'up',
      icon: Shield,
      color: 'text-cyan-400'
    }
  ]

  const breachEvents: BreachEvent[] = [
    {
      id: '1',
      service: 'Adobe Creative Cloud',
      severity: 'critical',
      affectedAccounts: 38000000,
      discoveredDate: '2 hours ago',
      description: 'Password database compromised, immediate action required'
    },
    {
      id: '2',
      service: 'LastPass',
      severity: 'high',
      affectedAccounts: 25000000,
      discoveredDate: '1 day ago',
      description: 'Encrypted vault data accessed, users advised to change master passwords'
    },
    {
      id: '3',
      service: 'Twitter/X',
      severity: 'medium',
      affectedAccounts: 5400000,
      discoveredDate: '3 days ago',
      description: 'Email addresses and phone numbers exposed in data leak'
    },
    {
      id: '4',
      service: 'Dropbox',
      severity: 'low',
      affectedAccounts: 68000000,
      discoveredDate: '1 week ago',
      description: 'Metadata exposure, no password or file content compromised'
    }
  ]

  const getSeverityColor = (severity: BreachEvent['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/30 border-red-500/30'
      case 'high': return 'text-orange-400 bg-orange-900/30 border-orange-500/30'
      case 'medium': return 'text-yellow-400 bg-yellow-900/30 border-yellow-500/30'
      case 'low': return 'text-blue-400 bg-blue-900/30 border-blue-500/30'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  const getTrendIcon = (trend: MetricCard['trend']) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" strokeWidth={1.5} />
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" strokeWidth={1.5} />
      case 'neutral': return <Activity className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
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
              <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-cyber-100">Analytics Dashboard</h2>
                <p className="text-xs text-cyber-400">Security metrics powered by The Graph</p>
              </div>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-cyber-800/30 rounded-lg p-1">
            {[
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' },
              { id: '90d', label: '90D' },
              { id: '1y', label: '1Y' }
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  timeRange === range.id
                    ? 'bg-primary-600 text-white'
                    : 'text-cyber-400 hover:text-cyber-200 hover:bg-cyber-700/50'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Graph Status */}
      <div className="p-4 border-b border-cyber-700/50">
        <div className="cyber-border rounded-lg p-3 bg-green-900/20 border-green-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-green-200 text-sm font-medium">The Graph Network</p>
                <p className="text-green-300 text-xs">Connected • Indexing Sapphire events • 99.9% uptime</p>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs text-green-400">
              <span className="flex items-center space-x-1">
                <Database className="w-3 h-3" strokeWidth={1.5} />
                <span>12.7M events</span>
              </span>
              <span className="flex items-center space-x-1">
                <Zap className="w-3 h-3" strokeWidth={1.5} />
                <span>~200ms latency</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-2">
        <div className="flex space-x-1 bg-cyber-800/30 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'usage', label: 'Usage', icon: Activity },
            { id: 'breaches', label: 'Breaches', icon: AlertTriangle }
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
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((metric, index) => {
                const IconComponent = metric.icon
                return (
                  <div key={index} className="cyber-border rounded-lg p-4 bg-gradient-to-br from-cyber-800/30 to-cyber-700/30">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`w-8 h-8 bg-cyber-700 rounded-lg flex items-center justify-center ${metric.color}`}>
                        <IconComponent className="w-4 h-4" strokeWidth={1.5} />
                      </div>
                      {getTrendIcon(metric.trend)}
                    </div>
                    <h3 className="text-cyber-100 text-xl font-bold">{metric.value}</h3>
                    <p className="text-cyber-400 text-sm">{metric.title}</p>
                    <div className="flex items-center space-x-1 mt-2">
                      <span className={`text-xs font-medium ${
                        metric.trend === 'up' ? 'text-green-400' : 
                        metric.trend === 'down' ? 'text-red-400' : 'text-cyber-400'
                      }`}>
                        {metric.change}
                      </span>
                      <span className="text-xs text-cyber-500">from last {timeRange}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Activity Chart Placeholder */}
            <div className="cyber-border rounded-lg p-4">
              <h4 className="text-cyber-100 font-medium mb-4">Vault Activity Trends</h4>
              <div className="h-32 bg-cyber-800/30 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-8 h-8 text-cyber-600 mx-auto mb-2" strokeWidth={1} />
                  <p className="text-cyber-500 text-sm">Chart visualization</p>
                  <p className="text-cyber-600 text-xs">Real-time data from The Graph</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="cyber-border rounded-lg p-3 text-center">
                <p className="text-cyber-100 text-lg font-semibold">156</p>
                <p className="text-cyber-400 text-xs">New Vaults Today</p>
              </div>
              <div className="cyber-border rounded-lg p-3 text-center">
                <p className="text-cyber-100 text-lg font-semibold">2.3s</p>
                <p className="text-cyber-400 text-xs">Avg Query Time</p>
              </div>
              <div className="cyber-border rounded-lg p-3 text-center">
                <p className="text-cyber-100 text-lg font-semibold">8.9K</p>
                <p className="text-cyber-400 text-xs">Signatures Today</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="cyber-border rounded-lg p-4 bg-green-900/20">
                <h4 className="text-green-200 font-medium mb-2">Security Score</h4>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-cyber-800 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                  <span className="text-green-400 font-bold">92/100</span>
                </div>
                <p className="text-green-300 text-xs mt-2">Network security excellent</p>
              </div>
              
              <div className="cyber-border rounded-lg p-4">
                <h4 className="text-cyber-200 font-medium mb-2">Threat Detection</h4>
                <p className="text-cyber-100 text-xl font-bold">147</p>
                <p className="text-cyber-400 text-sm">Blocked attacks this month</p>
              </div>
            </div>

            <div className="cyber-border rounded-lg p-4">
              <h4 className="text-cyber-100 font-medium mb-4">Security Events (Last 24h)</h4>
              <div className="space-y-3">
                {[
                  { type: 'Phishing Attempt', count: 23, severity: 'high' },
                  { type: 'Suspicious Login', count: 8, severity: 'medium' },
                  { type: 'Weak Password Alert', count: 45, severity: 'low' },
                  { type: 'Device Authorization', count: 12, severity: 'info' }
                ].map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-cyber-800/30 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        event.severity === 'high' ? 'bg-red-400' :
                        event.severity === 'medium' ? 'bg-orange-400' :
                        event.severity === 'low' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}></div>
                      <span className="text-cyber-200 text-sm">{event.type}</span>
                    </div>
                    <span className="text-cyber-400 text-sm">{event.count} events</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="cyber-border rounded-lg p-4">
                <h4 className="text-cyber-200 font-medium mb-2">Peak Usage</h4>
                <p className="text-cyber-100 text-xl font-bold">14:30 UTC</p>
                <p className="text-cyber-400 text-sm">~4.2K concurrent users</p>
              </div>
              
              <div className="cyber-border rounded-lg p-4">
                <h4 className="text-cyber-200 font-medium mb-2">Avg Session</h4>
                <p className="text-cyber-100 text-xl font-bold">8.3 min</p>
                <p className="text-cyber-400 text-sm">+2.1 min from last week</p>
              </div>
            </div>

            <div className="cyber-border rounded-lg p-4">
              <h4 className="text-cyber-100 font-medium mb-4">Feature Usage</h4>
              <div className="space-y-3">
                {[
                  { feature: 'Password Vault', usage: 89, color: 'bg-blue-400' },
                  { feature: 'Wallet Vault', usage: 76, color: 'bg-green-400' },
                  { feature: 'Device Registry', usage: 45, color: 'bg-yellow-400' },
                  { feature: 'Recovery Kit', usage: 23, color: 'bg-purple-400' }
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-cyber-200">{item.feature}</span>
                      <span className="text-cyber-400">{item.usage}%</span>
                    </div>
                    <div className="bg-cyber-800 rounded-full h-2">
                      <div 
                        className={`${item.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${item.usage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'breaches' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-cyber-100 font-medium">Recent Data Breaches</h4>
              <span className="text-xs text-cyber-400">Updated 12 minutes ago</span>
            </div>
            
            {breachEvents.map((breach) => (
              <div key={breach.id} className={`cyber-border rounded-lg p-4 ${getSeverityColor(breach.severity)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-sm">{breach.service}</h5>
                    <p className="text-xs opacity-80 mt-1">{breach.description}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border capitalize ${getSeverityColor(breach.severity)}`}>
                      {breach.severity}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs opacity-80">
                  <span>{formatNumber(breach.affectedAccounts)} accounts affected</span>
                  <span>{breach.discoveredDate}</span>
                </div>
              </div>
            ))}

            <div className="cyber-border rounded-lg p-4 bg-cyber-800/30 text-center">
              <Globe className="w-6 h-6 text-cyber-500 mx-auto mb-2" strokeWidth={1} />
              <p className="text-cyber-400 text-sm">Monitoring 15,000+ services</p>
              <p className="text-cyber-500 text-xs mt-1">Real-time breach detection via The Graph</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Analytics