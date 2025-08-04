import React from 'react'
import { HelpCircle, Info, Mail } from 'lucide-react'

const Footer: React.FC = () => {
  const footerLinks = [
    { icon: HelpCircle, label: 'Help', action: () => console.log('Help clicked') },
    { icon: Info, label: 'About', action: () => console.log('About clicked') },
    { icon: Mail, label: 'Contact', action: () => console.log('Contact clicked') },
  ]

  return (
    <footer className="px-4 py-3 border-t border-cyber-700/30">
      <div className="flex items-center justify-center space-x-6">
        {footerLinks.map((link) => {
          const IconComponent = link.icon
          return (
            <button
              key={link.label}
              onClick={link.action}
              className="flex items-center space-x-2 text-cyber-400 hover:text-primary-400 
                       transition-colors duration-200 text-xs py-1 px-2 rounded-md
                       hover:bg-cyber-800/50"
            >
              <IconComponent className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="font-medium">{link.label}</span>
            </button>
          )
        })}
      </div>
      
      <div className="text-center mt-2">
        <p className="text-cyber-500 text-xs">
          v1.0.0 • Secured & Protected
        </p>
      </div>
    </footer>
  )
}

export default Footer