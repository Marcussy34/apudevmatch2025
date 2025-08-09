import React, { useEffect, useState } from 'react'
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'
import { WalletImport } from './components/WalletImport'

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
        
        {/* Sapphire Encryption Demo Section */}
        <div className="bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-2">🔐 Sapphire Encryption Demo</h2>
            <p className="text-center text-gray-600 mb-6">
              Experience Grand Warden's privacy-first security with automatic encryption
            </p>
            <WalletImport 
              onSuccess={(result) => console.log('Wallet import success:', result)}
              onError={(error) => console.error('Wallet import error:', error)}
            />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}

export default App