import React, { useEffect } from 'react'
import { useAuthCallback } from '@mysten/enoki/react'
import { useNavigate } from 'react-router-dom'

const AuthRedirect: React.FC = () => {
  const navigate = useNavigate()
  const { handled } = useAuthCallback()

  useEffect(() => {
    if (handled) {
      navigate('/dashboard', { replace: true })
    }
  }, [handled, navigate])

  // If needed, we could parse errors from URL params here and display them

  return (
    <div className="w-full h-full min-h-screen flex items-center justify-center p-4">
      <div className="cyber-border rounded-xl p-6">
        <p className="text-cyber-300">Completing login...</p>
      </div>
    </div>
  )
}

export default AuthRedirect


