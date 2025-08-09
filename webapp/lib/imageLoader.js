// Custom image loader to handle IPFS URLs and other protocols
export default function imageLoader({ src, width, quality }) {
  // Handle IPFS URLs by converting them to a public gateway
  if (src.startsWith('ipfs://')) {
    const ipfsHash = src.replace('ipfs://', '');
    // Use a public IPFS gateway (you can change this to your preferred gateway)
    return `https://ipfs.io/ipfs/${ipfsHash}?w=${width}&q=${quality || 75}`;
  }
  
  // Handle regular HTTP/HTTPS URLs
  if (src.startsWith('http://') || src.startsWith('https://')) {
    return src;
  }
  
  // Handle relative paths (local assets)
  if (src.startsWith('/')) {
    return src;
  }
  
  // Default fallback
  return src;
}
