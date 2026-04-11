(function(){"use strict";function u(s){return(s||"").toLowerCase().split(/\W+/).filter(n=>n.length>=3)}function f(s,n){const o=new Set(u(s));if(o.size===0)return 0;const t=[n.title,n.url,n.description].filter(Boolean).join(" "),e=new Set(u(t));let r=0;for(const l of o)e.has(l)&&r++;return r}function m(s,n,o=2,t=3){return n.map(e=>({candidate:e,score:f(s,e)})).filter(e=>e.score>=o).sort((e,r)=>r.score-e.score).slice(0,t)}if(window.__tabDebtKillerInjected)throw new Error("already injected");window.__tabDebtKillerInjected=!0;let i=null,d=null,c={resurfacingEnabled:!0,tokenMatchThreshold:2,overlayDismissMs:8e3};chrome.storage.sync.get("settings",({settings:s})=>{s&&(c={...c,...s})}),chrome.storage.onChanged.addListener((s,n)=>{n==="sync"&&s.settings&&(c={...c,...s.settings.newValue})});let p=null;document.addEventListener("input",s=>{try{if(!c.resurfacingEnabled)return;const n=s.target;if(n.tagName!=="INPUT"&&n.tagName!=="TEXTAREA")return;const o=n.value||n.innerText||"";if(o.length<5){a();return}clearTimeout(p),p=setTimeout(()=>g(o),300)}catch{}},!0);async function g(s){try{const{sessions:n=[]}=await chrome.storage.local.get("sessions"),{tab_metadata_cache:o={}}=await chrome.storage.local.get("tab_metadata_cache"),t=[];for(const r of n)for(const l of r.tabs)t.push({title:l.title,url:l.url,favIconUrl:l.favIconUrl,source:r.name,sessionId:r.id});for(const[,r]of Object.entries(o))t.push({title:r.title,url:r.url,description:r.description,favIconUrl:r.favIconUrl,source:"Open tab",sessionId:null});const e=m(s,t,c.tokenMatchThreshold,3);if(e.length===0){a();return}b(e.map(r=>r.candidate))}catch{}}function b(s){a(),i=document.createElement("div"),i.id="__tdk-overlay",i.setAttribute("role","dialog"),i.setAttribute("aria-label","Tab suggestions"),i.style.cssText=`
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 2147483647;
    background: #1a1a2e;
    border: 1px solid #7c3aed;
    border-radius: 10px;
    padding: 12px;
    width: 300px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
    font-family: system-ui, sans-serif;
    color: #e0e0e0;
    font-size: 12px;
  `;const n=document.createElement("div");n.style.cssText="display:flex;align-items:center;margin-bottom:8px;",n.innerHTML='<span style="flex:1;font-weight:600;color:#a78bfa;">💡 Forgotten tabs</span>';const o=document.createElement("button");o.textContent="✕",o.setAttribute("aria-label","Dismiss suggestions"),o.style.cssText=`
    background:none;border:none;color:#888;cursor:pointer;font-size:14px;padding:2px 4px;
    border-radius:4px;
  `,o.addEventListener("click",a),o.addEventListener("keydown",t=>{(t.key==="Enter"||t.key===" ")&&a()}),n.appendChild(o),i.appendChild(n);for(const t of s){const e=document.createElement("div");e.style.cssText=`
      display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;
      border-radius:6px;
    `,e.setAttribute("tabindex","0"),e.setAttribute("role","button"),e.setAttribute("aria-label",`Open ${t.title||t.url}`);const r=(t.title||t.url||"").slice(0,50);e.innerHTML=`
      ${t.favIconUrl?`<img src="${t.favIconUrl}" width="14" height="14" style="border-radius:2px;" alt="" />`:""}
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${r}</span>
      <span style="color:#666;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;">${t.source}</span>
    `,e.addEventListener("mouseenter",()=>{e.style.background="#2d2d4e"}),e.addEventListener("mouseleave",()=>{e.style.background=""}),e.addEventListener("click",()=>{chrome.runtime.sendMessage({type:"OPEN_TAB",url:t.url,sessionId:t.sessionId}),a()}),e.addEventListener("keydown",l=>{(l.key==="Enter"||l.key===" ")&&(chrome.runtime.sendMessage({type:"OPEN_TAB",url:t.url,sessionId:t.sessionId}),a())}),i.appendChild(e)}document.body.appendChild(i),h()}function a(){clearTimeout(d),i&&(i.remove(),i=null)}function h(){clearTimeout(d),d=setTimeout(a,c.overlayDismissMs)}document.addEventListener("keydown",s=>{s.key==="Escape"&&i&&a()})})();
