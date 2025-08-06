import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import Alerts from './components/Alerts'
import WalletVault from './components/WalletVault'
import DeviceRegistry from './components/DeviceRegistry'
import Analytics from './components/Analytics'
import Footer from './components/Footer'
import ToastContainer from './components/ToastContainer'
import { ToastProps } from './components/Toast'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const navigate = useNavigate()
  
  // Check if user is logged in on component mount
  useEffect(() => {
    const suiAddress = localStorage.getItem('suiWalletAddress')
    if (suiAddress) {
      setIsLoggedIn(true)
    }
  }, [])

  const handleSignIn = () => {
    setIsLoggedIn(true)
    // Show welcome toast
    addToast({
      type: 'success',
      title: 'Login Successful',
      message: 'Welcome to Grand Warden!',
      duration: 3000
    })
  }

  const handleSignOut = () => {
    setIsLoggedIn(false)
    navigate('/')
  }

  const addToast = (toast: Omit<ToastProps, 'onClose' | 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }])
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isLoggedIn) {
      return <Navigate to="/" replace />
    }
    return <>{children}</>
  }

  return (
    <div className="w-full h-full min-h-screen flex flex-col cyber-gradient">
      <Header isLoggedIn={isLoggedIn} onSignOut={handleSignOut} />
      
      <main className="flex-1 flex flex-col overflow-auto">
        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPrompt onLoginClick={handleSignIn} />
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard onSignOut={handleSignOut} addToast={addToast} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute>
                <Settings onSignOut={handleSignOut} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/alerts" 
            element={
              <ProtectedRoute>
                <Alerts />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/wallet" 
            element={
              <ProtectedRoute>
                <WalletVault />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/devices" 
            element={
              <ProtectedRoute>
                <DeviceRegistry />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      
      <Footer />

      {/* Toast Notifications - visible across all pages */}
      <ToastContainer 
        toasts={toasts}
        onRemoveToast={removeToast}
      />
    </div>
  )
}

export default App