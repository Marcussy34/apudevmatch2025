import React from 'react'
import { Shield, Github } from 'lucide-react'

const Footer: React.FC = () => {
  return (
    <footer className="p-4 border-t border-cyber-700/50 bg-cyber-800/90 backdrop-blur-sm text-cyber-400 text-sm">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-3 md:mb-0">
          <Shield className="w-4 h-4 text-primary-500" />
          <span className="font-medium">Grand Warden</span>
          <span className="text-cyber-500">•</span>
          <span>A Secure Password Manager</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <a 
            href="https://github.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-cyber-400 hover:text-primary-400 transition-colors"
          >
            <Github className="w-4 h-4" />
          </a>
          <span>&copy; {new Date().getFullYear()} Grand Warden</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer