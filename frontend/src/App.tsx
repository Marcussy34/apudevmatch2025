import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  // Reflect webapp session in the extension
  useEffect(() => {
    const load = async () => {
      try {
        const data = await chrome.storage.local.get('gw_session')
        const addr = data?.gw_session?.address
        setIsLoggedIn(Boolean(addr))
        console.log('GW Extension App: initial session', data)
      } catch (e) {
        console.log('GW Extension App: no session', e)
      }
    }
    load()

    const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes.gw_session) {
        const newVal = changes.gw_session.newValue
        setIsLoggedIn(Boolean(newVal?.address))
        console.log('GW Extension App: session changed', newVal)
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const handleSignOut = async () => {
    try {
      await chrome.storage.local.remove('gw_session')
    } finally {
      setIsLoggedIn(false)
      console.log('GW Extension App: signed out (cleared gw_session)')
    }
  }

  return (
    <div className="w-full h-full flex flex-col cyber-gradient">
      <Header />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        {isLoggedIn ? (
          <Dashboard onSignOut={handleSignOut} />
        ) : (
          <LoginPrompt onLoginClick={() => setIsLoggedIn(true)} />
        )}
      </main>
      
      <Footer />
    </div>
  )
}

export default App