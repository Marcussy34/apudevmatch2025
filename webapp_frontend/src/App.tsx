import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import LoginPrompt from './components/LoginPrompt'
import AuthCallback from './components/AuthCallback'
import OAuthTest from './components/OAuthTest'
import SimpleOAuthTest from './components/SimpleOAuthTest'
import Dashboard from './components/Dashboard'
import Settings from './components/Settings'
import Alerts from './components/Alerts'
import WalletVault from './components/WalletVault'
import DeviceRegistry from './components/DeviceRegistry'
import Analytics from './components/Analytics'
import Footer from './components/Footer'
import ToastContainer from './components/ToastContainer'
import { ToastProps } from './components/Toast'
import { ZkLoginService } from './services/zklogin'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; suiAddress: string; provider: string } | null>(null)
  const [toasts, setToasts] = useState<ToastProps[]>([])
  const navigate = useNavigate()
  
  // Check if user is logged in on component mount
  useEffect(() => {
    const storedProfile = ZkLoginService.getStoredUserProfile()
    if (storedProfile) {
      setIsLoggedIn(true)
      setUserProfile({
        name: storedProfile.name,
        email: storedProfile.email,
        suiAddress: storedProfile.suiAddress,
        provider: storedProfile.provider
      })
    }
  }, [])

  const handleLogin = (profile: { name: string; email: string; suiAddress: string; provider: string }) => {
    setIsLoggedIn(true)
    setUserProfile(profile)
    
    // Show welcome toast
    addToast({
      type: 'success',
      title: 'zkLogin Successful!',
      message: `Welcome ${profile.name}! Your Sui wallet has been created.`,
      duration: 5000
    })
  }

  const handleSignOut = () => {
    setIsLoggedIn(false)
    setUserProfile(null)
    ZkLoginService.clearZkLoginData()
    navigate('/')
    
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been successfully signed out.',
      duration: 3000
    })
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
      <Header isLoggedIn={isLoggedIn} onSignOut={handleSignOut} userProfile={userProfile} />
      
      <main className="flex-1 flex flex-col overflow-auto">
        <Routes>
          <Route 
            path="/" 
            element={
              isLoggedIn ? 
                <Navigate to="/dashboard" replace /> : 
                <LoginPrompt onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/auth/callback" 
            element={
              <AuthCallback onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/oauth-test" 
            element={
              <OAuthTest />
            } 
          />
          <Route 
            path="/simple-oauth-test" 
            element={
              <SimpleOAuthTest />
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