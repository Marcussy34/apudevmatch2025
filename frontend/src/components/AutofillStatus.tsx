import React, { useState, useEffect } from 'react'
import { Zap, Globe, Check, AlertCircle, Loader2 } from 'lucide-react'

interface AutofillStatusProps {
  className?: string
}

interface TabInfo {
  domain: string
  url: string
  hasCredentials: boolean
  credentialCount: number
  isLoginPage: boolean
}

const AutofillStatus: React.FC<AutofillStatusProps> = ({ className = '' }) => {
  const [tabInfo, setTabInfo] = useState<TabInfo | null>(null)
  const [isAutofilling, setIsAutofilling] = useState(false)
  const [lastAutofillResult, setLastAutofillResult] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    // Check current tab and autofill status
    checkCurrentTab()
    
    // Listen for autofill events
    const handleMessage = (message: any) => {
      if (message.type === 'AUTOFILL_STATUS_UPDATE') {
        setTabInfo(message.tabInfo)
      }
    }

    // Mock current tab detection (in real implementation, use chrome.tabs API)
    const mockTabInfo: TabInfo = {
      domain: 'github.com',
      url: 'https://github.com/login',
      hasCredentials: true,
      credentialCount: 1,
      isLoginPage: true
    }

    // Simulate checking for current tab after component mount
    setTimeout(() => {
      setTabInfo(mockTabInfo)
    }, 500)

  }, [])

  const checkCurrentTab = async () => {
    try {
      // In real implementation, use chrome.tabs.query to get current tab
      // const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      // For demo, we'll use mock data
      console.log('Checking current tab for autofill opportunities...')
    } catch (error) {
      console.error('Error checking current tab:', error)
    }
  }

  const handleAutofill = async () => {
    if (!tabInfo) return

    setIsAutofilling(true)
    setLastAutofillResult(null)

    try {
      // In real implementation, send message to content script
      // await chrome.tabs.sendMessage(tabId, { type: 'PERFORM_AUTOFILL' })
      
      // Simulate autofill process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setLastAutofillResult('success')
      
      // Reset success state after 3 seconds
      setTimeout(() => {
        setLastAutofillResult(null)
      }, 3000)
      
    } catch (error) {
      console.error('Autofill failed:', error)
      setLastAutofillResult('error')
      
      setTimeout(() => {
        setLastAutofillResult(null)
      }, 3000)
    } finally {
      setIsAutofilling(false)
    }
  }

  if (!tabInfo) {
    return (
      <div className={`cyber-border rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyber-700 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-cyber-300 text-sm">Checking for autofill opportunities...</p>
            <div className="flex items-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-cyber-600 rounded-full animate-pulse"></div>
              <span className="text-cyber-500 text-xs">Scanning current page</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tabInfo.hasCredentials || !tabInfo.isLoginPage) {
    return (
      <div className={`cyber-border rounded-lg p-3 bg-cyber-800/20 ${className}`}>
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-cyber-700 rounded-lg flex items-center justify-center">
            <Globe className="w-4 h-4 text-cyber-500" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <p className="text-cyber-400 text-sm">No autofill available</p>
            <p className="text-cyber-500 text-xs">
              {!tabInfo.hasCredentials 
                ? `No saved credentials for ${tabInfo.domain}`
                : 'Not on a login page'
              }
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`cyber-border rounded-lg p-3 bg-gradient-to-r from-primary-900/20 to-primary-800/20 border-primary-500/30 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            {lastAutofillResult === 'success' ? (
              <Check className="w-4 h-4 text-green-400" strokeWidth={2} />
            ) : lastAutofillResult === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-400" strokeWidth={1.5} />
            ) : isAutofilling ? (
              <Loader2 className="w-4 h-4 text-primary-400 animate-spin" strokeWidth={1.5} />
            ) : (
              <Zap className="w-4 h-4 text-primary-400" strokeWidth={1.5} />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <p className="text-primary-200 text-sm font-medium">
                {lastAutofillResult === 'success' ? 'Autofilled successfully!' :
                 lastAutofillResult === 'error' ? 'Autofill failed' :
                 isAutofilling ? 'Autofilling...' :
                 'Autofill ready'}
              </p>
              {!lastAutofillResult && !isAutofilling && (
                <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <p className="text-primary-300/80 text-xs">
              {lastAutofillResult === 'success' ? `Credentials filled on ${tabInfo.domain}` :
               lastAutofillResult === 'error' ? 'Please try again or fill manually' :
               isAutofilling ? 'Filling credentials securely...' :
               `${tabInfo.credentialCount} credential${tabInfo.credentialCount > 1 ? 's' : ''} available for ${tabInfo.domain}`
              }
            </p>
          </div>
        </div>

        {!lastAutofillResult && (
          <button
            onClick={handleAutofill}
            disabled={isAutofilling}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-md transition-colors duration-200 flex items-center space-x-1.5"
          >
            {isAutofilling ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" strokeWidth={2} />
                <span>Filling...</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3" strokeWidth={2} />
                <span>Autofill</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Additional Info */}
      {!lastAutofillResult && !isAutofilling && (
        <div className="mt-3 pt-3 border-t border-primary-500/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4 text-primary-400/80">
              <span className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span>Secure</span>
              </span>
              <span className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                <span>Encrypted</span>
              </span>
            </div>
            <span className="text-primary-500">
              {tabInfo.domain}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default AutofillStatus