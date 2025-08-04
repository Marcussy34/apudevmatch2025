var h=Object.defineProperty;var f=(c,e,t)=>e in c?h(c,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):c[e]=t;var p=(c,e,t)=>(f(c,typeof e!="symbol"?e+"":e,t),t);class w{constructor(){p(this,"loginFields",new Map);p(this,"credentials",[]);p(this,"isDropdownOpen",!1);p(this,"currentDropdown",null);this.init()}init(){this.loadCredentials(),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",()=>this.detectLoginFields()):this.detectLoginFields(),this.observeFormChanges(),this.setupFormSubmissionDetection(),chrome.runtime.onMessage.addListener((e,t,n)=>{this.handleMessage(e,t,n)}),document.addEventListener("click",e=>this.handleOutsideClick(e)),console.log("Grand Warden: Content script loaded")}detectLoginFields(){document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]').forEach(t=>{const n=t;if(this.loginFields.has(n))return;const o=this.determineFieldType(n);if(o){const s={element:n,type:o};this.loginFields.set(n,s),this.enhanceField(s)}}),console.log(`Grand Warden: Detected ${this.loginFields.size} login fields`)}determineFieldType(e){if(e.type==="password")return"password";const t=[e.name,e.id,e.placeholder,e.autocomplete,e.getAttribute("data-testid")||"",e.className].join(" ").toLowerCase();return t.includes("email")||t.includes("user")||t.includes("login")||e.type==="email"?"username":null}loadCredentials(){this.credentials=[{id:1,name:"Gmail",url:"gmail.com",username:"john.doe@gmail.com",password:"MySecure2023!"},{id:2,name:"GitHub",url:"github.com",username:"johndoe_dev",password:"CodeMaster#456"},{id:3,name:"LinkedIn",url:"linkedin.com",username:"john.doe@professional.com",password:"Network2024!"},{id:4,name:"Amazon",url:"amazon.com",username:"john.doe@email.com",password:"Shop2023$ecure"},{id:5,name:"Facebook",url:"facebook.com",username:"john.doe.social",password:"Social2024#"}]}enhanceField(e){const{element:t,type:n}=e,o=this.createFieldContainer(t),s=this.createFieldIcon(n);o.appendChild(s),e.icon=s,this.attachFieldListeners(e),console.log(`Grand Warden: Enhanced ${n} field`)}createFieldContainer(e){var o;const t=e.parentElement;if(t!=null&&t.classList.contains("gw-field-container"))return t;const n=document.createElement("div");return n.className="gw-field-container",n.style.cssText=`
      position: relative;
      display: inline-block;
      width: 100%;
    `,(o=e.parentNode)==null||o.insertBefore(n,e),n.appendChild(e),e.style.width&&e.style.width!=="100%"&&(e.style.width="100%"),n}createFieldIcon(e){const t=document.createElement("div");t.className=`gw-field-icon gw-${e}-icon`;const n=e==="password"?this.getPasswordIcon():this.getUsernameIcon();return t.innerHTML=n,t.style.cssText=`
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
    `}attachFieldListeners(e){const{element:t,icon:n}=e;t.addEventListener("focus",()=>this.showFieldIcon(e)),t.addEventListener("mouseenter",()=>this.showFieldIcon(e)),t.addEventListener("blur",()=>{setTimeout(()=>{this.isDropdownOpen||this.hideFieldIcon(e)},200)}),t.addEventListener("mouseleave",()=>{!t.matches(":focus")&&!this.isDropdownOpen&&this.hideFieldIcon(e)}),n==null||n.addEventListener("click",o=>{o.preventDefault(),o.stopPropagation(),this.handleIconClick(e)})}showFieldIcon(e){e.icon&&(e.icon.style.opacity="1")}hideFieldIcon(e){e.icon&&!this.isDropdownOpen&&(e.icon.style.opacity="0.4")}handleIconClick(e){console.log("Grand Warden: Icon clicked for",e.type,"field"),this.closeDropdown();const t=this.getMatchingCredentials();if(t.length===0){this.showNoCredentialsMessage(e);return}if(t.length===1){console.log("Grand Warden: Auto-filling single matching credential"),this.fillCredentials(t[0]);return}this.showCredentialsDropdown(e,t)}getMatchingCredentials(){const e=window.location.hostname.toLowerCase();console.log("Grand Warden: Matching credentials for domain:",e);const t=this.credentials.filter(n=>{const o=n.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),s=e.replace(/^www\./,"");if(console.log(`Grand Warden: Checking ${n.name} (${o}) against ${s}`),o===s)return console.log(`Grand Warden: ✅ Exact match found - ${n.name}`),!0;const i=o.split(".").slice(-2).join("."),r=s.split(".").slice(-2).join(".");if(i===r)return console.log(`Grand Warden: ✅ Main domain match found - ${n.name}`),!0;if(s.includes(o)||o.includes(s))return console.log(`Grand Warden: ✅ Subdomain match found - ${n.name}`),!0;const d=o.replace(/\.(com|org|net|io|co|gov|edu|uk|ca|au)$/,""),l=s.replace(/\.(com|org|net|io|co|gov|edu|uk|ca|au)$/,"");if(d===l&&d.length>2)return console.log(`Grand Warden: ✅ Name match found - ${n.name}`),!0;const a={linkedin:["linkedin.com","www.linkedin.com","mobile.linkedin.com"],facebook:["facebook.com","www.facebook.com","m.facebook.com","mobile.facebook.com"],github:["github.com","www.github.com","api.github.com"],gmail:["gmail.com","mail.google.com","accounts.google.com"],amazon:["amazon.com","www.amazon.com","amazon.co.uk","amazon.ca"]};for(const[m,g]of Object.entries(a))if(g.some(u=>u===s)&&o.includes(m))return console.log(`Grand Warden: ✅ Special match found - ${n.name}`),!0;return!1});return console.log(`Grand Warden: Found ${t.length} matching credentials:`,t.map(n=>n.name)),t.sort((n,o)=>{const s=n.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),i=o.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),r=e.replace(/^www\./,"");return s===r&&i!==r?-1:i===r&&s!==r?1:0})}showNoCredentialsMessage(e){const t=document.createElement("div");t.className="gw-credentials-dropdown",t.innerHTML=`
      <div style="
        position: absolute;
        top: 100%;
        right: 0;
        width: 280px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        z-index: 999999;
        padding: 16px;
        font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
        color: #f1f5f9;
        font-size: 14px;
        margin-top: 4px;
      ">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <div style="
            width: 24px;
            height: 24px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            ${this.getPasswordIcon()}
          </div>
          <span style="font-weight: 600;">Grand Warden</span>
        </div>
        <p style="margin: 0; color: #94a3b8; font-size: 13px;">
          No saved credentials found for ${window.location.hostname}
        </p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          margin-top: 12px;
          background: rgb(59, 130, 246);
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
        ">
          Save New Credential
        </button>
      </div>
    `,e.element.parentElement.appendChild(t),setTimeout(()=>t.remove(),3e3)}showCredentialsDropdown(e,t){const n=document.createElement("div");n.className="gw-credentials-dropdown";const o=t.map(i=>`
      <div class="gw-credential-item" data-credential-id="${i.id}" style="
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
          ${i.name.charAt(0)}
        </div>
        <div style="flex: 1;">
          <div style="font-weight: 500; color: #f1f5f9; font-size: 14px;">${i.name}</div>
          <div style="color: #94a3b8; font-size: 12px;">${i.username}</div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgb(34, 197, 94)" stroke-width="2">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
      </div>
    `).join("");n.innerHTML=`
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
        ${o}
      </div>
    `,e.element.parentElement.appendChild(n),n.querySelectorAll(".gw-credential-item").forEach(i=>{i.addEventListener("click",r=>{const d=parseInt(r.currentTarget.dataset.credentialId),l=t.find(a=>a.id===d);l&&this.fillCredentials(l),this.closeDropdown()}),i.addEventListener("mouseenter",()=>{i.style.backgroundColor="rgba(59, 130, 246, 0.1)"}),i.addEventListener("mouseleave",()=>{i.style.backgroundColor="transparent"})}),e.dropdown=n,this.currentDropdown=n,this.isDropdownOpen=!0,console.log("Grand Warden: Dropdown shown with",t.length,"credentials")}async fillCredentials(e){console.log("Grand Warden: Filling credentials for",e.name);const t=this.findFieldByType("username"),n=this.findFieldByType("password");t&&await this.typeInField(t,e.username),n&&(t&&await new Promise(o=>setTimeout(o,300)),await this.typeInField(n,e.password)),this.showAutofillSuccess()[n].forEach(o=>{o&&(o.dispatchEvent(new Event("input",{bubbles:!0})),o.dispatchEvent(new Event("change",{bubbles:!0})),o.dispatchEvent(new Event("blur",{bubbles:!0})))})}findFieldByType(e){for(const[t,n]of this.loginFields)if(n.type===e)return t;return null}closeDropdown(){this.currentDropdown&&(this.currentDropdown.remove(),this.currentDropdown=null,this.isDropdownOpen=!1,this.loginFields.forEach(e=>{this.hideFieldIcon(e)}))}handleOutsideClick(e){const t=e.target;t.closest(".gw-field-icon")||t.closest(".gw-credentials-dropdown")||this.isDropdownOpen&&this.closeDropdown()}async typeInField(e,t){e.focus(),e.value="";for(let n=0;n<t.length;n++)e.value+=t[n],e.dispatchEvent(new Event("input",{bubbles:!0})),await new Promise(o=>setTimeout(o,30+Math.random()*20))}showAutofillSuccess(){const e=document.createElement("div");e.innerHTML=`
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
    `,document.body.appendChild(e),setTimeout(()=>e.remove(),3e3)}observeFormChanges(){new MutationObserver(t=>{let n=!1;t.forEach(o=>{o.type==="childList"&&o.addedNodes.forEach(s=>{if(s.nodeType===Node.ELEMENT_NODE){const i=s;(i.tagName==="INPUT"||i.querySelector('input[type="text"], input[type="email"], input[type="password"]'))&&(n=!0)}})}),n&&setTimeout(()=>this.detectLoginFields(),500)}).observe(document.body,{childList:!0,subtree:!0})}handleMessage(e,t,n){switch(e.type){case"PING":n({status:"alive",fieldsDetected:this.loginFields.size});break;case"GET_DETECTED_FIELDS":n({fields:this.loginFields.size});break;default:n({error:"Unknown message type"})}}setupFormSubmissionDetection(){document.addEventListener("submit",e=>this.handleFormSubmission(e),!0),document.addEventListener("click",e=>{const t=e.target;(t.tagName==="BUTTON"||t.tagName==="INPUT"&&t.type==="submit")&&setTimeout(()=>this.checkForNewCredentials(),100)},!0)}handleFormSubmission(e){console.log("Grand Warden: Form submission detected");const t=e.target;setTimeout(()=>this.checkForNewCredentials(t),500)}checkForNewCredentials(e){const t=this.findFieldByType("username"),n=this.findFieldByType("password");if(!t||!n){console.log("Grand Warden: No username/password fields found for saving");return}const o=t.value.trim(),s=n.value.trim();if(!o||!s){console.log("Grand Warden: Empty username or password, skipping save prompt");return}const i=window.location.hostname.toLowerCase(),r=this.credentials.find(d=>{const l=d.url.toLowerCase().replace(/^https?:\/\//,"").replace(/^www\./,""),a=i.replace(/^www\./,"");return(l===a||a.includes(l))&&d.username===o});if(r){r.password!==s?this.showUpdateCredentialsPrompt(o,s,r):console.log("Grand Warden: Credentials already saved and match");return}console.log("Grand Warden: New credentials detected, showing save prompt"),this.showSaveCredentialsPrompt(o,s)}showSaveCredentialsPrompt(e,t){const n=document.querySelector(".gw-save-prompt");n&&n.remove();const o=window.location.hostname,s=this.getSiteName(o),i=document.createElement("div");i.className="gw-save-prompt",i.innerHTML=`
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
            <strong>${s}</strong>
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
    `,document.body.appendChild(i);const r=i.querySelector(".gw-save-btn"),d=i.querySelector(".gw-never-btn"),l=i.querySelector(".gw-dismiss-btn");r.addEventListener("mouseenter",()=>{r.style.background="linear-gradient(135deg, #2563eb, #1e40af)",r.style.transform="translateY(-1px)"}),r.addEventListener("mouseleave",()=>{r.style.background="linear-gradient(135deg, #3b82f6, #1d4ed8)",r.style.transform="translateY(0)"}),[d,l].forEach(a=>{a.addEventListener("mouseenter",()=>{a.style.background="rgba(148, 163, 184, 0.1)",a.style.borderColor="rgba(148, 163, 184, 0.5)"}),a.addEventListener("mouseleave",()=>{a.style.background="transparent",a.style.borderColor="rgba(148, 163, 184, 0.3)"})}),r.addEventListener("click",()=>{this.saveNewCredentials(e,t,s),i.remove()}),d.addEventListener("click",()=>{console.log("Grand Warden: User chose never save for",o),i.remove()}),l.addEventListener("click",()=>{console.log("Grand Warden: User dismissed save prompt"),i.remove()}),setTimeout(()=>{document.contains(i)&&(i.style.animation="slideOutSave 0.3s ease-in-out",setTimeout(()=>i.remove(),300))},15e3)}showUpdateCredentialsPrompt(e,t,n){const o=document.querySelector(".gw-save-prompt");o&&o.remove();const s=n.name,i=document.createElement("div");i.className="gw-save-prompt",i.innerHTML=`
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
            <strong>${s}</strong>
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
    `,document.body.appendChild(i);const r=i.querySelector(".gw-update-btn"),d=i.querySelector(".gw-dismiss-btn");r.addEventListener("click",()=>{this.updateExistingCredentials(n,t),i.remove()}),d.addEventListener("click",()=>{console.log("Grand Warden: User dismissed update prompt"),i.remove()}),setTimeout(()=>{document.contains(i)&&(i.style.animation="slideOutSave 0.3s ease-in-out",setTimeout(()=>i.remove(),300))},15e3)}getSiteName(e){const o=e.replace(/^www\./,"").split(".")[0];return o.charAt(0).toUpperCase()+o.slice(1)}saveNewCredentials(e,t,n){const o=window.location.hostname.replace(/^www\./,""),s={id:Date.now(),name:n,url:o,username:e,password:t};this.credentials.push(s),console.log("Grand Warden: Saved new credentials for",n,s),this.showSaveSuccessNotification(n),chrome.runtime.sendMessage({type:"UPDATE_BADGE",count:this.getMatchingCredentials().length})}updateExistingCredentials(e,t){e.password=t,console.log("Grand Warden: Updated credentials for",e.name),this.showUpdateSuccessNotification(e.name)}showSaveSuccessNotification(e){const t=document.createElement("div");t.innerHTML=`
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
    `,document.body.appendChild(t),setTimeout(()=>t.remove(),3e3)}}if(typeof window<"u"){new w;const c=document.createElement("style");c.textContent=`
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
