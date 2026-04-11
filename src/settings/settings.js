const send = (msg) => chrome.runtime.sendMessage(msg);

const els = {
  resurfacingEnabled: document.getElementById("resurfacing-enabled"),
  tokenThreshold: document.getElementById("token-threshold"),
  overlayDismiss: document.getElementById("overlay-dismiss"),
  autoGroupThreshold: document.getElementById("auto-group-threshold"),
  licenseKey: document.getElementById("license-key"),
  tierBadge: document.getElementById("tier-badge"),
  licenseStatus: document.getElementById("license-status"),
  saveStatus: document.getElementById("save-status"),
};

// Load current settings and license
async function load() {
  const { settings = {} } = await chrome.storage.sync.get("settings");
  const { license = { tier: "free" } } = await chrome.storage.sync.get("license");

  els.resurfacingEnabled.checked = settings.resurfacingEnabled ?? true;
  els.tokenThreshold.value = settings.tokenMatchThreshold ?? 2;
  els.overlayDismiss.value = settings.overlayDismissMs ?? 8000;
  els.autoGroupThreshold.value = settings.autoGroupThreshold ?? 10;

  updateTierBadge(license.tier);
  if (license.key) els.licenseKey.value = license.key;
}

function updateTierBadge(tier) {
  els.tierBadge.textContent = tier === "pro" ? "Pro" : "Free";
  els.tierBadge.className = `tier-badge${tier === "pro" ? " pro" : ""}`;
}

document.getElementById("btn-save").addEventListener("click", async () => {
  const settings = {
    resurfacingEnabled: els.resurfacingEnabled.checked,
    tokenMatchThreshold: Number(els.tokenThreshold.value),
    overlayDismissMs: Number(els.overlayDismiss.value),
    autoGroupThreshold: Number(els.autoGroupThreshold.value),
  };
  await chrome.storage.sync.set({ settings });
  els.saveStatus.textContent = "Settings saved.";
  setTimeout(() => { els.saveStatus.textContent = ""; }, 2000);
});

document.getElementById("btn-activate").addEventListener("click", async () => {
  const key = els.licenseKey.value.trim();
  if (!key) { els.licenseStatus.textContent = "Please enter a license key."; return; }

  els.licenseStatus.textContent = "Validating…";
  els.licenseStatus.className = "";

  const res = await send({ type: "ACTIVATE_LICENSE", key });
  if (res.ok) {
    els.licenseStatus.textContent = "Pro activated successfully!";
    els.licenseStatus.className = "success";
    updateTierBadge("pro");
  } else {
    els.licenseStatus.textContent = res.reason === "NETWORK_ERROR"
      ? "Could not reach license server. Please try again."
      : "Invalid license key.";
    els.licenseStatus.className = "error";
  }
});

load();
