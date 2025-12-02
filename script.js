document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("https://github.com/florianthepro/rnanual/blob/main/structure.json");
  const structure = await res.json();

  const langSelect = document.getElementById("langSelect");
  const toc = document.getElementById("toc");
  const content = document.getElementById("content");

  // Sprachen sammeln
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
  langSelect.value = "de";

  function renderTOC() {
    toc.innerHTML = "";
    for (const [thema, cats] of Object.entries(structure)) {
      const h = document.createElement("h3");
      h.textContent = thema;
      toc.appendChild(h);
      for (const [cat, langMap] of Object.entries(cats)) {
        if (langMap[langSelect.value]) {
          const btn = document.createElement("button");
          btn.textContent = cat;
          btn.onclick = () => loadMarkdown(langMap[langSelect.value]);
          toc.appendChild(btn);
        }
      }
    }
  }

  async function loadMarkdown(path) {
    const res = await fetch(path);
    if (!res.ok) {
      content.textContent = "Datei nicht gefunden: " + path;
      return;
    }
    const md = await res.text();
    content.innerHTML = marked.parse(md);
  }

  langSelect.onchange = renderTOC;
  renderTOC();
});
