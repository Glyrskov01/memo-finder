# Ordklasse-træner

Et lille værktøj til at finde danske ord ud fra ordklasse og et
to-bogstavs-mønster, sorteret efter hyppighed.

Dette er en ren klient-side version (HTML/CSS/JS) — der er ikke
længere brug for en Python/Flask-server. Alt kører i browseren, så
projektet kan hostes direkte fra en GitHub-repo, fx med GitHub Pages.

## Kør projektet lokalt

Fordi siden henter `data/lemma-30k-2017.txt` med `fetch`, skal den
køres via en lille lokal webserver (åbner du `index.html` direkte som
en fil, blokerer browseren typisk fetch-kaldet).

Fra denne mappe, kør fx:

```
python3 -m http.server 8000
```

Åbn derefter http://localhost:8000 i browseren.

(Enhver anden simpel statisk server virker også, fx `npx serve`.)

## Sådan lægges det på GitHub Pages

1. Opret et repo på GitHub og push indholdet af denne mappe til det
   (fx til `main`-branchen).
2. Gå til repoets **Settings → Pages**.
3. Under "Build and deployment" vælges **Deploy from a branch**, med
   branch `main` og mappe `/ (root)`.
4. Efter et øjebliks kørsel er siden tilgængelig på den URL, GitHub
   viser (typisk `https://<brugernavn>.github.io/<repo-navn>/`).

## Struktur

- `index.html` – siden (ordklasse-knapperne er nu skrevet direkte i
  HTML'en i stedet for at blive genereret af Flask/Jinja).
- `style.css` – layout, uændret fra originalen.
- `script.js` – al logik: indlæser datasættet med `fetch`, filtrerer
  det i browseren og opdaterer resultaterne. Dette erstatter både
  Flask-endpointet `POST /api/generate` og den oprindelige
  `static/script.js`.
- `data/lemma-30k-2017.txt` – datasættet (kode, ord, hyppighed),
  uændret.

## Bemærk om logik

- Er der ikke valgt nogen ordklasse-knap, søges der på tværs af alle
  8 ordklasser (ingen begrænsning).
- "Det første bogstav": ordet skal starte med bogstav 1, og bogstav 2
  skal forekomme et sted senere i ordet.
- "Begge bogstaver": ordet skal starte med præcis bogstav 1 + bogstav 2.
- Er ingen af de to valgt: bogstav 1 og bogstav 2 skal begge forekomme
  i ordet, i den rækkefølge, men ikke nødvendigvis lige efter hinanden
  (fx "fk" matcher "forklare").
- Koder i datasættet uden for de 8 ordklasser (fx AW, VW, EW –
  sjældne/fremmedords-varianter) indgår ikke i søgningen.
