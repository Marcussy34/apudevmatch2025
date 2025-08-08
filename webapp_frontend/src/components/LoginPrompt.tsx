import React, { useState } from 'react'
import { Shield, Lock, Eye, EyeOff } from 'lucide-react'
import googleIcon from '../assets/google.svg'
import facebookIcon from '../assets/facebook.svg'
<<<<<<< HEAD
import { useConnectWallet, useWallets } from '@mysten/dapp-kit'
import { isEnokiWallet } from '@mysten/enoki'
=======
import { ZkLoginService } from '../services/zklogin'
>>>>>>> origin/ivy

interface LoginPromptProps {
  onLogin: (profile: { name: string; email: string; suiAddress: string; provider: string }) => void;
}

<<<<<<< HEAD
// (Removed unused mock address helpers)

const LoginPrompt: React.FC<LoginPromptProps> = ({ onLoginClick }) => {
=======
const LoginPrompt: React.FC<LoginPromptProps> = ({ onLogin }) => {
>>>>>>> origin/ivy
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isZkLoginLoading, setIsZkLoginLoading] = useState<string | null>(null)
  
  // Traditional master password login (simulated)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call delay for master password login
    setTimeout(() => {
      const simulatedProfile = {
        name: 'Master User',
        email: 'master@grandwarden.com',
        suiAddress: '0x' + Math.random().toString(16).substring(2, 66),
        provider: 'Master Password',
      }
      setIsLoading(false)
      onLogin(simulatedProfile)
    }, 1500)
  }
  
<<<<<<< HEAD
  const { mutateAsync: connect } = useConnectWallet()
  const wallets = useWallets().filter(isEnokiWallet)
  const [loginError, setLoginError] = useState<string | null>(null)
  const googleWallet = wallets.find((w: any) => w.provider === 'google')

  // zkLogin with Enoki via dapp-kit popup: Google only for now
  const handleSocialLogin = async (provider: string) => {
    if (provider !== 'google') return
    setIsZkLoginLoading(provider)
    try {
      setLoginError(null)
      if (!googleWallet) throw new Error('Google wallet not registered')
      await connect({ wallet: googleWallet })
      onLoginClick()
    } catch (e: any) {
      setLoginError(e?.message || 'Failed to start Google login')
      setIsZkLoginLoading(null)
    }
=======
  // Real zkLogin with Google
  const handleGoogleZkLogin = () => {
    setIsZkLoginLoading('google')
    
    try {
      // Initialize zkLogin OAuth flow
      ZkLoginService.initiateZkLoginFlow()
    } catch (error) {
      console.error('Error initiating zkLogin flow:', error)
      setIsZkLoginLoading(null)
    }
  }
  
  // Simulated Facebook login (for future implementation)
  const handleFacebookLogin = () => {
    setIsZkLoginLoading('facebook')
    
    // Simulate Facebook zkLogin flow
    setTimeout(() => {
      const simulatedProfile = {
        name: 'Facebook User',
        email: 'user@facebook.com',
        suiAddress: '0x' + Math.random().toString(16).substring(2, 66),
        provider: 'Facebook zkLogin',
      }
      setIsZkLoginLoading(null)
      onLogin(simulatedProfile)
    }, 2000)
>>>>>>> origin/ivy
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="cyber-border rounded-xl p-6 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-full bg-primary-500/10 mb-4">
            <Shield className="w-10 h-10 text-primary-400" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl font-bold text-cyber-100">Welcome to Grand Warden</h1>
          <p className="text-cyber-400 mt-2">Secure your digital life</p>
        </div>
        
        {/* Social Login Options */}
        <div className="mb-6">
          <p className="text-sm text-center text-cyber-300 mb-3">Sign in with zkLogin</p>
          <div className="space-y-3">
            <button 
<<<<<<< HEAD
              onClick={() => handleSocialLogin('google')}
              disabled={isZkLoginLoading !== null || !googleWallet}
=======
              onClick={handleGoogleZkLogin}
              disabled={isZkLoginLoading !== null}
>>>>>>> origin/ivy
              className="w-full cyber-border bg-white hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {isZkLoginLoading === 'google' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Initializing zkLogin...</span>
                </span>
              ) : (
                <>
                  <img src={googleIcon} alt="Google" className="w-5 h-5" />
<<<<<<< HEAD
                  <span>{googleWallet ? 'Continue with Google' : 'Google not available'}</span>
=======
                  <span>Continue with Google zkLogin</span>
>>>>>>> origin/ivy
                </>
              )}
            </button>
            
            <button 
              onClick={handleFacebookLogin}
              disabled={isZkLoginLoading !== null}
              className="w-full cyber-border bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              {isZkLoginLoading === 'facebook' ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Connecting with Facebook...</span>
                </span>
              ) : (
                <>
                  <img src={facebookIcon} alt="Facebook" className="w-5 h-5" />
                  <span>Continue with Facebook</span>
                </>
              )}
            </button>
          </div>
        </div>

        {loginError && (
          <p className="text-sm text-red-400 text-center mb-4">{loginError}</p>
        )}
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cyber-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-cyber-800 text-cyber-400">or continue with</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-cyber-300 mb-2">Master Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-cyber-500" strokeWidth={1.5} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="cyber-input pl-10 pr-10"
                placeholder="Enter your master password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-cyber-500 hover:text-cyber-300" strokeWidth={1.5} />
                ) : (
                  <Eye className="h-5 w-5 text-cyber-500 hover:text-cyber-300" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-cyber-600 text-primary-600 focus:ring-primary-500 bg-cyber-800"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-cyber-400">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-500 hover:text-primary-400">
                Forgot password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={!password || isLoading || isZkLoginLoading !== null}
              className="cyber-button w-full flex justify-center items-center"
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Unlocking...
                </span>
              ) : (
                "Unlock Vault"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-cyber-500">
            New to Grand Warden? <a href="#" className="text-primary-500 hover:text-primary-400">Create account</a>
          </p>
        </div>
        
        {/* zkLogin Info */}
        <div className="mt-6 bg-cyber-700/30 rounded-lg p-3 text-xs text-cyber-400 text-center">
          <p>zkLogin powered by Sui provides seed-phrase-free Web3 authentication</p>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt