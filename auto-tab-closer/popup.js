let patterns = [];
let nextId = 1;

function renderPatterns() {
  const list = document.getElementById("patterns-list");
  list.innerHTML = "";

  patterns.forEach((p) => {
    const card = document.createElement("div");
    card.className = "pattern-card" + (p.enabled ? "" : " disabled");
    card.dataset.id = p.id;

    card.innerHTML = `
      <div class="card-header">
        <input type="text" class="name-field" value="${escHtml(p.name)}" placeholder="Pattern name" />
        <label class="toggle">
          <input type="checkbox" class="enabled-toggle" ${p.enabled ? "checked" : ""} />
          <span class="toggle-slider"></span>
        </label>
        <button class="delete-btn" title="Delete">✕</button>
      </div>
      <div class="field-row">
        <label>URL Pattern</label>
        <input type="text" class="url-pattern" value="${escHtml(p.urlPattern)}" placeholder="e.g. *example.com/path* or 127.0.0.1:*/?code=*" />
        <span class="hint">Use * as wildcard. Matched against the full tab URL.</span>
      </div>
      <div class="field-row">
        <label>Content Match <span style="color:#555">(optional)</span></label>
        <input type="text" class="content-match" value="${escHtml(p.contentMatch)}" placeholder="Text that must appear on the page" />
        <span class="hint">Leave blank to close on URL match alone.</span>
      </div>
    `;

    card.querySelector(".enabled-toggle").addEventListener("change", (e) => {
      p.enabled = e.target.checked;
      card.className = "pattern-card" + (p.enabled ? "" : " disabled");
    });

    card.querySelector(".delete-btn").addEventListener("click", () => {
      patterns = patterns.filter((x) => x.id !== p.id);
      renderPatterns();
    });

    card.querySelector(".name-field").addEventListener("input", (e) => {
      p.name = e.target.value;
    });

    card.querySelector(".url-pattern").addEventListener("input", (e) => {
      p.urlPattern = e.target.value;
    });

    card.querySelector(".content-match").addEventListener("input", (e) => {
      p.contentMatch = e.target.value;
    });

    list.appendChild(card);
  });
}

function addPattern() {
  patterns.push({
    id: nextId++,
    name: "New Pattern",
    urlPattern: "",
    contentMatch: "",
    enabled: true
  });
  renderPatterns();
  const cards = document.querySelectorAll(".pattern-card");
  const last = cards[cards.length - 1];
  last?.querySelector(".name-field")?.focus();
  last?.scrollIntoView({ behavior: "smooth" });
}

async function save() {
  await chrome.storage.sync.set({ patterns });
  const status = document.getElementById("status");
  status.textContent = "Saved!";
  setTimeout(() => { status.textContent = ""; }, 1500);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

document.getElementById("add-btn").addEventListener("click", addPattern);
document.getElementById("save-btn").addEventListener("click", save);

chrome.storage.sync.get("patterns").then((result) => {
  patterns = result.patterns ?? [];
  nextId = patterns.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  renderPatterns();
});
