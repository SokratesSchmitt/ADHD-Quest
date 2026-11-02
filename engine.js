/**
 * ============================================================================
 * ADHD-QUEST CORE ENGINE v0.26 (1:1 Google Sheet Datenstruktur + Live-Sync)
 * ============================================================================
 * Basiert exakt auf deiner Google-Tabelle "ADHD Quest":
 * - Charakterbogen: MB (B3) = 94, HP (B4) = 54, Level (B6) = 25, XP (B8) = 59005, Gold (B10) = 9424, AP (D10) = 7
 * - MB Aktivitaeten (Spalten A: Aktivitaet, B: MB-Heilung, C: XP, D-G: Spaß/Kompetenz/Soziales/Selbstwert, H: Aktionspunkte, I: Status, M: Raum, N: Repräsentiert durch)
 * - Aufgaben (Spalten A: Aufgaben im Haushalt, B: MB-Heilung, C: XP, H: Gold, I: Aktionspunkte, J: Status, M: Raum, N: Repräsentiert durch)
 * - Shop (Spalten A: Aktivitaet, B: Preis, C: Status, E: Aktionspunktkosten)
 * - Frontend_Raum_Objekte (Spalten A: Raum, B: Beschreibung, C: posX, D: posY, E: Verknüpfung, F: Tabelle, G: iconUrl, H: soundUrl, I: id, J: iconName, K: soundName)
 * - Raum_adressen (Badezimmer, Dashboard, Map, Küche, Wohnzimmer, Startbildschirm, Startlogo + Flur & Schlafzimmer)
 * - Questlog (A: Datum, B: Uhrzeit, C: Aktivität, D: Typ, E: XP, F: MB, G: Gold, H: Aktionspunkte)
 * - Achievements (Beständiger Geist, Wochenheld, Monatsveteran)
 */
const Engine = (function () {
  const APP_VERSION = "0.28";
  const STORAGE_KEY = "ADHD_QUEST_SHEET_STATE_V0_28";
  const SPLASH_DATE_KEY = "adhdQuest_lastSplashDate";

  // Deine Live Google Apps Script Web-App URL aus dem Tabellenblatt "Dokumentation"
  const GAS_API_URL = "https://script.google.com/macros/s/AKfycbz3w5odPMFVRZ9hhMdhvMIwg6A0N6Fi2N6cKxu6aOTBKnilqYjptIbuAWbA5qYMu1-E5Q/exec";

  // 1. Tabellenblatt "Raum_adressen" + neue lokale Grafiken (Intro, Map, Flur)
  const ASSETS = {
    backgrounds: {
      "Startbildschirm": "aq_schriftzugtitle.png",
      "Startlogo": "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/backgrounds/bg_startlogo.png",
      "Map": "assets/bg_map_orig.png",
      "Flur": "assets/bg_flur_orig.png",
      "Dashboard": "assets/bg_dashboard.jpg",
      "Arbeitszimmer": "assets/bg_dashboard.jpg",
      "Wohnzimmer": "assets/bg_livingroom_me.png",
      "Küche": "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/backgrounds/bg_kitchen.png",
      "Badezimmer": "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/backgrounds/bg_bathroom.png",
      "Schlafzimmer": "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/assets/bg_schlafzimmer_orig.png",
      "Kinderzimmer": "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/assets/bg_kinderzimmer_orig.png"
    }
  };


  // 1b. Offizielle Designreferenz für Profilbild & 10 Spielerfigur-States (Schiebermütze, Brille, Vollbart & blau-braunes Karohemd)
  const PLAYER_DESIGN_REF = {
    profileRef: "assets/avatar/avatar_profile_ref.png",
    states: [
      { id: "state_01_neutral",  nr: 1,  label: "Neutral / Bereit",          mbRange: "75–100% MB (Standard)",  fullSprite: "assets/avatar/player_state_01_neutral.png",  portrait: "assets/avatar/portrait_state_01_neutral.png" },
      { id: "state_02_thumbsup", nr: 2,  label: "Daumen hoch / Motiviert",   mbRange: "85–100% MB (Gut drauf)", fullSprite: "assets/avatar/player_state_02_thumbsup.png", portrait: "assets/avatar/portrait_state_02_thumbsup.png" },
      { id: "state_03_waving",   nr: 3,  label: "Winkend / Begrüßung",       mbRange: "Raumwechsel / Hallo",    fullSprite: "assets/avatar/player_state_03_waving.png",   portrait: "assets/avatar/portrait_state_03_waving.png" },
      { id: "state_04_thinking", nr: 4,  label: "Grübelnd / Planend (?)",    mbRange: "55–74% MB (Planung)",    fullSprite: "assets/avatar/player_state_04_thinking.png", portrait: "assets/avatar/portrait_state_04_thinking.png" },
      { id: "state_05_yawning",  nr: 5,  label: "Gähnend / Müde",            mbRange: "20–39% MB (Müde)",       fullSprite: "assets/avatar/player_state_05_yawning.png",  portrait: "assets/avatar/portrait_state_05_yawning.png" },
      { id: "state_06_laughing", nr: 6,  label: "Herzlich lachend",          mbRange: "Spaß- & Witz-Aktivität", fullSprite: "assets/avatar/player_state_06_laughing.png", portrait: "assets/avatar/portrait_state_06_laughing.png" },
      { id: "state_07_action",   nr: 7,  label: "Aktiv / Anpackend",         mbRange: "Haushalts-Quest aktiv",  fullSprite: "assets/avatar/player_state_07_action.png",   portrait: "assets/avatar/portrait_state_07_action.png" },
      { id: "state_08_sipping",  nr: 8,  label: "Kaffee-Pause (aktiv)",      mbRange: "60–79% MB (Fokus)",      fullSprite: "assets/avatar/player_state_08_sipping.png",  portrait: "assets/avatar/portrait_state_08_sipping.png" },
      { id: "state_09_cozy_mug", nr: 9,  label: "Genießend mit Tasse",       mbRange: "40–54% MB (Regeneration)",fullSprite: "assets/avatar/player_state_09_cozy_mug.png", portrait: "assets/avatar/portrait_state_09_cozy_mug.png" },
      { id: "state_10_cheering", nr: 10, label: "Jubelnd / Quest erledigt!", mbRange: "Loot-Jubel & Level-Up",  fullSprite: "assets/avatar/player_state_10_cheering.png", portrait: "assets/avatar/portrait_state_10_cheering.png" },
      { id: "state_11_armchair", nr: 11, label: "Erschöpft im Sessel",       mbRange: "0–19% MB (Ruhe nötig)",  fullSprite: "assets/avatar/player_state_11_armchair.png", portrait: "assets/avatar/portrait_state_11_armchair.png" }
    ]
  };

  // 2. Interaktive Wohnungs-Map (Neuer Grundriss inkl. Flur & Schlafzimmer)
  const ROOMS = [
    {
      id: "Flur",
      icon: "🚪",
      desc: "Bücherregal, Eulen-Uhr, freies Holzbrett & Wohnungstür",
      bgUrl: ASSETS.backgrounds["Flur"],
      mapSprite: "assets/map_sprites/sprite_map_flur.png",
      leftPct: 3.92, topPct: 14.45, widthPct: 33.28, heightPct: 73.18, zIndex: 5,
      clipPath: "polygon(33.2% 0%, 100% 0%, 68.7% 100%, 0% 100%, 0% 40.1%)"
    },
    {
      id: "Wohnzimmer",
      icon: "🛋️",
      desc: "Schöne Musik, Instrumente, Filme & Erholung",
      bgUrl: ASSETS.backgrounds["Wohnzimmer"],
      mapSprite: "assets/map_sprites/sprite_map_wohnzimmer.png",
      leftPct: 29.65, topPct: 14.45, widthPct: 33.79, heightPct: 73.18, zIndex: 4,
      clipPath: "polygon(25.8% 0%, 100% 0%, 100% 49.0%, 85.3% 49.0%, 85.3% 100%, 0% 100%)"
    },
    {
      id: "Schlafzimmer",
      icon: "🛏️",
      desc: "Erholung, Massageöl, Teleskop & Samstagsputz",
      bgUrl: ASSETS.backgrounds["Schlafzimmer"],
      mapSprite: "assets/map_sprites/sprite_map_schlafzimmer.png",
      leftPct: 64.53, topPct: 14.45, widthPct: 32.05, heightPct: 35.94, zIndex: 5
    },
    {
      id: "Badezimmer",
      icon: "🚿",
      desc: "Schwimmen, Kalt duschen & Bad-Routine",
      bgUrl: ASSETS.backgrounds["Badezimmer"],
      mapSprite: "assets/map_sprites/sprite_map_badezimmer.png",
      leftPct: 59.45, topPct: 52.08, widthPct: 12.72, heightPct: 35.55, zIndex: 5
    },
    {
      id: "Küche",
      icon: "🍳",
      desc: "Geschirrspüler, Tisch abwischen & Mittagessen",
      bgUrl: ASSETS.backgrounds["Küche"],
      mapSprite: "assets/map_sprites/sprite_map_kueche.png",
      leftPct: 73.26, topPct: 52.08, widthPct: 23.33, heightPct: 35.55, zIndex: 5
    },
    {
      id: "Dashboard",
      icon: "🏠",
      desc: "Haupt-Dashboard, Tagesplaner, Shop & Questlog",
      bgUrl: ASSETS.backgrounds["Dashboard"],
      mapSprite: "assets/map_sprites/sprite_map_arbeitszimmer.png",
      leftPct: 41.13, topPct: 88.80, widthPct: 17.22, heightPct: 10.94, zIndex: 6
    }
  ];

  // Hilfsfunktion: Wandelt FlutterFlow/Sheet-Koordinaten (-1.0 bis +1.0) in CSS-Prozent (0% bis 100%) um
  function alignToPct(val, fallbackPct) {
    if (typeof val !== "number" || isNaN(val)) return fallbackPct;
    if (val >= -1.0 && val <= 1.0) {
      return Math.round(((val + 1) / 2) * 1000) / 10;
    }
    return val;
  }

  // 3. Tabellenblätter "Aufgaben", "MB Aktivitaeten" & "Frontend_Raum_Objekte"
  // Alle Einträge nutzen exakt die Namen (`name`) und Ziel-Tabellen (`zielTabelle`: "Aufgaben" oder "MB Aktivitaeten") deiner Google-Tabelle!
  const ROOM_OBJECTS = {
    "Flur": [
      {
        id: "FLU_001_01",
        raum: "Flur",
        name: "Tisch abwischen",
        anzeigeName: "Holzbrett der Kommode komplett frei halten (Tisch abwischen)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A17",
        icon: "✨",
        iconUrl: "assets/icons/icon_flu_holzbrett.png",
        spriteUrl: "assets/flur_sprites/sprite_flu_holzbrett.png",
        leftPct: 0.0, topPct: 50.10, widthPct: 75.74, heightPct: 21.39, zIndex: 14,
        clipPath: "polygon(0% 80%, 51% 36%, 89% 0%, 100% 0%, 100% 6%, 32% 100%, 0% 89%)",
        mb: 0, xp: 5, gold: 5, ap: 1,
        repr: "Freies braunes Holzbrett auf der Flur-Kommode"
      },
      {
        id: "FLU_002_01",
        raum: "Flur",
        name: "Witze anhören oder einfach nur so lachen",
        anzeigeName: "Bücher- & Brettspielregal (Star Wars, Kosmos & Witzebuch)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A6",
        icon: "🎲",
        iconUrl: "assets/icons/icon_flu_buecherregal.png",
        spriteUrl: "assets/flur_sprites/sprite_flu_buecherregal.png",
        leftPct: 0.42, topPct: 0.49, widthPct: 62.24, heightPct: 35.25, zIndex: 12,
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Großes Bücher- und Brettspielregal im Flur"
      },
      {
        id: "FLU_003_01",
        raum: "Flur",
        name: "10000 Schritte um 5 Uhr gehen",
        anzeigeName: "Oranger Eulen-Wecker im Regal (10.000 Schritte / Frühstart)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A17",
        icon: "🦉",
        iconUrl: "assets/icons/icon_flu_eule.png",
        spriteUrl: "assets/flur_sprites/sprite_flu_eule.png",
        leftPct: 5.06, topPct: 41.31, widthPct: 6.96, heightPct: 5.27, zIndex: 18,
        mb: 5, xp: 100, gold: 0, ap: 3,
        repr: "Oranger Eulen-Wecker im Flurregal"
      },
      {
        id: "FLU_004_01",
        raum: "Flur",
        name: "Wäsche zusammenlegen",
        anzeigeName: "Kommoden-Schubladen ordentlich einräumen (Wäsche/Ordnung)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A15",
        icon: "🗄️",
        iconUrl: "assets/icons/icon_flu_schubladen.png",
        spriteUrl: "assets/flur_sprites/sprite_flu_schubladen.png",
        leftPct: 22.78, topPct: 51.17, widthPct: 52.95, heightPct: 48.83, zIndex: 11,
        clipPath: "polygon(0% 41%, 100% 0%, 100% 25%, 9% 100%, 0% 100%)",
        mb: 0, xp: 50, gold: 10, ap: 1,
        repr: "Weiße und dunkelgrüne Schubladen im Flur"
      },
      {
        id: "FLU_005_01",
        raum: "Flur",
        name: "Ronja zum Kindergarten bringen",
        anzeigeName: "Pinnwand an der Zimmertür (Ronja zum Kindergarten bringen)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A2",
        icon: "📌",
        iconUrl: "assets/icons/icon_flu_pinnwand_tuer.png",
        spriteUrl: "assets/flur_sprites/sprite_flu_pinnwand_tuer.png",
        leftPct: 75.74, topPct: 28.12, widthPct: 14.35, heightPct: 31.45, zIndex: 16,
        mb: 0, xp: 10, gold: 1, ap: 1,
        repr: "Notizen & Postkarten an der weißen Flurtür"
      },
      {
        id: "FLU_MAP",
        raum: "Flur",
        name: "Wohnungs-Grundriss öffnen",
        anzeigeName: "Durchgang zur Wohnungs-Map",
        zielTabelle: "Navigation",
        icon: "🗺️",
        spriteUrl: "assets/flur_sprites/sprite_flu_tuer_durchgang.png",
        leftPct: 73.00, topPct: 25.98, widthPct: 25.95, heightPct: 34.18, zIndex: 10,
        isMapDoor: true
      }
    ],
    "Dashboard": [
      {
        id: "DASH_001_PINNWAND",
        raum: "Dashboard",
        name: "Etwas tun, was einem sonst nicht leicht fällt",
        anzeigeName: "Kork-Pinnwand (Plan A, Map & Budget-Übersicht)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A32",
        icon: "📋",
        iconUrl: "assets/icons/icon_dash_klemmbrett_todo.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_pinnwand.png",
        leftPct: 7.38, topPct: 21.88, widthPct: 63.71, heightPct: 19.14, zIndex: 12,
        xPct: 39.2, yPct: 31.4,
        mb: 1, xp: 300, gold: 0, ap: 1,
        repr: "Klemmbrett mit abgehakter To-Do-Liste an der Korkwand"
      },
      {
        id: "DASH_002_GOALS",
        raum: "Dashboard",
        name: "Vorbereitung auf Vorstellungsgespräch",
        anzeigeName: "GOALS-Checkliste & Wandcharts (Gesprächsvorbereitung)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A39",
        icon: "🎯",
        iconUrl: "assets/icons/icon_dash_interview_prep.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_goals.png",
        leftPct: 37.55, topPct: 43.36, widthPct: 32.91, heightPct: 9.96, zIndex: 13,
        xPct: 54.0, yPct: 48.3,
        mb: 0, xp: 50, gold: 125, ap: 1,
        repr: "Klemmbrett mit Fragen & Notizblock"
      },
      {
        id: "DASH_003_LAMPE",
        raum: "Dashboard",
        name: "Vibe Coding",
        anzeigeName: "Schreibtischlampe (Vibe Coding Fokus-Session)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A45",
        icon: "💡",
        iconUrl: "assets/icons/icon_dash_vibecoding.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_lampe.png",
        leftPct: 15.82, topPct: 44.43, widthPct: 21.52, heightPct: 14.65, zIndex: 14,
        xPct: 26.6, yPct: 51.8,
        mb: 2, xp: 500, gold: 0, ap: 1,
        repr: "Coding-Kopfhörer & beleuchtete mechanische Tastatur"
      },
      {
        id: "DASH_004_ORGANIZER",
        raum: "Dashboard",
        name: "Täglicher Check AfA Bewerbungen",
        anzeigeName: "Leder-Stifteorganizer (Täglicher Check AfA Bewerbungen)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A35",
        icon: "✒️",
        iconUrl: "assets/icons/icon_dash_afa_check.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_organizer.png",
        leftPct: 11.18, topPct: 58.40, widthPct: 19.41, heightPct: 4.49, zIndex: 16,
        xPct: 20.9, yPct: 60.6,
        mb: 1, xp: 25, gold: 50, ap: 1,
        repr: "Schreibtisch-Organizer & AfA-Unterlagen"
      },
      {
        id: "DASH_005_RECHNER",
        raum: "Dashboard",
        name: "Rechnungen bezahlen oder Formulare richtig ausfüllen und abschicken",
        anzeigeName: "Taschenrechner & Briefstapel (Rechnungen & Formulare)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A21",
        icon: "🧮",
        iconUrl: "assets/icons/icon_dash_rechnungen.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_rechner.png",
        leftPct: 30.59, topPct: 57.81, widthPct: 11.60, heightPct: 4.88, zIndex: 17,
        xPct: 36.4, yPct: 60.3,
        mb: -2, xp: 300, gold: 0, ap: 3,
        repr: "Briefstapel & Taschenrechner am Schreibtisch"
      },
      {
        id: "DASH_SHOP",
        raum: "Dashboard",
        name: "Shop öffnen",
        anzeigeName: "Rosa Sparschwein (Dopamin-Shop & Belohnungen öffnen)",
        zielTabelle: "Shop",
        icon: "🐷",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_sparschwein.png",
        leftPct: 39.24, topPct: 52.34, widthPct: 21.94, heightPct: 9.38, zIndex: 18,
        xPct: 50.2, yPct: 57.0,
        isShopTrigger: true
      },
      {
        id: "DASH_007_ROBOTER",
        raum: "Dashboard",
        name: "ADHD Quest programmieren",
        anzeigeName: "Holz-Roboter auf dem Schreibtisch (ADHD Quest programmieren)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A40",
        icon: "🤖",
        iconUrl: "assets/icons/icon_dash_adhdquest_code.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_roboter.png",
        leftPct: 65.61, topPct: 50.59, widthPct: 11.81, heightPct: 8.50, zIndex: 17,
        xPct: 71.5, yPct: 54.8,
        mb: 1, xp: 500, gold: 0, ap: 1,
        repr: "Offener Laptop & Roboter-Figur auf dem Schreibtisch"
      },
      {
        id: "DASH_008_NOTIZBUCH",
        raum: "Dashboard",
        name: "Tägliche Recherche Jobbörsen (20 min)",
        anzeigeName: "Aufgeschlagenes Notizbuch (Recherche Jobbörsen / Deprexis)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A36",
        icon: "📖",
        iconUrl: "assets/icons/icon_dash_jobboersen.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_notizbuch.png",
        leftPct: 58.02, topPct: 58.69, widthPct: 22.57, heightPct: 4.20, zIndex: 16,
        xPct: 69.3, yPct: 60.8,
        mb: 1, xp: 25, gold: 50, ap: 1,
        repr: "Laptop auf dem Schreibtisch mit Jobbörsen-Tabs"
      },
      {
        id: "DASH_009_ISTQB",
        raum: "Dashboard",
        name: "Lernen für ISTQB (Softwaretesting) 30 min",
        anzeigeName: "Bunter Bücherstapel am Teppich (ISTQB Foundation Level)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A37",
        icon: "📚",
        iconUrl: "assets/icons/icon_dash_istqb_buch.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_istqb_stapel.png",
        leftPct: 52.32, topPct: 84.18, widthPct: 21.52, heightPct: 9.57, zIndex: 19,
        xPct: 63.1, yPct: 89.0,
        mb: 0, xp: 50, gold: 100, ap: 3,
        repr: "ISTQB-Lehrbuch & Textmarker am Schreibtisch"
      },
      {
        id: "DASH_010_KOFFER",
        raum: "Dashboard",
        name: "Bewerbung geschrieben und abgeschickt",
        anzeigeName: "Reisekoffer unten rechts (Bewerbung abgeschickt!)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A41",
        icon: "🧳",
        iconUrl: "assets/icons/icon_dash_bewerbungsmappe.png",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_koffer.png",
        leftPct: 73.42, topPct: 81.05, widthPct: 26.58, heightPct: 14.45, zIndex: 18,
        xPct: 86.7, yPct: 88.3,
        mb: 2, xp: 500, gold: 300, ap: 3,
        repr: "Versandbereite Bewerbungsmappe am Schreibtisch"
      },
      {
        id: "DASH_DOOR",
        raum: "Dashboard",
        name: "Zur Wohnungs-Map",
        anzeigeName: "Offene Holztür rechts (Zur Wohnungs-Map)",
        zielTabelle: "Navigation",
        icon: "🚪",
        spriteUrl: "assets/dashboard_sprites/sprite_dash_tuer.png",
        leftPct: 77.64, topPct: 28.52, widthPct: 22.36, heightPct: 45.51, zIndex: 11,
        xPct: 88.8, yPct: 51.3,
        isMapDoor: true
      }
    ],
    "Wohnzimmer": [
      {
        id: "WOH_001_STAGEPIANO",
        raum: "Wohnzimmer",
        name: "Klavier spielen (20 min)",
        anzeigeName: "Stage Piano in der Musikecke (Klavier spielen - 20 min)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A33",
        icon: "🎹",
        iconUrl: "assets/icons/icon_woh_stagepiano.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_stagepiano.png",
        leftPct: 52.56, topPct: 36.51, widthPct: 42.47, heightPct: 20.00, zIndex: 15,
        mb: 3, xp: 15, gold: 0, ap: 1,
        repr: "Stage Piano in der Musikecke"
      },
      {
        id: "WOH_002_SYNTH",
        raum: "Wohnzimmer",
        name: "Ein Instrument spielen oder neu lernen (30 min)",
        anzeigeName: "Synthesizer & Setup (Instrument spielen/lernen - 30 min)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A19",
        icon: "🎛️",
        iconUrl: "assets/icons/icon_woh_synth_piano.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_synth_piano.png",
        leftPct: 52.56, topPct: 29.01, widthPct: 43.04, heightPct: 12.00, zIndex: 16,
        mb: 1, xp: 25, gold: 0, ap: 0,
        repr: "Stage Piano & Synthesizer"
      },
      {
        id: "WOH_003_UKULELEN",
        raum: "Wohnzimmer",
        name: "Trommeln oder ein anderes Instrument spielen",
        anzeigeName: "Ukulelen an der Wand (Instrument spielen)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A10",
        icon: "🎸",
        iconUrl: "assets/icons/icon_woh_ukulelen.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_ukulelen.png",
        leftPct: 28.98, topPct: 20.00, widthPct: 19.46, heightPct: 13.49, zIndex: 14,
        mb: 2, xp: 25, gold: 0, ap: 0,
        repr: "Ukulele an der Wand oder Trommel"
      },
      {
        id: "WOH_004_MONITORBOXEN",
        raum: "Wohnzimmer",
        name: "Schöne Musik hören",
        anzeigeName: "Studio-Monitorboxen (Schöne Musik hören)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A2",
        icon: "🎧",
        iconUrl: "assets/icons/icon_woh_monitorboxen.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_monitorboxen.png",
        leftPct: 58.10, topPct: 20.53, widthPct: 40.91, heightPct: 10.50, zIndex: 14,
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Schallplattenspieler, Kopfhörer oder Monitor-Boxen"
      },
      {
        id: "WOH_005_FOTOALBUM",
        raum: "Wohnzimmer",
        name: "Gemeinsam mit jemandem lachen",
        anzeigeName: "Bücherregal mit Efeutute & Fotoalbum (Gemeinsam lachen)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A23",
        icon: "📗",
        iconUrl: "assets/icons/icon_woh_fotoalbum.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_fotoalbum.png",
        leftPct: 20.03, topPct: 29.01, widthPct: 33.95, heightPct: 32.50, zIndex: 13,
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Geöffnetes Fotoalbum auf dem Couchtisch"
      },
      {
        id: "WOH_006_SOFAKISSEN",
        raum: "Wohnzimmer",
        name: "Auf einer Bank sitzen.",
        anzeigeName: "Rotes Sofa mit Decken & Kissen (Ausruhen / Innehalten)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A15",
        icon: "🛋️",
        iconUrl: "assets/icons/icon_woh_sofakissen.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_sofakissen.png",
        leftPct: 0.00, topPct: 52.04, widthPct: 31.96, heightPct: 13.49, zIndex: 15,
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Gemütliches Kissen auf der Fensterbank / Sofa"
      },
      {
        id: "WOH_007_TEETASSEN",
        raum: "Wohnzimmer",
        name: "Sich mit einem Menschen, den man mag, unterhalten",
        anzeigeName: "Couchtisch mit Teetasse (Gutes Gespräch führen)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A22",
        icon: "☕",
        iconUrl: "assets/icons/icon_woh_teetassen.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_teetassen.png",
        leftPct: 8.52, topPct: 62.50, widthPct: 53.41, heightPct: 20.99, zIndex: 16,
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Zwei dampfende Teetassen auf dem Couchtisch"
      },
      {
        id: "WOH_008_GAMEPADS",
        raum: "Wohnzimmer",
        name: "Mit Pia Rimworld spielen",
        anzeigeName: "Gamepads im Kallax-Regal (Mit Pia Rimworld spielen)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A39",
        icon: "🎮",
        iconUrl: "assets/icons/icon_woh_gamepads.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_gamepads.png",
        leftPct: 94.03, topPct: 35.99, widthPct: 5.97, heightPct: 24.01, zIndex: 17,
        mb: 2, xp: 125, gold: 0, ap: 0,
        repr: "Zwei Gamepads am Kallax-Regal"
      },
      {
        id: "WOH_009_FERNSEHER",
        raum: "Wohnzimmer",
        name: "Einen guten Film angucken",
        anzeigeName: "Fernseher rechts unten (Einen guten Film angucken)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A11",
        icon: "🎬",
        iconUrl: "assets/icons/icon_woh_fernseher.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_fernseher.png",
        leftPct: 77.98, topPct: 84.01, widthPct: 22.02, heightPct: 15.99, zIndex: 18,
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Fernseher oder Popcorn-Schüssel"
      },
      {
        id: "WOH_010_WANDFOKUS",
        raum: "Wohnzimmer",
        name: "Stare at the Wall (10 min)",
        anzeigeName: "Kronleuchter & Wandfokus (Stare at the Wall - 10 min)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A40",
        icon: "🕯️",
        iconUrl: "assets/icons/icon_woh_wandfokus.png",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_wandfokus.png",
        leftPct: 33.10, topPct: 2.04, widthPct: 33.38, heightPct: 19.47, zIndex: 12,
        mb: 2, xp: 125, gold: 100, ap: 1,
        repr: "Leere weiße Wand gegenüber dem Sessel"
      },
      {
        id: "WOH_AUF_001",
        raum: "Wohnzimmer",
        name: "Samstagsputz (Wohnzimmer)",
        anzeigeName: "Wohnzimmer-Teppich (Samstagsputz Wohnzimmer)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A8",
        xPct: 54, yPct: 86,
        icon: "🧹",
        iconUrl: "assets/icons/icon_woh_staubsauger.png",
        mb: 0, xp: 125, gold: 50, ap: 2,
        repr: "Staubsauger & Mikrofasertuch"
      },
      {
        id: "WOH_DOOR",
        raum: "Wohnzimmer",
        name: "Zur Wohnungs-Map",
        anzeigeName: "Wohnzimmertür links (Zur Wohnungs-Map)",
        zielTabelle: "Navigation",
        icon: "🚪",
        spriteUrl: "assets/wohnzimmer_sprites/sprite_woh_tuer.png",
        leftPct: 0.0, topPct: 16.32, widthPct: 16.76, heightPct: 30.26, zIndex: 11,
        isMapDoor: true
      }
    ],
    "Küche": [
      {
        id: "KUE_001_01",
        raum: "Küche",
        name: "Geschirrspüler ausräumen und einräumen",
        anzeigeName: "Geschirrspüler ausräumen und einräumen",
        zielTabelle: "Aufgaben",
        verknuepfung: "A13",
        posX: -0.57, posY: 0.351,
        xPct: alignToPct(-0.57, 21.5), yPct: alignToPct(0.351, 67.5),
        icon: "🍽️",
        iconUrl: "assets/icons/icon_kue_001.png",
        soundUrl: "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/sounds/sfx_kue_001.mp3",
        iconName: "icon_kue_001.png",
        soundName: "sfx_kue_001.mp3",
        mb: 0, xp: 125, gold: 10, ap: 1,
        repr: "Geschirrspüler"
      },
      {
        id: "KUE_002_01",
        raum: "Küche",
        name: "Tisch abwischen",
        anzeigeName: "Tisch abwischen",
        zielTabelle: "Aufgaben",
        verknuepfung: "A17",
        posX: -0.21, posY: 0.597,
        xPct: alignToPct(-0.21, 39.5), yPct: alignToPct(0.597, 79.8),
        icon: "🧽",
        iconUrl: "assets/icons/icon_kue_putzeimer.png",
        soundUrl: "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/sounds/sfx_kue_002.mp3",
        iconName: "icon_kue_002.png",
        soundName: "sfx_kue_002.mp3",
        mb: 0, xp: 5, gold: 5, ap: 1,
        repr: "Küchentisch / Arbeitsfläche"
      },
      {
        id: "KUE_003_01",
        raum: "Küche",
        name: "Mittagessen vorbereiten",
        anzeigeName: "Mittagessen vorbereiten",
        zielTabelle: "Aufgaben",
        verknuepfung: "A11",
        posX: -0.10, posY: -0.465,
        xPct: alignToPct(-0.10, 45.0), yPct: alignToPct(-0.465, 26.8),
        icon: "🍳",
        iconUrl: "assets/icons/icon_kue_schneidebrett_topf.png",
        soundUrl: "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/sounds/sfx_kue_003.mp3",
        iconName: "icon_kue_003.png",
        soundName: "sfx_kue_003.mp3",
        mb: 0, xp: 125, gold: 1, ap: 1,
        repr: "Holz-Schneidebrett / Herd"
      },
      {
        id: "KUE_AUF_004",
        raum: "Küche",
        name: "Müll rausbringen",
        anzeigeName: "Müll rausbringen",
        zielTabelle: "Aufgaben",
        verknuepfung: "A14",
        xPct: 74, yPct: 72,
        icon: "🗑️",
        iconUrl: "assets/icons/icon_kue_muelleimer.png",
        mb: 0, xp: 125, gold: 10, ap: 1,
        repr: "Mülleimer-Trennsystem unter der Spüle"
      },
      {
        id: "KUE_MB_001",
        raum: "Küche",
        name: "Leckeres Essen zubereiten",
        anzeigeName: "Leckeres Essen zubereiten (Genuss & Kompetenz)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A4",
        xPct: 68, yPct: 54,
        icon: "🥗",
        iconUrl: "assets/icons/icon_kue_siebtraeger.png",
        mb: 1, xp: 15, gold: 0, ap: 0,
        repr: "Holz-Schneidebrett mit Messer"
      },
      {
        id: "KUE_MB_002",
        raum: "Küche",
        name: "Zentangle (10 min)",
        anzeigeName: "Zentangle zeichnen (10 min Fokus & Entspannung)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A37",
        xPct: 26, yPct: 44,
        icon: "✒️",
        iconUrl: "assets/icons/icon_kue_zentangle.png",
        mb: 1, xp: 50, gold: 0, ap: 0,
        repr: "Skizzenblock und schwarzer Fineliner"
      },
      {
        id: "KUE_DOOR",
        raum: "Küche",
        name: "Zur Wohnungs-Map",
        anzeigeName: "Zur Wohnungs-Map",
        zielTabelle: "Navigation",
        xPct: 88, yPct: 48,
        icon: "🚪",
        isMapDoor: true
      }
    ],
    "Schlafzimmer": [
      {
        id: "SCH_MB_001",
        raum: "Schlafzimmer",
        name: "Eine Massage bekommen oder jemanden massieren",
        anzeigeName: "Eine Massage bekommen oder jemanden massieren",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A3",
        xPct: 34, yPct: 52,
        icon: "💆",
        iconUrl: "assets/icons/icon_sch_massageoel.png",
        mb: 2, xp: 5, gold: 0, ap: 0,
        repr: "Fläschchen Massageöl auf dem Nachttisch"
      },
      {
        id: "SCH_MB_002",
        raum: "Schlafzimmer",
        name: "Mit jemandem zärtlich sein",
        anzeigeName: "Mit jemandem zärtlich sein",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A8",
        xPct: 58, yPct: 56,
        icon: "🕯️",
        iconUrl: "assets/icons/icon_sch_kissen.png",
        mb: 2, xp: 25, gold: 0, ap: 0,
        repr: "Besonderes Kissen auf dem Bett"
      },
      {
        id: "SCH_MB_003",
        raum: "Schlafzimmer",
        name: "Nachts ganz bewusst den Mond und die Sterne betrachten",
        anzeigeName: "Nachts ganz bewusst den Mond und die Sterne betrachten",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A13",
        xPct: 82, yPct: 40,
        icon: "🔭",
        iconUrl: "assets/icons/icon_sch_teleskop.png",
        mb: 2, xp: 5, gold: 0, ap: 0,
        repr: "Teleskop am Fenster"
      },
      {
        id: "SCH_MB_004",
        raum: "Schlafzimmer",
        name: "Sich sportlich betätigen",
        anzeigeName: "Yogamatte & Hanteln (Sich sportlich betätigen / Planking)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A29",
        xPct: 28, yPct: 78,
        icon: "🧘",
        iconUrl: "assets/icons/icon_sch_yogamatte.png",
        mb: 2, xp: 25, gold: 0, ap: 0,
        repr: "Ausgerollte Yogamatte & Hanteln"
      },
      {
        id: "SCH_AUF_001",
        raum: "Schlafzimmer",
        name: "Samstagsputz (Schlafzimmer)",
        anzeigeName: "Samstagsputz (Schlafzimmer)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A9",
        xPct: 62, yPct: 78,
        icon: "🛏️",
        iconUrl: "assets/icons/icon_sch_samstagsputz.png",
        mb: 0, xp: 150, gold: 50, ap: 2,
        repr: "Schlafzimmer komplett herrichten"
      },
      {
        id: "SCH_DOOR",
        raum: "Schlafzimmer",
        name: "Zur Wohnungs-Map",
        anzeigeName: "Zur Wohnungs-Map",
        zielTabelle: "Navigation",
        xPct: 12, yPct: 45,
        icon: "🚪",
        isMapDoor: true
      }
    ],
    "Badezimmer": [
      {
        id: "BAD_MB_001",
        raum: "Badezimmer",
        name: "Schwimmen",
        anzeigeName: "Schwimmen gehen",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A5",
        xPct: 34, yPct: 56,
        icon: "🏊",
        iconUrl: "assets/icons/icon_bad_badetasche.png",
        mb: 5, xp: 25, gold: 0, ap: 0,
        repr: "Fertig gepackte Badetasche mit Handtuch"
      },
      {
        id: "BAD_MB_002",
        raum: "Badezimmer",
        name: "Kalt duschen",
        anzeigeName: "Kalt duschen (Erfrischung & Fokus)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A34",
        xPct: 28, yPct: 32,
        icon: "🚿",
        iconUrl: "assets/icons/icon_bad_kaltduschen.png",
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Regenduschkopf mit blauen Wassertropfen"
      },
      {
        id: "BAD_MB_003",
        raum: "Badezimmer",
        name: "Venla",
        anzeigeName: "Venla (Tägliche Medikations-Routine)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A38",
        xPct: 74, yPct: 38,
        icon: "💊",
        iconUrl: "assets/icons/icon_bad_venla.png",
        mb: 2, xp: 50, gold: 0, ap: 0,
        repr: "Pillendose auf der Bad-Ablage"
      },
      {
        id: "BAD_AUF_001",
        raum: "Badezimmer",
        name: "Wäsche waschen",
        anzeigeName: "Wäsche waschen",
        zielTabelle: "Aufgaben",
        verknuepfung: "A4",
        xPct: 68, yPct: 64,
        icon: "🧺",
        iconUrl: "assets/icons/icon_bad_waschmaschine.png",
        mb: 0, xp: 50, gold: 25, ap: 1,
        repr: "Waschmaschine / Wäschekorb"
      },
      {
        id: "BAD_AUF_002",
        raum: "Badezimmer",
        name: "Samstagsputz (Bad)",
        anzeigeName: "Samstagsputz (Bad)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A10",
        xPct: 52, yPct: 36,
        icon: "✨",
        iconUrl: "assets/icons/icon_bad_badreiniger.png",
        mb: 0, xp: 125, gold: 50, ap: 2,
        repr: "Waschbecken & Spiegel glänzen lassen"
      },
      {
        id: "BAD_DOOR",
        raum: "Badezimmer",
        name: "Zur Wohnungs-Map",
        anzeigeName: "Zur Wohnungs-Map",
        zielTabelle: "Navigation",
        xPct: 14, yPct: 48,
        icon: "🚪",
        isMapDoor: true
      }
    ],
    "Kinderzimmer": [
      {
        id: "KIN_MB_001",
        raum: "Kinderzimmer",
        name: "Mit Kindern spielen",
        anzeigeName: "Mit Kindern spielen (Eisenbahn & Einhorn)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A14",
        xPct: 36, yPct: 64,
        icon: "🚂",
        iconUrl: "assets/icons/icon_kin_eisenbahn_einhorn.png",
        mb: 1, xp: 25, gold: 0, ap: 0,
        repr: "Bunte Spielzeug-Eisenbahn oder Plüsch-Einhorn"
      },
      {
        id: "KIN_MB_002",
        raum: "Kinderzimmer",
        name: "Etwas basteln oder bauen (30 min)",
        anzeigeName: "Kleiner Mal- & Basteltisch (30 min basteln/bauen)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A20",
        xPct: 66, yPct: 58,
        icon: "🎨",
        iconUrl: "assets/icons/icon_kin_basteltisch.png",
        mb: 1, xp: 5, gold: 0, ap: 0,
        repr: "Kleiner Mal- & Basteltisch"
      },
      {
        id: "KIN_MB_003",
        raum: "Kinderzimmer",
        name: "Handwerken (Holz)",
        anzeigeName: "Holz-Werkzeugkasten (Handwerken & DIY-Projekte)",
        zielTabelle: "MB Aktivitaeten",
        verknuepfung: "A44",
        xPct: 74, yPct: 80,
        icon: "🪚",
        iconUrl: "assets/icons/icon_kin_holzwerkzeug.png",
        mb: 3, xp: 500, gold: 0, ap: 1,
        repr: "Holz-Werkzeugkasten mit Japansäge & Stecheisen"
      },
      {
        id: "KIN_AUF_001",
        raum: "Kinderzimmer",
        name: "Ronja ins Bett bringen",
        anzeigeName: "Gute-Nacht-Buch (Ronja ins Bett bringen)",
        zielTabelle: "Aufgaben",
        verknuepfung: "A16",
        xPct: 45, yPct: 42,
        icon: "📖",
        iconUrl: "assets/icons/icon_kin_gutenachtbuch.png",
        mb: 0, xp: 10, gold: 1, ap: 1,
        repr: "Gute-Nacht-Buch auf dem Kinderbett"
      },
      {
        id: "KIN_DOOR",
        raum: "Kinderzimmer",
        name: "Zur Wohnungs-Map",
        anzeigeName: "Zur Wohnungs-Map",
        zielTabelle: "Navigation",
        xPct: 14, yPct: 48,
        icon: "🚪",
        isMapDoor: true
      }
    ]
  };

  // 4. Tabellenblatt "Shop" (Exakt deine 6 Einträge und Preise aus A1:E17!)
  const SHOP_ITEMS = [
    { id: "SHOP_001", name: "Wow spielen", preisGold: 100, kostenAp: 1, status: false },
    { id: "SHOP_002", name: "XBOX spielen", preisGold: 100, kostenAp: 1, status: false },
    { id: "SHOP_003", name: "Steam spielen", preisGold: 100, kostenAp: 1, status: false },
    { id: "SHOP_004", name: "Viennese", preisGold: 150, kostenAp: 2, status: false },
    { id: "SHOP_005", name: "Effektpedal kaufen", preisGold: 10000, kostenAp: 0, status: false },
    { id: "SHOP_006", name: "Akai MPC Sample", preisGold: 30000, kostenAp: 0, status: false }
  ];

  // 5. Tabellenblatt "Achievements" (Exakt aus A1:E5!)
  const ACHIEVEMENTS = [
    { id: "ACH_1", name: "Beständiger Geist", bedingung: "Streak => 3", goldBonus: 300, xpBonus: 300, status: "" },
    { id: "ACH_2", name: "Wochenheld", bedingung: "Streak => 7", goldBonus: 500, xpBonus: 500, status: "" },
    { id: "ACH_3", name: "Monatsveteran", bedingung: "Streak => 30", goldBonus: 1000, xpBonus: 1000, status: "" },
    { id: "ACH_4", name: "Eine Arbeit vollendet, die mindestens 3 Schritte erforderte", bedingung: "Meilenstein", goldBonus: 200, xpBonus: 200, status: "JA" }
  ];


  // 5b. Vollständiger Katalog aus "MB Aktivitaeten" (42 Einträge) & "Aufgaben" (25 Einträge) inkl. Spalte M (Raum) & Spalte N (Repräsentiert durch)
  const DEFAULT_SHEET_CATALOG = {
    mbAktivitaeten: [
      {
            "id": "MB_A2",
            "cellRef": "A2",
            "name": "Schöne Musik hören",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Schallplattenspieler, Kopfhörer oder Monitor-Boxen",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A3",
            "cellRef": "A3",
            "name": "Eine Massage bekommen oder jemanden massieren",
            "mb": 2,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Fläschchen Massageöl auf dem Nachttisch",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A4",
            "cellRef": "A4",
            "name": "Leckeres Essen zubereiten",
            "mb": 1,
            "xp": 15,
            "gold": 0,
            "ap": 0,
            "raum": "Küche",
            "repraesentiertDurch": "Holz-Schneidebrett mit Messer oder Kochtopf",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A5",
            "cellRef": "A5",
            "name": "Schwimmen",
            "mb": 5,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Fertig gepackte Badetasche mit Handtuch",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A6",
            "cellRef": "A6",
            "name": "Witze anhören oder einfach nur so lachen",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Flur",
            "repraesentiertDurch": "Großes Bücher- & Brettspielregal (Star Wars & Witzebuch)",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A7",
            "cellRef": "A7",
            "name": "In ein Café gehen, etwas essen/trinken oder einfach nur Leute beobachten",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Küche",
            "repraesentiertDurch": "Coffee-to-go Becher auf der Arbeitsplatte",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A8",
            "cellRef": "A8",
            "name": "Mit jemandem zärtlich sein",
            "mb": 2,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Besonderes Kissen auf dem Bett",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A9",
            "cellRef": "A9",
            "name": "Barfuß auf Gras oder Sand gehen...um die Füße richtig zu spüren",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Flur",
            "repraesentiertDurch": "Abgestelltes Paar Schuhe neben der Wohnungstür",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A10",
            "cellRef": "A10",
            "name": "Trommeln oder ein anderes Instrument spielen",
            "mb": 2,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Ukulele an der Wand oder Trommel",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A11",
            "cellRef": "A11",
            "name": "Einen guten Film angucken",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Fernseher oder Popcorn-Schüssel",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A12",
            "cellRef": "A12",
            "name": "In ein Restaurant gehen und gut essen",
            "mb": 1,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Flur",
            "repraesentiertDurch": "Portemonnaie auf der Flur-Kommode oder Ausgeh-Kleidung",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A13",
            "cellRef": "A13",
            "name": "Nachts ganz bewusst den Mond und die Sterne betrachten",
            "mb": 2,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Teleskop am Fenster",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A14",
            "cellRef": "A14",
            "name": "Mit Kindern spielen",
            "mb": 1,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Kinderzimmer",
            "repraesentiertDurch": "Bunte Spielzeug-Eisenbahn oder Plüsch-Einhorn",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A15",
            "cellRef": "A15",
            "name": "Auf einer Bank sitzen.",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Gemütliches Kissen auf der Fensterbank",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A16",
            "cellRef": "A16",
            "name": "10000 Schritte gehen",
            "mb": 2,
            "xp": 50,
            "gold": 0,
            "ap": 0,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Paar Laufschuhe im Vordergrund",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A17",
            "cellRef": "A17",
            "name": "10000 Schritte um 5 Uhr gehen",
            "mb": 5,
            "xp": 100,
            "gold": 0,
            "ap": 3,
            "raum": "Flur",
            "repraesentiertDurch": "Oranger Eulen-Wecker im Flurregal",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A18",
            "cellRef": "A18",
            "name": "Zimmer oder Wohnung aufräumen (30 min)",
            "mb": 1,
            "xp": 50,
            "gold": 0,
            "ap": 0,
            "raum": "Flur",
            "repraesentiertDurch": "Freies braunes Holzbrett auf der Flur-Kommode",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A19",
            "cellRef": "A19",
            "name": "Ein Instrument spielen oder neu lernen (30 min)",
            "mb": 1,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Stage Piano & Synthesizer",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A20",
            "cellRef": "A20",
            "name": "Etwas basteln oder bauen (30 min)",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Kinderzimmer",
            "repraesentiertDurch": "Kleiner Mal- & Basteltisch",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A21",
            "cellRef": "A21",
            "name": "Rechnungen bezahlen oder Formulare richtig ausfüllen und abschicken",
            "mb": -2,
            "xp": 300,
            "gold": 0,
            "ap": 3,
            "raum": "Dashboard",
            "repraesentiertDurch": "Briefstapel & Taschenrechner am Schreibtisch",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A22",
            "cellRef": "A22",
            "name": "Sich mit einem Menschen, den man mag, unterhalten",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Zwei dampfende Teetassen auf dem Couchtisch",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A23",
            "cellRef": "A23",
            "name": "Gemeinsam mit jemandem lachen",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Geöffnetes Fotoalbum auf dem Couchtisch",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A24",
            "cellRef": "A24",
            "name": "Mit jemandem Sex haben",
            "mb": 2,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Kerzen auf der Kommode",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A25",
            "cellRef": "A25",
            "name": "Jemandem sagen, dass man ihm oder ihr dankbar ist oder sie/ihn gern hat",
            "mb": 1,
            "xp": 15,
            "gold": 0,
            "ap": 0,
            "raum": "Flur",
            "repraesentiertDurch": "Erinnerungs-Postkarten & Notizen an der Zimmertür",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A26",
            "cellRef": "A26",
            "name": "Eigene Stärken und Talente bewusst machen... Liste oder Test absolvieren",
            "mb": 1,
            "xp": 15,
            "gold": 0,
            "ap": 0,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Aufgeschlagenes Journal auf dem Bett",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A27",
            "cellRef": "A27",
            "name": "Sich bewusst werden, dass die eigenen Schwächen oder Fehler auch nur menschlich sind.",
            "mb": 1,
            "xp": 15,
            "gold": 0,
            "ap": 0,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Spiegel über dem Waschbecken",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A28",
            "cellRef": "A28",
            "name": "Etwas tun, worauf ich stolz bin (auch wenn es nur eine kleine Sache ist)",
            "mb": 1,
            "xp": 15,
            "gold": 0,
            "ap": 0,
            "raum": "Kinderzimmer",
            "repraesentiertDurch": "Bunte Bücherregale & gerahmte Kinderzeichnung",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A29",
            "cellRef": "A29",
            "name": "Sich sportlich betätigen",
            "mb": 2,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Ausgerollte Yogamatte & Hanteln",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A30",
            "cellRef": "A30",
            "name": "Etwas tun, was man besonders gut kann",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Küche",
            "repraesentiertDurch": "Lieblings-Kaffeetasse neben der Siebträgermaschine",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A31",
            "cellRef": "A31",
            "name": "Etwas probieren, was man noch nicht besonders gut kann",
            "mb": 1,
            "xp": 15,
            "gold": 0,
            "ap": 0,
            "raum": "Flur",
            "repraesentiertDurch": "Unfertiges Puzzle oder Brettspiel-Box im Regal",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A32",
            "cellRef": "A32",
            "name": "Etwas tun, was einem sonst nicht leicht fällt",
            "mb": 1,
            "xp": 300,
            "gold": 0,
            "ap": 1,
            "raum": "Dashboard",
            "repraesentiertDurch": "Klemmbrett mit abgehakter To-Do-Liste an der Korkwand",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A33",
            "cellRef": "A33",
            "name": "Klavier spielen (20 min)",
            "mb": 3,
            "xp": 15,
            "gold": 0,
            "ap": 1,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Stage Piano in der Musikecke",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A34",
            "cellRef": "A34",
            "name": "Kalt duschen",
            "mb": 1,
            "xp": 5,
            "gold": 0,
            "ap": 0,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Regenduschkopf mit blauen Wassertropfen",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A35",
            "cellRef": "A35",
            "name": "Deprexis",
            "mb": 2,
            "xp": 25,
            "gold": 0,
            "ap": 0,
            "raum": "Dashboard",
            "repraesentiertDurch": "Deprexis Online-Therapie am Laptop",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A36",
            "cellRef": "A36",
            "name": "Atemübung durchführen (1 Min)",
            "mb": 5,
            "xp": 50,
            "gold": 0,
            "ap": 0,
            "raum": "Flur",
            "repraesentiertDurch": "Oranger Eulen-Buddy im Regal",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A37",
            "cellRef": "A37",
            "name": "Zentangle (10 min)",
            "mb": 1,
            "xp": 50,
            "gold": 0,
            "ap": 0,
            "raum": "Küche",
            "repraesentiertDurch": "Skizzenblock und schwarzer Fineliner",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A38",
            "cellRef": "A38",
            "name": "Venla",
            "mb": 2,
            "xp": 50,
            "gold": 0,
            "ap": 0,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Pillendose auf der Bad-Ablage",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A39",
            "cellRef": "A39",
            "name": "Mit Pia Rimworld spielen",
            "mb": 2,
            "xp": 125,
            "gold": 0,
            "ap": 0,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Zwei Gamepads am Kallax-Regal",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A40",
            "cellRef": "A40",
            "name": "ADHD Quest programmieren",
            "mb": 1,
            "xp": 500,
            "gold": 0,
            "ap": 1,
            "raum": "Dashboard",
            "repraesentiertDurch": "Offener Laptop & Roboter-Figur auf dem Schreibtisch",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A42",
            "cellRef": "A42",
            "name": "Mittagsspaziergang",
            "mb": 2,
            "xp": 125,
            "gold": 0,
            "ap": 1,
            "raum": "Flur",
            "repraesentiertDurch": "Sonnenbrille & Wohnungsschlüssel auf der Kommode",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A44",
            "cellRef": "A44",
            "name": "Handwerken (Holz)",
            "mb": 3,
            "xp": 500,
            "gold": 0,
            "ap": 1,
            "raum": "Kinderzimmer",
            "repraesentiertDurch": "Holz-Werkzeugkasten mit Japansäge & Stecheisen",
            "zielTabelle": "MB Aktivitaeten"
      },
      {
            "id": "MB_A45",
            "cellRef": "A45",
            "name": "Vibe Coding",
            "mb": 2,
            "xp": 500,
            "gold": 0,
            "ap": 1,
            "raum": "Dashboard",
            "repraesentiertDurch": "Coding-Kopfhörer & beleuchtete mechanische Tastatur",
            "zielTabelle": "MB Aktivitaeten"
      }
],
    aufgaben: [
      {
            "id": "AUF_A2",
            "cellRef": "A2",
            "name": "Ronja zum Kindergarten bringen",
            "mb": 0,
            "xp": 10,
            "gold": 1,
            "ap": 1,
            "raum": "Flur",
            "repraesentiertDurch": "Pinnwand an der Zimmertür",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A3",
            "cellRef": "A3",
            "name": "Ronja vom Kindergarten abholen",
            "mb": 0,
            "xp": 15,
            "gold": 1,
            "ap": 1,
            "raum": "Flur",
            "repraesentiertDurch": "Garderobenhaken mit Ronjas Jacke",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A4",
            "cellRef": "A4",
            "name": "Wäsche waschen",
            "mb": 0,
            "xp": 50,
            "gold": 25,
            "ap": 1,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Waschmaschine & Waschpulver",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A5",
            "cellRef": "A5",
            "name": "Gewaschene Wäsche ausräumen und zum Trockner bringen",
            "mb": 0,
            "xp": 50,
            "gold": 25,
            "ap": 1,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Wäschekorb vor der Waschmaschine",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A6",
            "cellRef": "A6",
            "name": "Trockner ausräumen und Wäsche zusammenlegen",
            "mb": 0,
            "xp": 50,
            "gold": 25,
            "ap": 2,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Wäschetrockner & zusammengelegte Handtücher",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A7",
            "cellRef": "A7",
            "name": "Samstagsputz (Küche)",
            "mb": 0,
            "xp": 100,
            "gold": 50,
            "ap": 2,
            "raum": "Küche",
            "repraesentiertDurch": "Putzmittel-Eimer & Schwamm auf der Arbeitsplatte",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A8",
            "cellRef": "A8",
            "name": "Samstagsputz (Wohnzimmer)",
            "mb": 0,
            "xp": 125,
            "gold": 50,
            "ap": 2,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Staubsauger & Mikrofasertuch",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A9",
            "cellRef": "A9",
            "name": "Samstagsputz (Schlafzimmer)",
            "mb": 0,
            "xp": 150,
            "gold": 50,
            "ap": 2,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Frisch bezogenes Bett & Staubwedel",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A10",
            "cellRef": "A10",
            "name": "Samstagsputz (Bad)",
            "mb": 0,
            "xp": 125,
            "gold": 50,
            "ap": 2,
            "raum": "Badezimmer",
            "repraesentiertDurch": "Badreiniger & Bodenwischer",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A11",
            "cellRef": "A11",
            "name": "Mittagessen vorbereiten",
            "mb": 0,
            "xp": 125,
            "gold": 1,
            "ap": 1,
            "raum": "Küche",
            "repraesentiertDurch": "Großes Schneidebrett mit Kochmesser & Kochtopf",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A12",
            "cellRef": "A12",
            "name": "Einkaufen gehen",
            "mb": 0,
            "xp": 125,
            "gold": 10,
            "ap": 1,
            "raum": "Flur",
            "repraesentiertDurch": "Einkaufstasche an der Flurgarderobe",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A13",
            "cellRef": "A13",
            "name": "Geschirrspüler ausräumen und einräumen",
            "mb": 0,
            "xp": 125,
            "gold": 10,
            "ap": 1,
            "raum": "Küche",
            "repraesentiertDurch": "Geschirrspüler",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A14",
            "cellRef": "A14",
            "name": "Müll rausbringen",
            "mb": 0,
            "xp": 125,
            "gold": 10,
            "ap": 1,
            "raum": "Küche",
            "repraesentiertDurch": "Mülleimer-Trennsystem unter der Spüle",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A15",
            "cellRef": "A15",
            "name": "Wäsche zusammenlegen",
            "mb": 0,
            "xp": 50,
            "gold": 10,
            "ap": 1,
            "raum": "Flur",
            "repraesentiertDurch": "Kommoden-Schubladen ordentlich einräumen",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A16",
            "cellRef": "A16",
            "name": "Ronja ins Bett bringen",
            "mb": 0,
            "xp": 10,
            "gold": 1,
            "ap": 1,
            "raum": "Kinderzimmer",
            "repraesentiertDurch": "Gute-Nacht-Buch auf dem Kinderbett",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A17",
            "cellRef": "A17",
            "name": "Tisch abwischen",
            "mb": 0,
            "xp": 5,
            "gold": 5,
            "ap": 1,
            "raum": "Flur",
            "repraesentiertDurch": "Holzbrett der Kommode komplett frei halten",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A18",
            "cellRef": "A18",
            "name": "Unkraut jähten",
            "mb": 0,
            "xp": 100,
            "gold": 100,
            "ap": 1,
            "raum": "Flur",
            "repraesentiertDurch": "Gartenhandschuhe & Unkrautstecher",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A35",
            "cellRef": "A35",
            "name": "Täglicher Check AfA Bewerbungen",
            "mb": 1,
            "xp": 25,
            "gold": 50,
            "ap": 1,
            "raum": "Dashboard",
            "repraesentiertDurch": "Schreibtisch-Organizer & AfA-Unterlagen",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A36",
            "cellRef": "A36",
            "name": "Tägliche Recherche Jobbörsen (20 min)",
            "mb": 1,
            "xp": 25,
            "gold": 50,
            "ap": 1,
            "raum": "Dashboard",
            "repraesentiertDurch": "Laptop auf dem Schreibtisch mit Jobbörsen-Tabs",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A37",
            "cellRef": "A37",
            "name": "Lernen für ISTQB (Softwaretesting) 30 min",
            "mb": 0,
            "xp": 50,
            "gold": 100,
            "ap": 3,
            "raum": "Dashboard",
            "repraesentiertDurch": "ISTQB-Lehrbuch & Textmarker am Schreibtisch",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A38",
            "cellRef": "A38",
            "name": "Planking (10 min)",
            "mb": 1,
            "xp": 50,
            "gold": 50,
            "ap": 1,
            "raum": "Schlafzimmer",
            "repraesentiertDurch": "Ausgerollte Fitnessmatte auf dem Boden",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A39",
            "cellRef": "A39",
            "name": "Vorbereitung auf Vorstellungsgespräch",
            "mb": 0,
            "xp": 50,
            "gold": 125,
            "ap": 1,
            "raum": "Dashboard",
            "repraesentiertDurch": "Klemmbrett mit Fragen & Notizblock",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A40",
            "cellRef": "A40",
            "name": "Stare at the Wall (10 min)",
            "mb": 2,
            "xp": 125,
            "gold": 100,
            "ap": 1,
            "raum": "Wohnzimmer",
            "repraesentiertDurch": "Leere weiße Wand gegenüber dem Sessel",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A41",
            "cellRef": "A41",
            "name": "Bewerbung geschrieben und abgeschickt",
            "mb": 2,
            "xp": 500,
            "gold": 300,
            "ap": 3,
            "raum": "Dashboard",
            "repraesentiertDurch": "Versandbereite Bewerbungsmappe am Schreibtisch",
            "zielTabelle": "Aufgaben"
      },
      {
            "id": "AUF_A42",
            "cellRef": "A42",
            "name": "Bauprojekt Schlafzimmerempore und Flurebene",
            "mb": 3,
            "xp": 1000,
            "gold": 1000,
            "ap": 2,
            "raum": "Flur",
            "repraesentiertDurch": "Werkzeugkasten mit Bauplan, Zollstock & Akkuschrauber",
            "zielTabelle": "Aufgaben"
      }
]
  };

  function getRoomCatalog(roomName) {
    const cat = state.sheetCatalog || DEFAULT_SHEET_CATALOG;
    const mbList = (cat.mbAktivitaeten && cat.mbAktivitaeten.length ? cat.mbAktivitaeten : DEFAULT_SHEET_CATALOG.mbAktivitaeten)
      .filter(x => !roomName || roomName === "Alle" || x.raum === roomName);
    const aufList = (cat.aufgaben && cat.aufgaben.length ? cat.aufgaben : DEFAULT_SHEET_CATALOG.aufgaben)
      .filter(x => !roomName || roomName === "Alle" || x.raum === roomName);
    return { mbAktivitaeten: mbList, aufgaben: aufList };
  }

  // 6. Tabellenblatt "Charakterbogen" (Exakt deine aktuellen Live-Werte aus dem Sheet!)
  const defaultState = {
    version: APP_VERSION,
    character: {
      mb: 95,            // B3: Mentale Belastbarkeit (MB) = 95 (Live-Sheet)
      maxMb: 100,
      hp: 54,            // B4: Lebenspunkte (HP) = 54
      maxHp: 54,
      level: 25,         // B6: Level = 25
      xp: 59005,         // B8: Gesamt-XP = 59005
      levelProgressText: "1405 / 4900 XP", // C8
      gold: 9424,        // B10: Gold = 9424
      ap: 7,             // D10: Aktionspunkte = 7
      maxAp: 10,
      aktuelleQuest: "ISTQB Foundation Level", // C14
      streak: 5
    },
    settings: {
      currentRoom: "Flur",
      liveSheetSync: true
    },
    completedToday: {},
    questlog: [
      { datum: "01.11.2026", uhrzeit: "20:00", aktivitaet: "Tabellen-Datenstruktur geladen (Level 25 | 9424 Gold | 94% MB)", typ: "System", xp: 0, mb: 0, gold: 0, ap: 0 }
    ]
  };

  let state = loadState();

  function loadState() {
    const today = new Date().toISOString().split("T")[0];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const merged = Object.assign({}, defaultState, parsed);
        if (merged.lastCompletedDate !== today) {
          merged.completedToday = {};
          merged.lastCompletedDate = today;
        }
        return merged;
      }
    } catch (e) {}
    const fresh = JSON.parse(JSON.stringify(defaultState));
    fresh.lastCompletedDate = today;
    return fresh;
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function shouldShowDailySplash() {
    const today = new Date().toISOString().split("T")[0];
    const lastShown = localStorage.getItem(SPLASH_DATE_KEY);
    if (lastShown !== today) {
      localStorage.setItem(SPLASH_DATE_KEY, today);
      return true;
    }
    return false;
  }

  function resetDailySplashLock() {
    localStorage.removeItem(SPLASH_DATE_KEY);
  }

  // Spielt entweder die hinterlegte MP3 aus "Frontend_Raum_Objekte" (soundUrl) oder den 16-Bit-Chiptune-Sound ab
  function playObjectSound(soundUrl) {
    playSynthSuccess();
    if (soundUrl) {
      try {
        const cleanUrl = soundUrl.replace("/sfx/", "/sounds/");
        const audio = new Audio(cleanUrl);
        audio.volume = 0.7;
        audio.play().catch(() => {});
      } catch (e) {}
    }
  }

  function playSynthSuccess() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.14, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.24);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.24);
      });
    } catch (e) {}
  }

  // --- LIVE GET-REQUEST AN DEIN GOOGLE APPS SCRIPT (doGet v0.3) ---
  async function fetchFromGoogleSheet() {
    if (!GAS_API_URL) return { ok: false };
    try {
      const resp = await fetch(GAS_API_URL, { method: "GET" });
      const json = await resp.json();
      if (json && json.status === "success" && json.data) {
        const d = json.data;
        if (typeof d.mb === "number") state.character.mb = d.mb;
        if (typeof d.hp === "number") state.character.hp = d.hp;
        if (typeof d.level === "number") state.character.level = d.level;
        if (typeof d.xp === "number") state.character.xp = d.xp;
        if (typeof d.gold === "number") state.character.gold = d.gold;
        if (typeof d.ap === "number") state.character.ap = d.ap;
        if (d.levelProgress) state.character.levelProgressText = d.levelProgress;
        if (d.aktuelleQuest) state.character.aktuelleQuest = d.aktuelleQuest;

        // Falls das erweiterte doGet v0.3 auch die Shop-Liste, MB-Aktivitäten & Aufgaben (inkl. Spalte M "Raum" & Spalte N "Repräsentiert durch") mitliefert:
        if (Array.isArray(d.shop) && d.shop.length > 0) {
          SHOP_ITEMS.length = 0;
          d.shop.forEach(sItem => SHOP_ITEMS.push(sItem));
        }
        state.sheetCatalog = {
          mbAktivitaeten: d.mbAktivitaeten || [],
          aufgaben: d.aufgaben || [],
          objects: d.objects || []
        };

        saveState();
        return { ok: true, data: d };
      }
    } catch (err) {
      console.warn("Offline-Modus aktiv (Sheet-GET optional):", err);
    }
    return { ok: false };
  }

  // --- LIVE POST-REQUEST AN DEIN GOOGLE APPS SCRIPT (doPost -> processAction) ---
  function postToGoogleSheet(type, itemName) {
    if (!GAS_API_URL || !state.settings.liveSheetSync) return;
    const payload = {
      action: "processAction",
      type: type,     // Exakt wie in deinem Apps Script erwartet: "MB Aktivitaeten", "Aufgaben" oder "Shop"
      name: itemName  // Exakt der Name in Spalte A deiner Tabelle
    };
    fetch(GAS_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  }

  // --- AUFGABE ODER MB-AKTIVITÄT ABSCHLIESSEN ---
  function completeObject(obj) {
    const xpGain = Number(obj.xp) || 0;
    const goldGain = Number(obj.gold) || 0;
    const mbGain = Number(obj.mb) || 0;
    const apGain = Number(obj.ap) || 0;

    state.character.xp += xpGain;
    state.character.gold = Math.max(0, state.character.gold + goldGain);
    state.character.mb = Math.min(100, Math.max(0, state.character.mb + mbGain));
    state.character.ap = Math.max(0, state.character.ap + apGain);
    state.completedToday[obj.id] = true;

    const now = new Date();
    const datumStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const zeitStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    // Exakt nach Struktur deines Tabellenblatts "Questlog" (Spalten A bis H)
    state.questlog.unshift({
      datum: datumStr,
      uhrzeit: zeitStr,
      aktivitaet: obj.name,
      typ: obj.zielTabelle === "Aufgaben" ? "Aufgabe" : "Erholung",
      xp: xpGain,
      mb: mbGain,
      gold: goldGain,
      ap: apGain
    });

    playObjectSound(obj.soundUrl);
    saveState();

    // Synchronisiert automatisch mit deinem Google Sheet via doPost(e)
    if (obj.zielTabelle === "Aufgaben" || obj.zielTabelle === "MB Aktivitaeten") {
      postToGoogleSheet(obj.zielTabelle, obj.name);
    }
  }

  // --- SHOP-KAUF (PRÜFT GOLD IN B10 UND AP IN D10 WIE IM APPS SCRIPT) ---
  function buyShopItem(item) {
    const goldCost = Number(item.preisGold) || 0;
    const apCost = Number(item.kostenAp) || 0;

    if (state.character.gold < goldCost || state.character.ap < apCost) {
      return {
        ok: false,
        msg: "⚠️ Zu wenig Ressourcen! Absolviere erst mehr Aufgaben und verdien es Dir!"
      };
    }

    state.character.gold -= goldCost;
    state.character.ap -= apCost;

    const now = new Date();
    const datumStr = now.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const zeitStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    state.questlog.unshift({
      datum: datumStr,
      uhrzeit: zeitStr,
      aktivitaet: item.name,
      typ: "Shop",
      xp: 0,
      mb: 0,
      gold: -goldCost,
      ap: -apCost
    });

    playSynthSuccess();
    saveState();
    postToGoogleSheet("Shop", item.name);

    return {
      ok: true,
      msg: `🎉 Gekauft: ${item.name} (-${goldCost} Gold, -${apCost} AP)`
    };
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ADHD_Quest_SheetBackup_v${APP_VERSION}.json`;
    a.click();
  }

  return {
    APP_VERSION,
    GAS_API_URL,
    ASSETS,
    PLAYER_DESIGN_REF,
    ROOMS,
    ROOM_OBJECTS,
    SHOP_ITEMS,
    ACHIEVEMENTS,
    DEFAULT_SHEET_CATALOG,
    getRoomCatalog,
    getState: () => state,
    saveState,
    shouldShowDailySplash,
    resetDailySplashLock,
    fetchFromGoogleSheet,
    completeObject,
    buyShopItem,
    exportBackup
  };
})();
