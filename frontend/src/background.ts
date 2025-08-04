// Background service worker for Grand Warden extension
// Handles communication between content scripts and popup

interface SavedCredential {
  id: number
  name: string
  url: string
  username: string
  password: string
  icon?: string
  color?: string
}

class GrandWardenBackground {
  private credentials: SavedCredential[] = [
    { id: 1, name: 'Gmail', url: 'gmail.com', username: 'john.doe@gmail.com', password: 'MySecure2023!' },
    { id: 2, name: 'GitHub', url: 'github.com', username: 'johndoe_dev', password: 'CodeMaster#456' },
    { id: 3, name: 'Amazon', url: 'amazon.com', username: 'john.doe@email.com', password: 'Shop2023$ecure' },
    { id: 4, name: 'Work Portal', url: 'company.com', username: 'j.doe', password: 'Work@Pass789' },
    { id: 5, name: 'LinkedIn', url: 'linkedin.com', username: 'john-doe-professional', password: 'Network#2023' }
  ]

  constructor() {
    this.setupMessageHandlers()
    this.loadCredentials()
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

      case 'PING':
        sendResponse({ status: 'alive', timestamp: Date.now() })
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
}

// Initialize background service
const grandWardenBackground = new GrandWardenBackground()

// Keep service worker alive
chrome.runtime.onSuspend.addListener(() => {
  console.log('Grand Warden background service worker suspending')
})

export {}