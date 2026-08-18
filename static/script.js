const classGrid = document.getElementById("classGrid");
const lettersInput = document.getElementById("lettersInput");
const countInput = document.getElementById("countInput");
const startFirstBtn = document.getElementById("startFirstBtn");
const startBothBtn = document.getElementById("startBothBtn");
const generateBtn = document.getElementById("generateBtn");
const statusText = document.getElementById("statusText");
const resultsEl = document.getElementById("results");

let startMode = null; // null | "first" | "both"

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

async function generate() {
  const letters = lettersInput.value.trim();

  if (letters.length < 2) {
    setStatus("Skriv præcis to bogstaver.", true);
    lettersInput.focus();
    return;
  }

  let count = parseInt(countInput.value, 10);
  if (!Number.isFinite(count) || count < 1) count = 20;

  generateBtn.disabled = true;
  setStatus("Genererer …");
  resultsEl.innerHTML = "";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classes: getSelectedClasses(),
        letters,
        start_mode: startMode,
        count,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setStatus(data.error || "Der gik noget galt.", true);
      return;
    }

    renderResults(data.words);
    setStatus(`${data.count} ord fundet.`);
  } catch (err) {
    setStatus("Kunne ikke kontakte serveren.", true);
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
