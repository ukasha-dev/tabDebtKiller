const send = (msg) => chrome.runtime.sendMessage(msg);
const status = document.getElementById("status");
const upgradeModal = document.getElementById("upgrade-modal");

function setStatus(msg, isError = false) {
  status.textContent = msg;
  status.style.color = isError ? "#f87171" : "#a78bfa";
}

document.getElementById("btn-group").addEventListener("click", async () => {
  setStatus("Grouping tabs…");
  const res = await send({ type: "GROUP_TABS" });
  setStatus(res.error ? res.error : `Done — ${res.groupCount} group(s) created.`);
});

document.getElementById("btn-save").addEventListener("click", async () => {
  const name = document.getElementById("session-name").value.trim();
  setStatus("Saving…");
  const res = await send({ type: "SAVE_SESSION", name: name || undefined });
  if (res.reason === "FREE_LIMIT") {
    upgradeModal.classList.add("show");
    setStatus("");
  } else if (res.ok) {
    setStatus(`Saved: "${res.session.name}"`);
    document.getElementById("session-name").value = "";
  } else {
    setStatus(res.reason || "Save failed.", true);
  }
});

document.getElementById("btn-sidebar").addEventListener("click", async () => {
  await send({ type: "OPEN_SIDEBAR" });
  window.close();
});

document.getElementById("btn-settings").addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});

document.getElementById("modal-close").addEventListener("click", () => {
  upgradeModal.classList.remove("show");
});
