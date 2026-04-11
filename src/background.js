import { cluster, keyToColor, capitalize } from "./grouping.js";
import { getSessions, setSessions, getLicense, getSettings, setLicense } from "./storage.js";

// ── Auto-group threshold listener ──────────────────────────────────────────

chrome.tabs.onCreated.addListener(async () => {
  const settings = await getSettings();
  if (!settings.autoGroupThreshold) return;
  const tabs = await chrome.tabs.query({ currentWindow: true });
  if (tabs.length > settings.autoGroupThreshold) {
    await runGrouping();
  }
});

// ── Message router ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
  return true; // keep channel open for async response
});

async function handleMessage(msg) {
  switch (msg.type) {
    case "GROUP_TABS":       return runGrouping();
    case "SAVE_SESSION":     return saveSession(msg.name);
    case "RESTORE_SESSION":  return restoreSession(msg.sessionId, msg.newWindow);
    case "DELETE_SESSION":   return deleteSession(msg.sessionId);
    case "RENAME_SESSION":   return renameSession(msg.sessionId, msg.name);
    case "GET_SESSIONS":     return getSessions();
    case "ACTIVATE_LICENSE": return activateLicense(msg.key);
    case "OPEN_SIDEBAR":
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
      return { ok: true };
    case "OPEN_TAB":         return openOrFocusTab(msg.url, msg.sessionId);
    default: throw new Error(`Unknown message type: ${msg.type}`);
  }
}

// ── Grouping ───────────────────────────────────────────────────────────────

/**
 * Clusters all tabs in the current window and applies Chrome tab groups.
 */
async function runGrouping() {
  const [window] = await chrome.windows.getAll({ populate: true });
  const currentWindow = await chrome.windows.getCurrent({ populate: true });
  const tabs = currentWindow.tabs.filter((t) => !t.pinned);

  // Ungroup all existing groups first
  const tabIds = tabs.map((t) => t.id);
  if (tabIds.length) {
    await chrome.tabs.ungroup(tabIds).catch(() => {});
  }

  const groups = cluster(tabs);

  for (const [key, members] of groups) {
    const ids = members.map((t) => t.id);
    const groupId = await chrome.tabs.group({ tabIds: ids });
    await chrome.tabGroups.update(groupId, {
      title: capitalize(key),
      color: keyToColor(key),
      collapsed: false,
    });
  }
  return { ok: true, groupCount: groups.size };
}

// ── Session Save ───────────────────────────────────────────────────────────

async function saveSession(customName) {
  const license = await getLicense();
  const sessions = await getSessions();

  if (license.tier === "free" && sessions.length >= 5) {
    return { ok: false, reason: "FREE_LIMIT" };
  }

  const window = await chrome.windows.getCurrent({ populate: true });
  const tabs = window.tabs;

  // Build group metadata
  const groupIds = [...new Set(tabs.map((t) => t.groupId).filter((id) => id !== -1))];
  const groupMeta = {};
  for (const gid of groupIds) {
    const g = await chrome.tabGroups.get(gid).catch(() => null);
    if (g) groupMeta[gid] = { name: g.title, color: g.color };
  }

  // Auto-generate name from most frequent hostname
  const hostCounts = {};
  for (const tab of tabs) {
    try {
      const h = new URL(tab.url || "").hostname.replace(/^www\./, "");
      hostCounts[h] = (hostCounts[h] || 0) + 1;
    } catch {}
  }
  const topHost = Object.entries(hostCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Session";
  const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const autoName = `${capitalize(topHost.split(".")[0])} — ${dateStr}`;

  const session = {
    id: Date.now(),
    name: customName || autoName,
    savedAt: Date.now(),
    tabs: tabs.map((t) => ({
      url: t.url,
      title: t.title,
      favIconUrl: t.favIconUrl,
      groupId: t.groupId,
    })),
    groups: groupMeta,
  };

  await setSessions([session, ...sessions]);
  return { ok: true, session };
}

// ── Session Restore ────────────────────────────────────────────────────────

async function restoreSession(sessionId, newWindow = false) {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return { ok: false, reason: "NOT_FOUND" };

  let windowId;
  if (newWindow) {
    const win = await chrome.windows.create({ focused: true });
    windowId = win.id;
    // Close the default blank tab
    const [blankTab] = await chrome.tabs.query({ windowId });
    if (blankTab) await chrome.tabs.remove(blankTab.id).catch(() => {});
  } else {
    windowId = (await chrome.windows.getCurrent()).id;
  }

  // Create tabs
  const createdTabs = [];
  for (const tabData of session.tabs) {
    const tab = await chrome.tabs.create({ url: tabData.url, windowId, active: false });
    createdTabs.push({ tab, originalGroupId: tabData.groupId });
  }

  // Re-create groups
  const groupIdMap = {}; // old groupId -> new groupId
  for (const [oldGid, meta] of Object.entries(session.groups)) {
    const tabsForGroup = createdTabs
      .filter((t) => String(t.originalGroupId) === oldGid)
      .map((t) => t.tab.id);
    if (tabsForGroup.length < 2) continue;
    const newGid = await chrome.tabs.group({ tabIds: tabsForGroup, createProperties: { windowId } });
    await chrome.tabGroups.update(newGid, { title: meta.name, color: meta.color });
    groupIdMap[oldGid] = newGid;
  }

  return { ok: true };
}

// ── Session Delete / Rename ────────────────────────────────────────────────

async function deleteSession(sessionId) {
  const sessions = await getSessions();
  await setSessions(sessions.filter((s) => s.id !== sessionId));
  return { ok: true };
}

async function renameSession(sessionId, name) {
  const sessions = await getSessions();
  const idx = sessions.findIndex((s) => s.id === sessionId);
  if (idx === -1) return { ok: false };
  sessions[idx].name = name;
  await setSessions(sessions);
  return { ok: true };
}

// ── License Activation ─────────────────────────────────────────────────────

async function activateLicense(key) {
  const LEMON_URL = "https://api.lemonsqueezy.com/v1/licenses/validate";
  let lastError;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(LEMON_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ license_key: key, instance_name: "tab-debt-killer" }),
      });
      const data = await res.json();
      if (data.valid) {
        await setLicense({ key, tier: "pro", validatedAt: Date.now() });
        return { ok: true };
      }
      return { ok: false, reason: data.error || "INVALID_KEY" };
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return { ok: false, reason: "NETWORK_ERROR", detail: lastError?.message };
}

// ── Open or focus a tab ────────────────────────────────────────────────────

async function openOrFocusTab(url, sessionId) {
  // Check if tab is already open
  const existing = await chrome.tabs.query({ url });
  if (existing.length > 0) {
    await chrome.tabs.update(existing[0].id, { active: true });
    await chrome.windows.update(existing[0].windowId, { focused: true });
    return { ok: true };
  }
  // Restore from session if needed
  if (sessionId) {
    await restoreSession(sessionId, false);
    return { ok: true };
  }
  await chrome.tabs.create({ url });
  return { ok: true };
}
