// ---------------------------------------------------------------
// Ordklasse-træner — fuldt klient-side version
// (portet fra Flask/Python-backenden, så alt kan køre statisk
// via fx GitHub Pages, uden en server)
// ---------------------------------------------------------------

const classGrid = document.getElementById("classGrid");
const lettersInput = document.getElementById("lettersInput");
const countInput = document.getElementById("countInput");
const startFirstBtn = document.getElementById("startFirstBtn");
const startBothBtn = document.getElementById("startBothBtn");
const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("statusText");
const resultsEl = document.getElementById("results");

let startMode = null; // null | "first" | "both"

// ---- Data (svarer til CODE_TO_CLASS / ALL_CLASSES / load_words i app.py) ----

const DATA_URL = "data/lemma-30k-2017.txt";

const CODE_TO_CLASS = {
  A: "adjektiv",
  C: "konjunktion",
  U: "konjunktion", // C og U er begge konjunktioner
  D: "adverbium",
  I: "interjektion",
  NC: "substantiv",
  P: "pronomen",
  T: "præposition",
  V: "verbum",
};

const ALL_CLASSES = new Set([
  "adjektiv",
  "konjunktion",
  "adverbium",
  "interjektion",
  "substantiv",
  "pronomen",
  "præposition",
  "verbum",
]);

let WORDS = []; // liste af { word, wordClass }, i datasættets rækkefølge
let wordsReady = null; // Promise, der resolver når WORDS er indlæst

function loadWords() {
  return fetch(DATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Kunne ikke hente ordlisten (${res.status}).`);
      return res.text();
    })
    .then((text) => {
      const lines = text.split("\n");
      const words = [];
      for (const line of lines) {
        if (!line) continue;
        const parts = line.replace(/\r$/, "").split("\t");
        if (parts.length < 2) continue;
        const code = parts[0];
        const word = parts[1];
        const wordClass = CODE_TO_CLASS[code];
        if (!wordClass) continue;
        words.push({ word, wordClass });
      }
      WORDS = words;
    });
}

// ---- Ordklasse-knapper (flere kan være valgt ad gangen) ----
classGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".class-btn");
  if (!btn) return;
  btn.classList.toggle("active");
});

function getSelectedClasses() {
  return Array.from(classGrid.querySelectorAll(".class-btn.active")).map(
    (btn) => btn.dataset.class
  );
}

// ---- Start-betingelse (kun én ad gangen, eller ingen) ----
function setStartMode(mode) {
  startMode = startMode === mode ? null : mode;
  startFirstBtn.classList.toggle("active", startMode === "first");
  startBothBtn.classList.toggle("active", startMode === "both");
}

startFirstBtn.addEventListener("click", () => setStartMode("first"));
startBothBtn.addEventListener("click", () => setStartMode("both"));

// ---- Kun bogstaver i bogstav-feltet ----
lettersInput.addEventListener("input", () => {
  lettersInput.value = lettersInput.value
    .replace(/[^a-zA-ZæøåÆØÅ]/g, "")
    .slice(0, 2)
    .toLowerCase();
});

[lettersInput, countInput].forEach((el) => {
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter") generate();
  });
});

generateBtn.addEventListener("click", generate);

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.classList.toggle("is-error", isError);
}

// ---- Bogstav-matching (svarer til matches_letters i app.py) ----
function matchesLetters(word, l1, l2, startModeValue) {
  const w = word.toLowerCase();

  if (startModeValue === "both") {
    return w.slice(0, 2) === l1 + l2;
  }

  if (startModeValue === "first") {
    if (!w.startsWith(l1)) return false;
    return w.slice(1).includes(l2);
  }

  const idx1 = w.indexOf(l1);
  if (idx1 === -1) return false;
  const idx2 = w.indexOf(l2, idx1 + 1);
  return idx2 !== -1;
}

// ---- Generér-knap (svarer til /api/generate i app.py) ----
async function generate() {
  const letters = lettersInput.value.trim();

  if (letters.length < 2) {
    setStatus("Skriv præcis to bogstaver.", true);
    lettersInput.focus();
    return;
  }

  let count = parseInt(countInput.value, 10);
  if (!Number.isFinite(count) || count < 1) count = 20;
  count = Math.max(1, Math.min(count, 2000));

  generateBtn.disabled = true;
  setStatus("Genererer …");
  resultsEl.innerHTML = "";

  try {
    if (wordsReady) await wordsReady;

    const selectedClasses = getSelectedClasses().filter((c) => ALL_CLASSES.has(c));
    const classFilter = selectedClasses.length ? new Set(selectedClasses) : null;

    const l1 = letters[0];
    const l2 = letters[1];

    const results = [];
    for (const { word, wordClass } of WORDS) {
      if (classFilter && !classFilter.has(wordClass)) continue;
      if (!matchesLetters(word, l1, l2, startMode)) continue;
      results.push(word);
      if (results.length >= count) break;
    }

    renderResults(results);
    setStatus(`${results.length} ord fundet.`);
  } catch (err) {
    setStatus("Kunne ikke indlæse ordlisten.", true);
  } finally {
    generateBtn.disabled = false;
  }
}

function renderResults(words) {
  resultsEl.innerHTML = "";

  if (!words || words.length === 0) {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.textContent = "Ingen ord matcher de valgte kriterier.";
    resultsEl.appendChild(note);
    return;
  }

  const fragment = document.createDocumentFragment();
  words.forEach((word, i) => {
    const tile = document.createElement("div");
    tile.className = "word-tile";
    tile.style.animationDelay = `${Math.min(i, 30) * 12}ms`;
    tile.textContent = word;
    fragment.appendChild(tile);
  });
  resultsEl.appendChild(fragment);
}

// ---- Indlæs ordlisten i baggrunden med det samme ----
wordsReady = loadWords().catch((err) => {
  setStatus("Kunne ikke indlæse ordlisten.", true);
  console.error(err);
});
