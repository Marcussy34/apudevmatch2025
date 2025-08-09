import React, { useEffect, useState } from 'react'
import { Shield } from 'lucide-react'

const Header: React.FC = () => {
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await chrome.storage.local.get('gw_session')
        const addr = data?.gw_session?.address || null
        setAddress(addr)
        console.log('GW Extension Header: loaded gw_session', data)
      } catch (e) {
        console.log('GW Extension Header: no session', e)
      }
    }
    load()

    const onChanged = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
      if (area === 'local' && changes.gw_session) {
        const newVal = changes.gw_session.newValue
        setAddress(newVal?.address || null)
        console.log('GW Extension Header: gw_session changed', newVal)
      }
    }
    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  return (
    <header className="flex items-center justify-center py-4 px-6 border-b border-cyber-700/50">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <Shield 
            className="w-8 h-8 text-primary-400 animate-pulse-slow" 
            strokeWidth={2}
          />
          <div className="absolute inset-0 w-8 h-8 bg-primary-400/20 rounded-full blur-md animate-glow"></div>
        </div>
        <div>
          <h1 className="text-xl font-bold text-cyber-100 tracking-wide">
            Grand Warden
          </h1>
          <p className="text-xs text-cyber-400 font-medium">
            {address ? `Connected: ${address.slice(0,6)}...${address.slice(-4)}` : 'Your Digital Guardian'}
          </p>
        </div>
      </div>
    </header>
  )
}

export default Header