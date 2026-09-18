const CONFIG = {
  // If the site is hosted as https://USER.github.io/REPO/,
  // this is detected automatically.
  // For a custom domain, set owner/repo manually.
  owner: "",
  repo: "",
  notesDir: "notes"
};

const $ = (selector) => document.querySelector(selector);

function getRepository() {
  if (CONFIG.owner && CONFIG.repo) return CONFIG;

  const host = location.hostname;
  const path = location.pathname.split("/").filter(Boolean);

  if (host.endsWith(".github.io")) {
    return {
      ...CONFIG,
      owner: host.replace(".github.io", ""),
      repo: path[0] || ""
    };
  }

  // GitHub Pages project site can also be opened from a custom domain
  // after setting owner/repo explicitly above.
  throw new Error("Не удалось определить GitHub repository. Укажите owner и repo в app.js.");
}

function rawUrl(repo, file) {
  return `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/main/${CONFIG.notesDir}/${encodeURIComponent(file)}`;
}

function apiUrl(repo) {
  return `https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/${CONFIG.notesDir}`;
}

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { meta: {}, body: markdown };

  const meta = {};
  for (const line of match[1].split("\n")) {
    const m = line.match(/^([^:#]+):\s*(.*)$/);
    if (!m) continue;
    meta[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }

  return { meta, body: markdown.slice(match[0].length) };
}

function parseDate(filename) {
  const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})\.md$/);
  if (!match) return null;
  const date = new Date(`${match[1]}-${match[2]}-${match[3]}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(date);
}

function formatWeekday(date) {
  return new Intl.DateTimeFormat("ru-RU", { weekday: "short" })
    .format(date)
    .replace(".", "");
}

function filenameFromHash() {
  const hash = decodeURIComponent(location.hash.slice(1));
  return hash && /^\d{4}-\d{2}-\d{2}\.md$/.test(hash) ? hash : null;
}

function renderDateList(files) {
  const list = $("#date-list");
  list.innerHTML = "";

  const template = $("#date-item-template");

  for (const file of files) {
    const date = parseDate(file.name);
    if (!date) continue;

    const item = template.content.cloneNode(true);
    const link = item.querySelector(".date-item");
    link.href = `#${file.name}`;
    link.querySelector(".date-main").textContent =
      file.name.replace(".md", "");
    link.querySelector(".date-weekday").textContent = formatWeekday(date);
    list.appendChild(item);
  }
}

function renderMarkdown(markdown) {
  marked.setOptions({
    gfm: true,
    breaks: true
  });

  const html = marked.parse(markdown);
  return DOMPurify.sanitize(html);
}

async function loadNote(file, repo) {
  const status = $("#status");
  const note = $("#note");

  status.classList.remove("error");
  status.textContent = `Загрузка ${file}…`;
  note.classList.add("hidden");

  const response = await fetch(rawUrl(repo, file));
  if (!response.ok) throw new Error(`Не удалось загрузить ${file}: HTTP ${response.status}`);

  const markdown = await response.text();
  const { meta, body } = parseFrontmatter(markdown);
  const date = parseDate(file);

  const title = meta.title || (date ? formatDate(date) : file.replace(".md", ""));
  const subtitle = [meta.status, meta.time].filter(Boolean).join(" · ");

  note.innerHTML = `
    <header class="note-header">
      <div class="note-date">${date ? formatDate(date) : file}</div>
      <h1 class="note-title">${escapeHtml(title)}</h1>
      ${subtitle ? `<div class="note-subtitle">${escapeHtml(subtitle)}</div>` : ""}
    </header>
    <div class="markdown-body">${renderMarkdown(body)}</div>
  `;

  document.querySelectorAll(".date-item").forEach((el) => {
    el.classList.toggle("active", el.getAttribute("href") === `#${file}`);
  });

  status.classList.add("hidden");
  note.classList.remove("hidden");
  document.title = `${title} — Worklog`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function init() {
  try {
    const repo = getRepository();
    const repoName = `${repo.owner}/${repo.repo}`;
    $("#repo-label").textContent = repoName;
    $("#github-link").href = `https://github.com/${repoName}/tree/main/${CONFIG.notesDir}`;

    const response = await fetch(apiUrl(repo), {
      headers: { "Accept": "application/vnd.github+json" }
    });

    if (!response.ok) {
      throw new Error(`GitHub API: HTTP ${response.status}`);
    }

    const entries = await response.json();

    const files = entries
      .filter((entry) => entry.type === "file" && entry.name.endsWith(".md"))
      .filter((entry) => parseDate(entry.name))
      .sort((a, b) => b.name.localeCompare(a.name));

    if (!files.length) {
      $("#status").textContent = "В каталоге notes пока нет файлов YYYY-MM-DD.md.";
      return;
    }

    renderDateList(files);

    const selected = filenameFromHash();
    const file = files.find((x) => x.name === selected) || files[0];

    if (!location.hash || !selected) {
      history.replaceState(null, "", `#${file.name}`);
    }

    await loadNote(file.name, repo);
  } catch (error) {
    console.error(error);
    $("#status").textContent = error.message;
    $("#status").classList.add("error");
  }
}

window.addEventListener("hashchange", async () => {
  try {
    const repo = getRepository();
    const file = filenameFromHash();
    if (file) await loadNote(file, repo);
  } catch (error) {
    $("#status").textContent = error.message;
    $("#status").classList.add("error");
  }
});

init();
