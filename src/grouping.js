/**
 * Extracts the cluster key from a URL (hostname without www.).
 * @param {string} url
 * @returns {string} cluster key
 */
export function getClusterKey(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    // Use the primary domain (e.g. "github" from "github.com")
    return hostname.split(".")[0];
  } catch {
    return null;
  }
}

/**
 * Clusters an array of tabs by hostname.
 * @param {chrome.tabs.Tab[]} tabs
 * @returns {Map<string, chrome.tabs.Tab[]>} map of clusterKey -> tabs
 */
export function cluster(tabs) {
  const groups = new Map();
  for (const tab of tabs) {
    const key = getClusterKey(tab.url || tab.pendingUrl || "");
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(tab);
  }
  // FR-003: remove single-tab groups
  for (const [key, members] of groups) {
    if (members.length < 2) groups.delete(key);
  }
  return groups;
}

/**
 * Deterministically maps a cluster key to a Chrome tab group color.
 * @param {string} key
 * @returns {string} Chrome color name
 */
export function keyToColor(key) {
  const colors = ["grey", "blue", "red", "yellow", "green", "pink", "purple", "cyan", "orange"];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return colors[hash % colors.length];
}

/**
 * Capitalizes the first letter of a string.
 * @param {string} str
 * @returns {string}
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
