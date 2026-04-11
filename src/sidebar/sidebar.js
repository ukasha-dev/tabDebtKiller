const send = (msg) => chrome.runtime.sendMessage(msg);
const list = document.getElementById("session-list");
const searchInput = document.getElementById("search");

let allSessions = [];

async function loadSessions() {
  allSessions = await send({ type: "GET_SESSIONS" });
  render(allSessions);
}

function render(sessions) {
  list.innerHTML = "";
  if (!sessions.length) {
    list.innerHTML = '<p class="empty">No saved sessions yet.</p>';
    return;
  }
  for (const session of sessions) {
    list.appendChild(buildCard(session));
  }
}

function buildCard(session) {
  const card = document.createElement("div");
  card.className = "session-card";
  card.dataset.id = session.id;

  const dateStr = new Date(session.savedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  // Favicons (up to 3)
  const faviconHtml = session.tabs
    .slice(0, 3)
    .map((t) => t.favIconUrl ? `<img src="${t.favIconUrl}" alt="" />` : "")
    .join("");

  card.innerHTML = `
    <div class="session-header">
      <span class="chevron">▶</span>
      <div class="session-info">
        <div class="session-name" title="${session.name}">${session.name}</div>
        <div class="session-meta">${dateStr} · ${session.tabs.length} tabs</div>
      </div>
      <div class="favicons">${faviconHtml}</div>
      <div class="session-actions">
        <button class="icon-btn btn-rename" title="Rename">✏️</button>
        <button class="icon-btn btn-delete" title="Delete">🗑️</button>
      </div>
    </div>
    <div class="session-tabs">
      ${session.tabs.map((t) => `
        <div class="tab-row" data-url="${t.url}" data-session="${session.id}">
          ${t.favIconUrl ? `<img src="${t.favIconUrl}" alt="" />` : ""}
          <span class="tab-title">${t.title || t.url}</span>
          <span class="tab-url">${t.url}</span>
        </div>`).join("")}
      <div class="restore-btns">
        <button class="btn-restore-here">Restore Here</button>
        <button class="btn-restore-new">Restore in New Window</button>
      </div>
    </div>`;

  // Toggle expand
  const header = card.querySelector(".session-header");
  const tabsPanel = card.querySelector(".session-tabs");
  const chevron = card.querySelector(".chevron");
  header.addEventListener("click", (e) => {
    if (e.target.closest(".session-actions")) return;
    tabsPanel.classList.toggle("open");
    chevron.classList.toggle("open");
  });

  // Rename (double-click on name)
  const nameEl = card.querySelector(".session-name");
  nameEl.addEventListener("dblclick", () => startRename(nameEl, session));
  card.querySelector(".btn-rename").addEventListener("click", () => startRename(nameEl, session));

  // Delete
  card.querySelector(".btn-delete").addEventListener("click", async () => {
    if (confirm(`Delete "${session.name}"?`)) {
      await send({ type: "DELETE_SESSION", sessionId: session.id });
      loadSessions();
    }
  });

  // Restore
  card.querySelector(".btn-restore-here").addEventListener("click", () =>
    send({ type: "RESTORE_SESSION", sessionId: session.id, newWindow: false })
  );
  card.querySelector(".btn-restore-new").addEventListener("click", () =>
    send({ type: "RESTORE_SESSION", sessionId: session.id, newWindow: true })
  );

  // Tab row click
  card.querySelectorAll(".tab-row").forEach((row) => {
    row.addEventListener("click", () =>
      send({ type: "OPEN_TAB", url: row.dataset.url, sessionId: Number(row.dataset.session) })
    );
  });

  return card;
}

function startRename(nameEl, session) {
  nameEl.contentEditable = "true";
  nameEl.focus();
  // Select all text
  const range = document.createRange();
  range.selectNodeContents(nameEl);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  const finish = async () => {
    nameEl.contentEditable = "false";
    const newName = nameEl.textContent.trim();
    if (newName && newName !== session.name) {
      await send({ type: "RENAME_SESSION", sessionId: session.id, name: newName });
      session.name = newName;
    } else {
      nameEl.textContent = session.name;
    }
  };

  nameEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); finish(); }
    if (e.key === "Escape") { nameEl.textContent = session.name; nameEl.contentEditable = "false"; }
  }, { once: true });
  nameEl.addEventListener("blur", finish, { once: true });
}

// Search filter
searchInput.addEventListener("input", () => {
  const q = searchInput.value.toLowerCase();
  if (!q) { render(allSessions); return; }
  const filtered = allSessions.filter((s) =>
    s.name.toLowerCase().includes(q) ||
    s.tabs.some((t) => (t.title || "").toLowerCase().includes(q) || (t.url || "").toLowerCase().includes(q))
  );
  render(filtered);
});

// Listen for storage changes to auto-refresh
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.sessions) loadSessions();
});

loadSessions();
