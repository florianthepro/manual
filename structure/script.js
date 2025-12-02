let structure = {};
let currentLang = "de";

async function init() {
  const res = await fetch("structure.json");
  structure = await res.json();

  // Sprachen sammeln
  const langs = new Set();
  Object.values(structure).forEach(thema => {
    Object.values(thema).forEach(kat => {
      Object.keys(kat).forEach(lang => langs.add(lang));
    });
  });

  const langSelect = document.getElementById("langSelect");
  langs.forEach(l => {
    const opt = document.createElement("option");
    opt.value = l; opt.textContent = l;
    langSelect.appendChild(opt);
  });
  langSelect.value = currentLang;
  langSelect.onchange = () => { currentLang = langSelect.value; renderTOC(); };

  renderTOC();
}

function renderTOC() {
  const toc = document.getElementById("toc");
  toc.innerHTML = "";
  for (const [thema, cats] of Object.entries(structure)) {
    for (const [cat, langs] of Object.entries(cats)) {
      if (langs[currentLang]) {
        const li = document.createElement("li");
        li.textContent = `${thema} / ${cat}`;
        li.onclick = () => loadMarkdown(langs[currentLang]);
        toc.appendChild(li);
      }
    }
  }
}

async function loadMarkdown(path) {
  const res = await fetch(path);
  const text = await res.text();
  document.getElementById("content").innerHTML = marked.parse(text);
}

init();
