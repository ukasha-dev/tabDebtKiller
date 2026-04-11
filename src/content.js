import { tokenize, rankCandidates } from "./scoring.js";

// Guard: only inject once
if (window.__tabDebtKillerInjected) {
  throw new Error("already injected");
}
window.__tabDebtKillerInjected = true;

let overlay = null;
let dismissTimer = null;
let settings = { resurfacingEnabled: true, tokenMatchThreshold: 2, overlayDismissMs: 8000 };

// Load settings once
chrome.storage.sync.get("settings", ({ settings: s }) => {
  if (s) settings = { ...settings, ...s };
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.settings) {
    settings = { ...settings, ...changes.settings.newValue };
  }
});

let debounceTimer = null;

document.addEventListener(
  "input",
  (e) => {
    try {
      if (!settings.resurfacingEnabled) return;
      const target = e.target;
      if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") return;
      const text = target.value || target.innerText || "";
      if (text.length < 5) { hideOverlay(); return; }

      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => runSurfacing(text), 300);
    } catch {}
  },
  true
);

async function runSurfacing(query) {
  try {
    const { sessions = [] } = await chrome.storage.local.get("sessions");
    const { tab_metadata_cache = {} } = await chrome.storage.local.get("tab_metadata_cache");

    // Build candidate list from saved sessions + open tabs
    const candidates = [];

    for (const session of sessions) {
      for (const tab of session.tabs) {
        candidates.push({
          title: tab.title,
          url: tab.url,
          favIconUrl: tab.favIconUrl,
          source: session.name,
          sessionId: session.id,
        });
      }
    }

    // Open tabs from cache
    for (const [, meta] of Object.entries(tab_metadata_cache)) {
      candidates.push({
        title: meta.title,
        url: meta.url,
        description: meta.description,
        favIconUrl: meta.favIconUrl,
        source: "Open tab",
        sessionId: null,
      });
    }

    const results = rankCandidates(query, candidates, settings.tokenMatchThreshold, 3);
    if (results.length === 0) { hideOverlay(); return; }
    showOverlay(results.map((r) => r.candidate));
  } catch {}
}

function showOverlay(suggestions) {
  hideOverlay();

  overlay = document.createElement("div");
  overlay.id = "__tdk-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-label", "Tab suggestions");
  overlay.style.cssText = `
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
  `;

  const header = document.createElement("div");
  header.style.cssText = "display:flex;align-items:center;margin-bottom:8px;";
  header.innerHTML = `<span style="flex:1;font-weight:600;color:#a78bfa;">💡 Forgotten tabs</span>`;

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "✕";
  closeBtn.setAttribute("aria-label", "Dismiss suggestions");
  closeBtn.style.cssText = `
    background:none;border:none;color:#888;cursor:pointer;font-size:14px;padding:2px 4px;
    border-radius:4px;
  `;
  closeBtn.addEventListener("click", hideOverlay);
  closeBtn.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") hideOverlay(); });
  header.appendChild(closeBtn);
  overlay.appendChild(header);

  for (const s of suggestions) {
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;gap:8px;padding:6px 4px;cursor:pointer;
      border-radius:6px;
    `;
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", `Open ${s.title || s.url}`);

    const title = (s.title || s.url || "").slice(0, 50);
    row.innerHTML = `
      ${s.favIconUrl ? `<img src="${s.favIconUrl}" width="14" height="14" style="border-radius:2px;" alt="" />` : ""}
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${title}</span>
      <span style="color:#666;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;">${s.source}</span>
    `;

    row.addEventListener("mouseenter", () => { row.style.background = "#2d2d4e"; });
    row.addEventListener("mouseleave", () => { row.style.background = ""; });
    row.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OPEN_TAB", url: s.url, sessionId: s.sessionId });
      hideOverlay();
    });
    row.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        chrome.runtime.sendMessage({ type: "OPEN_TAB", url: s.url, sessionId: s.sessionId });
        hideOverlay();
      }
    });
    overlay.appendChild(row);
  }

  document.body.appendChild(overlay);
  resetDismissTimer();
}

function hideOverlay() {
  clearTimeout(dismissTimer);
  if (overlay) { overlay.remove(); overlay = null; }
}

function resetDismissTimer() {
  clearTimeout(dismissTimer);
  dismissTimer = setTimeout(hideOverlay, settings.overlayDismissMs);
}

// Escape key dismissal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && overlay) hideOverlay();
});
