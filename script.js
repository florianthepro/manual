
document.addEventListener("DOMContentLoaded", async () => {
  const STRUCTURE_URL = "https://raw.githubusercontent.com/florianthepro/rnanual/main/structure.json";
  const res = await fetch(STRUCTURE_URL);
  const structure = await res.json();

  const langSelect = document.getElementById("langSelect");
  const toc = document.getElementById("toc");
  const content = document.getElementById("content");

  const langs = new Set();
  Object.values(structure).forEach(cats =>
    Object.values(cats).forEach(langMap =>
      Object.keys(langMap).forEach(l => langs.add(l))
    )
  );
  langs.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l; opt.textContent = l;
    langSelect.appendChild(opt);
  });

  function buildUrl(lang, path) {
    const u = new URL(window.location.href);
    if (lang) u.searchParams.set("lang", lang); else u.searchParams.delete("lang");
    u.hash = path ? encodeURIComponent(path) : "";
    return u.toString();
  }

  function currentFromUrl() {
    const u = new URL(window.location.href);
    const lang = u.searchParams.get("lang");
    const path = u.hash ? decodeURIComponent(u.hash.slice(1)) : "";
    return { lang, path };
  }

  async function loadMarkdown(path, { push = true } = {}) {
    if (!path) { content.innerHTML = ""; return; }
    const r = await fetch(path);
    if (!r.ok) { content.textContent = "Datei nicht gefunden: " + path; return; }
    const md = await r.text();
    content.innerHTML = marked.parse(md);
    if (push) history.pushState({ lang: langSelect.value, path }, "", buildUrl(langSelect.value, path));
  }

  function renderTOC() {
    toc.innerHTML = "";
    for (const [thema, cats] of Object.entries(structure)) {
      const h = document.createElement("h3");
      h.textContent = thema;
      toc.appendChild(h);
      for (const [cat, langMap] of Object.entries(cats)) {
        const p = langMap[langSelect.value];
        if (p) {
          const btn = document.createElement("button");
          btn.textContent = cat;
          btn.onclick = () => loadMarkdown(p, { push: true });
          toc.appendChild(btn);
        }
      }
    }
  }

  langSelect.onchange = () => {
    renderTOC();
    const st = currentFromUrl();
    history.pushState({ lang: langSelect.value, path: st.path }, "", buildUrl(langSelect.value, st.path));
  };

  // Initiale Wiederherstellung aus URL
  const init = currentFromUrl();
  langSelect.value = langs.has(init.lang) ? init.lang : "de";
  renderTOC();
  if (init.path) await loadMarkdown(init.path, { push: false });
  else history.replaceState({ lang: langSelect.value, path: "" }, "", buildUrl(langSelect.value, ""));

  // Back/Forward und Hash-Änderungen
  async function syncFromUrl() {
    const st = currentFromUrl();
    if (st.lang && langs.has(st.lang) && langSelect.value !== st.lang) {
      langSelect.value = st.lang;
      renderTOC();
    }
    await loadMarkdown(st.path, { push: false });
  }
  window.addEventListener("popstate", syncFromUrl);
  window.addEventListener("hashchange", syncFromUrl);
});
