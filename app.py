"""
Ordklasse-træner
-----------------
Flask-backend der indlæser det danske lemma-datasæt og eksponerer et
API-endpoint, som filtrerer ordlisten ud fra ordklasse, to bogstaver
(i rækkefølge), start-betingelse og antal ord.
"""

from pathlib import Path
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

DATA_PATH = Path(__file__).parent / "data" / "lemma-30k-2017.txt"

# Kode i datasættet -> (intern nøgle, dansk visningsnavn)
CODE_TO_CLASS = {
    "A": "adjektiv",
    "C": "konjunktion",
    "U": "konjunktion",  # C og U er begge konjunktioner
    "D": "adverbium",
    "I": "interjektion",
    "NC": "substantiv",
    "P": "pronomen",
    "T": "præposition",
    "V": "verbum",
}

# De 8 valgbare ordklasser (nøgle -> visningsnavn), i den rækkefølge
# knapperne vises på siden (2 rækker af 4).
CLASS_LABELS = {
    "adjektiv": "Adjektiv",
    "konjunktion": "Konjunktion",
    "adverbium": "Adverbium",
    "interjektion": "Interjektion",
    "substantiv": "Substantiv",
    "pronomen": "Pronomen",
    "præposition": "Præposition",
    "verbum": "Verbum",
}

ALL_CLASSES = set(CLASS_LABELS.keys())


def load_words():
    """Indlæs datasættet én gang i hukommelsen.

    Returnerer en liste af (ord, ordklasse) i faldende frekvensorden,
    og springer koder over, der ikke svarer til en af de 8 ordklasser
    (fx AW/VW/EW, som er sjældne/fremmedords-varianter).
    """
    words = []
    with DATA_PATH.open(encoding="utf-8") as f:
        for line in f:
            parts = line.rstrip("\n").split("\t")
            if len(parts) < 2:
                continue
            code, word = parts[0], parts[1]
            word_class = CODE_TO_CLASS.get(code)
            if word_class is None:
                continue
            words.append((word, word_class))
    # Datasættet er allerede sorteret efter hyppighed (mest -> mindst),
    # men vi bevarer blot den indlæste rækkefølge for at være sikre.
    return words


WORDS = load_words()


def matches_letters(word: str, l1: str, l2: str, start_mode: str) -> bool:
    """Tjek om et ord opfylder bogstav-betingelsen.

    start_mode:
      - "both":  ordet skal starte med præcis l1 efterfulgt af l2
      - "first": ordet skal starte med l1, og l2 skal forekomme
                 et sted senere i ordet
      - None:    l1 og l2 skal blot begge forekomme i ordet, i den
                 angivne rækkefølge (ikke nødvendigvis i træk)
    """
    w = word.lower()

    if start_mode == "both":
        return w[:2] == (l1 + l2)

    if start_mode == "first":
        if not w.startswith(l1):
            return False
        return l2 in w[1:]

    idx1 = w.find(l1)
    if idx1 == -1:
        return False
    idx2 = w.find(l2, idx1 + 1)
    return idx2 != -1


@app.route("/")
def index():
    return render_template("index.html", class_labels=CLASS_LABELS)


@app.route("/api/generate", methods=["POST"])
def generate():
    payload = request.get_json(force=True, silent=True) or {}

    selected_classes = payload.get("classes") or []
    selected_classes = [c for c in selected_classes if c in ALL_CLASSES]
    # Intet valgt = ingen begrænsning på ordklasse (alle 8 er "til").
    class_filter = set(selected_classes) if selected_classes else None

    letters_raw = str(payload.get("letters") or "").strip().lower()
    start_mode = payload.get("start_mode")
    if start_mode not in ("first", "both"):
        start_mode = None

    try:
        count = int(payload.get("count", 20))
    except (TypeError, ValueError):
        count = 20
    count = max(1, min(count, 2000))

    if len(letters_raw) < 2:
        return jsonify({
            "error": "Skriv præcis to bogstaver i tekstfeltet.",
            "words": [],
        }), 400

    l1, l2 = letters_raw[0], letters_raw[1]

    results = []
    for word, word_class in WORDS:
        if class_filter is not None and word_class not in class_filter:
            continue
        if not matches_letters(word, l1, l2, start_mode):
            continue
        results.append(word)
        if len(results) >= count:
            break

    return jsonify({"words": results, "count": len(results)})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
