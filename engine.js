/**
 * ============================================================================
 * ADHD-QUEST CORE LOGIC ENGINE v0.11
 * (Inkl. GitHub-Hintergründen aus "Raum_adressen" & Icons/SFX aus "Frontend_Raum_Objekte")
 * ============================================================================
 */
const ADHDQuestEngine = (function() {
  const APP_VERSION = "0.24";
  const STORAGE_KEY = "ADHD_QUEST_LOCAL_STATE_V0_24";

  // Alle Grafik-Adressen aus dem Tabellenblatt "Raum_adressen" (umgewandelt in direkte raw-Links)
  const ASSETS = {
    backgrounds: {
      "Badezimmer": "assets/bg_bathroom_orig.png",
      "Arbeitszimmer": "assets/bg_dashboard_orig.png",
      "Map": "assets/bg_map_orig.png",
      "Küche": "assets/bg_kitchen_orig.png",
      "Wohnzimmer": "assets/bg_livingroom_orig.png",
      "Kinderzimmer": "assets/bg_kinderzimmer_orig.png",
      "Schlafzimmer": "assets/bg_schlafzimmer_orig.png",
      "Startlogo": "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/backgrounds/bg_startlogo.png"
    }
  };

  // Hilfsfunktion: Rechnet FlutterFlow-Alignment (-1.0 bis +1.0) in CSS-Prozent (0% bis 100%) um
  function alignToPercent(val) {
    return Math.round(((Number(val) + 1) / 2) * 1000) / 10;
  }

  // Exakt die 5 freigestellten Räume deiner Karte (bg_map_orig.png) mit ihren exakten Sprite-Koordinaten:
  const ROOMS = [
    {
      id: "Arbeitszimmer",
      icon: "🏠",
      desc: "Startraum, Shop & Tageschronik",
      bgUrl: ASSETS.backgrounds["Arbeitszimmer"],
      mapSprite: "assets/map_sprites/sprite_map_arbeitszimmer.png",
      leftPct: 10.94, topPct: 10.94, widthPct: 24.41, heightPct: 30.47, zIndex: 5
    },
    {
      id: "Wohnzimmer",
      icon: "🛋️",
      desc: "Musik, Projekte & Soziales",
      bgUrl: ASSETS.backgrounds["Wohnzimmer"],
      mapSprite: "assets/map_sprites/sprite_map_wohnzimmer.png",
      leftPct: 10.94, topPct: 10.94, widthPct: 51.76, heightPct: 78.12, zIndex: 3,
      // Exakte CSS clip-path Polygon-Maske des L-förmigen Wohnzimmers, damit Klicks auf Arbeitszimmer/Badezimmer/Kinderzimmer nicht verdeckt werden:
      clipPath: "polygon(49.43% 0%, 100% 0%, 100% 62.0%, 84.91% 62.0%, 84.91% 100%, 58.49% 100%, 58.49% 72.25%, 0% 72.25%, 0% 40.25%, 49.43% 40.25%)"
    },
    {
      id: "Küche",
      icon: "🍳",
      desc: "Ordnung, Ernährung & Fokus",
      bgUrl: ASSETS.backgrounds["Küche"],
      mapSprite: "assets/map_sprites/sprite_map_kueche.png",
      leftPct: 63.96, topPct: 10.94, widthPct: 25.10, heightPct: 48.44, zIndex: 5
    },
    {
      id: "Badezimmer",
      icon: "🚿",
      desc: "Frische, Pflege & Routine",
      bgUrl: ASSETS.backgrounds["Badezimmer"],
      mapSprite: "assets/map_sprites/sprite_map_badezimmer.png",
      leftPct: 10.94, topPct: 68.75, widthPct: 29.10, heightPct: 20.31, zIndex: 5
    },
    {
      id: "Kinderzimmer",
      icon: "🦄",
      desc: "Familie, Spiel, Bücher & Kreativität",
      bgUrl: ASSETS.backgrounds["Kinderzimmer"],
      mapSprite: "assets/map_sprites/sprite_map_kinderzimmer.png",
      leftPct: 56.15, topPct: 60.74, widthPct: 32.91, heightPct: 28.32, zIndex: 5
    },
    {
      id: "Schlafzimmer",
      icon: "🛏️",
      desc: "Erholung, Sport, Sterne & Ruhe",
      bgUrl: ASSETS.backgrounds["Schlafzimmer"],
      mapSprite: "assets/map_sprites/sprite_map_schlafzimmer.png",
      leftPct: 73.73, topPct: 61.13, widthPct: 14.94, heightPct: 8.98, zIndex: 7
    }
  ];

  const defaultState = {
    version: APP_VERSION,
    character: {
      mb: 100,
      maxMb: 100,
      hp: 54,
      maxHp: 54,
      xp: 0,
      level: 1,
      gold: 0,
      ap: 0,
      streak: 0,
      activeFoxSkin: "Standard-Fuchs"
    },
    settings: {
      currentRoom: "Arbeitszimmer",
      confirmBeforeClaim: true
    },
    meta: {
      lastActiveDate: getTodayStr(),
      eveningBoostClaimedDate: "",
      dailyEarned: { xp: 0, mb: 0, gold: 0, ap: 0, activities: [] }
    },
    catalog: {
      // AUFGABEN (Inkl. der exakten Einträge, Icons, Sounds & Koordinaten aus "Frontend_Raum_Objekte")
      tasks: [
        {
          id: "KUE_001_01",
          raum: "Küche",
          icon: "🍽️",
          iconUrl: "assets/kitchen_sprites/sprite_geschirrspueler.png",
          isSceneSprite: true,
          leftPct: 15.09, topPct: 59.95, widthPct: 19.18, heightPct: 10.19,
          soundUrl: "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/sfx/sfx_kue_001.mp3",
          objekt: "Geschirrspüler",
          name: "Geschirrspüler ausräumen und einräumen",
          mb: 0, xp: 35, gold: 25, ap: 2,
          posX: -0.57, posY: 0.351,
          x: alignToPercent(-0.57), y: alignToPercent(0.351),
          completedToday: false
        },
        {
          id: "KUE_002_01",
          raum: "Küche",
          icon: "🍎",
          iconUrl: "assets/kitchen_sprites/sprite_tisch_obst_becher.png",
          isSceneSprite: true,
          leftPct: 17.90, topPct: 70.62, widthPct: 36.06, heightPct: 6.52,
          soundUrl: "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/sfx/sfx_kue_002.mp3",
          objekt: "Esstisch & Obstschale",
          name: "Tisch abwischen & richten",
          mb: 0, xp: 20, gold: 15, ap: 1,
          posX: -0.21, posY: 0.597,
          x: alignToPercent(-0.21), y: alignToPercent(0.597),
          completedToday: false
        },
        {
          id: "KUE_003_01",
          raum: "Küche",
          icon: "🍲",
          iconUrl: "assets/kitchen_sprites/sprite_kupfertoepfe.png",
          isSceneSprite: true,
          leftPct: 36.32, topPct: 13.98, widthPct: 33.50, heightPct: 5.45,
          soundUrl: "https://raw.githubusercontent.com/SokratesSchmitt/ADHD-Quest/main/sfx/sfx_kue_003.mp3",
          objekt: "Kupfertöpfe",
          name: "Mittagessen vorbereiten",
          mb: 0, xp: 40, gold: 25, ap: 2,
          posX: -0.10, posY: -0.465,
          x: alignToPercent(-0.10), y: alignToPercent(-0.465),
          completedToday: false
        },
        {
          id: "T_KUE_04",
          raum: "Küche",
          icon: "📌",
          iconUrl: "assets/kitchen_sprites/sprite_pinnwand.png",
          isSceneSprite: true,
          leftPct: 0.0, topPct: 25.36, widthPct: 26.34, heightPct: 22.16,
          objekt: "Pinnwand",
          name: "Rechnungen bezahlen / Formulare",
          mb: 5, xp: 35, gold: [20, 40], ap: 3,
          x: 13, y: 36,
          completedToday: false
        },
        {
          id: "T_ARB_01",
          raum: "Arbeitszimmer",
          icon: "🧮",
          iconUrl: "assets/arbeitszimmer_sprites/sprite_arb_unterlagen.png",
          isSceneSprite: true,
          leftPct: 31.01, topPct: 58.20, widthPct: 25.53, heightPct: 6.15,
          objekt: "Taschenrechner & Unterlagen",
          name: "Finanzen, Budget & Papierkram erledigen",
          mb: 5, xp: 40, gold: 30, ap: 2,
          x: 43, y: 61,
          completedToday: false
        },
        {
          id: "T_WOH_01",
          raum: "Wohnzimmer",
          icon: "🛋️",
          iconUrl: "assets/wohnzimmer_sprites/sprite_woh_sofa_decken.png",
          isSceneSprite: true,
          leftPct: 0.0, topPct: 51.17, widthPct: 31.65, heightPct: 10.64,
          objekt: "Sofa-Decken & Kissen",
          name: "Zimmer oder Wohnung aufräumen (30 min)",
          mb: 5, xp: 50, gold: 30, ap: 2,
          x: 16, y: 56,
          completedToday: false
        },
        {
          id: "T_BAD_01",
          raum: "Badezimmer",
          icon: "🧺",
          iconUrl: "assets/badezimmer_sprites/sprite_bad_waeschekorb.png",
          isSceneSprite: true,
          leftPct: 78.27, topPct: 81.71, widthPct: 21.73, heightPct: 18.29,
          objekt: "Geflochtener Wäschekorb",
          name: "Wäsche waschen & richten",
          mb: 0, xp: 50, gold: 25, ap: 1,
          x: 88, y: 90,
          completedToday: false
        },
        {
          id: "T_BAD_02",
          raum: "Badezimmer",
          icon: "🚰",
          iconUrl: "assets/badezimmer_sprites/sprite_bad_waschtisch.png",
          isSceneSprite: true,
          leftPct: 30.11, topPct: 49.01, widthPct: 36.51, heightPct: 29.61,
          objekt: "Waschbecken & Waschtisch",
          name: "Bad & Waschbecken richten / Frische-Routine",
          mb: 5, xp: 30, gold: 20, ap: 1,
          x: 48, y: 64,
          completedToday: false
        },
        {
          id: "T_KIN_01",
          raum: "Kinderzimmer",
          icon: "🧸",
          iconUrl: "assets/kinderzimmer_sprites/sprite_kin_spielzeugkiste.png",
          isSceneSprite: true,
          leftPct: 42.97, topPct: 48.11, widthPct: 25.00, heightPct: 10.03,
          objekt: "Spielzeugkiste",
          name: "Kinderzimmer-Chaos bändigen & Spielsachen einsortieren",
          mb: 5, xp: 35, gold: 25, ap: 2,
          x: 55, y: 53,
          completedToday: false
        },
        {
          id: "T_KIN_02",
          raum: "Kinderzimmer",
          icon: "🛏️",
          iconUrl: "assets/kinderzimmer_sprites/sprite_kin_bodenbett.png",
          isSceneSprite: true,
          leftPct: 18.49, topPct: 49.06, widthPct: 47.14, heightPct: 18.39,
          objekt: "Kuschel-Bodenbett",
          name: "Bodenbett richten & Kuschelecke gemütlich machen",
          mb: 5, xp: 25, gold: 20, ap: 1,
          x: 42, y: 58,
          completedToday: false
        },
        {
          id: "T_SCH_01",
          raum: "Schlafzimmer",
          icon: "🛏️",
          iconUrl: "assets/schlafzimmer_sprites/sprite_sch_bett_kissen.png",
          isSceneSprite: true,
          leftPct: 66.15, topPct: 49.06, widthPct: 33.85, heightPct: 15.26,
          objekt: "Bett & Kissen",
          name: "Bett richten, Kissen aufschütteln & Schlafzimmer lüften",
          mb: 5, xp: 30, gold: 20, ap: 1,
          x: 83, y: 57,
          completedToday: false
        }
      ],
      // MB-AKTIVITÄTEN (Erholung & Dopamin)
      mbActivities: [
        // Küche (Nahtlose Original-Sprites aus bg_kitchen)
        {
          id: "MB_KUE_01",
          raum: "Küche",
          icon: "☕",
          iconUrl: "assets/kitchen_sprites/sprite_kaffeemaschine.png",
          isSceneSprite: true,
          leftPct: 18.41, topPct: 48.10, widthPct: 19.69, heightPct: 10.90,
          objekt: "Siebträger-Kaffeemaschine",
          name: "Genuss-Pause / Kaffee bewusst zubereiten",
          mb: 15, xp: 15, gold: 0, ap: 1,
          x: 28, y: 53,
          completedToday: false
        },
        {
          id: "MB_KUE_03",
          raum: "Küche",
          icon: "💌",
          iconUrl: "assets/kitchen_sprites/sprite_kuehlschrank_notizen.png",
          isSceneSprite: true,
          leftPct: 76.98, topPct: 46.92, widthPct: 19.44, heightPct: 19.67,
          objekt: "Kühlschrank-Notizen",
          name: "Jemandem Dankbarkeit ausdrücken",
          mb: 15, xp: 15, gold: 0, ap: 1,
          x: 86, y: 56,
          completedToday: false
        },
        // Arbeitszimmer (Nahtlose Original-Sprites aus bg_dashboard)
        {
          id: "MB_ARB_01",
          raum: "Arbeitszimmer",
          icon: "📌",
          iconUrl: "assets/arbeitszimmer_sprites/sprite_arb_pinnwand.png",
          isSceneSprite: true,
          leftPct: 7.38, topPct: 21.58, widthPct: 64.77, heightPct: 19.53,
          objekt: "Große Projekt-Pinnwand",
          name: "An ADHD Quest & eigenen Projekten arbeiten",
          mb: 20, xp: 30, gold: 0, ap: 2,
          x: 40, y: 31,
          completedToday: false
        },
        {
          id: "MB_ARB_02",
          raum: "Arbeitszimmer",
          icon: "📚",
          iconUrl: "assets/arbeitszimmer_sprites/sprite_arb_buecherstapel.png",
          isSceneSprite: true,
          leftPct: 52.74, topPct: 88.38, widthPct: 21.31, heightPct: 9.38,
          objekt: "Bücherstapel",
          name: "In einem guten Buch lesen / Weiterbildung",
          mb: 15, xp: 20, gold: 0, ap: 1,
          x: 63, y: 93,
          completedToday: false
        },
        // Wohnzimmer (Nahtlose Original-Sprites aus bg_livingroom_me)
        {
          id: "MB_WOH_01",
          raum: "Wohnzimmer",
          icon: "🎛️",
          iconUrl: "assets/wohnzimmer_sprites/sprite_woh_synthesizer_boxen.png",
          isSceneSprite: true,
          leftPct: 59.07, topPct: 20.80, widthPct: 40.08, heightPct: 16.89,
          objekt: "Synthesizer & Studio-Boxen",
          name: "Schöne Musik hören / Beats & Loops bauen",
          mb: 15, xp: 15, gold: 0, ap: 1,
          x: 79, y: 29,
          completedToday: false
        },
        {
          id: "MB_WOH_02",
          raum: "Wohnzimmer",
          icon: "🎹",
          iconUrl: "assets/wohnzimmer_sprites/sprite_woh_stage_piano.png",
          isSceneSprite: true,
          leftPct: 52.95, topPct: 35.45, widthPct: 41.77, heightPct: 12.21,
          objekt: "Stage Piano",
          name: "Klavier spielen (20 min)",
          mb: 20, xp: 25, gold: 0, ap: 2,
          x: 74, y: 41,
          completedToday: false
        },
        {
          id: "MB_WOH_03_UKU",
          raum: "Wohnzimmer",
          icon: "🎸",
          iconUrl: "assets/wohnzimmer_sprites/sprite_woh_ukulelen.png",
          isSceneSprite: true,
          leftPct: 29.54, topPct: 20.21, widthPct: 18.57, heightPct: 12.60,
          objekt: "Kala Ukulelen an der Wand",
          name: "Ein Instrument spielen oder neu lernen (30 min)",
          mb: 20, xp: 25, gold: 0, ap: 2,
          x: 39, y: 26,
          completedToday: false
        },
        {
          id: "MB_WOH_04",
          raum: "Wohnzimmer",
          icon: "🎮",
          iconUrl: "assets/wohnzimmer_sprites/sprite_woh_switch_konsole.png",
          isSceneSprite: true,
          leftPct: 94.51, topPct: 35.94, widthPct: 5.49, heightPct: 23.24,
          objekt: "Gaming-Regal & Konsole",
          name: "Mit Pia Rimworld spielen",
          mb: 20, xp: 20, gold: 0, ap: 2,
          x: 97, y: 47,
          completedToday: false
        },
        {
          id: "MB_WOH_06",
          raum: "Wohnzimmer",
          icon: "🍵",
          iconUrl: "assets/wohnzimmer_sprites/sprite_woh_couchtisch.png",
          isSceneSprite: true,
          leftPct: 9.07, topPct: 60.94, widthPct: 53.16, heightPct: 20.31,
          objekt: "Couchtisch & Teetasse",
          name: "Sich mit lieben Menschen unterhalten / Gemeinsam lachen",
          mb: 15, xp: 15, gold: 0, ap: 1,
          x: 35, y: 71,
          completedToday: false
        },
        {
          id: "MB_WOH_08_TV",
          raum: "Wohnzimmer",
          icon: "📺",
          iconUrl: "assets/wohnzimmer_sprites/sprite_woh_fernseher.png",
          isSceneSprite: true,
          leftPct: 78.90, topPct: 83.40, widthPct: 21.10, heightPct: 16.60,
          objekt: "Fernseher",
          name: "Einen guten Film angucken",
          mb: 15, xp: 15, gold: 0, ap: 1,
          x: 89, y: 91,
          completedToday: false
        },
        // Badezimmer (Nahtlose Original-Sprites aus bg_bathroom)
        {
          id: "MB_BAD_01",
          raum: "Badezimmer",
          icon: "🚿",
          iconUrl: "assets/badezimmer_sprites/sprite_bad_dusche.png",
          isSceneSprite: true,
          leftPct: 70.17, topPct: 20.53, widthPct: 22.87, heightPct: 29.14,
          objekt: "Regendusche & Dusch-Ablage",
          name: "Kalt duschen / Bewusste Erfrischung",
          mb: 20, xp: 25, gold: 0, ap: 2,
          x: 81, y: 35,
          completedToday: false
        },
        {
          id: "MB_BAD_02",
          raum: "Badezimmer",
          icon: "🪞",
          iconUrl: "assets/badezimmer_sprites/sprite_bad_spiegel.png",
          isSceneSprite: true,
          leftPct: 35.23, topPct: 32.76, widthPct: 29.69, heightPct: 15.33,
          objekt: "Runder Holzspiegel",
          name: "Atemübung durchführen (1 Min) & Achtsamer Moment",
          mb: 10, xp: 10, gold: 0, ap: 1,
          x: 50, y: 40,
          completedToday: false
        },
        {
          id: "MB_BAD_03",
          raum: "Badezimmer",
          icon: "🧴",
          iconUrl: "assets/badezimmer_sprites/sprite_bad_wandregal.png",
          isSceneSprite: true,
          leftPct: 8.10, topPct: 26.45, widthPct: 25.71, heightPct: 22.24,
          objekt: "Wandregal & Pflege",
          name: "Venla einnehmen & Selbstfürsorge",
          mb: 10, xp: 10, gold: 0, ap: 1,
          x: 21, y: 37,
          completedToday: false
        },
        // Schlafzimmer (Nahtlose Original-Sprites aus bg_schlafzimmer_orig.png)
        {
          id: "MB_SCH_01",
          raum: "Schlafzimmer",
          icon: "💆",
          iconUrl: "assets/schlafzimmer_sprites/sprite_sch_massageoel.png",
          isSceneSprite: true,
          leftPct: 82.29, topPct: 70.86, widthPct: 17.71, heightPct: 10.90,
          objekt: "Massageöl auf dem Nachttisch",
          name: "Eine Massage bekommen oder jemanden massieren",
          mb: 20, xp: 20, gold: 0, ap: 2,
          x: 91, y: 76,
          completedToday: false
        },
        {
          id: "MB_SCH_02",
          raum: "Schlafzimmer",
          icon: "🕯️",
          iconUrl: "assets/schlafzimmer_sprites/sprite_sch_kerzen_kommode.png",
          isSceneSprite: true,
          leftPct: 23.44, topPct: 37.43, widthPct: 21.61, heightPct: 9.67,
          objekt: "Warm leuchtende Kerzen auf der Kommode",
          name: "Mit jemandem zärtlich sein / Bewusste Nähe genießen",
          mb: 25, xp: 25, gold: 0, ap: 2,
          x: 34, y: 42,
          completedToday: false
        },
        {
          id: "MB_SCH_03",
          raum: "Schlafzimmer",
          icon: "🔭",
          iconUrl: "assets/schlafzimmer_sprites/sprite_sch_teleskop.png",
          isSceneSprite: true,
          leftPct: 44.27, topPct: 36.92, widthPct: 21.48, heightPct: 23.04,
          objekt: "Teleskop am offenen Fenster",
          name: "Bewusst in die Ferne, in den Himmel oder in die Sterne schauen",
          mb: 15, xp: 15, gold: 0, ap: 1,
          x: 55, y: 48,
          completedToday: false
        },
        {
          id: "MB_SCH_04",
          raum: "Schlafzimmer",
          icon: "📔",
          iconUrl: "assets/schlafzimmer_sprites/sprite_sch_journal.png",
          isSceneSprite: true,
          leftPct: 64.45, topPct: 61.63, widthPct: 19.66, heightPct: 6.32,
          objekt: "Aufgeschlagenes Journal auf dem Bett",
          name: "Eigene Stärken & Talente bewusst machen / Journaling",
          mb: 15, xp: 20, gold: 0, ap: 1,
          x: 74, y: 65,
          completedToday: false
        },
        {
          id: "MB_SCH_05",
          raum: "Schlafzimmer",
          icon: "🏋️",
          iconUrl: "assets/schlafzimmer_sprites/sprite_sch_yogamatte_hanteln.png",
          isSceneSprite: true,
          leftPct: 9.77, topPct: 77.40, widthPct: 65.10, heightPct: 18.17,
          objekt: "Ausgerollte Yogamatte & Hanteln",
          name: "Sich sportlich betätigen / Yoga & Workout",
          mb: 20, xp: 25, gold: 0, ap: 2,
          x: 42, y: 86,
          completedToday: false
        },
        {
          id: "MB_SCH_06",
          raum: "Schlafzimmer",
          icon: "👟",
          iconUrl: "assets/schlafzimmer_sprites/sprite_sch_laufschuhe.png",
          isSceneSprite: true,
          leftPct: 14.97, topPct: 93.39, widthPct: 22.27, heightPct: 6.32,
          objekt: "Laufschuhe & Sneaker",
          name: "10.000 Schritte gehen / Frische Luft schnappen",
          mb: 25, xp: 30, gold: 0, ap: 2,
          x: 26, y: 96,
          completedToday: false
        },
        // Kinderzimmer (Nahtlose Original-Sprites aus bg_kinderzimmer_orig.png)
        {
          id: "MB_KIN_01",
          raum: "Kinderzimmer",
          icon: "🚂",
          iconUrl: "assets/kinderzimmer_sprites/sprite_kin_eisenbahn.png",
          isSceneSprite: true,
          leftPct: 51.43, topPct: 64.83, widthPct: 43.36, heightPct: 16.21,
          objekt: "Bunte Spielzeug-Eisenbahn",
          name: "Mit Kindern spielen",
          mb: 20, xp: 25, gold: 0, ap: 2,
          x: 73, y: 73,
          completedToday: false
        },
        {
          id: "MB_KIN_02",
          raum: "Kinderzimmer",
          icon: "🎨",
          iconUrl: "assets/kinderzimmer_sprites/sprite_kin_maltisch.png",
          isSceneSprite: true,
          leftPct: 76.82, topPct: 50.73, widthPct: 23.18, heightPct: 12.14,
          objekt: "Kleiner Mal- & Basteltisch",
          name: "Etwas basteln, malen oder bauen (30 min)",
          mb: 20, xp: 25, gold: 0, ap: 2,
          x: 88, y: 57,
          completedToday: false
        },
        {
          id: "MB_KIN_03",
          raum: "Kinderzimmer",
          icon: "🦄",
          iconUrl: "assets/kinderzimmer_sprites/sprite_kin_einhorn.png",
          isSceneSprite: true,
          leftPct: 0.0, topPct: 52.33, widthPct: 24.09, heightPct: 21.22,
          objekt: "Großes Plüsch-Einhorn",
          name: "Kuschel-Pause, Quatsch machen & gemeinsam lachen",
          mb: 20, xp: 20, gold: 0, ap: 2,
          x: 12, y: 63,
          completedToday: false
        },
        {
          id: "MB_KIN_04",
          raum: "Kinderzimmer",
          icon: "📖",
          iconUrl: "assets/kinderzimmer_sprites/sprite_kin_ikearegale_links.png",
          isSceneSprite: true,
          leftPct: 37.50, topPct: 27.98, widthPct: 23.70, heightPct: 18.90,
          objekt: "IKEA-Wandregale (Kinderbücher)",
          name: "Zusammen ein Kinderbuch anschauen & vorlesen",
          mb: 15, xp: 20, gold: 0, ap: 1,
          x: 49, y: 37,
          completedToday: false
        },
        {
          id: "MB_KIN_05",
          raum: "Kinderzimmer",
          icon: "🌟",
          iconUrl: "assets/kinderzimmer_sprites/sprite_kin_ikearegale_rechts.png",
          isSceneSprite: true,
          leftPct: 78.39, topPct: 24.13, widthPct: 21.61, heightPct: 18.75,
          objekt: "Bunte Bücherregale & Kinderzeichnungen",
          name: "Etwas tun, worauf ich stolz bin (auch kleine Dinge!)",
          mb: 15, xp: 20, gold: 0, ap: 1,
          x: 89, y: 33,
          completedToday: false
        }
      ],
      // SHOP (Sparschwein)
      shop: [
        { id: "SHOP_001", icon: "⚔️", name: "World of Warcraft spielen", goldCost: 100, apCost: 1, pinned: true, category: "Belohnung" },
        { id: "SHOP_002", icon: "📺", name: "Fernsehen / XBOX / Steam", goldCost: 100, apCost: 1, pinned: true, category: "Belohnung" },
        { id: "SHOP_003", icon: "🎹", name: "Akai MPC Sampler", goldCost: 30000, apCost: 0, pinned: true, category: "Langzeitziel" },
        { id: "SHOP_004", icon: "🍨", name: "Viennese genießen", goldCost: 150, apCost: 2, pinned: false, category: "Belohnung" },
        { id: "SHOP_005", icon: "🎸", name: "Effektpedal kaufen", goldCost: 10000, apCost: 0, pinned: false, category: "Langzeitziel" },
        { id: "SHOP_006", icon: "🎁", name: "Überraschungs-Dopamin-Box", goldCost: 50, apCost: 1, pinned: false, isMystery: true, category: "Mystery" }
      ]
    },
    questlog: [],
    dailyProtocol: [],
    achievements: [
      { id: "ACH_3", name: "Beständiger Geist (3 Tage Streak)", reqStreak: 3, rewardGold: 300, rewardXp: 300, unlocked: false },
      { id: "ACH_7", name: "Wochenheld (7 Tage Streak)", reqStreak: 7, rewardGold: 500, rewardXp: 500, unlocked: false },
      { id: "ACH_30", name: "Monatsveteran (30 Tage Streak)", reqStreak: 30, rewardGold: 1000, rewardXp: 1000, unlocked: false }
    ]
  };

  let state = loadState();

  function getTodayStr() {
    const d = new Date();
    return String(d.getDate()).padStart(2, '0') + "." +
           String(d.getMonth() + 1).padStart(2, '0') + "." +
           d.getFullYear();
  }

  function getTimeStr() {
    const d = new Date();
    return String(d.getHours()).padStart(2, '0') + ":" +
           String(d.getMinutes()).padStart(2, '0');
  }

  function resolveValue(val) {
    if (Array.isArray(val) && val.length === 2) {
      return Math.floor(Math.random() * (val[1] - val[0] + 1)) + val[0];
    }
    return Number(val) || 0;
  }

  // Spielt entweder die echte GitHub-MP3 der Aufgabe ab oder den synthetischen Fallback-Sound
  function playSound(type, customSoundUrl = "") {
    if (customSoundUrl) {
      try {
        const audio = new Audio(customSoundUrl);
        audio.volume = 0.75;
        audio.play().catch(() => playSynthSound(type));
        return;
      } catch (e) {}
    }
    playSynthSound(type);
  }

  function playSynthSound(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const now = ctx.currentTime;
      const notes = type === "levelup" ? [440, 554.37, 659.25, 880]
                  : type === "error"   ? [160, 120]
                  : [523.25, 659.25, 783.99];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type === "error" ? "sawtooth" : "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.15, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now + i * 0.08); osc.stop(now + i * 0.08 + 0.25);
      });
    } catch (e) {}
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    try {
      const loaded = JSON.parse(raw);
      loaded.version = APP_VERSION;
      const merged = Object.assign(JSON.parse(JSON.stringify(defaultState)), loaded);
      // Aktualisiere neue Icon-Grafikpfade in bestehenden Spielständen
      merged.catalog.tasks = defaultState.catalog.tasks.map(defItem => {
        const oldItem = (loaded.catalog && loaded.catalog.tasks || []).find(i => i.id === defItem.id);
        return oldItem ? Object.assign({}, defItem, { completedToday: oldItem.completedToday }) : defItem;
      });
      merged.catalog.mbActivities = defaultState.catalog.mbActivities.map(defItem => {
        const oldItem = (loaded.catalog && loaded.catalog.mbActivities || []).find(i => i.id === defItem.id);
        return oldItem ? Object.assign({}, defItem, { completedToday: oldItem.completedToday }) : defItem;
      });
      return merged;
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (typeof window.onEngineUpdate === "function") {
      window.onEngineUpdate(state);
    }
  }

  function exportBackup() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const a = document.createElement("a");
    a.href = dataStr;
    a.download = `ADHD_Quest_v${APP_VERSION}_Backup_${getTodayStr()}.json`;
    a.click();
  }

  function importBackup(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && parsed.character && parsed.catalog) {
        state = parsed;
        state.version = APP_VERSION;
        saveState();
        return { status: "success" };
      }
    } catch (e) {}
    return { status: "error", message: "Ungültige Backup-Datei!" };
  }

  function calculateLevel(xp) {
    return Math.floor(Math.sqrt((Number(xp) || 0) / 100)) + 1;
  }

  function addXpAndCheckLevelUp(xpGain) {
    if (xpGain <= 0) return { leveledUp: false, goldBonus: 0 };
    const oldLevel = calculateLevel(state.character.xp);
    state.character.xp += xpGain;
    const newLevel = calculateLevel(state.character.xp);
    state.character.level = newLevel;

    if (newLevel > oldLevel) {
      const goldReward = 50 * (newLevel - oldLevel);
      state.character.gold += goldReward;
      playSound("levelup");
      return { leveledUp: true, newLevel, goldBonus: goldReward };
    }
    return { leveledUp: false, goldBonus: 0 };
  }

  function healMB(mbAmount) {
    if (mbAmount <= 0) return 0;
    const before = state.character.mb;
    state.character.mb = Math.min(state.character.maxMb, state.character.mb + mbAmount);
    return state.character.mb - before;
  }

  function completeActivity(type, id) {
    const list = type === "Aufgabe" ? state.catalog.tasks : state.catalog.mbActivities;
    const item = list.find(entry => entry.id === id);
    if (!item) return { status: "error", message: "Eintrag nicht gefunden!" };

    let xpGain = resolveValue(item.xp);
    let goldGain = resolveValue(item.gold);
    let mbGain = resolveValue(item.mb);
    let apGain = resolveValue(item.ap);

    let isDopamineSurge = false;
    if (Math.random() < 0.15) {
      isDopamineSurge = true;
      goldGain += 10;
      xpGain = Math.round(xpGain * 1.5);
    }

    state.character.ap += apGain;
    state.character.gold += goldGain;
    const actualMbHealed = healMB(mbGain);
    const levelResult = addXpAndCheckLevelUp(xpGain);
    item.completedToday = true;

    state.meta.dailyEarned.xp += xpGain;
    state.meta.dailyEarned.mb += mbGain;
    state.meta.dailyEarned.gold += goldGain;
    state.meta.dailyEarned.ap += apGain;
    state.meta.dailyEarned.activities.push(item.name);

    const logEntry = {
      date: getTodayStr(),
      time: getTimeStr(),
      name: `${item.name} (${item.objekt})` + (isDopamineSurge ? " [💎 DOPAMIN-SURGE!]" : ""),
      category: type,
      xp: xpGain, mb: mbGain, gold: goldGain, ap: apGain
    };
    state.questlog.unshift(logEntry);

    // Spezifischen Aufgaben-Sound von GitHub abspielen (falls vorhanden)
    if (!levelResult.leveledUp) {
      playSound("success", item.soundUrl || "");
    }
    saveState();

    return { status: "success", item, logEntry, levelResult, actualMbHealed, isDopamineSurge };
  }

  function buyShopItem(id) {
    const item = state.catalog.shop.find(entry => entry.id === id);
    if (!item) return { status: "error", message: "Shop-Item nicht gefunden!" };

    const goldCost = Number(item.goldCost) || 0;
    const apCost = Number(item.apCost) || 0;

    if (state.character.gold < goldCost || state.character.ap < apCost) {
      playSound("error");
      return {
        status: "denied",
        message: "Absolviere erst mehr Aufgaben und verdien es Dir!"
      };
    }

    state.character.gold -= goldCost;
    state.character.ap -= apCost;

    let extraInfo = "";
    if (item.isMystery) {
      const pool = [
        { text: "Jackpot! +80 Gold Schatztruhe!", mb: 0, gold: 80 },
        { text: "Tiefe Entspannung (+25 MB)", mb: 25, gold: 0 },
        { text: "Energie-Schub (+3 AP)", mb: 0, gold: 0, ap: 3 }
      ];
      const win = pool[Math.floor(Math.random() * pool.length)];
      healMB(win.mb || 0);
      state.character.gold += (win.gold || 0);
      state.character.ap += (win.ap || 0);
      extraInfo = " 🎁 " + win.text;
    }

    state.questlog.unshift({
      date: getTodayStr(),
      time: getTimeStr(),
      name: item.name + extraInfo,
      category: "Kauf",
      xp: 0, mb: 0, gold: -goldCost, ap: -apCost
    });

    playSound("success");
    saveState();
    return { status: "success", item, extraInfo };
  }

  function grantEveningBoost(force = false) {
    const now = new Date();
    const today = getTodayStr();
    if (!force && (now.getHours() < 19 || state.meta.eveningBoostClaimedDate === today)) {
      return { granted: false };
    }
    state.character.ap += 5;
    state.meta.eveningBoostClaimedDate = today;
    state.questlog.unshift({
      date: today, time: getTimeStr(),
      name: "Abendlicher Energie-Boost (+5 AP)", category: "System",
      xp: 0, mb: 0, gold: 0, ap: 5
    });
    playSound("success");
    saveState();
    return { granted: true };
  }

  function runNightlyMaintenance(force = false) {
    const today = getTodayStr();
    if (!force && state.meta.lastActiveDate === today) return { executed: false };

    const snapshot = {
      date: state.meta.lastActiveDate,
      eveningMB: state.character.mb,
      dailyMB: state.meta.dailyEarned.mb,
      eveningGold: state.character.gold,
      dailyGold: state.meta.dailyEarned.gold,
      totalXP: state.character.xp,
      dailyXP: state.meta.dailyEarned.xp,
      activities: state.meta.dailyEarned.activities.join(", ")
    };
    state.dailyProtocol.unshift(snapshot);

    if (state.meta.dailyEarned.mb > 0) {
      state.character.streak += 1;
    } else {
      state.character.streak = 0;
    }

    state.achievements.forEach(ach => {
      if (!ach.unlocked && state.character.streak >= ach.reqStreak) {
        ach.unlocked = true;
        state.character.gold += ach.rewardGold;
        addXpAndCheckLevelUp(ach.rewardXp);
      }
    });

    state.character.ap = 0;
    state.character.mb = Math.max(0, state.character.mb - 5);
    if (state.character.mb === 0) {
      state.character.hp = Math.max(1, state.character.hp - 5);
    }

    state.meta.lastActiveDate = today;
    state.meta.dailyEarned = { xp: 0, mb: 0, gold: 0, ap: 0, activities: [] };
    state.catalog.tasks.forEach(t => t.completedToday = false);
    state.catalog.mbActivities.forEach(m => m.completedToday = false);

    saveState();
    return { executed: true, snapshot };
  }

  function getPinnedShopProgress() {
    return state.catalog.shop.filter(i => i.pinned).map(item => {
      // Fortschritt primär anhand Gold (oder AP falls Gold = 0)
      const usesGold = item.goldCost > 0;
      const current = usesGold ? state.character.gold : state.character.ap;
      const target = usesGold ? item.goldCost : item.apCost;
      const percent = Math.min(100, Math.round((current / target) * 100));
      return {
        id: item.id,
        icon: item.icon || "🎯",
        name: item.name,
        currency: usesGold ? "G" : "AP",
        current,
        target,
        apCost: item.apCost,
        percent
      };
    });
  }

  runNightlyMaintenance(false);
  grantEveningBoost(false);
  setInterval(() => { runNightlyMaintenance(false); grantEveningBoost(false); }, 60000);

  return {
    APP_VERSION,
    ASSETS,
    ROOMS,
    getState: () => state,
    setRoom: (roomName) => { state.settings.currentRoom = roomName; saveState(); },
    completeTask: (id) => completeActivity("Aufgabe", id),
    completeMB: (id) => completeActivity("MB Aktivität", id),
    buyShopItem,
    getPinnedShopProgress,
    grantEveningBoost,
    runNightlyMaintenance,
    exportBackup,
    importBackup,
    resetAllData: () => { localStorage.removeItem(STORAGE_KEY); state = loadState(); saveState(); }
  };
})();

const Engine = ADHDQuestEngine;
