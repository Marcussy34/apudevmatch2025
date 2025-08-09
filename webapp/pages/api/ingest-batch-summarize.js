// API route to proxy batch password analysis requests to ROFL worker
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get ROFL worker endpoint from environment or use default
    const roflEndpoint = process.env.NEXT_PUBLIC_ROFL_SUMMARY_ENDPOINT || 'http://localhost:8080/ingest-batch-summarize';
    
    console.log('🚀 Proxying batch summarize request to ROFL worker:', roflEndpoint);
    
    // Forward the request to ROFL worker
    const response = await fetch(roflEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ROFL worker error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `ROFL worker error: ${response.status}`,
        details: errorText 
      });
    }

    const data = await response.json();
    console.log('✅ ROFL worker response received, forwarding to frontend');
    
    // Forward the successful response
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to connect to ROFL worker',
      details: error.message 
    });
  }
}
