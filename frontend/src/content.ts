// Content script that runs on all web pages to detect login forms
// This script communicates with the Grand Warden extension popup

interface LoginField {
  element: HTMLInputElement
  type: 'username' | 'password'
  icon?: HTMLElement
  dropdown?: HTMLElement
}

interface SavedCredential {
  id: number
  name: string
  url: string
  username: string
  password: string
}

class GrandWardenAutofill {
  private loginFields: Map<HTMLInputElement, LoginField> = new Map()
  private credentials: SavedCredential[] = []
  private isDropdownOpen = false
  private currentDropdown: HTMLElement | null = null

  constructor() {
    this.init()
  }

  private init() {
    // Load mock credentials (in real app, this would come from extension storage)
    this.loadCredentials()
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.detectLoginFields())
    } else {
      this.detectLoginFields()
    }

    // Watch for dynamically added forms
    this.observeFormChanges()
    
    // Listen for form submissions to auto-save new credentials
    this.setupFormSubmissionDetection()
    
    // Listen for messages from extension popup
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse)
    })

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => this.handleOutsideClick(e))
    
    console.log('Grand Warden: Content script loaded')
  }

  private detectLoginFields() {
    // Find all input fields that could be username or password fields
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]')
    
    inputs.forEach(input => {
      const inputElement = input as HTMLInputElement
      
      // Skip if already processed
      if (this.loginFields.has(inputElement)) return
      
      const fieldType = this.determineFieldType(inputElement)
      if (fieldType) {
        const loginField: LoginField = {
          element: inputElement,
          type: fieldType
        }
        
        this.loginFields.set(inputElement, loginField)
        this.enhanceField(loginField)
      }
    })

    console.log(`Grand Warden: Detected ${this.loginFields.size} login fields`)
  }

  private determineFieldType(input: HTMLInputElement): 'username' | 'password' | null {
    // Password field is obvious
    if (input.type === 'password') {
      return 'password'
    }

    // Check for username/email indicators
    const indicators = [
      input.name,
      input.id,
      input.placeholder,
      input.autocomplete,
      input.getAttribute('data-testid') || '',
      input.className
    ].join(' ').toLowerCase()

    if (indicators.includes('email') || 
        indicators.includes('user') || 
        indicators.includes('login') ||
        input.type === 'email') {
      return 'username'
    }

    return null
  }

  private loadCredentials() {
    // Mock credentials for demo (in real app, fetch from extension storage)
    this.credentials = [
      { id: 1, name: 'Gmail', url: 'gmail.com', username: 'john.doe@gmail.com', password: 'MySecure2023!' },
      { id: 2, name: 'GitHub', url: 'github.com', username: 'johndoe_dev', password: 'CodeMaster#456' },
      { id: 3, name: 'LinkedIn', url: 'linkedin.com', username: 'john.doe@professional.com', password: 'Network2024!' },
      { id: 4, name: 'Amazon', url: 'amazon.com', username: 'john.doe@email.com', password: 'Shop2023$ecure' },
      { id: 5, name: 'Facebook', url: 'facebook.com', username: 'john.doe.social', password: 'Social2024#' }
    ]
  }

  private enhanceField(loginField: LoginField) {
    const { element, type } = loginField
    
    // Make the input container relative for positioning
    const container = this.createFieldContainer(element)
    
    // Create the Grand Warden icon
    const icon = this.createFieldIcon(type)
    container.appendChild(icon)
    
    // Store references
    loginField.icon = icon
    
    // Add event listeners
    this.attachFieldListeners(loginField)
    
    console.log(`Grand Warden: Enhanced ${type} field`)
  }

  private createFieldContainer(input: HTMLInputElement): HTMLElement {
    // Check if input is already wrapped
    const existingContainer = input.parentElement
    if (existingContainer?.classList.contains('gw-field-container')) {
      return existingContainer
    }

    // Create container wrapper
    const container = document.createElement('div')
    container.className = 'gw-field-container'
    container.style.cssText = `
      position: relative;
      display: inline-block;
      width: 100%;
    `

    // Wrap the input
    input.parentNode?.insertBefore(container, input)
    container.appendChild(input)
    
    // Ensure input takes full width
    if (input.style.width && input.style.width !== '100%') {
      input.style.width = '100%'
    }

    return container
  }

  private createFieldIcon(type: 'username' | 'password'): HTMLElement {
    const icon = document.createElement('div')
    icon.className = `gw-field-icon gw-${type}-icon`
    
    const iconSvg = type === 'password' 
      ? this.getPasswordIcon() 
      : this.getUsernameIcon()
    
    icon.innerHTML = iconSvg
    icon.style.cssText = `
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 20px;
      cursor: pointer;
      z-index: 999999;
      opacity: 0.4;
      transition: opacity 0.2s ease;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(59, 130, 246, 0.3);
    `
    
    // Show more on hover
    icon.addEventListener('mouseenter', () => {
      icon.style.opacity = '1'
    })
    
    icon.addEventListener('mouseleave', () => {
      icon.style.opacity = '0.4'
    })
    
    return icon
  }

  private getPasswordIcon(): string {
    return `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(59, 130, 246)" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <circle cx="12" cy="16" r="1"></circle>
        <path d="m7 11 V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `
  }

  private getUsernameIcon(): string {
    return `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(59, 130, 246)" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `
  }

  private attachFieldListeners(loginField: LoginField) {
    const { element, icon } = loginField
    
    // Show icon on field focus/hover
    element.addEventListener('focus', () => this.showFieldIcon(loginField))
    element.addEventListener('mouseenter', () => this.showFieldIcon(loginField))
    
    // Hide icon when field loses focus (with delay)
    element.addEventListener('blur', () => {
      setTimeout(() => {
        if (!this.isDropdownOpen) {
          this.hideFieldIcon(loginField)
        }
      }, 200)
    })
    
    element.addEventListener('mouseleave', () => {
      if (!element.matches(':focus') && !this.isDropdownOpen) {
        this.hideFieldIcon(loginField)
      }
    })
    
    // Handle icon click
    icon?.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.handleIconClick(loginField)
    })
  }

  private showFieldIcon(loginField: LoginField) {
    if (loginField.icon) {
      loginField.icon.style.opacity = '1'
    }
  }

  private hideFieldIcon(loginField: LoginField) {
    if (loginField.icon && !this.isDropdownOpen) {
      loginField.icon.style.opacity = '0.4'
    }
  }

  private handleIconClick(loginField: LoginField) {
    console.log('Grand Warden: Icon clicked for', loginField.type, 'field')
    
    // Close any existing dropdown
    this.closeDropdown()
    
    // Get matching credentials
    const matchingCredentials = this.getMatchingCredentials()
    
    if (matchingCredentials.length === 0) {
      this.showNoCredentialsMessage(loginField)
      return
    }
    
    // If exactly one credential matches, auto-fill it immediately
    if (matchingCredentials.length === 1) {
      console.log('Grand Warden: Auto-filling single matching credential')
      this.fillCredentials(matchingCredentials[0])
      return
    }
    
    // If multiple credentials, show dropdown for selection
    this.showCredentialsDropdown(loginField, matchingCredentials)
  }

  private getMatchingCredentials(): SavedCredential[] {
    const domain = window.location.hostname.toLowerCase()
    console.log('Grand Warden: Matching credentials for domain:', domain)
    
    const matches = this.credentials.filter(credential => {
      const credentialUrl = credential.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
      const checkDomain = domain.replace(/^www\./, '')
      
      console.log(`Grand Warden: Checking ${credential.name} (${credentialUrl}) against ${checkDomain}`)
      
      // Exact match (highest priority)
      if (credentialUrl === checkDomain) {
        console.log(`Grand Warden: ✅ Exact match found - ${credential.name}`)
        return true
      }
      
      // Check if main domain matches (e.g., github.com matches github.com)
      const credentialMainDomain = credentialUrl.split('.').slice(-2).join('.')
      const checkMainDomain = checkDomain.split('.').slice(-2).join('.')
      if (credentialMainDomain === checkMainDomain) {
        console.log(`Grand Warden: ✅ Main domain match found - ${credential.name}`)
        return true
      }
      
      // Check subdomain matches (e.g., api.github.com matches github.com or www.linkedin.com matches linkedin.com)
      if (checkDomain.includes(credentialUrl) || credentialUrl.includes(checkDomain)) {
        console.log(`Grand Warden: ✅ Subdomain match found - ${credential.name}`)
        return true
      }
      
      // Check if domain name without TLD matches (e.g., github matches github.com)
      const credentialName = credentialUrl.replace(/\.(com|org|net|io|co|gov|edu|uk|ca|au)$/, '')
      const checkName = checkDomain.replace(/\.(com|org|net|io|co|gov|edu|uk|ca|au)$/, '')
      if (credentialName === checkName && credentialName.length > 2) {
        console.log(`Grand Warden: ✅ Name match found - ${credential.name}`)
        return true
      }
      
      // Special handling for common variations
      const specialMatches = {
        'linkedin': ['linkedin.com', 'www.linkedin.com', 'mobile.linkedin.com'],
        'facebook': ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'mobile.facebook.com'],
        'github': ['github.com', 'www.github.com', 'api.github.com'],
        'gmail': ['gmail.com', 'mail.google.com', 'accounts.google.com'],
        'amazon': ['amazon.com', 'www.amazon.com', 'amazon.co.uk', 'amazon.ca']
      }
      
      for (const [key, domains] of Object.entries(specialMatches)) {
        if (domains.some(d => d === checkDomain) && credentialUrl.includes(key)) {
          console.log(`Grand Warden: ✅ Special match found - ${credential.name}`)
          return true
        }
      }
      
      return false
    })
    
    console.log(`Grand Warden: Found ${matches.length} matching credentials:`, matches.map(c => c.name))
    
    // Sort by relevance - exact matches first, then by credential name match
    return matches.sort((a, b) => {
      const aDomain = a.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
      const bDomain = b.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
      const checkDomain = domain.replace(/^www\./, '')
      
      // Exact match gets highest priority
      if (aDomain === checkDomain && bDomain !== checkDomain) return -1
      if (bDomain === checkDomain && aDomain !== checkDomain) return 1
      
      // Otherwise maintain original order
      return 0
    })
  }

  private showNoCredentialsMessage(loginField: LoginField) {
    const dropdown = document.createElement('div')
    dropdown.className = 'gw-credentials-dropdown'
    
    // Get all available credentials to show as options
    const allCredentials = this.credentials
    const currentDomain = window.location.hostname.toLowerCase()
    
    let credentialItems = ''
    
    if (allCredentials.length > 0) {
      credentialItems = allCredentials.map(credential => `
        <div class="gw-credential-item" data-credential-id="${credential.id}" style="
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid rgba(71, 85, 105, 0.3);
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            color: white;
          ">
            ${credential.name.charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 500; color: #e2e8f0; font-size: 13px; margin-bottom: 2px;">
              ${credential.name}
            </div>
            <div style="color: #94a3b8; font-size: 11px; opacity: 0.8;">
              ${credential.username}
            </div>
          </div>
          <div style="color: #94a3b8; font-size: 11px;">
            Use anyway
          </div>
        </div>
      `).join('')
    }
    
    dropdown.innerHTML = `
      <div style="
        position: absolute;
        top: 100%;
        right: 0;
        background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
        border: 1px solid rgba(148, 163, 184, 0.3);
        border-radius: 8px;
        padding: 0;
        min-width: 320px;
        max-width: 380px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: white;
        font-size: 13px;
        margin-top: 4px;
        animation: slideIn 0.2s ease-out;
        max-height: 400px;
        overflow-y: auto;
      ">
        <!-- Header -->
        <div style="padding: 12px 16px; border-bottom: 1px solid rgba(71, 85, 105, 0.3); background: rgba(15, 23, 42, 0.5);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
            </svg>
            <span style="font-weight: 600; font-size: 14px;">No credentials for this site</span>
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            Choose from other saved credentials or create new
          </div>
        </div>
        
        <!-- Create New Option -->
        <div class="gw-create-new-item" style="
          padding: 12px 16px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          border-bottom: 1px solid rgba(71, 85, 105, 0.3);
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(34, 197, 94, 0.1);
          border-left: 3px solid #22c55e;
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 16px;
            color: white;
          ">
            +
          </div>
          <div style="flex: 1;">
            <div style="font-weight: 500; color: #e2e8f0; font-size: 13px; margin-bottom: 2px;">
              Create New Credential
            </div>
            <div style="color: #94a3b8; font-size: 11px;">
              Add credentials for ${currentDomain}
            </div>
          </div>
        </div>
        
        ${allCredentials.length > 0 ? `
          <!-- Separator -->
          <div style="padding: 8px 16px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(15, 23, 42, 0.3);">
            Or use existing credentials
          </div>
          
          <!-- Existing Credentials -->
          ${credentialItems}
        ` : ''}
      </div>
    `
    
    // Position and show dropdown
    const container = loginField.element.parentElement!
    container.appendChild(dropdown)
    
    // Add click handlers
    const createNewItem = dropdown.querySelector('.gw-create-new-item') as HTMLElement
    if (createNewItem) {
      createNewItem.addEventListener('click', () => {
        this.showCreateCredentialModal(currentDomain)
        this.closeDropdown()
      })
      
      // Hover effect
      createNewItem.addEventListener('mouseenter', () => {
        createNewItem.style.backgroundColor = 'rgba(34, 197, 94, 0.15)'
      })
      createNewItem.addEventListener('mouseleave', () => {
        createNewItem.style.backgroundColor = 'rgba(34, 197, 94, 0.1)'
      })
    }
    
    // Add click handlers for existing credentials
    dropdown.querySelectorAll('.gw-credential-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const credentialId = parseInt((e.currentTarget as HTMLElement).dataset.credentialId!)
        const credential = allCredentials.find(c => c.id === credentialId)
        if (credential) {
          this.fillCredentials(credential)
        }
        this.closeDropdown()
      })
      
      // Hover effect
      item.addEventListener('mouseenter', () => {
        (item as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
      })
      item.addEventListener('mouseleave', () => {
        (item as HTMLElement).style.backgroundColor = 'transparent'
      })
    })
    
    loginField.dropdown = dropdown
    this.currentDropdown = dropdown
    this.isDropdownOpen = true
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (document.contains(dropdown)) {
        this.closeDropdown()
      }
    }, 10000)
    
    console.log('Grand Warden: No credentials message shown with', allCredentials.length, 'alternatives')
  }

  private showCreateCredentialModal(domain: string) {
    // Remove any existing modals
    const existing = document.querySelector('.gw-create-modal')
    if (existing) existing.remove()

    const siteName = this.getSiteName(domain)
    
    const modal = document.createElement('div')
    modal.className = 'gw-create-modal'
    modal.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease-out;
      ">
        <div style="
          background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 12px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: white;
          animation: slideInModal 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        ">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
            <div style="
              width: 40px;
              height: 40px;
              background: linear-gradient(135deg, #22c55e, #16a34a);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              color: white;
            ">
              +
            </div>
            <div>
              <div style="font-weight: 600; font-size: 18px; margin-bottom: 2px;">Create New Credential</div>
              <div style="color: #94a3b8; font-size: 13px;">Add login for ${siteName}</div>
            </div>
          </div>
          
          <div style="space-y: 16px;">
            <div>
              <label style="display: block; color: #e2e8f0; font-size: 13px; font-weight: 500; margin-bottom: 6px;">
                Username or Email
              </label>
              <input 
                type="text" 
                id="gw-new-username"
                placeholder="Enter username or email"
                style="
                  width: 100%;
                  padding: 10px 12px;
                  background: rgba(15, 23, 42, 0.6);
                  border: 1px solid rgba(148, 163, 184, 0.3);
                  border-radius: 6px;
                  color: white;
                  font-size: 14px;
                  outline: none;
                  transition: border-color 0.2s ease;
                  box-sizing: border-box;
                "
              >
            </div>
            
            <div style="margin-top: 16px;">
              <label style="display: block; color: #e2e8f0; font-size: 13px; font-weight: 500; margin-bottom: 6px;">
                Password
              </label>
              <div style="position: relative;">
                <input 
                  type="password" 
                  id="gw-new-password"
                  placeholder="Enter password"
                  style="
                    width: 100%;
                    padding: 10px 12px;
                    background: rgba(15, 23, 42, 0.6);
                    border: 1px solid rgba(148, 163, 184, 0.3);
                    border-radius: 6px;
                    color: white;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s ease;
                    padding-right: 40px;
                    box-sizing: border-box;
                  "
                >
                <button type="button" id="gw-toggle-password" style="
                  position: absolute;
                  right: 8px;
                  top: 50%;
                  transform: translateY(-50%);
                  background: none;
                  border: none;
                  color: #94a3b8;
                  cursor: pointer;
                  padding: 4px;
                ">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
              </div>
            </div>
            
            <div style="display: flex; gap: 12px; margin-top: 24px;">
              <button id="gw-modal-cancel" style="
                flex: 1;
                padding: 10px 16px;
                background: transparent;
                border: 1px solid rgba(148, 163, 184, 0.3);
                border-radius: 6px;
                color: #94a3b8;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.2s ease;
              ">Cancel</button>
              <button id="gw-modal-save" style="
                flex: 1;
                padding: 10px 16px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                border: none;
                border-radius: 6px;
                color: white;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
              ">Save & Fill</button>
            </div>
          </div>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
    
    // Focus on username field
    const usernameField = modal.querySelector('#gw-new-username') as HTMLInputElement
    const passwordField = modal.querySelector('#gw-new-password') as HTMLInputElement
    usernameField?.focus()
    
    // Password toggle
    const toggleBtn = modal.querySelector('#gw-toggle-password') as HTMLButtonElement
    toggleBtn?.addEventListener('click', () => {
      const isPassword = passwordField.type === 'password'
      passwordField.type = isPassword ? 'text' : 'password'
      toggleBtn.innerHTML = isPassword 
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22M9 9a3 3 0 1 1 4.24 4.24"></path>
           </svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
             <circle cx="12" cy="12" r="3"></circle>
           </svg>`
    })
    
    // Button handlers
    const cancelBtn = modal.querySelector('#gw-modal-cancel') as HTMLButtonElement
    const saveBtn = modal.querySelector('#gw-modal-save') as HTMLButtonElement
    
    cancelBtn?.addEventListener('click', () => modal.remove())
    
    saveBtn?.addEventListener('click', () => {
      const username = usernameField.value.trim()
      const password = passwordField.value.trim()
      
      if (!username || !password) {
        // Highlight empty fields
        if (!username) usernameField.style.borderColor = '#ef4444'
        if (!password) passwordField.style.borderColor = '#ef4444'
        return
      }
      
      // Create and save new credential
      const newCredential: SavedCredential = {
        id: Date.now(),
        name: siteName,
        url: domain.replace(/^www\./, ''),
        username: username,
        password: password
      }
      
      this.credentials.push(newCredential)
      console.log('Grand Warden: Created new credential via modal', newCredential)
      
      // Fill the credentials immediately
      this.fillCredentials(newCredential)
      
      // Show success notification
      this.showSaveSuccessNotification(siteName)
      
      // Update badge count
      chrome.runtime.sendMessage({ 
        type: 'UPDATE_BADGE', 
        count: this.getMatchingCredentials().length 
      })
      
      modal.remove()
    })
    
    // Click outside to close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove()
      }
    })
    
    // Enter key to save
    modal.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        saveBtn?.click()
      } else if (e.key === 'Escape') {
        modal.remove()
      }
    })
  }

  private showCredentialsDropdown(loginField: LoginField, credentials: SavedCredential[]) {
    const dropdown = document.createElement('div')
    dropdown.className = 'gw-credentials-dropdown'
    
    const credentialItems = credentials.map(cred => `
      <div class="gw-credential-item" data-credential-id="${cred.id}" style="
        padding: 12px;
        border-bottom: 1px solid rgba(75, 85, 99, 0.3);
        cursor: pointer;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <div style="
          width: 32px;
          height: 32px;
          background: rgba(59, 130, 246, 0.2);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: rgb(59, 130, 246);
          font-size: 14px;
        ">
          ${cred.name.charAt(0)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #f1f5f9; font-size: 14px;">${cred.name}</div>
          <div style="color: #94a3b8; font-size: 12px;">${cred.username}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 197, 94)" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      </div>
    `).join('')
    
    dropdown.innerHTML = `
      <div style="
        position: absolute;
        top: 100%;
        right: 0;
        width: 320px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        color: #f1f5f9;
        margin-top: 4px;
        overflow: hidden;
      ">
        <div style="
          padding: 12px 16px;
          border-bottom: 1px solid rgba(75, 85, 99, 0.3);
          background: rgba(59, 130, 246, 0.1);
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(59, 130, 246)" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <circle cx="12" cy="16" r="1"></circle>
            <path d="m7 11 V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span style="font-weight: 600; font-size: 14px;">Select credential to fill</span>
        </div>
        ${credentialItems}
      </div>
    `
    
    // Position and show dropdown
    const container = loginField.element.parentElement!
    container.appendChild(dropdown)
    
    // Add click handlers for credential items
    dropdown.querySelectorAll('.gw-credential-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const credentialId = parseInt((e.currentTarget as HTMLElement).dataset.credentialId!)
        const credential = credentials.find(c => c.id === credentialId)
        if (credential) {
          this.fillCredentials(credential)
        }
        this.closeDropdown()
      })
      
      // Hover effect
      item.addEventListener('mouseenter', () => {
        (item as HTMLElement).style.backgroundColor = 'rgba(59, 130, 246, 0.1)'
      })
      item.addEventListener('mouseleave', () => {
        (item as HTMLElement).style.backgroundColor = 'transparent'
      })
    })
    
    loginField.dropdown = dropdown
    this.currentDropdown = dropdown
    this.isDropdownOpen = true
    
    console.log('Grand Warden: Dropdown shown with', credentials.length, 'credentials')
  }

  private async fillCredentials(credential: SavedCredential) {
    console.log('Grand Warden: Filling credentials for', credential.name)
    
    // Find username and password fields
    const usernameField = this.findFieldByType('username')
    const passwordField = this.findFieldByType('password')
    
    if (usernameField) {
      await this.typeInField(usernameField, credential.username)
    }
    
    if (passwordField) {
      if (usernameField) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      await this.typeInField(passwordField, credential.password)
    }
    
    // Show success notification
    this.showAutofillSuccess()
    
    // Trigger form validation events
    [usernameField, passwordField].forEach(field => {
      if (field) {
        field.dispatchEvent(new Event('input', { bubbles: true }))
        field.dispatchEvent(new Event('change', { bubbles: true }))
        field.dispatchEvent(new Event('blur', { bubbles: true }))
      }
    })
  }

  private findFieldByType(type: 'username' | 'password'): HTMLInputElement | null {
    for (const [element, field] of this.loginFields) {
      if (field.type === type) {
        return element
      }
    }
    return null
  }

  private closeDropdown() {
    if (this.currentDropdown) {
      this.currentDropdown.remove()
      this.currentDropdown = null
      this.isDropdownOpen = false
      
      // Hide all field icons
      this.loginFields.forEach(field => {
        this.hideFieldIcon(field)
      })
    }
  }

  private handleOutsideClick(e: Event) {
    const target = e.target as HTMLElement
    
    // Don't close if clicking on field icons or dropdown
    if (target.closest('.gw-field-icon') || target.closest('.gw-credentials-dropdown')) {
      return
    }
    
    // Close dropdown if clicking outside
    if (this.isDropdownOpen) {
      this.closeDropdown()
    }
  }

  private async typeInField(field: HTMLInputElement, text: string) {
    field.focus()
    field.value = ''
    
    for (let i = 0; i < text.length; i++) {
      field.value += text[i]
      field.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise(resolve => setTimeout(resolve, 30 + Math.random() * 20))
    }
  }

  private showAutofillSuccess() {
    const successToast = document.createElement('div')
    successToast.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        z-index: 999999;
        font-family: 'Inter', sans-serif;
        color: white;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        Credentials autofilled successfully
      </div>
    `
    
    document.body.appendChild(successToast)
    setTimeout(() => successToast.remove(), 3000)
  }

  private observeFormChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldRecheck = false
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.tagName === 'INPUT' || 
                  element.querySelector('input[type="text"], input[type="email"], input[type="password"]')) {
                shouldRecheck = true
              }
            }
          })
        }
      })

      if (shouldRecheck) {
        setTimeout(() => this.detectLoginFields(), 500)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  private handleMessage(message: any, sender: any, sendResponse: (response?: any) => void) {
    switch (message.type) {
      case 'PING':
        sendResponse({ status: 'alive', fieldsDetected: this.loginFields.size })
        break
      
      case 'GET_DETECTED_FIELDS':
        sendResponse({ fields: this.loginFields.size })
        break
        
      default:
        sendResponse({ error: 'Unknown message type' })
    }
  }

  private setupFormSubmissionDetection() {
    // Listen for form submissions
    document.addEventListener('submit', (e) => this.handleFormSubmission(e), true)
    
    // Also listen for common submit button clicks (some forms don't use proper submit events)
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'submit')) {
        // Wait a bit for form validation, then check if we should save
        setTimeout(() => this.checkForNewCredentials(), 100)
      }
    }, true)
  }

  private handleFormSubmission(e: Event) {
    console.log('Grand Warden: Form submission detected')
    const form = e.target as HTMLFormElement
    
    // Wait a moment for the form to be processed, then check for credentials
    setTimeout(() => this.checkForNewCredentials(form), 500)
  }

  private checkForNewCredentials(form?: HTMLFormElement) {
    // Find username and password fields
    const usernameField = this.findFieldByType('username')
    const passwordField = this.findFieldByType('password')
    
    if (!usernameField || !passwordField) {
      console.log('Grand Warden: No username/password fields found for saving')
      return
    }

    const username = usernameField.value.trim()
    const password = passwordField.value.trim()
    
    if (!username || !password) {
      console.log('Grand Warden: Empty username or password, skipping save prompt')
      return
    }

    // Check if we already have these credentials
    const domain = window.location.hostname.toLowerCase()
    const existingCredential = this.credentials.find(cred => {
      const credDomain = cred.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')
      const checkDomain = domain.replace(/^www\./, '')
      return (credDomain === checkDomain || checkDomain.includes(credDomain)) && cred.username === username
    })

    if (existingCredential) {
      if (existingCredential.password !== password) {
        // Password changed, ask to update
        this.showUpdateCredentialsPrompt(username, password, existingCredential)
      } else {
        console.log('Grand Warden: Credentials already saved and match')
      }
      return
    }

    // New credentials - show save prompt
    console.log('Grand Warden: New credentials detected, showing save prompt')
    this.showSaveCredentialsPrompt(username, password)
  }

  private showSaveCredentialsPrompt(username: string, password: string) {
    // Remove any existing prompts
    const existing = document.querySelector('.gw-save-prompt')
    if (existing) existing.remove()

    const domain = window.location.hostname
    const siteName = this.getSiteName(domain)
    
    const prompt = document.createElement('div')
    prompt.className = 'gw-save-prompt'
    prompt.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: white;
        font-size: 14px;
        max-width: 350px;
        animation: slideInSave 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <circle cx="12" cy="16" r="1"></circle>
              <path d="m7 11 V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 16px; margin-bottom: 2px;">Save Password?</div>
            <div style="color: #94a3b8; font-size: 12px;">Grand Warden detected new login</div>
          </div>
        </div>
        
        <div style="background: rgba(15, 23, 42, 0.5); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <div style="color: #e2e8f0; font-size: 13px; margin-bottom: 6px;">
            <strong>${siteName}</strong>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">
            Username: ${username.length > 25 ? username.substring(0, 25) + '...' : username}
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            Password: ${'•'.repeat(Math.min(password.length, 12))}
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button class="gw-save-btn" style="
            flex: 1;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border: none;
            border-radius: 6px;
            padding: 10px 16px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Save</button>
          <button class="gw-never-btn" style="
            background: transparent;
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 6px;
            padding: 10px 12px;
            color: #94a3b8;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Never</button>
          <button class="gw-dismiss-btn" style="
            background: transparent;
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 6px;
            padding: 10px 12px;
            color: #94a3b8;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Not Now</button>
        </div>
      </div>
    `
    
    document.body.appendChild(prompt)
    
    // Add hover effects and click handlers
    const saveBtn = prompt.querySelector('.gw-save-btn') as HTMLElement
    const neverBtn = prompt.querySelector('.gw-never-btn') as HTMLElement
    const dismissBtn = prompt.querySelector('.gw-dismiss-btn') as HTMLElement
    
    saveBtn.addEventListener('mouseenter', () => {
      saveBtn.style.background = 'linear-gradient(135deg, #2563eb, #1e40af)'
      saveBtn.style.transform = 'translateY(-1px)'
    })
    saveBtn.addEventListener('mouseleave', () => {
      saveBtn.style.background = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
      saveBtn.style.transform = 'translateY(0)'
    })
    
    ;[neverBtn, dismissBtn].forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        btn.style.background = 'rgba(148, 163, 184, 0.1)'
        btn.style.borderColor = 'rgba(148, 163, 184, 0.5)'
      })
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'transparent'
        btn.style.borderColor = 'rgba(148, 163, 184, 0.3)'
      })
    })
    
    // Click handlers
    saveBtn.addEventListener('click', () => {
      this.saveNewCredentials(username, password, siteName)
      prompt.remove()
    })
    
    neverBtn.addEventListener('click', () => {
      console.log('Grand Warden: User chose never save for', domain)
      // TODO: Add to never-save list
      prompt.remove()
    })
    
    dismissBtn.addEventListener('click', () => {
      console.log('Grand Warden: User dismissed save prompt')
      prompt.remove()
    })
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (document.contains(prompt)) {
        prompt.style.animation = 'slideOutSave 0.3s ease-in-out'
        setTimeout(() => prompt.remove(), 300)
      }
    }, 15000)
  }

  private showUpdateCredentialsPrompt(username: string, newPassword: string, existingCredential: SavedCredential) {
    // Remove any existing prompts
    const existing = document.querySelector('.gw-save-prompt')
    if (existing) existing.remove()

    const siteName = existingCredential.name
    
    const prompt = document.createElement('div')
    prompt.className = 'gw-save-prompt'
    prompt.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%);
        border: 1px solid rgba(251, 191, 36, 0.3);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: white;
        font-size: 14px;
        max-width: 350px;
        animation: slideInSave 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      ">
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
          <div style="
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M12 9v4l2 2"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
          </div>
          <div>
            <div style="font-weight: 600; font-size: 16px; margin-bottom: 2px;">Update Password?</div>
            <div style="color: #94a3b8; font-size: 12px;">Password changed for this site</div>
          </div>
        </div>
        
        <div style="background: rgba(15, 23, 42, 0.5); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <div style="color: #e2e8f0; font-size: 13px; margin-bottom: 6px;">
            <strong>${siteName}</strong>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">
            Username: ${username.length > 25 ? username.substring(0, 25) + '...' : username}
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            New Password: ${'•'.repeat(Math.min(newPassword.length, 12))}
          </div>
        </div>
        
        <div style="display: flex; gap: 8px;">
          <button class="gw-update-btn" style="
            flex: 1;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            border: none;
            border-radius: 6px;
            padding: 10px 16px;
            color: white;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Update</button>
          <button class="gw-dismiss-btn" style="
            background: transparent;
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 6px;
            padding: 10px 12px;
            color: #94a3b8;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
          ">Not Now</button>
        </div>
      </div>
    `
    
    document.body.appendChild(prompt)
    
    // Add click handlers
    const updateBtn = prompt.querySelector('.gw-update-btn') as HTMLElement
    const dismissBtn = prompt.querySelector('.gw-dismiss-btn') as HTMLElement
    
    updateBtn.addEventListener('click', () => {
      this.updateExistingCredentials(existingCredential, newPassword)
      prompt.remove()
    })
    
    dismissBtn.addEventListener('click', () => {
      console.log('Grand Warden: User dismissed update prompt')
      prompt.remove()
    })
    
    // Auto-dismiss after 15 seconds
    setTimeout(() => {
      if (document.contains(prompt)) {
        prompt.style.animation = 'slideOutSave 0.3s ease-in-out'
        setTimeout(() => prompt.remove(), 300)
      }
    }, 15000)
  }

  private getSiteName(domain: string): string {
    // Extract site name from domain
    const cleanDomain = domain.replace(/^www\./, '')
    const parts = cleanDomain.split('.')
    const siteName = parts[0]
    
    // Capitalize first letter
    return siteName.charAt(0).toUpperCase() + siteName.slice(1)
  }

  private saveNewCredentials(username: string, password: string, siteName: string) {
    const domain = window.location.hostname.replace(/^www\./, '')
    const newCredential: SavedCredential = {
      id: Date.now(), // Simple ID generation
      name: siteName,
      url: domain,
      username: username,
      password: password
    }
    
    // Add to local credentials array
    this.credentials.push(newCredential)
    
    // TODO: In real app, save to chrome.storage
    console.log('Grand Warden: Saved new credentials for', siteName, newCredential)
    
    // Show success notification
    this.showSaveSuccessNotification(siteName)
    
    // Update badge count
    chrome.runtime.sendMessage({ 
      type: 'UPDATE_BADGE', 
      count: this.getMatchingCredentials().length 
    })
  }

  private updateExistingCredentials(existingCredential: SavedCredential, newPassword: string) {
    // Update the password
    existingCredential.password = newPassword
    
    // TODO: In real app, update in chrome.storage
    console.log('Grand Warden: Updated credentials for', existingCredential.name)
    
    // Show success notification
    this.showUpdateSuccessNotification(existingCredential.name)
  }

  private showSaveSuccessNotification(siteName: string) {
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        z-index: 999999;
        font-family: 'Inter', sans-serif;
        color: white;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        Password saved for ${siteName}
      </div>
    `
    
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }

  private showUpdateSuccessNotification(siteName: string) {
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        z-index: 999999;
        font-family: 'Inter', sans-serif;
        color: white;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideIn 0.3s ease-out;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        Password updated for ${siteName}
      </div>
    `
    
    document.body.appendChild(notification)
    setTimeout(() => notification.remove(), 3000)
  }
}

// Initialize the autofill system
if (typeof window !== 'undefined') {
  const grandWardenAutofill = new GrandWardenAutofill()
  
  // Add CSS for animations and global styles
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(100%); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes slideOut {
      from { opacity: 1; transform: translateX(0); }
      to { opacity: 0; transform: translateX(100%); }
    }
    
    @keyframes slideInSave {
      from { opacity: 0; transform: translateY(-20px) scale(0.9); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    @keyframes slideOutSave {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(-20px) scale(0.9); }
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideInModal {
      from { opacity: 0; transform: translateY(-30px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    /* Ensure Grand Warden icons are always visible */
    .gw-field-container {
      position: relative !important;
      display: inline-block !important;
    }
    
    .gw-field-icon {
      position: absolute !important;
      right: 8px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      width: 20px !important;
      height: 20px !important;
      cursor: pointer !important;
      z-index: 999999 !important;
      opacity: 0.4 !important;
      transition: opacity 0.2s ease !important;
      background: rgba(59, 130, 246, 0.1) !important;
      border-radius: 4px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      border: 1px solid rgba(59, 130, 246, 0.3) !important;
      box-sizing: border-box !important;
    }
    
    .gw-field-icon:hover {
      opacity: 1 !important;
      background: rgba(59, 130, 246, 0.2) !important;
    }
    
    .gw-credentials-dropdown {
      z-index: 999999 !important;
      position: absolute !important;
      font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
    }
    
    /* Ensure dropdowns work on any website */
    .gw-credentials-dropdown * {
      box-sizing: border-box !important;
    }
  `
  document.head.appendChild(style)
}

// Prevent multiple instances
declare global {
  interface Window {
    grandWardenAutofill?: GrandWardenAutofill
  }
}

export {}