# ADHD-Quest: Version 0.28 (Ruhige Raum-Ansicht ohne Hintergrund-Figur + Vergrößerter 86px Pop-Out Profilrahmen)

### Neu in Version 0.28:
1. **Kleine Spielerfigur aus den Raum-Hintergründen entfernt:**
   - Der kleine Ganzkörper-Avatar (`#room-player-container` / `#room-player-sprite`) wurde aus allen Raum-Kulissen entfernt, sodass die Räume ruhig und aufgeräumt wirken.
2. **Profilrahmen im Header vergrößert (86×86 px) & Kopfschnitt-Bug behoben:**
   - Ursache für den abgeschnittenen Kopf/Schiebermütze war `object-fit: cover` in Kombination mit `border-radius: 50%` auf einem 66×66 px Kreis bei hochformatigen Porträt-Sprites (`147×220 px` bzw. `765×1024 px`).
   - Der Rahmen (`.avatar-popout-wrapper`) wurde auf **86×86 px** vergrößert und nutzt nun `object-fit: contain; object-position: center bottom;` mit oberem Kopffreiheits-Puffer, sodass Schiebermütze, Brille und Vollbart in allen 11 States vollständig sichtbar sitzen.

# ADHD-Quest: Version 0.27 (Dashboard & Wohnzimmer mit Null-Naht-Sprites + Reparierte Assets + Sheet-Sync Update)

### Neu in Version 0.27:
1. **Echtes Dashboard-Hintergrundbild (`assets/bg_dashboard.jpg` / `assets/bg_dashboard_orig.jpg`) wiederhergestellt + 11 Null-Naht-Sprites (`assets/dashboard_sprites/`):**
   - `sprite_dash_pinnwand.png` – **Kork-Pinnwand (Plan A, Map & Budget)** (`left: 7.38%, top: 21.88%, width: 63.71%, height: 19.14%`) -> `MB Aktivitaeten!A32`
   - `sprite_dash_goals.png` – **GOALS-Checkliste & Wandcharts** (`left: 37.55%, top: 43.36%, width: 32.91%, height: 9.96%`) -> `Aufgaben!A39`
   - `sprite_dash_lampe.png` – **Schreibtischlampe (Vibe Coding)** (`left: 15.82%, top: 44.43%, width: 21.52%, height: 14.65%`) -> `MB Aktivitaeten!A45`
   - `sprite_dash_organizer.png` – **Leder-Stifteorganizer (AfA Check)** (`left: 11.18%, top: 58.40%, width: 19.41%, height: 4.49%`) -> `Aufgaben!A35`
   - `sprite_dash_rechner.png` – **Taschenrechner & Briefstapel (Rechnungen)** (`left: 30.59%, top: 57.81%, width: 11.60%, height: 4.88%`) -> `MB Aktivitaeten!A21`
   - `sprite_dash_sparschwein.png` – **Rosa Sparschwein (Dopamin-Shop öffnen)** (`left: 39.24%, top: 52.34%, width: 21.94%, height: 9.38%`) -> `Shop`
   - `sprite_dash_roboter.png` – **Holz-Roboter (ADHD Quest programmieren)** (`left: 65.61%, top: 50.59%, width: 11.81%, height: 8.50%`) -> `MB Aktivitaeten!A40`
   - `sprite_dash_notizbuch.png` – **Aufgeschlagenes Arbeitsbuch (Jobbörsen)** (`left: 58.02%, top: 58.69%, width: 22.57%, height: 4.20%`) -> `Aufgaben!A36`
   - `sprite_dash_istqb_stapel.png` – **Bücherstapel am Teppich (ISTQB Lernen)** (`left: 52.32%, top: 84.18%, width: 21.52%, height: 9.57%`) -> `Aufgaben!A37`
   - `sprite_dash_koffer.png` – **Reisekoffer unten rechts (Bewerbung abgeschickt)** (`left: 73.42%, top: 81.05%, width: 26.58%, height: 14.45%`) -> `Aufgaben!A41`
   - `sprite_dash_tuer.png` – **Offene Holztür rechts (Zur Wohnungs-Map)** (`left: 77.64%, top: 28.52%, width: 22.36%, height: 45.51%`) -> `Navigation`

2. **Wohnzimmer (`assets/bg_livingroom_me.png`) komplett auf 11 Null-Naht-Sprites (`assets/wohnzimmer_sprites/`) umgestellt:**
   - Alle 10 vorhandenen Wohnzimmer-Sprites (`sprite_woh_stagepiano.png`, `sprite_woh_synth_piano.png`, `sprite_woh_ukulelen.png`, `sprite_woh_monitorboxen.png`, `sprite_woh_fotoalbum.png`, `sprite_woh_sofakissen.png`, `sprite_woh_teetassen.png`, `sprite_woh_gamepads.png`, `sprite_woh_fernseher.png`, `sprite_woh_wandfokus.png`) plus die neue Wohnzimmertür (`sprite_woh_tuer.png`) sind nun pixelgenau platziert.

3. **Alle Raum-Icons (`assets/icons/`) & neuer Raum „Kinderzimmer“ integriert:**
   - Alle 43 Pixel-Icons aus `assets/icons/` sind jetzt fest mit den Aufgaben und MB-Aktivitäten in Küche, Bad, Schlafzimmer, Flur, Wohnzimmer, Dashboard und Kinderzimmer verknüpft.
   - Automatischer Mitternachts-Reset für erledigte Tagesaufgaben (`completedToday`), dynamischer MB%-Ring um den Avatar und zuverlässiger `text/plain` POST-Sync mit Google Apps Script.
