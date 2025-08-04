import React, { useEffect } from 'react'
import { CheckCircle, X, AlertCircle, Info } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
  duration?: number
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 3000, 
  onClose 
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" strokeWidth={1.5} />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
      case 'info':
        return <Info className="w-5 h-5 text-blue-400" strokeWidth={1.5} />
    }
  }

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-500/50 text-green-100'
      case 'error':
        return 'bg-red-900/90 border-red-500/50 text-red-100'
      case 'info':
        return 'bg-blue-900/90 border-blue-500/50 text-blue-100'
    }
  }

  return (
    <div className={`
      ${getStyles()}
      border rounded-lg p-4 shadow-lg backdrop-blur-sm
      transform transition-all duration-300 ease-in-out
      animate-in slide-in-from-right-5
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {title}
          </p>
          {message && (
            <p className="text-xs mt-1 opacity-90">
              {message}
            </p>
          )}
        </div>

        <button
          onClick={() => onClose(id)}
          className="flex-shrink-0 p-1 hover:bg-white/10 rounded transition-colors"
        >
          <X className="w-4 h-4" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}

export default Toast