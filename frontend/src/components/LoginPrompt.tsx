import React, { useState, useEffect } from 'react'
import { Lock, Shield, Loader2, Wallet } from 'lucide-react'
import { zkLoginService } from '../utils/zkLoginService'

interface LoginPromptProps {
  onLoginClick: (state?: any) => void
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
  const [zkLoginStep, setZkLoginStep] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [zkAddress, setZkAddress] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is already logged in
    const userState = zkLoginService.getUserState()
    if (userState.isLoggedIn) {
      setZkAddress(userState.userAddress)
      onLoginClick()
    }
  }, [onLoginClick])

  // First test if background script is alive
  const checkBackgroundStatus = () => {
    console.log('Checking if background script is alive...')
    
    // Send a simple ping to check if the background script is responding
    chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Background script not responding:', chrome.runtime.lastError)
        setErrorMessage('Background script not responding. Please reload the extension.')
        setIsLoading(null)
        return
      }
      
      console.log('Background response to ping:', response)
      if (response && response.status === 'alive') {
        // Background is alive, proceed with auth
        performGoogleAuth()
      } else {
        console.error('Background script gave invalid response')
        setErrorMessage('Extension background service is not working properly.')
        setIsLoading(null)
      }
    })
  }
  
  const performGoogleAuth = () => {
    console.log('Sending auth request to background...')
    
    // Adding a timeout to detect if the message is not being handled
    const messageTimeoutId = setTimeout(() => {
      console.error('Background script message timed out after 10 seconds')
      setErrorMessage('Authentication request timed out. Please try again or reload the extension.')
      setIsLoading(null)
    }, 10000)
    
    chrome.runtime.sendMessage({ type: 'SIMPLE_GOOGLE_AUTH' }, (response) => {
      clearTimeout(messageTimeoutId)
      console.log('Got response from background script:', response)
      
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError)
        handleError(chrome.runtime.lastError)
        return
      }
      
      if (!response || !response.success) {
        console.error('Auth failed:', response)
        handleError(new Error(response?.error || 'Authentication failed'))
        return
      }
      
      // Success - we have authenticated!
      console.log('Authentication successful!')
      setZkLoginStep(3)
      
      // Use the user info from the response
      setIsLoading(null)
      onLoginClick({
        isLoggedIn: true,
        userAddress: '0x123...abc', // Placeholder
        userInfo: response.userInfo || {
          name: 'Test User',
          email: 'user@example.com',
        }
      })
    })
  }
  
  const handleGoogleLogin = async () => {
    setIsLoading('google')
    setErrorMessage(null)
    console.log('Starting Google login flow...')
    
    // Check if background script is alive first
    try {
      checkBackgroundStatus()
    } catch (error) {
      console.error('Error checking background status:', error)
      handleError(error)
    }
  }
  
  const handleError = (error: Error | unknown) => {
    console.error('zkLogin error:', error)
    setErrorMessage(error instanceof Error ? error.message : 'Login failed')
    setIsLoading(null)
  }

  const handleFacebookLogin = async (provider: 'facebook') => {
    setIsLoading(provider)
    setErrorMessage('Facebook login not implemented yet. Please use Google login.')
    setTimeout(() => {
      setIsLoading(null)
    }, 2000)
  }
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
      <div className="text-center space-y-6">
        {/* Hero Icon */}
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl animate-pulse-slow"></div>
          <div className="relative bg-cyber-800 border-2 border-primary-500/30 rounded-full p-4 shadow-cyber">
            {zkAddress ? (
              <Wallet className="w-12 h-12 text-primary-400" strokeWidth={1.5} />
            ) : (
              <Lock className="w-12 h-12 text-primary-400" strokeWidth={1.5} />
            )}
          </div>
        </div>

        {/* Welcome Text */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-cyber-100">
            Welcome to Grand Warden
          </h2>
          <p className="text-cyber-300 text-sm leading-relaxed max-w-xs">
            Sign in with zkLogin to access your secure password vault and protect your digital life.
          </p>
        </div>

        {/* zkLogin Status */}
        {zkLoginStep > 0 && (
          <div className="bg-cyber-800/50 p-4 rounded-lg border border-cyber-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-cyber-300">Authentication Progress</span>
                <span className="text-xs text-cyber-400">{zkLoginStep}/4</span>
              </div>
              <div className="w-full bg-cyber-700/50 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(zkLoginStep / 4) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-cyber-400 mt-1">
                {zkLoginStep === 1 && "Authenticated with Google"}
                {zkLoginStep === 2 && "Generated security keys"}
                {zkLoginStep === 3 && "Created Sui address"}
                {zkLoginStep === 4 && "Verified proof"}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="bg-red-900/20 border border-red-800 text-red-300 p-3 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        {/* Wallet Address */}
        {zkAddress && (
          <div className="bg-cyber-800/50 p-3 rounded-lg border border-cyber-700">
            <div className="text-xs text-cyber-400 mb-1">Your Sui Address</div>
            <div className="text-xs font-mono text-cyber-200 break-all">
              {zkAddress}
            </div>
          </div>
        )}

        {/* Social Login Buttons */}
        <div className="space-y-4 pt-4 w-full max-w-sm">
          {/* Google Login */}
          <button 
            onClick={() => handleGoogleLogin()}
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
              {isLoading === 'google' ? 'Authenticating via zkLogin...' : 'Sign in with Google'}
            </span>
          </button>

          {/* Facebook Login */}
          <button 
            onClick={() => handleFacebookLogin('facebook')}
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
              {isLoading === 'facebook' ? 'Coming soon...' : 'Sign in with Facebook'}
            </span>
          </button>

          {/* Security Info */}
          <div className="flex items-center justify-center space-x-2 text-xs text-cyber-400 mt-4">
            <Shield className="w-4 h-4" strokeWidth={1.5} />
            <span>Secure login using Sui zkLogin. No password required.</span>
          </div>

          {/* Or Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cyber-700/50"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-cyber-900 px-3 text-cyber-500 font-medium">Zero-Knowledge Proof</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="mt-8 space-y-3 w-full max-w-sm">
        <div className="cyber-border rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span className="text-cyber-300 text-sm">Sign in with Google, no passwords</span>
          </div>
        </div>
        
        <div className="cyber-border rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span className="text-cyber-300 text-sm">Secure zero-knowledge authentication</span>
          </div>
        </div>
        
        <div className="cyber-border rounded-lg p-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
            <span className="text-cyber-300 text-sm">Sui blockchain-powered security</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt