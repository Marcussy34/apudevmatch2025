import React, { useState } from 'react'
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import Dashboard from './components/Dashboard'
import Footer from './components/Footer'

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
      </main>
      
      <Footer />
    </div>
  )
}

export default App