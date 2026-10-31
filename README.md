# ADHD-Quest: Version 0.24 (Echter Vollbild-Modus ohne Adressleiste + Neuer Startbildschirm)

### Neu in Version 0.24:
1. **Versionscounter auf `v0.24` erhöht.**
2. **Browser-Adressleiste auf dem Smartphone komplett ausgeblendet (`manifest.json` + PWA-Meta-Tags):**
   - Durch die neue `manifest.json` (`"display": "standalone"`) und die Mobile-Web-App-Tags im `<head>` von `index.html` startet `ADHD Quest` über das Home-Screen-Icon ohne störende Browser-Adressleiste im echten Vollbildmodus.
3. **Neuer, cleaner Startbildschirm:**
   - Das Hintergrundbild mit dem Kritzelmännchen (`bg_startbildschirm.png`) wurde komplett entfernt.
   - Das Titelbild (`bg_startlogo.png`) füllt jetzt **100 % der Bildschirmbreite** (`width: 100%; height: auto;`) unter Beibehaltung seiner exakten Original-Proportionen.
   - Der restliche Bildschirmhintergrund ist komplett **Reinweiß (`#ffffff`)**.
   - Die Anzeigedauer des Titelbilds wurde um **2 Sekunden verlängert** (von 2,2 s auf **4,2 Sekunden**).
