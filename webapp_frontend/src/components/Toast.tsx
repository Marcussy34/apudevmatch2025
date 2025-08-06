import React, { useEffect } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, X, Info } from 'lucide-react'

export interface ToastProps {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  onClose: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000,
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
        return <CheckCircle2 className="w-6 h-6 text-green-400" />
      case 'error':
        return <XCircle className="w-6 h-6 text-red-400" />
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-yellow-400" />
      case 'info':
        return <Info className="w-6 h-6 text-blue-400" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30'
      case 'error':
        return 'bg-red-500/10 border-red-500/30'
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30'
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30'
    }
  }

  return (
    <div className={`rounded-lg p-4 mb-3 border ${getBgColor()} backdrop-blur-sm animate-fade-in`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-cyber-100">
            {title}
          </h3>
          <p className="mt-1 text-sm text-cyber-300">
            {message}
          </p>
        </div>
        <button
          type="button"
          className="ml-4 inline-flex text-cyber-400 hover:text-cyber-100 focus:outline-none"
          onClick={() => onClose(id)}
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

export default Toast