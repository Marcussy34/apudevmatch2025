import React from 'react'
import { Shield } from 'lucide-react'

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center py-4 px-6 border-b border-cyber-700/50">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Shield 
            className="w-8 h-8 text-primary-400 animate-pulse-slow" 
            strokeWidth={2}
          />
          <div className="absolute inset-0 w-8 h-8 bg-primary-400/20 rounded-full blur-md animate-glow"></div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-cyber-100 tracking-wide">
            Grand Warden
          </h1>
          <p className="text-xs text-cyber-400 font-medium">
            Your Digital Guardian
          </p>
        </div>
      </div>
    </header>
  )
}

export default Header