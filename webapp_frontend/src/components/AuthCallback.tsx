import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Shield, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { ZkLoginService } from '../services/zklogin'

interface AuthCallbackProps {
  onLogin: (profile: { name: string; email: string; suiAddress: string; provider: string }) => void;
}

const AuthCallback: React.FC<AuthCallbackProps> = ({ onLogin }) => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [steps] = useState([
    'Processing OAuth response...',
    'Decoding JWT token...',
    'Generating user salt...',
    'Creating Sui address...',
    'Completing zkLogin flow...'
  ])

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setCurrentStep(0)
        
        // Debug: Log all URL parameters
        console.log('URL Search Params:', Object.fromEntries(searchParams.entries()))
        console.log('Full URL:', window.location.href)
        
        // Check for OAuth errors
        const error = searchParams.get('error')
        if (error) {
          setStatus('error')
          setErrorMessage(`OAuth error: ${error}`)
          return
        }

        // Get ID token from URL params
        let idToken = searchParams.get('id_token')
        console.log('ID Token received:', idToken ? 'Yes' : 'No')
        
        // Fallback: Check for other possible token parameters
        if (!idToken) {
          idToken = searchParams.get('token') || searchParams.get('access_token')
          console.log('Fallback token check:', idToken ? 'Found' : 'Not found')
        }
        
        // Additional debugging
        console.log('All search params keys:', Array.from(searchParams.keys()))
        console.log('Fragment:', window.location.hash)
        
        // Check URL fragment for tokens (some OAuth flows return tokens in #)
        if (!idToken && window.location.hash) {
          const fragmentParams = new URLSearchParams(window.location.hash.substring(1))
          idToken = fragmentParams.get('id_token')
          console.log('Fragment ID Token:', idToken ? 'Found' : 'Not found')
        }
        
        if (!idToken) {
          setStatus('error')
          setErrorMessage('No ID token received from Google. Please check your OAuth configuration.')
          return
        }

        setCurrentStep(1)
        
        // Complete zkLogin flow
        const userProfile = await ZkLoginService.completeZkLoginFlow(idToken)
        
        setCurrentStep(4)
        setStatus('success')
        
        // Wait a moment to show success, then redirect
        setTimeout(() => {
          onLogin({
            name: userProfile.name,
            email: userProfile.email,
            suiAddress: userProfile.suiAddress,
            provider: userProfile.provider
          })
          navigate('/dashboard')
        }, 1500)
        
      } catch (error) {
        console.error('Error in auth callback:', error)
        setStatus('error')
        setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred')
      }
    }

    handleCallback()
  }, [searchParams, onLogin, navigate])

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="cyber-border rounded-xl p-8 w-full max-w-md">
        <div className="text-center">
          <div className="inline-flex p-3 rounded-full bg-primary-500/10 mb-4">
            <Shield className="w-10 h-10 text-primary-400" strokeWidth={1.5} />
          </div>
          
          <h1 className="text-2xl font-bold text-cyber-100 mb-2">
            {status === 'processing' && 'Processing zkLogin...'}
            {status === 'success' && 'zkLogin Successful!'}
            {status === 'error' && 'zkLogin Failed'}
          </h1>
          
          <p className="text-cyber-400 mb-6">
            {status === 'processing' && 'Please wait while we complete your authentication'}
            {status === 'success' && 'Your Sui wallet has been created successfully'}
            {status === 'error' && 'There was an issue with the authentication process'}
          </p>

          {/* Progress Steps */}
          {status === 'processing' && (
            <div className="space-y-3 mb-6">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    index <= currentStep 
                      ? 'bg-cyber-800/50 border border-cyber-700' 
                      : 'bg-cyber-900/30'
                  }`}
                >
                  {index < currentStep ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : index === currentStep ? (
                    <Loader2 className="w-5 h-5 text-primary-400 animate-spin" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-cyber-600" />
                  )}
                  <span className={`text-sm ${
                    index <= currentStep ? 'text-cyber-200' : 'text-cyber-500'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <div className="flex items-center justify-center space-x-2 text-green-400 mb-6">
              <CheckCircle className="w-6 h-6" />
              <span className="text-lg font-medium">Redirecting to dashboard...</span>
            </div>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2 text-red-400 mb-4">
                <XCircle className="w-6 h-6" />
                <span className="text-lg font-medium">Authentication Failed</span>
              </div>
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p className="text-red-300 text-sm">{errorMessage}</p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="cyber-button w-full"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthCallback 