import React, { useState } from 'react'
import { Bell, BellOff } from 'lucide-react'

const AutofillStatus: React.FC = () => {
  const [isAutoFillEnabled, setIsAutoFillEnabled] = useState(false)

  const toggleAutoFill = () => {
    setIsAutoFillEnabled(!isAutoFillEnabled)
  }

  return (
    <div className={`cyber-border rounded-lg p-3 flex items-center justify-between transition-all duration-300 ${isAutoFillEnabled ? 'bg-primary-900/10 border-primary-700/30' : 'bg-cyber-800/50'}`}>
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isAutoFillEnabled ? 'bg-primary-500/20' : 'bg-cyber-700/50'}`}>
          {isAutoFillEnabled ? (
            <Bell className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
          ) : (
            <BellOff className="w-5 h-5 text-cyber-500" strokeWidth={1.5} />
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-cyber-200">
            {isAutoFillEnabled ? 'Autofill Active' : 'Autofill Disabled'}
          </p>
          <p className="text-xs text-cyber-400">
            {isAutoFillEnabled 
              ? 'Password suggestions will appear on websites'
              : 'Enable to get password suggestions on websites'}
          </p>
        </div>
      </div>
      
      {/* Toggle Button */}
      <label className="relative inline-flex items-center cursor-pointer">
        <input 
          type="checkbox" 
          checked={isAutoFillEnabled}
          onChange={toggleAutoFill}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 rounded-full ${isAutoFillEnabled ? 'bg-primary-600' : 'bg-cyber-600'} peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-cyber-100 after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all`}></div>
      </label>
    </div>
  )
}

export default AutofillStatus