/**
 * Typed helpers over chrome.storage.local and chrome.storage.sync.
 */

/** @returns {Promise<Array>} */
export async function getSessions() {
  const { sessions = [] } = await chrome.storage.local.get("sessions");
  return sessions;
}

/** @param {Array} sessions */
export async function setSessions(sessions) {
  await chrome.storage.local.set({ sessions });
}

/** @returns {Promise<object>} */
export async function getSettings() {
  const defaults = {
    resurfacingEnabled: true,
    autoGroupThreshold: 10,
    tokenMatchThreshold: 2,
    overlayDismissMs: 8000,
  };
  const { settings = {} } = await chrome.storage.sync.get("settings");
  return { ...defaults, ...settings };
}

/** @param {object} settings */
export async function setSettings(settings) {
  await chrome.storage.sync.set({ settings });
}

/** @returns {Promise<{key: string, tier: string, validatedAt: number}>} */
export async function getLicense() {
  const { license = { key: "", tier: "free", validatedAt: 0 } } =
    await chrome.storage.sync.get("license");
  return license;
}

/** @param {{key: string, tier: string, validatedAt: number}} license */
export async function setLicense(license) {
  await chrome.storage.sync.set({ license });
}

/** @returns {Promise<object>} */
export async function getTabMetadataCache() {
  const { tab_metadata_cache = {} } = await chrome.storage.local.get("tab_metadata_cache");
  return tab_metadata_cache;
}

/** @param {object} cache */
export async function setTabMetadataCache(cache) {
  await chrome.storage.local.set({ tab_metadata_cache: cache });
}
