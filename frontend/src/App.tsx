import React, { useState } from 'react'
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'
import { WalletImport } from './components/WalletImport'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const handleSignOut = () => {
    setIsLoggedIn(false)
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