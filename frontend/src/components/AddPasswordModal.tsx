import React, { useState } from 'react'
import { X, Eye, EyeOff, Globe, Save, AlertCircle } from 'lucide-react'

interface AddPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (passwordData: NewPasswordData) => void
}

export interface NewPasswordData {
  name: string
  url: string
  username: string
  password: string
}

const AddPasswordModal: React.FC<AddPasswordModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState<NewPasswordData>({
    name: '',
    url: '',
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<NewPasswordData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<NewPasswordData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Website name is required'
    }

    if (!formData.url.trim()) {
      newErrors.url = 'Website URL is required'
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL'
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username/Email is required'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      // Add protocol if missing
      const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`
      new URL(urlWithProtocol)
      return true
    } catch {
      return false
    }
  }

  const handleInputChange = (field: keyof NewPasswordData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      onSave(formData)
      setIsSubmitting(false)
      handleClose()
    }, 1000)
  }

  const handleClose = () => {
    setFormData({ name: '', url: '', username: '', password: '' })
    setErrors({})
    setShowPassword(false)
    setIsSubmitting(false)
    onClose()
  }

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 16; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    handleInputChange('password', password)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md bg-cyber-900 border border-cyber-600/50 rounded-xl shadow-cyber-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyber-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary-400" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-cyber-100">Add New Password</h2>
              <p className="text-xs text-cyber-400">Store a new credential securely</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-cyber-800 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-cyber-400 hover:text-cyber-200" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Website Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-cyber-200">
              Website Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Gmail, GitHub, Facebook"
              className={`cyber-input w-full ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
              disabled={isSubmitting}
            />
            {errors.name && (
              <div className="flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* Website URL */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-cyber-200">
              Website URL *
            </label>
            <input
              type="text"
              value={formData.url}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="e.g., gmail.com, github.com"
              className={`cyber-input w-full ${errors.url ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
              disabled={isSubmitting}
            />
            {errors.url && (
              <div className="flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                <span>{errors.url}</span>
              </div>
            )}
          </div>

          {/* Username/Email */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-cyber-200">
              Username/Email *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="your@email.com or username"
              className={`cyber-input w-full ${errors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
              disabled={isSubmitting}
            />
            {errors.username && (
              <div className="flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                <span>{errors.username}</span>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-cyber-200">
                Password *
              </label>
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs text-primary-400 hover:text-primary-300 font-medium"
                disabled={isSubmitting}
              >
                Generate Strong
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter a strong password"
                className={`cyber-input w-full pr-10 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' : ''}`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-cyber-700 rounded transition-colors"
                disabled={isSubmitting}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4 text-cyber-400" strokeWidth={1.5} />
                )}
              </button>
            </div>
            {errors.password && (
              <div className="flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
                <span>{errors.password}</span>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 cyber-button-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 cyber-button flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" strokeWidth={1.5} />
                  <span>Save Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddPasswordModal