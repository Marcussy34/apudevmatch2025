import React from 'react'

const SimpleOAuthTest: React.FC = () => {
  const testOAuth = () => {
    // Use the exact same configuration as the working demo
    const CLIENT_ID = "36098691154-3j95ku5omvh399otb0id12q542st42c9.apps.googleusercontent.com"
    const REDIRECT_URI = "http://localhost:5173/oauth-test"
    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "id_token",
      scope: "openid",
      nonce: "test-nonce-" + Math.random().toString(36).substring(2),
    })
    
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    console.log('OAuth URL:', oauthUrl)
    window.location.href = oauthUrl
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Simple OAuth Test</h1>
      <button 
        onClick={testOAuth}
        className="cyber-button mb-4"
      >
        Test Google OAuth
      </button>
      <p className="text-sm text-cyber-400">
        This will redirect to Google OAuth and then back to /oauth-test to see what parameters are returned.
      </p>
    </div>
  )
}

export default SimpleOAuthTest 