// Background service worker for Grand Warden extension
// Handles communication between content scripts and popup
console.log('BACKGROUND SCRIPT LOADED - STARTUP CHECK');

// Log chrome.identity availability
if (chrome.identity) {
  console.log('chrome.identity API is available');
} else {
  console.error('chrome.identity API is NOT available');
}

import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { SuiClient } from '@mysten/sui.js/client';
import { fromB64 } from '@mysten/sui.js/utils';
import { 
  genAddressSeed, 
  generateNonce, 
  generateRandomness, 
  getExtendedEphemeralPublicKey, 
  getZkLoginSignature,
  jwtToAddress
} from '@mysten/zklogin';
import { JwtPayload, jwtDecode } from 'jwt-decode';
import axios from 'axios';

import { 
  GOOGLE_CLIENT_ID, 
  REDIRECT_URI, 
  FULLNODE_URL,
  SUI_PROVER_DEV_ENDPOINT,
  KEY_PAIR_SESSION_STORAGE_KEY,
  USER_SALT_LOCAL_STORAGE_KEY,
  RANDOMNESS_SESSION_STORAGE_KEY,
  MAX_EPOCH_LOCAL_STORAGE_KEY,
  JWT_SESSION_STORAGE_KEY,
  ZKLOGIN_USER_ADDRESS_KEY
} from './config/zkLogin';

// Log important configuration values
console.log('Configuration check:');
console.log('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
console.log('REDIRECT_URI:', REDIRECT_URI);

interface SavedCredential {
  id: number
  name: string
  url: string
  username: string
  password: string
  icon?: string
  color?: string
}

interface ZkLoginState {
  isLoggedIn: boolean
  userAddress?: string
  userInfo?: any
  jwtToken?: string
}

type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

class GrandWardenBackground {
  private credentials: SavedCredential[] = [
    { id: 1, name: 'Gmail', url: 'gmail.com', username: 'john.doe@gmail.com', password: 'MySecure2023!' },
    { id: 2, name: 'GitHub', url: 'github.com', username: 'johndoe_dev', password: 'CodeMaster#456' },
    { id: 3, name: 'Amazon', url: 'amazon.com', username: 'john.doe@email.com', password: 'Shop2023$ecure' },
    { id: 4, name: 'Work Portal', url: 'company.com', username: 'j.doe', password: 'Work@Pass789' },
    { id: 5, name: 'LinkedIn', url: 'linkedin.com', username: 'john-doe-professional', password: 'Network#2023' }
  ]

  // zkLogin properties
  private suiClient = new SuiClient({ url: FULLNODE_URL })
  private ephemeralKeyPair?: Ed25519Keypair
  private randomness: string = ''
  private nonce: string = ''
  private maxEpoch: number = 0
  private currentEpoch: string = ''
  private jwtToken: string = ''
  private decodedJwt?: JwtPayload
  private userSalt?: string
  private userAddress: string = ''
  private zkProofData?: PartialZkLoginSignature
  private extendedEphemeralPublicKey: string = ''
  private zkLoginState: ZkLoginState = {
    isLoggedIn: false
  }

  constructor() {
    this.setupMessageHandlers()
    this.loadCredentials()
    this.loadZkLoginState()
  }

  private setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
      return true // Keep message channel open for async responses
    })

    // Handle extension installation
    chrome.runtime.onInstalled.addListener(() => {
      console.log('Grand Warden extension installed')
      this.saveCredentials()
    })

    // Handle tab updates to detect login pages
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.checkForLoginPage(tabId, tab.url)
      }
    })
  }

  private async handleMessage(message: any, sender: any, sendResponse: (response?: any) => void) {
    switch (message.type) {
      case 'GET_CREDENTIALS_FOR_DOMAIN':
        const matchingCredentials = this.getCredentialsForDomain(message.domain)
        sendResponse({ 
          success: true, 
          credentials: matchingCredentials,
          domain: message.domain 
        })
        break

      case 'SAVE_CREDENTIAL':
        const saved = await this.saveNewCredential(message.credential)
        sendResponse({ success: saved, id: saved ? Date.now() : null })
        break

      case 'GET_ALL_CREDENTIALS':
        sendResponse({ success: true, credentials: this.credentials })
        break

      case 'DELETE_CREDENTIAL':
        const deleted = this.deleteCredential(message.id)
        sendResponse({ success: deleted })
        break

      case 'UPDATE_CREDENTIAL':
        const updated = this.updateCredential(message.id, message.credential)
        sendResponse({ success: updated })
        break

      case 'OPEN_SAVE_DIALOG':
        // Open popup with pre-filled domain information
        this.openPopupWithContext(message.domain, message.url)
        sendResponse({ success: true })
        break

      // zkLogin related messages
      case 'ZKLOGIN_PREPARE':
        console.log('Background: Received ZKLOGIN_PREPARE message')
        try {
          console.log('Background: Calling prepareForLogin')
          this.prepareForLogin().then(nonce => {
            console.log('Background: Login prepared successfully with nonce:', nonce)
            sendResponse({ success: true, nonce })
          }).catch(error => {
            console.error('Background: Error preparing for zkLogin:', error)
            sendResponse({ success: false, error: String(error) })
          })
        } catch (error) {
          console.error('Background: Error in ZKLOGIN_PREPARE handler:', error)
          sendResponse({ success: false, error: String(error) })
        }
        // Return true to indicate we're sending the response asynchronously
        return true

      case 'ZKLOGIN_GOOGLE_AUTH':
        console.log('Background: Received ZKLOGIN_GOOGLE_AUTH message');
        // Use a timeout to ensure the response is sent even if there's an issue
        const timeoutId = setTimeout(() => {
          console.error('Background: ZKLOGIN_GOOGLE_AUTH timed out');
          if (sendResponse) {
            sendResponse({ success: false, error: 'Google authentication timed out' });
          }
        }, 60000); // 60 seconds timeout
        
        try {
          const nonce = message.nonce || this.nonce;
          if (!nonce) {
            console.log('Background: Generating nonce for Google auth');
            await this.prepareForLogin();
          } else {
            console.log('Background: Using provided nonce:', nonce);
            this.nonce = nonce;
          }
          
          console.log('Background: Calling initiateGoogleAuth...');
          const idToken = await this.initiateGoogleAuth();
          console.log('Background: Got ID token, returning success response');
          clearTimeout(timeoutId);
          sendResponse({ success: true, idToken });
        } catch (error) {
          console.error('Background: Error during Google auth:', error);
          clearTimeout(timeoutId);
          sendResponse({ success: false, error: String(error) });
        }
        // Return true to indicate we're sending the response asynchronously
        return true;

      case 'ZKLOGIN_GET_USER_SALT':
        console.log('Background: Received ZKLOGIN_GET_USER_SALT message')
        try {
          this.getUserSalt().then(salt => {
            console.log('Background: Got user salt')
            sendResponse({ success: true, salt })
          }).catch(error => {
            console.error('Background: Error getting user salt:', error)
            sendResponse({ success: false, error: String(error) })
          })
        } catch (error) {
          console.error('Background: Error in ZKLOGIN_GET_USER_SALT handler:', error)
          sendResponse({ success: false, error: String(error) })
        }
        return true

      case 'ZKLOGIN_GENERATE_ADDRESS':
        console.log('Background: Received ZKLOGIN_GENERATE_ADDRESS message')
        try {
          this.generateSuiAddress().then(address => {
            console.log('Background: Generated Sui address:', address)
            sendResponse({ success: true, address })
          }).catch(error => {
            console.error('Background: Error generating Sui address:', error)
            sendResponse({ success: false, error: String(error) })
          })
        } catch (error) {
          console.error('Background: Error in ZKLOGIN_GENERATE_ADDRESS handler:', error)
          sendResponse({ success: false, error: String(error) })
        }
        return true

      case 'ZKLOGIN_GET_ZK_PROOF':
        console.log('Background: Received ZKLOGIN_GET_ZK_PROOF message')
        try {
          this.getZkProof().then(zkProof => {
            console.log('Background: Got ZK proof')
            sendResponse({ success: true, zkProof })
          }).catch(error => {
            console.error('Background: Error getting ZK proof:', error)
            sendResponse({ success: false, error: String(error) })
          })
        } catch (error) {
          console.error('Background: Error in ZKLOGIN_GET_ZK_PROOF handler:', error)
          sendResponse({ success: false, error: String(error) })
        }
        return true

      case 'ZKLOGIN_GET_STATE':
        sendResponse({ success: true, state: this.zkLoginState })
        break
        
      // Simple Google auth for testing
      case 'SIMPLE_GOOGLE_AUTH':
        console.log('Background: Received SIMPLE_GOOGLE_AUTH message')
        try {
          if (!chrome.identity) {
            console.error('Background: chrome.identity API is not available')
            sendResponse({ success: false, error: 'chrome.identity API is not available' })
            return
          }
          
          console.log('Background: Using chrome.identity.getAuthToken')
          chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            try {
              console.log('Background: Got auth token:', token ? 'yes' : 'no')
              
              if (!token) {
                console.error('Background: No token returned')
                sendResponse({ success: false, error: 'No authentication token returned' })
                return
              }
              
              // Fetch user info from Google
              try {
                const response = await fetch(
                  'https://www.googleapis.com/oauth2/v3/userinfo',
                  {
                    headers: { Authorization: `Bearer ${token}` }
                  }
                )
                
                if (!response.ok) {
                  throw new Error(`Failed to fetch user info: ${response.status}`)
                }
                
                const userInfo = await response.json()
                console.log('Background: Got user info:', userInfo)
                
                // Update state and respond
                this.zkLoginState.isLoggedIn = true
                this.zkLoginState.userInfo = userInfo
                
                sendResponse({ 
                  success: true, 
                  userInfo,
                  token
                })
              } catch (fetchError) {
                console.error('Background: Error fetching user info:', fetchError)
                // Still return success with the token
                sendResponse({ success: true, token })
              }
            } catch (error) {
              console.error('Background: Error in SIMPLE_GOOGLE_AUTH callback:', error)
              sendResponse({ success: false, error: String(error) })
            }
          })
          
          // Return true to keep the message channel open for the async response
          return true
        } catch (error) {
          console.error('Background: Error in SIMPLE_GOOGLE_AUTH handler:', error)
          sendResponse({ success: false, error: String(error) })
        }

      case 'ZKLOGIN_LOGOUT':
        console.log('Background: Received ZKLOGIN_LOGOUT message')
        try {
          this.resetZkLoginState().then(() => {
            console.log('Background: zkLogin state reset successfully')
            sendResponse({ success: true })
          }).catch(error => {
            console.error('Background: Error during logout:', error)
            sendResponse({ success: false, error: String(error) })
          })
        } catch (error) {
          console.error('Background: Error in ZKLOGIN_LOGOUT handler:', error)
          sendResponse({ success: false, error: String(error) })
        }
        return true

      case 'PING':
        console.log('Background: Received PING message')
        const response = { 
          status: 'alive', 
          timestamp: Date.now(),
          identityAvailable: !!chrome.identity,
          extension_id: chrome.runtime.id
        }
        console.log('Background: Sending PING response', response)
        sendResponse(response)
        break

      default:
        sendResponse({ success: false, error: 'Unknown message type' })
    }
  }

  private getCredentialsForDomain(domain: string): SavedCredential[] {
    return this.credentials.filter(credential => {
      const credentialDomain = credential.url.replace(/^https?:\/\//, '').replace(/^www\./, '')
      const checkDomain = domain.replace(/^www\./, '')
      
      return credentialDomain === checkDomain || 
             credentialDomain.includes(checkDomain) || 
             checkDomain.includes(credentialDomain.replace('.com', ''))
    })
  }

  private async saveNewCredential(credential: Omit<SavedCredential, 'id'>): Promise<boolean> {
    try {
      const newCredential: SavedCredential = {
        ...credential,
        id: Date.now() + Math.random()
      }
      
      this.credentials.push(newCredential)
      await this.saveCredentials()
      
      // Notify content scripts about new credential
      this.notifyContentScripts('CREDENTIAL_ADDED', newCredential)
      
      return true
    } catch (error) {
      console.error('Failed to save credential:', error)
      return false
    }
  }

  private deleteCredential(id: number): boolean {
    const index = this.credentials.findIndex(cred => cred.id === id)
    if (index !== -1) {
      this.credentials.splice(index, 1)
      this.saveCredentials()
      return true
    }
    return false
  }

  private updateCredential(id: number, updates: Partial<SavedCredential>): boolean {
    const credential = this.credentials.find(cred => cred.id === id)
    if (credential) {
      Object.assign(credential, updates)
      this.saveCredentials()
      return true
    }
    return false
  }

  private async loadCredentials() {
    try {
      const result = await chrome.storage.local.get(['grandWardenCredentials'])
      if (result.grandWardenCredentials) {
        this.credentials = result.grandWardenCredentials
        console.log(`Loaded ${this.credentials.length} saved credentials`)
      }
    } catch (error) {
      console.log('Using default credentials (storage not available)')
    }
  }
  
  // Load zkLogin state from storage
  private async loadZkLoginState() {
    try {
      // Load from Chrome storage
      const privateKey = await chrome.storage.session.get(KEY_PAIR_SESSION_STORAGE_KEY)
      if (privateKey && privateKey[KEY_PAIR_SESSION_STORAGE_KEY]) {
        this.ephemeralKeyPair = Ed25519Keypair.fromSecretKey(
          fromB64(privateKey[KEY_PAIR_SESSION_STORAGE_KEY])
        )
      }

      const randomness = await chrome.storage.session.get(RANDOMNESS_SESSION_STORAGE_KEY)
      if (randomness && randomness[RANDOMNESS_SESSION_STORAGE_KEY]) {
        this.randomness = randomness[RANDOMNESS_SESSION_STORAGE_KEY]
      }

      const jwtToken = await chrome.storage.session.get(JWT_SESSION_STORAGE_KEY)
      if (jwtToken && jwtToken[JWT_SESSION_STORAGE_KEY]) {
        this.jwtToken = jwtToken[JWT_SESSION_STORAGE_KEY]
        this.decodedJwt = jwtDecode(this.jwtToken)
        this.zkLoginState.userInfo = this.decodedJwt
      }

      const userSalt = await chrome.storage.local.get(USER_SALT_LOCAL_STORAGE_KEY)
      if (userSalt && userSalt[USER_SALT_LOCAL_STORAGE_KEY]) {
        this.userSalt = userSalt[USER_SALT_LOCAL_STORAGE_KEY]
      }

      const maxEpoch = await chrome.storage.local.get(MAX_EPOCH_LOCAL_STORAGE_KEY)
      if (maxEpoch && maxEpoch[MAX_EPOCH_LOCAL_STORAGE_KEY]) {
        this.maxEpoch = Number(maxEpoch[MAX_EPOCH_LOCAL_STORAGE_KEY])
      }

      const userAddress = await chrome.storage.local.get(ZKLOGIN_USER_ADDRESS_KEY)
      if (userAddress && userAddress[ZKLOGIN_USER_ADDRESS_KEY]) {
        this.userAddress = userAddress[ZKLOGIN_USER_ADDRESS_KEY]
        this.zkLoginState.userAddress = this.userAddress
      }

      // Update logged in state
      this.zkLoginState.isLoggedIn = Boolean(this.userAddress && this.jwtToken)
      this.zkLoginState.jwtToken = this.jwtToken

      console.log('ZkLogin state loaded:', this.zkLoginState.isLoggedIn ? 'Logged in' : 'Not logged in')
    } catch (error) {
      console.error('Error loading zkLogin state:', error)
    }
  }

  private async saveCredentials() {
    try {
      await chrome.storage.local.set({ 
        grandWardenCredentials: this.credentials 
      })
      console.log(`Saved ${this.credentials.length} credentials to storage`)
    } catch (error) {
      console.error('Failed to save credentials to storage:', error)
    }
  }

  private async checkForLoginPage(tabId: number, url: string) {
    try {
      const domain = new URL(url).hostname
      const matchingCredentials = this.getCredentialsForDomain(domain)
      
      if (matchingCredentials.length > 0) {
        // Set badge to indicate autofill is available
        chrome.action.setBadgeText({
          tabId: tabId,
          text: matchingCredentials.length.toString()
        })
        
        chrome.action.setBadgeBackgroundColor({
          tabId: tabId,
          color: '#3b82f6'
        })
        
        // Update badge tooltip
        chrome.action.setTitle({
          tabId: tabId,
          title: `Grand Warden - ${matchingCredentials.length} saved credential${matchingCredentials.length > 1 ? 's' : ''} for ${domain}`
        })
      } else {
        // Clear badge if no credentials
        chrome.action.setBadgeText({ tabId: tabId, text: '' })
        chrome.action.setTitle({ tabId: tabId, title: 'Grand Warden - Secure Password Manager' })
      }
    } catch (error) {
      console.error('Error checking login page:', error)
    }
  }

  private async notifyContentScripts(type: string, data: any) {
    try {
      const tabs = await chrome.tabs.query({ active: true })
      tabs.forEach(tab => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { type, data }).catch(() => {
            // Content script might not be loaded, ignore error
          })
        }
      })
    } catch (error) {
      console.error('Error notifying content scripts:', error)
    }
  }

  private async openPopupWithContext(domain: string, url: string) {
    try {
      // Store context for popup to access
      await chrome.storage.local.set({
        popupContext: {
          domain,
          url,
          timestamp: Date.now()
        }
      })
      
      // The popup will automatically open when user clicks the extension icon
      console.log(`Context set for popup: ${domain}`)
    } catch (error) {
      console.error('Error setting popup context:', error)
    }
  }

  // zkLogin methods

  // Step 1-2: Generate ephemeral key pair and prepare for login
  async prepareForLogin(): Promise<string> {
    try {
      console.log('Background: Starting prepareForLogin');
      
      // Generate ephemeral key pair if doesn't exist
      if (!this.ephemeralKeyPair) {
        console.log('Background: Generating ephemeral key pair');
        this.ephemeralKeyPair = Ed25519Keypair.generate();
        const keyPairData = {
          [KEY_PAIR_SESSION_STORAGE_KEY]: this.ephemeralKeyPair.export().privateKey
        }
        await chrome.storage.session.set(keyPairData);
        console.log('Background: Ephemeral key pair stored in session');
      } else {
        console.log('Background: Using existing ephemeral key pair');
      }

      // For debugging purposes, let's set a hardcoded max epoch to avoid network calls
      // that might be failing or timing out
      console.log('Background: Setting max epoch manually');
      this.maxEpoch = 1000;
      await chrome.storage.local.set({
        [MAX_EPOCH_LOCAL_STORAGE_KEY]: String(this.maxEpoch)
      });
      console.log('Background: Max epoch set to', this.maxEpoch);

      // Generate randomness
      console.log('Background: Generating randomness');
      this.randomness = generateRandomness();
      await chrome.storage.session.set({
        [RANDOMNESS_SESSION_STORAGE_KEY]: this.randomness
      });
      console.log('Background: Randomness generated and stored');

      // Generate nonce using ephemeral key pair, max epoch, and randomness
      console.log('Background: Generating nonce');
      this.nonce = generateNonce(
        this.ephemeralKeyPair.getPublicKey(),
        this.maxEpoch,
        this.randomness
      );
      console.log('Background: Nonce generated:', this.nonce);

      return this.nonce;
    } catch (error) {
      console.error('Background: Error preparing for login:', error);
      throw error;
    }
  }

  // Step 3: Initiate Google OAuth login
  async initiateGoogleAuth(): Promise<string> {
    console.log('Background: initiateGoogleAuth called');
    
    if (!this.nonce) {
      console.log('Background: No nonce found, generating one...');
      try {
        await this.prepareForLogin();
        console.log('Background: Nonce generated:', this.nonce);
      } catch (error) {
        console.error('Background: Failed to generate nonce:', error);
        throw error;
      }
    }
    
    return new Promise<string>((resolve, reject) => {
      try {
        // Using the chrome.identity.getAuthToken is simpler, but it doesn't return ID tokens
        // So we're using launchWebAuthFlow with the correct parameters
        
        // The standard URL for getting an ID token from Google
        const authURL = `https://accounts.google.com/o/oauth2/auth?` +
          `client_id=${GOOGLE_CLIENT_ID}&` +
          `response_type=id_token&` +
          `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` + 
          `scope=openid email profile&` +
          `nonce=${this.nonce}`;
          
        console.log('Background: Using auth URL:', authURL);
        
        // Launch the auth flow in interactive mode
        chrome.identity.launchWebAuthFlow(
          { url: authURL, interactive: true },
          (responseUrl) => {
            // Handle response
            if (chrome.runtime.lastError) {
              const error = chrome.runtime.lastError;
              console.error('Background: Auth flow error:', error);
              reject(error);
              return;
            }
            
            if (!responseUrl) {
              const error = new Error('No response URL returned from auth flow');
              console.error('Background:', error);
              reject(error);
              return;
            }
            
            console.log('Background: Got response URL:', responseUrl);
            
            try {
              // Parse the ID token from the response URL hash
              const urlHash = responseUrl.split('#')[1];
              if (!urlHash) {
                const error = new Error('No URL hash in response');
                console.error('Background:', error);
                reject(error);
                return;
              }
              
              const params = new URLSearchParams(urlHash);
              const idToken = params.get('id_token');
              
              if (!idToken) {
                const error = new Error('No ID token in response');
                console.error('Background:', error);
                reject(error);
                return;
              }
              
              console.log('Background: Successfully extracted ID token');
              
              // Store JWT token and decode it
              this.jwtToken = idToken;
              this.decodedJwt = jwtDecode(idToken);
              
              // Save to session storage
              chrome.storage.session.set({
                [JWT_SESSION_STORAGE_KEY]: idToken
              });
              
              // Update zkLogin state
              this.zkLoginState.isLoggedIn = true;
              this.zkLoginState.jwtToken = idToken;
              this.zkLoginState.userInfo = this.decodedJwt;
              
              resolve(idToken);
            } catch (error) {
              console.error('Background: Error processing auth response:', error);
              reject(error);
            }
          }
        );
      } catch (error) {
        console.error('Background: Fatal error in initiateGoogleAuth:', error);
        reject(error);
      }
    });
  }

  // Step 4: Generate or get User Salt
  async getUserSalt(): Promise<string> {
    if (this.userSalt) {
      return this.userSalt;
    }
    
    // Generate new salt if not exists
    const salt = generateRandomness();
    await chrome.storage.local.set({
      [USER_SALT_LOCAL_STORAGE_KEY]: salt
    });
    this.userSalt = salt;
    return salt;
  }

  // Step 5: Generate Sui Address from JWT and Salt
  async generateSuiAddress(): Promise<string> {
    if (!this.jwtToken || !this.userSalt) {
      throw new Error('JWT token or user salt not available');
    }

    const address = jwtToAddress(this.jwtToken, this.userSalt);
    this.userAddress = address;
    
    await chrome.storage.local.set({
      [ZKLOGIN_USER_ADDRESS_KEY]: address
    });
    
    this.zkLoginState.userAddress = address;
    return address;
  }

  // Step 6: Get ZK Proof
  async getZkProof(): Promise<PartialZkLoginSignature> {
    if (!this.jwtToken || !this.userSalt || !this.maxEpoch || !this.randomness) {
      throw new Error('Missing required data for ZK proof');
    }

    // Get extended ephemeral public key
    if (!this.ephemeralKeyPair) {
      throw new Error('Ephemeral key pair not available');
    }

    this.extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
      this.ephemeralKeyPair.getPublicKey()
    );

    try {
      // Request ZK proof from prover service
      const response = await axios.post(
        SUI_PROVER_DEV_ENDPOINT,
        {
          jwt: this.jwtToken,
          extendedEphemeralPublicKey: this.extendedEphemeralPublicKey,
          maxEpoch: this.maxEpoch,
          jwtRandomness: this.randomness,
          salt: this.userSalt,
          keyClaimName: 'sub',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      this.zkProofData = response.data as PartialZkLoginSignature;
      
      // If we have zkProof, we're fully logged in
      this.zkLoginState.isLoggedIn = true;
      
      return this.zkProofData;
    } catch (error) {
      console.error('Error getting ZK proof:', error);
      throw error;
    }
  }

  // Reset zkLogin state (logout)
  async resetZkLoginState(): Promise<void> {
    try {
      // Clear session storage
      await chrome.storage.session.remove([
        KEY_PAIR_SESSION_STORAGE_KEY,
        RANDOMNESS_SESSION_STORAGE_KEY,
        JWT_SESSION_STORAGE_KEY
      ]);
      
      // Reset instance variables
      this.ephemeralKeyPair = undefined;
      this.randomness = '';
      this.nonce = '';
      this.jwtToken = '';
      this.decodedJwt = undefined;
      this.zkProofData = undefined;
      this.extendedEphemeralPublicKey = '';
      
      // Update zkLogin state
      this.zkLoginState = {
        isLoggedIn: false
      };
      
      console.log('zkLogin state reset');
    } catch (error) {
      console.error('Error resetting zkLogin state:', error);
      throw error;
    }
  }

  // Clear everything including user salt (will change user's address)
  async resetEverything(): Promise<void> {
    await this.resetZkLoginState();
    
    try {
      await chrome.storage.local.remove([
        USER_SALT_LOCAL_STORAGE_KEY,
        MAX_EPOCH_LOCAL_STORAGE_KEY,
        ZKLOGIN_USER_ADDRESS_KEY
      ]);
      
      this.userSalt = undefined;
      this.maxEpoch = 0;
      this.userAddress = '';
      
      console.log('All zkLogin data reset');
    } catch (error) {
      console.error('Error resetting all zkLogin data:', error);
      throw error;
    }
  }
}

// Initialize background service
const grandWardenBackground = new GrandWardenBackground()

// Keep service worker alive
chrome.runtime.onSuspend.addListener(() => {
  console.log('Grand Warden background service worker suspending')
})

export {}