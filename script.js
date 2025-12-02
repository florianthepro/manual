// Konfiguration
const STRUCTURE_URL = "structure.json"; // relativ zur index.html
let structure = {};
let currentLang = "de";
let currentKey = null; // "thema/kategorie"

const els = {
  langSelect: null, toc: null, content: null, status: null
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  // Elemente zuweisen
  els.langSelect = document.getElementById("langSelect");
  els.toc = document.getElementById("toc");
  els.content = document.getElementById("content");
  els.status = document.getElementById("status");

  // Sprache aus URL-Param oder LocalStorage
  const urlLang = new URL(location.href).searchParams.get("lang");
  currentLang = urlLang || localStorage.getItem("manual_lang") || currentLang;

  // Struktur laden
  try {
    const res = await fetch(STRUCTURE_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fehler beim Laden (${res.status})`);
    structure = await res.json();
  } catch (err) {
    showStatus(`structure.json konnte nicht geladen werden: ${err.message}`);
    renderLanguageSelect([]); // leer, damit UI benutzbar bleibt
    return;
  }

  // Sprachen sammeln
  const langs = collectLanguages(structure);
  if (!langs.size) showStatus("Keine Sprachen in structure.json gefunden.");

  renderLanguageSelect([...langs]);

  // Hash-Routing: #thema/kategorie
  window.addEventListener("hashchange", onHashChange);
  onHashChange(); // initialer Zustand
}

function collectLanguages(struct) {
  const set = new Set();
  Object.values(struct).forEach(cats => {
    Object.values(cats).forEach(langMap => {
      Object.keys(langMap).forEach(l => set.add(l));
    });
  });
  return set;
}

function renderLanguageSelect(langs) {
  els.langSelect.innerHTML = "";
  langs.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l; opt.textContent = l;
    els.langSelect.appendChild(opt);
  });
  // Fallback: wenn aktuelle Sprache nicht vorhanden ist, erste nehmen
  if (!langs.includes(currentLang)) currentLang = langs[0] || "de";
  els.langSelect.value = currentLang;

  els.langSelect.addEventListener("change", () => {
    currentLang = els.langSelect.value;
    localStorage.setItem("manual_lang", currentLang);
    renderTOC();
    // Wenn aktuell ausgewählt, neu laden
    if (currentKey) loadCurrent();
  });

  renderTOC();
}

function renderTOC() {
  els.toc.innerHTML = "";
  const fragment = document.createDocumentFragment();

  Object.entries(structure).forEach(([thema, cats]) => {
    // nur Themen mit mind. einer Kategorie für currentLang
    const visibleCats = Object.entries(cats).filter(([cat, langMap]) => !!langMap[currentLang]);
    if (!visibleCats.length) return;

    const section = document.createElement("div");
    section.className = "thema";

    const title = document.createElement("div");
    title.className = "thema-title";
    title.textContent = thema;
    section.appendChild(title);

    const list = document.createElement("ul");
    list.className = "cat-list";

    visibleCats.forEach(([cat, langMap]) => {
      const li = document.createElement("li");
      li.className = "cat-item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cat-button";
      btn.textContent = cat;
      const key = `${thema}/${cat}`;
      btn.dataset.key = key;

      btn.addEventListener("click", () => {
        // Hash setzen -> Routing-Handler lädt Inhalt
        location.hash = encodeURIComponent(key);
      });

      if (currentKey === key) btn.classList.add("active");

      li.appendChild(btn);
      list.appendChild(li);
    });

    section.appendChild(list);
    fragment.appendChild(section);
  });

  els.toc.appendChild(fragment);

  // Hinweis, falls kein Eintrag für Sprache existiert
  if (!els.toc.childElementCount) {
    showStatus(`Für Sprache "${currentLang}" sind keine Kategorien vorhanden.`);
  } else {
    hideStatus();
  }
}

function onHashChange() {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) {
    currentKey = null;
    clearContent();
    return;
  }
  currentKey = decodeURIComponent(raw);
  // UI-Aktivzustand aktualisieren
  [...document.querySelectorAll(".cat-button")].forEach(b => {
    b.classList.toggle("active", b.dataset.key === currentKey);
  });
  loadCurrent();
}

function loadCurrent() {
  if (!currentKey) return;
  // Key aufteilen
  const [thema, cat] = currentKey.split("/");
  const langMap = structure?.[thema]?.[cat];
  if (!langMap) {
    showStatus(`Unbekannte Kategorie: ${currentKey}`);
    return;
  }
  const path = langMap[currentLang];
  if (!path) {
    showStatus(`Für "${currentKey}" existiert keine Datei in Sprache "${currentLang}".`);
    return;
  }
  loadMarkdown(path);
}

async function loadMarkdown(path) {
  // relative Pfade zur GitHub Pages Struktur beachten
  try {
    showLoading(`Lade: ${path}`);
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`Fehler ${res.status} beim Laden: ${path}`);
    const md = await res.text();
    renderMarkdown(md);
    hideStatus();
  } catch (err) {
    showStatus(`Markdown konnte nicht geladen/gerendert werden: ${err.message}`);
  }
}

function renderMarkdown(md) {
  // marked ist global verfügbar (CDN in index.html)
  const html = marked.parse(md);
  els.content.innerHTML = html;
}

function clearContent() {
  els.content.innerHTML = `<h1>Manual</h1><p>Bitte links eine Kategorie wählen.</p>`;
}

function showLoading(msg) {
  els.status.textContent = msg;
  els.status.classList.remove("hidden");
  els.status.style.color = "#4b5563";
}

function showStatus(msg) {
  els.status.textContent = msg;
  els.status.classList.remove("hidden");
  els.status.style.color = "#b91c1c";
}

function hideStatus() {
  els.status.classList.add("hidden");
}
