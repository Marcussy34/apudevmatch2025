import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, BarChart3, PieChart, TrendingUp, Calendar, FileBarChart, Clock, Filter } from 'lucide-react'

const Analytics: React.FC = () => {
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
          <h1 className="text-xl font-semibold text-cyber-100">Security Analytics</h1>
        </div>
        
        <div className="flex space-x-2">
          <button className="cyber-border p-2 hover:bg-cyber-700/30 rounded-lg transition-colors">
            <FileBarChart className="w-5 h-5 text-cyber-400" strokeWidth={1.5} />
          </button>
          <button className="cyber-button-secondary py-2 px-3 text-sm flex items-center space-x-2">
            <Filter className="w-4 h-4" strokeWidth={1.5} />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="space-y-6">
          {/* Date Range Selector */}
          <div className="flex items-center justify-between">
            <div className="text-cyber-300">
              <span className="text-sm font-medium">Security Overview</span>
            </div>
            
            <div className="cyber-border rounded-lg overflow-hidden">
              <div className="flex divide-x divide-cyber-700/50">
                <button className="px-3 py-1.5 text-xs text-cyber-300 bg-cyber-700/20 hover:bg-cyber-700/40 transition-colors">
                  Week
                </button>
                <button className="px-3 py-1.5 text-xs text-cyber-100 bg-primary-600/20 hover:bg-primary-600/30 transition-colors">
                  Month
                </button>
                <button className="px-3 py-1.5 text-xs text-cyber-300 bg-cyber-700/20 hover:bg-cyber-700/40 transition-colors">
                  Year
                </button>
              </div>
            </div>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="cyber-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-cyber-400">Total Credentials</p>
                  <p className="text-2xl font-semibold text-cyber-100 mt-1">37</p>
                </div>
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <PieChart className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-xs text-green-400 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" strokeWidth={1.5} />
                <span>+5 this month</span>
              </div>
            </div>
            
            <div className="cyber-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-cyber-400">Password Strength</p>
                  <p className="text-2xl font-semibold text-cyber-100 mt-1">82%</p>
                </div>
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-xs text-green-400 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" strokeWidth={1.5} />
                <span>+8% improvement</span>
              </div>
            </div>
            
            <div className="cyber-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-cyber-400">Security Alerts</p>
                  <p className="text-2xl font-semibold text-cyber-100 mt-1">3</p>
                </div>
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-xs text-red-400 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" strokeWidth={1.5} transform="rotate(180)" />
                <span>2 active alerts</span>
              </div>
            </div>
            
            <div className="cyber-border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-cyber-400">Autofill Count</p>
                  <p className="text-2xl font-semibold text-cyber-100 mt-1">42</p>
                </div>
                <div className="p-2 bg-cyber-700/50 rounded-lg">
                  <Clock className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
              </div>
              <div className="text-xs text-green-400 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" strokeWidth={1.5} />
                <span>Time saved: 7m 30s</span>
              </div>
            </div>
          </div>
          
          {/* Charts - Visualization Placeholder */}
          <div className="space-y-6">
            {/* Password Strength Distribution */}
            <div className="cyber-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-cyber-100 mb-4">Password Strength Distribution</h3>
              <div className="h-48 w-full cyber-border rounded-lg flex items-center justify-center bg-cyber-800/30">
                <div className="text-center">
                  <PieChart className="w-8 h-8 text-cyber-500 mx-auto mb-2" strokeWidth={1} />
                  <p className="text-xs text-cyber-400">Chart visualization placeholder</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                <div className="text-center">
                  <div className="w-full h-2 bg-red-500 rounded-full mb-1"></div>
                  <span className="text-xs text-cyber-400">Weak</span>
                  <p className="text-sm font-medium text-cyber-200">5</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 bg-orange-500 rounded-full mb-1"></div>
                  <span className="text-xs text-cyber-400">Fair</span>
                  <p className="text-sm font-medium text-cyber-200">8</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 bg-yellow-500 rounded-full mb-1"></div>
                  <span className="text-xs text-cyber-400">Good</span>
                  <p className="text-sm font-medium text-cyber-200">13</p>
                </div>
                <div className="text-center">
                  <div className="w-full h-2 bg-green-500 rounded-full mb-1"></div>
                  <span className="text-xs text-cyber-400">Strong</span>
                  <p className="text-sm font-medium text-cyber-200">11</p>
                </div>
              </div>
            </div>
            
            {/* Recent Activity */}
            <div className="cyber-border rounded-lg p-4">
              <h3 className="text-sm font-medium text-cyber-100 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {/* Timeline items */}
                <div className="flex">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                  <div className="ml-4">
                    <p className="text-sm text-cyber-200">Password updated for <span className="text-primary-400">Amazon</span></p>
                    <p className="text-xs text-cyber-500 mt-0.5">Today, 2:34 PM</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-green-500"></div>
                  <div className="ml-4">
                    <p className="text-sm text-cyber-200">Autofill used for <span className="text-primary-400">Gmail</span></p>
                    <p className="text-xs text-cyber-500 mt-0.5">Today, 11:15 AM</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-yellow-500"></div>
                  <div className="ml-4">
                    <p className="text-sm text-cyber-200">Weak password detected for <span className="text-primary-400">Facebook</span></p>
                    <p className="text-xs text-cyber-500 mt-0.5">Yesterday, 3:22 PM</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-500"></div>
                  <div className="ml-4">
                    <p className="text-sm text-cyber-200">New password saved for <span className="text-primary-400">Twitter</span></p>
                    <p className="text-xs text-cyber-500 mt-0.5">Yesterday, 1:05 PM</p>
                  </div>
                </div>
              </div>
              
              <button className="w-full cyber-button-secondary py-2 mt-4 text-sm">
                View All Activity
              </button>
            </div>
            
            {/* Data integration notice */}
            <div className="cyber-border bg-cyber-800/50 rounded-lg p-4 border-primary-700/20">
              <div className="flex items-start">
                <div className="p-1.5 bg-primary-800/20 rounded-md">
                  <BarChart3 className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-cyber-100">
                    Graph Integration Coming Soon
                  </h3>
                  <p className="text-xs text-cyber-400 mt-1">
                    Real-time analytics via The Graph's GraphQL endpoint will be available soon, providing live security signals and event tracking.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics