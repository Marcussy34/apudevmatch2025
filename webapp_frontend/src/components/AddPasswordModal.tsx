import React, { useState, useEffect } from 'react'
import { X, Eye, EyeOff, Globe, RefreshCw } from 'lucide-react'

export interface NewPasswordData {
  name: string
  url: string
  username: string
  password: string
}

interface AddPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: NewPasswordData) => void
}

const generatePassword = (length: number = 16): string => {
  const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz'
  const numberChars = '0123456789'
  const specialChars = '!@#$%^&*()_-+=<>?'
  
  const allChars = uppercaseChars + lowercaseChars + numberChars + specialChars
  
  let password = ''
  // Ensure at least one of each type
  password += uppercaseChars.charAt(Math.floor(Math.random() * uppercaseChars.length))
  password += lowercaseChars.charAt(Math.floor(Math.random() * lowercaseChars.length))
  password += numberChars.charAt(Math.floor(Math.random() * numberChars.length))
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length))
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('')
}

const AddPasswordModal: React.FC<AddPasswordModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwordLength, setPasswordLength] = useState(16)
  
  useEffect(() => {
    // Generate random password when modal opens
    if (isOpen) {
      setPassword(generatePassword(passwordLength))
    }
  }, [isOpen, passwordLength])
  
  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('')
      setUrl('')
      setUsername('')
      setPassword('')
      setShowPassword(false)
    }
  }, [isOpen])
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!name || !url || !username || !password) {
      return
    }
    
    onSave({ name, url, username, password })
    onClose()
  }
  
  const handleGeneratePassword = () => {
    setPassword(generatePassword(passwordLength))
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-cyber-900/80 backdrop-blur-sm">
      <div className="cyber-border rounded-xl overflow-hidden w-full max-w-lg animate-fade-in">
        <div className="p-5 border-b border-cyber-700/50 flex justify-between items-center">
          <h3 className="text-xl font-medium text-cyber-100">Add Credentials</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cyber-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-cyber-400" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-cyber-300 mb-1">
              Site/App Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gmail, Facebook, Twitter"
              className="cyber-input"
              required
            />
          </div>
          
          {/* URL */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-cyber-300 mb-1">
              Website URL
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-4 w-4 text-cyber-500" strokeWidth={1.5} />
              </div>
              <input
                type="text"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g. gmail.com"
                className="cyber-input pl-9"
                required
              />
            </div>
          </div>
          
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-cyber-300 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john.doe@example.com"
              className="cyber-input"
              required
            />
          </div>
          
          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-cyber-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cyber-input pr-20"
                required
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-cyber-700 rounded transition-colors mr-1"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="p-1 hover:bg-cyber-700 rounded transition-colors mr-2"
                >
                  <RefreshCw className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
          
          {/* Password Generator Options */}
          <div className="pt-2">
            <label htmlFor="passwordLength" className="block text-sm font-medium text-cyber-300 mb-1">
              Password Length: {passwordLength}
            </label>
            <input
              type="range"
              id="passwordLength"
              min="8"
              max="32"
              value={passwordLength}
              onChange={(e) => setPasswordLength(parseInt(e.target.value))}
              className="w-full bg-cyber-700 rounded-lg appearance-none cursor-pointer h-2"
            />
            <div className="flex justify-between text-xs text-cyber-500 mt-1">
              <span>8</span>
              <span>20</span>
              <span>32</span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cyber-button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="cyber-button flex-1"
            >
              Save Password
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPasswordModal