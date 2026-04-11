import"../../modulepreload-polyfill.js";const r=e=>chrome.runtime.sendMessage(e),d=document.getElementById("session-list"),v=document.getElementById("search");let i=[];async function u(){i=await r({type:"GET_SESSIONS"}),l(i)}function l(e){if(d.innerHTML="",!e.length){d.innerHTML='<p class="empty">No saved sessions yet.</p>';return}for(const t of e)d.appendChild(f(t))}function f(e){const t=document.createElement("div");t.className="session-card",t.dataset.id=e.id;const a=new Date(e.savedAt).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}),o=e.tabs.slice(0,3).map(n=>n.favIconUrl?`<img src="${n.favIconUrl}" alt="" />`:"").join("");t.innerHTML=`
    <div class="session-header">
      <span class="chevron">▶</span>
      <div class="session-info">
        <div class="session-name" title="${e.name}">${e.name}</div>
        <div class="session-meta">${a} · ${e.tabs.length} tabs</div>
      </div>
      <div class="favicons">${o}</div>
      <div class="session-actions">
        <button class="icon-btn btn-rename" title="Rename">✏️</button>
        <button class="icon-btn btn-delete" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="session-tabs">
      ${e.tabs.map(n=>`
        <div class="tab-row" data-url="${n.url}" data-session="${e.id}">
          ${n.favIconUrl?`<img src="${n.favIconUrl}" alt="" />`:""}
          <span class="tab-title">${n.title||n.url}</span>
          <span class="tab-url">${n.url}</span>
        </div>`).join("")}
      <div class="restore-btns">
        <button class="btn-restore-here">Restore Here</button>
        <button class="btn-restore-new">Restore in New Window</button>
      </div>
    </div>`;const s=t.querySelector(".session-header"),m=t.querySelector(".session-tabs"),S=t.querySelector(".chevron");s.addEventListener("click",n=>{n.target.closest(".session-actions")||(m.classList.toggle("open"),S.classList.toggle("open"))});const c=t.querySelector(".session-name");return c.addEventListener("dblclick",()=>b(c,e)),t.querySelector(".btn-rename").addEventListener("click",()=>b(c,e)),t.querySelector(".btn-delete").addEventListener("click",async()=>{confirm(`Delete "${e.name}"?`)&&(await r({type:"DELETE_SESSION",sessionId:e.id}),u())}),t.querySelector(".btn-restore-here").addEventListener("click",()=>r({type:"RESTORE_SESSION",sessionId:e.id,newWindow:!1})),t.querySelector(".btn-restore-new").addEventListener("click",()=>r({type:"RESTORE_SESSION",sessionId:e.id,newWindow:!0})),t.querySelectorAll(".tab-row").forEach(n=>{n.addEventListener("click",()=>r({type:"OPEN_TAB",url:n.dataset.url,sessionId:Number(n.dataset.session)}))}),t}function b(e,t){e.contentEditable="true",e.focus();const a=document.createRange();a.selectNodeContents(e),window.getSelection().removeAllRanges(),window.getSelection().addRange(a);const o=async()=>{e.contentEditable="false";const s=e.textContent.trim();s&&s!==t.name?(await r({type:"RENAME_SESSION",sessionId:t.id,name:s}),t.name=s):e.textContent=t.name};e.addEventListener("keydown",s=>{s.key==="Enter"&&(s.preventDefault(),o()),s.key==="Escape"&&(e.textContent=t.name,e.contentEditable="false")},{once:!0}),e.addEventListener("blur",o,{once:!0})}v.addEventListener("input",()=>{const e=v.value.toLowerCase();if(!e){l(i);return}const t=i.filter(a=>a.name.toLowerCase().includes(e)||a.tabs.some(o=>(o.title||"").toLowerCase().includes(e)||(o.url||"").toLowerCase().includes(e)));l(t)});chrome.storage.onChanged.addListener((e,t)=>{t==="local"&&e.sessions&&u()});u();
