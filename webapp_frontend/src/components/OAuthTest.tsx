import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const OAuthTest: React.FC = () => {
  const [searchParams] = useSearchParams()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const info = {
      url: window.location.href,
      searchParams: Object.fromEntries(searchParams.entries()),
      searchParamKeys: Array.from(searchParams.keys()),
      hash: window.location.hash,
      hashParams: window.location.hash ? Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)).entries()) : {},
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    }
    
    setDebugInfo(info)
    console.log('OAuth Debug Info:', info)
  }, [searchParams])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">OAuth Debug Information</h1>
      <pre className="bg-gray-800 p-4 rounded overflow-auto text-sm">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  )
}

export default OAuthTest 