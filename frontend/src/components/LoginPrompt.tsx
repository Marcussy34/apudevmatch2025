import React, { useState } from 'react'
import { Lock, Shield, Loader2 } from 'lucide-react'

interface LoginPromptProps {
  onLoginClick: () => void
}

// Social Login Icons
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const LoginPrompt: React.FC<LoginPromptProps> = ({ onLoginClick }) => {
  const [isLoading, setIsLoading] = useState<'google' | 'facebook' | null>(null)

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    setIsLoading(provider)
    try {
      // Open the webapp for login (use plain origin; avoid duplicating query)
      const url = 'http://localhost:5173/'
      const [tab] = await chrome.tabs.query({ url })
      if (tab?.id) {
        await chrome.tabs.update(tab.id, { active: true })
      } else {
        await chrome.tabs.create({ url })
      }
    } finally {
      setIsLoading(null)
    }
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="text-center space-y-6">
        {/* Hero Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse-slow"></div>
          <div className="relative bg-cyber-800 border-2 border-primary-500/30 rounded-full p-4 shadow-cyber">
            <Lock className="w-12 h-12 text-primary-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-cyber-100">
            Welcome Back
          </h2>
          <p className="text-cyber-300 text-sm leading-relaxed max-w-xs">
            Sign in to access your secure password vault and protect your digital life.
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="space-y-4 pt-4 w-full max-w-sm">
          {/* Google Login */}
          <button 
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading !== null}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg
                     transition-all duration-200 ease-in-out shadow-lg hover:shadow-cyber
                     border border-gray-200 hover:border-gray-300 transform hover:scale-105
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     flex items-center justify-center space-x-3"
          >
            {isLoading === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <GoogleIcon />
            )}
            <span className="text-sm">
              {isLoading === 'google' ? 'Signing in...' : 'Sign in with Google'}
            </span>
          </button>

          {/* Facebook Login */}
          <button 
            onClick={() => handleSocialLogin('facebook')}
            disabled={isLoading !== null}
            className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-3 px-4 rounded-lg
                     transition-all duration-200 ease-in-out shadow-lg hover:shadow-cyber-lg
                     transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
                     disabled:transform-none flex items-center justify-center space-x-3"
          >
            {isLoading === 'facebook' ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <FacebookIcon />
            )}
            <span className="text-sm">
              {isLoading === 'facebook' ? 'Signing in...' : 'Sign in with Facebook'}
            </span>
          </button>

          {/* Security Info */}
          <div className="flex items-center justify-center space-x-2 text-xs text-cyber-400 mt-4">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
            <span>Secure login using your social account. No password required.</span>
          </div>

          {/* Or Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyber-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-cyber-900 px-3 text-cyber-500 font-medium">Fast & Secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 space-y-3 w-full max-w-sm">
        <div className="cyber-border rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span className="text-cyber-300 text-sm">Auto-fill passwords instantly</span>
          </div>
        </div>
        
        <div className="cyber-border rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span className="text-cyber-300 text-sm">Generate secure passwords</span>
          </div>
        </div>
        
        <div className="cyber-border rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span className="text-cyber-300 text-sm">Sync across all devices</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt