import React, { useState, useEffect } from 'react'
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [zkLoginState, setZkLoginState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check zkLogin state on component mount
  useEffect(() => {
    const checkZkLoginState = () => {
      setLoading(true)
      chrome.runtime.sendMessage({ type: 'ZKLOGIN_GET_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Failed to check login state:', chrome.runtime.lastError)
        } else if (response && response.success && response.state && response.state.isLoggedIn) {
          setIsLoggedIn(true)
          setZkLoginState(response.state)
        }
        setLoading(false)
      })
    }
    
    // Add timeout to avoid infinite loading if there's no response
    const timeoutId = setTimeout(() => {
      setLoading(false)
    }, 5000) // 5 seconds timeout
    
    checkZkLoginState()
    
    return () => clearTimeout(timeoutId)
  }, [])

  const handleSignOut = () => {
    chrome.runtime.sendMessage({ type: 'ZKLOGIN_LOGOUT' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error signing out:', chrome.runtime.lastError)
      } else {
        setIsLoggedIn(false)
        setZkLoginState(null)
      }
    })
  }

  const handleLoginSuccess = (state: any) => {
    setIsLoggedIn(true)
    setZkLoginState(state)
  }

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col cyber-gradient">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          <p className="text-cyber-300 mt-4">Loading your secure vault...</p>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col cyber-gradient">
      <Header />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {isLoggedIn ? (
          <Dashboard 
            onSignOut={handleSignOut}
            zkLoginState={zkLoginState}
          />
        ) : (
          <LoginPrompt onLoginClick={handleLoginSuccess} />
        )}
      </main>
      
      <Footer />
    </div>
  )
}

export default App