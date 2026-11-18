# ADHD Quest – private Android- und Windows-App

Dieser Branch verpackt die bestehende Web-App in zwei private, lokal installierbare Anwendungen:

- Android über Capacitor
- Windows über Tauri

Eine Veröffentlichung in einem App Store ist nicht erforderlich.

## Gemeinsamer Web-Build

```bash
npm install
npm run build
```

Der Build kopiert nur die Dateien, die von der App zur Laufzeit benötigt werden, nach `dist/`. CSV-Exporte, alte Update-ZIP-Dateien und Entwicklungsdokumentation landen nicht in der App.

Build und lokale Medienpfade prüfen:

```bash
npm run verify
```

## Android

Voraussetzungen:

- Node.js 22 oder neuer
- Java 21
- Android Studio mit Android SDK

Projekt synchronisieren und öffnen:

```bash
npm run android:open
```

Debug-APK über die Kommandozeile bauen:

```bash
npm run android:build:debug
```

Die APK liegt anschließend unter `android/app/build/outputs/apk/debug/`.

## Windows

Voraussetzungen:

- Node.js 22 oder neuer
- Rust mit Cargo
- Microsoft C++ Build Tools
- Microsoft Edge WebView2

Installationsdatei erzeugen:

```bash
npm run windows:build
```

Der erzeugte private Windows-Installer (`.exe`) liegt anschließend unter `src-tauri/target/release/bundle/nsis/`.

## Daten und Synchronisierung

Der aktuelle Stand verwendet weiterhin den lokalen Browser-/WebView-Speicher und optional die bestehende Google-Sheets-Synchronisierung. Die Umstellung auf einen robusteren lokalen App-Speicher erfolgt in einem separaten Schritt, damit die erste Verpackung das Spielverhalten nicht verändert.
