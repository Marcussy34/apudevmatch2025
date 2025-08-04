var u=Object.defineProperty;var w=(c,e,t)=>e in c?u(c,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):c[e]=t;var m=(c,e,t)=>(w(c,typeof e!="symbol"?e+"":e,t),t);class f{constructor(){m(this,"loginFields",new Map);m(this,"credentials",[]);m(this,"isDropdownOpen",!1);m(this,"currentDropdown",null);this.init()}init(){this.loadCredentials(),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.detectLoginFields()):this.detectLoginFields(),this.observeFormChanges(),this.setupFormSubmissionDetection(),chrome.runtime.onMessage.addListener((e,t,o)=>{this.handleMessage(e,t,o)}),document.addEventListener("click",e=>this.handleOutsideClick(e)),console.log("Grand Warden: Content script loaded")}detectLoginFields(){document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').forEach(t=>{const o=t;if(this.loginFields.has(o))return;const i=this.determineFieldType(o);if(i){const r={element:o,type:i};this.loginFields.set(o,r),this.enhanceField(r)}}),console.log(`Grand Warden: Detected ${this.loginFields.size} login fields`)}determineFieldType(e){if(e.type==="password")return"password";const t=[e.name,e.id,e.placeholder,e.autocomplete,e.getAttribute("data-testid")||"",e.className].join(" ").toLowerCase();return t.includes("email")||t.includes("user")||t.includes("login")||e.type==="email"?"username":null}loadCredentials(){this.credentials=[{id:1,name:"Gmail",url:"gmail.com",username:"john.doe@gmail.com",password:"MySecure2023!"},{id:2,name:"GitHub",url:"github.com",username:"johndoe_dev",password:"CodeMaster#456"},{id:3,name:"LinkedIn",url:"linkedin.com",username:"john.doe@professional.com",password:"Network2024!"},{id:4,name:"Amazon",url:"amazon.com",username:"john.doe@email.com",password:"Shop2023$ecure"},{id:5,name:"Facebook",url:"facebook.com",username:"john.doe.social",password:"Social2024#"}]}enhanceField(e){const{element:t,type:o}=e,i=this.createFieldContainer(t),r=this.createFieldIcon(o);i.appendChild(r),e.icon=r,this.attachFieldListeners(e),console.log(`Grand Warden: Enhanced ${o} field`)}createFieldContainer(e){var i;const t=e.parentElement;if(t!=null&&t.classList.contains("gw-field-container"))return t;const o=document.createElement("div");return o.className="gw-field-container",o.style.cssText=`
      position: relative;
      display: inline-block;
      width: 100%;
    `,(i=e.parentNode)==null||i.insertBefore(o,e),o.appendChild(e),e.style.width&&e.style.width!=="100%"&&(e.style.width="100%"),o}createFieldIcon(e){const t=document.createElement("div");t.className=`gw-field-icon gw-${e}-icon`;const o=e==="password"?this.getPasswordIcon():this.getUsernameIcon();return t.innerHTML=o,t.style.cssText=`
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
    `,t.addEventListener("mouseenter",()=>{t.style.opacity="1"}),t.addEventListener("mouseleave",()=>{t.style.opacity="0.4"}),t}getPasswordIcon(){return`
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(59, 130, 246)" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <circle cx="12" cy="16" r="1"></circle>
        <path d="m7 11 V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    `}getUsernameIcon(){return`
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgb(59, 130, 246)" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    `}attachFieldListeners(e){const{element:t,icon:o}=e;t.addEventListener("focus",()=>this.showFieldIcon(e)),t.addEventListener("mouseenter",()=>this.showFieldIcon(e)),t.addEventListener("blur",()=>{setTimeout(()=>{this.isDropdownOpen||this.hideFieldIcon(e)},200)}),t.addEventListener("mouseleave",()=>{!t.matches(":focus")&&!this.isDropdownOpen&&this.hideFieldIcon(e)}),o==null||o.addEventListener("click",i=>{i.preventDefault(),i.stopPropagation(),this.handleIconClick(e)})}showFieldIcon(e){e.icon&&(e.icon.style.opacity="1")}hideFieldIcon(e){e.icon&&!this.isDropdownOpen&&(e.icon.style.opacity="0.4")}handleIconClick(e){console.log("Grand Warden: Icon clicked for",e.type,"field"),this.closeDropdown();const t=this.getMatchingCredentials();if(t.length===0){this.showNoCredentialsMessage(e);return}if(t.length===1){console.log("Grand Warden: Auto-filling single matching credential"),this.fillCredentials(t[0]);return}this.showCredentialsDropdown(e,t)}getMatchingCredentials(){const e=window.location.hostname.toLowerCase();console.log("Grand Warden: Matching credentials for domain:",e);const t=this.credentials.filter(o=>{const i=o.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),r=e.replace(/^www\./,"");if(console.log(`Grand Warden: Checking ${o.name} (${i}) against ${r}`),i===r)return console.log(`Grand Warden: ✅ Exact match found - ${o.name}`),!0;const n=i.split(".").slice(-2).join("."),s=r.split(".").slice(-2).join(".");if(n===s)return console.log(`Grand Warden: ✅ Main domain match found - ${o.name}`),!0;if(r.includes(i)||i.includes(r))return console.log(`Grand Warden: ✅ Subdomain match found - ${o.name}`),!0;const a=i.replace(/\.(com|org|net|io|co|gov|edu|uk|ca|au)$/,""),l=r.replace(/\.(com|org|net|io|co|gov|edu|uk|ca|au)$/,"");if(a===l&&a.length>2)return console.log(`Grand Warden: ✅ Name match found - ${o.name}`),!0;const d={linkedin:["linkedin.com","www.linkedin.com","mobile.linkedin.com"],facebook:["facebook.com","www.facebook.com","m.facebook.com","mobile.facebook.com"],github:["github.com","www.github.com","api.github.com"],gmail:["gmail.com","mail.google.com","accounts.google.com"],amazon:["amazon.com","www.amazon.com","amazon.co.uk","amazon.ca"]};for(const[p,g]of Object.entries(d))if(g.some(h=>h===r)&&i.includes(p))return console.log(`Grand Warden: ✅ Special match found - ${o.name}`),!0;return!1});return console.log(`Grand Warden: Found ${t.length} matching credentials:`,t.map(o=>o.name)),t.sort((o,i)=>{const r=o.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),n=i.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),s=e.replace(/^www\./,"");return r===s&&n!==s?-1:n===s&&r!==s?1:0})}showNoCredentialsMessage(e){const t=document.createElement("div");t.className="gw-credentials-dropdown";const o=this.credentials,i=window.location.hostname.toLowerCase();let r="";o.length>0&&(r=o.map(a=>`
        <div class="gw-credential-item" data-credential-id="${a.id}" style="
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
            ${a.name.charAt(0).toUpperCase()}
          </div>
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 500; color: #e2e8f0; font-size: 13px; margin-bottom: 2px;">
              ${a.name}
            </div>
            <div style="color: #94a3b8; font-size: 11px; opacity: 0.8;">
              ${a.username}
            </div>
          </div>
          <div style="color: #94a3b8; font-size: 11px;">
            Use anyway
          </div>
        </div>
      `).join("")),t.innerHTML=`
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
              Add credentials for ${i}
            </div>
          </div>
        </div>
        
        ${o.length>0?`
          <!-- Separator -->
          <div style="padding: 8px 16px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(15, 23, 42, 0.3);">
            Or use existing credentials
          </div>
          
          <!-- Existing Credentials -->
          ${r}
        `:""}
      </div>
    `,e.element.parentElement.appendChild(t);const s=t.querySelector(".gw-create-new-item");s&&(s.addEventListener("click",()=>{this.showCreateCredentialModal(i),this.closeDropdown()}),s.addEventListener("mouseenter",()=>{s.style.backgroundColor="rgba(34, 197, 94, 0.15)"}),s.addEventListener("mouseleave",()=>{s.style.backgroundColor="rgba(34, 197, 94, 0.1)"})),t.querySelectorAll(".gw-credential-item").forEach(a=>{a.addEventListener("click",l=>{const d=parseInt(l.currentTarget.dataset.credentialId),p=o.find(g=>g.id===d);p&&this.fillCredentials(p),this.closeDropdown()}),a.addEventListener("mouseenter",()=>{a.style.backgroundColor="rgba(59, 130, 246, 0.1)"}),a.addEventListener("mouseleave",()=>{a.style.backgroundColor="transparent"})}),e.dropdown=t,this.currentDropdown=t,this.isDropdownOpen=!0,setTimeout(()=>{document.contains(t)&&this.closeDropdown()},1e4),console.log("Grand Warden: No credentials message shown with",o.length,"alternatives")}showCreateCredentialModal(e){const t=document.querySelector(".gw-create-modal");t&&t.remove();const o=this.getSiteName(e),i=document.createElement("div");i.className="gw-create-modal",i.innerHTML=`
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
              <div style="color: #94a3b8; font-size: 13px;">Add login for ${o}</div>
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
    `,document.body.appendChild(i);const r=i.querySelector("#gw-new-username"),n=i.querySelector("#gw-new-password");r==null||r.focus();const s=i.querySelector("#gw-toggle-password");s==null||s.addEventListener("click",()=>{const d=n.type==="password";n.type=d?"text":"password",s.innerHTML=d?`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19M1 1l22 22M9 9a3 3 0 1 1 4.24 4.24"></path>
           </svg>`:`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
             <circle cx="12" cy="12" r="3"></circle>
           </svg>`});const a=i.querySelector("#gw-modal-cancel"),l=i.querySelector("#gw-modal-save");a==null||a.addEventListener("click",()=>i.remove()),l==null||l.addEventListener("click",()=>{const d=r.value.trim(),p=n.value.trim();if(!d||!p){d||(r.style.borderColor="#ef4444"),p||(n.style.borderColor="#ef4444");return}const g={id:Date.now(),name:o,url:e.replace(/^www\./,""),username:d,password:p};this.credentials.push(g),console.log("Grand Warden: Created new credential via modal",g),this.fillCredentials(g),this.showSaveSuccessNotification(o),chrome.runtime.sendMessage({type:"UPDATE_BADGE",count:this.getMatchingCredentials().length}),i.remove()}),i.addEventListener("click",d=>{d.target===i&&i.remove()}),i.addEventListener("keydown",d=>{d.key==="Enter"?l==null||l.click():d.key==="Escape"&&i.remove()})}showCredentialsDropdown(e,t){const o=document.createElement("div");o.className="gw-credentials-dropdown";const i=t.map(n=>`
      <div class="gw-credential-item" data-credential-id="${n.id}" style="
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
          ${n.name.charAt(0)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #f1f5f9; font-size: 14px;">${n.name}</div>
          <div style="color: #94a3b8; font-size: 12px;">${n.username}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 197, 94)" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      </div>
    `).join("");o.innerHTML=`
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
        ${i}
      </div>
    `,e.element.parentElement.appendChild(o),o.querySelectorAll(".gw-credential-item").forEach(n=>{n.addEventListener("click",s=>{const a=parseInt(s.currentTarget.dataset.credentialId),l=t.find(d=>d.id===a);l&&this.fillCredentials(l),this.closeDropdown()}),n.addEventListener("mouseenter",()=>{n.style.backgroundColor="rgba(59, 130, 246, 0.1)"}),n.addEventListener("mouseleave",()=>{n.style.backgroundColor="transparent"})}),e.dropdown=o,this.currentDropdown=o,this.isDropdownOpen=!0,console.log("Grand Warden: Dropdown shown with",t.length,"credentials")}async fillCredentials(e){console.log("Grand Warden: Filling credentials for",e.name);const t=this.findFieldByType("username"),o=this.findFieldByType("password");t&&await this.typeInField(t,e.username),o&&(t&&await new Promise(i=>setTimeout(i,300)),await this.typeInField(o,e.password)),this.showAutofillSuccess()[o].forEach(i=>{i&&(i.dispatchEvent(new Event("input",{bubbles:!0})),i.dispatchEvent(new Event("change",{bubbles:!0})),i.dispatchEvent(new Event("blur",{bubbles:!0})))})}findFieldByType(e){for(const[t,o]of this.loginFields)if(o.type===e)return t;return null}closeDropdown(){this.currentDropdown&&(this.currentDropdown.remove(),this.currentDropdown=null,this.isDropdownOpen=!1,this.loginFields.forEach(e=>{this.hideFieldIcon(e)}))}handleOutsideClick(e){const t=e.target;t.closest(".gw-field-icon")||t.closest(".gw-credentials-dropdown")||this.isDropdownOpen&&this.closeDropdown()}async typeInField(e,t){e.focus(),e.value="";for(let o=0;o<t.length;o++)e.value+=t[o],e.dispatchEvent(new Event("input",{bubbles:!0})),await new Promise(i=>setTimeout(i,30+Math.random()*20))}showAutofillSuccess(){const e=document.createElement("div");e.innerHTML=`
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
    `,document.body.appendChild(e),setTimeout(()=>e.remove(),3e3)}observeFormChanges(){new MutationObserver(t=>{let o=!1;t.forEach(i=>{i.type==="childList"&&i.addedNodes.forEach(r=>{if(r.nodeType===Node.ELEMENT_NODE){const n=r;(n.tagName==="INPUT"||n.querySelector('input[type="text"], input[type="email"], input[type="password"]'))&&(o=!0)}})}),o&&setTimeout(()=>this.detectLoginFields(),500)}).observe(document.body,{childList:!0,subtree:!0})}handleMessage(e,t,o){switch(e.type){case"PING":o({status:"alive",fieldsDetected:this.loginFields.size});break;case"GET_DETECTED_FIELDS":o({fields:this.loginFields.size});break;default:o({error:"Unknown message type"})}}setupFormSubmissionDetection(){document.addEventListener("submit",e=>this.handleFormSubmission(e),!0),document.addEventListener("click",e=>{const t=e.target;(t.tagName==="BUTTON"||t.tagName==="INPUT"&&t.type==="submit")&&setTimeout(()=>this.checkForNewCredentials(),100)},!0)}handleFormSubmission(e){console.log("Grand Warden: Form submission detected");const t=e.target;setTimeout(()=>this.checkForNewCredentials(t),500)}checkForNewCredentials(e){const t=this.findFieldByType("username"),o=this.findFieldByType("password");if(!t||!o){console.log("Grand Warden: No username/password fields found for saving");return}const i=t.value.trim(),r=o.value.trim();if(!i||!r){console.log("Grand Warden: Empty username or password, skipping save prompt");return}const n=window.location.hostname.toLowerCase(),s=this.credentials.find(a=>{const l=a.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),d=n.replace(/^www\./,"");return(l===d||d.includes(l))&&a.username===i});if(s){s.password!==r?this.showUpdateCredentialsPrompt(i,r,s):console.log("Grand Warden: Credentials already saved and match");return}console.log("Grand Warden: New credentials detected, showing save prompt"),this.showSaveCredentialsPrompt(i,r)}showSaveCredentialsPrompt(e,t){const o=document.querySelector(".gw-save-prompt");o&&o.remove();const i=window.location.hostname,r=this.getSiteName(i),n=document.createElement("div");n.className="gw-save-prompt",n.innerHTML=`
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
            <strong>${r}</strong>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">
            Username: ${e.length>25?e.substring(0,25)+"...":e}
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            Password: ${"•".repeat(Math.min(t.length,12))}
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
    `,document.body.appendChild(n);const s=n.querySelector(".gw-save-btn"),a=n.querySelector(".gw-never-btn"),l=n.querySelector(".gw-dismiss-btn");s.addEventListener("mouseenter",()=>{s.style.background="linear-gradient(135deg, #2563eb, #1e40af)",s.style.transform="translateY(-1px)"}),s.addEventListener("mouseleave",()=>{s.style.background="linear-gradient(135deg, #3b82f6, #1d4ed8)",s.style.transform="translateY(0)"}),[a,l].forEach(d=>{d.addEventListener("mouseenter",()=>{d.style.background="rgba(148, 163, 184, 0.1)",d.style.borderColor="rgba(148, 163, 184, 0.5)"}),d.addEventListener("mouseleave",()=>{d.style.background="transparent",d.style.borderColor="rgba(148, 163, 184, 0.3)"})}),s.addEventListener("click",()=>{this.saveNewCredentials(e,t,r),n.remove()}),a.addEventListener("click",()=>{console.log("Grand Warden: User chose never save for",i),n.remove()}),l.addEventListener("click",()=>{console.log("Grand Warden: User dismissed save prompt"),n.remove()}),setTimeout(()=>{document.contains(n)&&(n.style.animation="slideOutSave 0.3s ease-in-out",setTimeout(()=>n.remove(),300))},15e3)}showUpdateCredentialsPrompt(e,t,o){const i=document.querySelector(".gw-save-prompt");i&&i.remove();const r=o.name,n=document.createElement("div");n.className="gw-save-prompt",n.innerHTML=`
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
            <strong>${r}</strong>
          </div>
          <div style="color: #94a3b8; font-size: 12px; margin-bottom: 4px;">
            Username: ${e.length>25?e.substring(0,25)+"...":e}
          </div>
          <div style="color: #94a3b8; font-size: 12px;">
            New Password: ${"•".repeat(Math.min(t.length,12))}
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
    `,document.body.appendChild(n);const s=n.querySelector(".gw-update-btn"),a=n.querySelector(".gw-dismiss-btn");s.addEventListener("click",()=>{this.updateExistingCredentials(o,t),n.remove()}),a.addEventListener("click",()=>{console.log("Grand Warden: User dismissed update prompt"),n.remove()}),setTimeout(()=>{document.contains(n)&&(n.style.animation="slideOutSave 0.3s ease-in-out",setTimeout(()=>n.remove(),300))},15e3)}getSiteName(e){const i=e.replace(/^www\./,"").split(".")[0];return i.charAt(0).toUpperCase()+i.slice(1)}saveNewCredentials(e,t,o){const i=window.location.hostname.replace(/^www\./,""),r={id:Date.now(),name:o,url:i,username:e,password:t};this.credentials.push(r),console.log("Grand Warden: Saved new credentials for",o,r),this.showSaveSuccessNotification(o),chrome.runtime.sendMessage({type:"UPDATE_BADGE",count:this.getMatchingCredentials().length})}updateExistingCredentials(e,t){e.password=t,console.log("Grand Warden: Updated credentials for",e.name),this.showUpdateSuccessNotification(e.name)}showSaveSuccessNotification(e){const t=document.createElement("div");t.innerHTML=`
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
        Password saved for ${e}
      </div>
    `,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}showUpdateSuccessNotification(e){const t=document.createElement("div");t.innerHTML=`
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
        Password updated for ${e}
      </div>
    `,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}}if(typeof window<"u"){new f;const c=document.createElement("style");c.textContent=`
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
  `,document.head.appendChild(c)}
