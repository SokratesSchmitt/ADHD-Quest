# Stilreferenz – ADHD Quest (Ab Version 0.30)

## 1. Visueller Kernstil
- **Genre & Look:** Moderner 2D-Vektor- / Cel-Shading-Illustrationsstil (inspiriert von hochwertigen Cozy-Games und modernen Graphic Novels).
- **Outlines:** Kräftige, saubere, dunkelbraun-schwarze Konturlinien (`#1a120b` bis `#0f0b14`) mit leicht variierender Strichstärke (organischer Tusche-/Vektor-Charakter, **keine** harte Pixel-Treppchenbildung).
- **Schattierung (Cel-Shading):** Klare, weich abgestufte Tonwertflächen (Grundfarbe + 1–2 Schattenstufen + gezielte warme Glanzlichter/Rim-Lights).
- **Farbpalette:** Warme, gemütliche Innenraumfarben (Honig- und Walnussholz, sanftes Salbeigrün bei Pflanzen, warmes Lampenlicht in Goldgelb/Orange `#ff922b` / `#ff7a00`) kombiniert mit hoher Lesbarkeit vor ruhigen Wandflächen.

## 2. Charakter-Referenz (Paddy)
- **Kopfbedeckung:** Beige-braune Schiebermütze (Flat Cap) mit feiner Fischgrät-/Webstruktur.
- **Brille:** Markante dunkelblaue/anthrazitfarbene Fassung mit Doppelsteg.
- **Bart:** Voller, gepflegter Vollbart in warmem Rotbraun/Kastanienbraun mit charakteristischen hellen/grauen Strähnen im vorderen Kinnbereich.
- **Kleidung:** Dunkelblaues Hemd mit feinem senfgelbem/orangem Karomuster über grauem T-Shirt.

## 3. Raum- & Objekt-Architektur (9:16 Smartphone-Vollbild)
- **Leere Raum-Kulissen (`768 × 1376 px`):** Werden ohne Personen und ohne die interaktiven Quest-Gegenstände gerendert.
- **Einzel-Sprites (Freigestellt mit Alpha-Kanal):** Alle anklickbaren Aufgaben- und MB-Gegenstände werden einzeln im selben Vektor-/Cel-Shading-Stil generiert, sauber freigestellt (`.png` mit transparentem Hintergrund) und per Prozent-Koordinaten (`leftPct`, `topPct`, `widthPct`, `heightPct`) auf der Raum-Kulisse platziert.
