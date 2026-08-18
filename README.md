# Ordklasse-træner

Et lille værktøj til at finde danske ord ud fra ordklasse og et
to-bogstavs-mønster, sorteret efter hyppighed.

## Kør projektet

1. Installér Flask:
   ```
   pip install -r requirements.txt
   ```
2. Start serveren fra denne mappe:
   ```
   python app.py
   ```
3. Åbn http://127.0.0.1:5000 i browseren.

## Struktur

- `app.py` – Flask-server. Indlæser datasættet én gang ved opstart
  og har endpointet `POST /api/generate`, som filtrerer og
  returnerer ordlisten.
- `data/lemma-30k-2017.txt` – datasættet (kode, ord, hyppighed).
- `templates/index.html` – siden.
- `static/style.css` / `static/script.js` – layout og interaktion.

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
