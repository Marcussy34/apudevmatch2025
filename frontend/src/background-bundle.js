// This is a simplified background script with no module imports
// to ensure compatibility with Chrome extension service workers

// Log startup
console.log('Background script loaded - STARTUP CHECK');

// Check identity availability
if (chrome.identity) {
  console.log('chrome.identity API is available');
} else {
  console.error('chrome.identity API is NOT available');
}

// Constants
const CLIENT_ID = '36098691154-oi9pm05ra1f70ov7pb43t9c0cg94isuo.apps.googleusercontent.com';
const EXTENSION_ID = chrome.runtime.id;
const REDIRECT_URI = `https://${EXTENSION_ID}.chromiumapp.org/`;

// State
let userState = {
  isLoggedIn: false,
  userInfo: null,
  userAddress: null
};

// Set up message listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background: Received message:', message);
  
  switch (message.type) {
    case 'PING':
      console.log('Background: Received PING message');
      const response = { 
        status: 'alive', 
        timestamp: Date.now(),
        identityAvailable: !!chrome.identity,
        extension_id: chrome.runtime.id,
        redirect_uri: REDIRECT_URI
      };
      console.log('Background: Sending PING response', response);
      sendResponse(response);
      break;
      
    case 'SIMPLE_GOOGLE_AUTH':
      console.log('Background: Received SIMPLE_GOOGLE_AUTH message');
      
      if (!chrome.identity) {
        console.error('Background: chrome.identity API is not available');
        sendResponse({ success: false, error: 'chrome.identity API is not available' });
        return false;
      }
      
      console.log('Background: Using chrome.identity.getAuthToken');
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        console.log('Background: Got auth token:', token ? 'yes' : 'no');
        
        if (!token) {
          console.error('Background: No token returned');
          sendResponse({ success: false, error: 'No authentication token returned' });
          return;
        }
        
        // Fetch user info
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch user info: ${response.status}`);
          }
          return response.json();
        })
        .then(userInfo => {
          console.log('Background: Got user info:', userInfo);
          
          // Update state
          userState = {
            isLoggedIn: true,
            userInfo: userInfo,
            userAddress: '0xSimulated123Address456'
          };
          
          sendResponse({ 
            success: true, 
            userInfo,
            token,
            state: userState
          });
        })
        .catch(error => {
          console.error('Background: Error fetching user info:', error);
          sendResponse({ 
            success: true, 
            token,
            error: String(error)
          });
        });
      });
      
      // Return true to keep the message channel open for the async response
      return true;
      
    case 'GET_USER_STATE':
      console.log('Background: Returning user state');
      sendResponse({ success: true, state: userState });
      break;
      
    case 'LOGOUT':
      if (chrome.identity) {
        chrome.identity.clearAllCachedAuthTokens(() => {
          console.log('Background: Auth tokens cleared');
          userState = {
            isLoggedIn: false,
            userInfo: null,
            userAddress: null
          };
          sendResponse({ success: true });
        });
        return true;
      } else {
        userState = {
          isLoggedIn: false,
          userInfo: null,
          userAddress: null
        };
        sendResponse({ success: true });
      }
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  // Return true for async response
  return true;
});

console.log('Background script initialization complete');