let selectedObject = null;
let isExcitedOverride = false;
let lookPhase = "center";
let introTimer = null;

document.addEventListener("DOMContentLoaded", async () => {
  initDailyIntroScreen(false);
  renderAll();

  // Beim Start live die aktuellen Werte (MB, XP, Gold, AP) aus deinem Google Sheet abrufen (falls online)
  const syncRes = await Engine.fetchFromGoogleSheet();
  if (syncRes && syncRes.ok) {
    renderAll();
    showLootToast("☁️ Charakterbogen live mit Google Sheet synchronisiert!");
  }

  // Lebendiger Idle-Blick-Loop für den Pop-Out-Avatar oben links
  setInterval(() => {
    const phases = ["center", "left", "center", "right"];
    lookPhase = phases[Math.floor(Math.random() * phases.length)];
    updateAvatarSprite();
  }, 4500);
});

// --- 1. TÄGLICHER 5-SEKUNDEN INTRO-SPLASH-SCREEN (1x pro Tag) ---
function initDailyIntroScreen(forceShow = false) {
  const introEl = document.getElementById("intro-screen");
  const splashImg = document.getElementById("intro-splash-img");
  if (!introEl || !splashImg) return;

  if (forceShow || Engine.shouldShowDailySplash()) {
    clearTimeout(introTimer);
    introEl.classList.remove("hidden");
    splashImg.classList.remove("animate-zoom");
    void splashImg.offsetWidth;
    splashImg.classList.add("animate-zoom");

    introTimer = setTimeout(() => {
      dismissIntroScreen();
    }, 5000);
  } else {
    introEl.classList.add("hidden");
  }
}

function dismissIntroScreen() {
  clearTimeout(introTimer);
  const introEl = document.getElementById("intro-screen");
  if (introEl) introEl.classList.add("hidden");
}

function replayDailyIntro() {
  closeModal("log-modal");
  Engine.resetDailySplashLock();
  initDailyIntroScreen(true);
}

// --- 2. AVATAR & SPIELERFIGUR ZUSTANDS-STEUERUNG (10 STATES + PROFILBILD-REFERENZ) ---
let pinnedStateId = null; // Optional: Vom Nutzer im Charakter-Modal manuell fixierter State

function getActivePlayerStateObj() {
  const ref = Engine.PLAYER_DESIGN_REF;
  const states = ref.states;

  if (isExcitedOverride) {
    return states.find(s => s.id === "state_10_cheering") || states[9];
  }
  if (pinnedStateId) {
    const pinned = states.find(s => s.id === pinnedStateId);
    if (pinned) return pinned;
  }

  const s = Engine.getState();
  const mbPct = (s.character.mb / s.character.maxMb) * 100;

  // Exakt nach Tabellenblatt "Ideen (Frontend)": 80-100 Happy, 50-79 Neutral, 25-49 Müde, 0-24 Erschöpft
  if (mbPct >= 80) {
    if (lookPhase === "left") return states[2];  // state_03_waving
    if (lookPhase === "right") return states[5]; // state_06_laughing
    return states[1];                            // state_02_thumbsup
  } else if (mbPct >= 65) {
    if (lookPhase === "left") return states[7];  // state_08_sipping
    if (lookPhase === "right") return states[6]; // state_07_action
    return states[0];                            // state_01_neutral
  } else if (mbPct >= 50) {
    if (lookPhase === "right") return states[8]; // state_09_cozy_mug
    return states[3];                            // state_04_thinking (?)
  } else if (mbPct >= 25) {
    return states[4];                            // state_05_yawning
  } else {
    return states[10];                           // state_11_armchair
  }
}

// ============================================================================
// KOMBINIERTE IDLE-ENGINE: KATEGORIE 1 (#1–#10), KATEGORIE 2 (#11–#20) & KATEGORIE 3 (#21–#30)
// ============================================================================
const BREATHING_IDLE_FRAMES = [
  "assets/avatar/idle_01_breathing/breathing_frame_01.png",
  "assets/avatar/idle_01_breathing/breathing_frame_02.png",
  "assets/avatar/idle_01_breathing/breathing_frame_03.png",
  "assets/avatar/idle_01_breathing/breathing_frame_04.png",
  "assets/avatar/idle_01_breathing/breathing_frame_05.png",
  "assets/avatar/idle_01_breathing/breathing_frame_06.png",
  "assets/avatar/idle_01_breathing/breathing_frame_07.png",
  "assets/avatar/idle_01_breathing/breathing_frame_08.png"
];

const IDLE_MICRO_FRAMES = {
  // --- KATEGORIE 1 (#2 bis #10) ---
  blink_half:   "assets/avatar/idle_02_blinking/blink_frame_02_half.png",
  blink_closed: "assets/avatar/idle_02_blinking/blink_frame_03_closed.png",
  glint: [
    "assets/avatar/idle_03_glint/glint_frame_01.png",
    "assets/avatar/idle_03_glint/glint_frame_02.png",
    "assets/avatar/idle_03_glint/glint_frame_03.png",
    "assets/avatar/idle_03_glint/glint_frame_04.png",
    "assets/avatar/idle_03_glint/glint_frame_05.png"
  ],
  brow_mid:   "assets/avatar/idle_04_eyebrow/brow_frame_02_mid.png",
  brow_high:  "assets/avatar/idle_04_eyebrow/brow_frame_03_high.png",
  gaze_mid:   "assets/avatar/idle_05_room_gaze/gaze_frame_02_mid.png",
  gaze_room:  "assets/avatar/idle_05_room_gaze/gaze_frame_03_room.png",
  smirk_mid:  "assets/avatar/idle_06_smirk/smirk_frame_02_mid.png",
  smirk_full: "assets/avatar/idle_06_smirk/smirk_frame_03_full.png",
  cap_low:    "assets/avatar/idle_07_cap_twitch/cap_frame_02_low.png",
  cap_high:   "assets/avatar/idle_07_cap_twitch/cap_frame_03_high.png",
  tilt_mid:   "assets/avatar/idle_08_head_tilt/tilt_frame_02_mid.png",
  tilt_full:  "assets/avatar/idle_08_head_tilt/tilt_frame_03_full.png",
  nod_mid:    "assets/avatar/idle_09_nod/nod_frame_02_mid.png",
  nod_down:   "assets/avatar/idle_09_nod/nod_frame_03_down.png",
  beard_a:    "assets/avatar/idle_10_beard_twitch/beard_frame_02_twitch_a.png",
  beard_b:    "assets/avatar/idle_10_beard_twitch/beard_frame_03_twitch_b.png",

  // --- KATEGORIE 2 (#11 bis #20: CHARAKTER-GIMMICKS & REQUISITEN) ---
  coffee_raise: "assets/avatar/idle_11_coffee_sip/coffee_frame_02_raise.png",
  coffee_sip_a: "assets/avatar/idle_11_coffee_sip/coffee_frame_03_sip_a.png",
  coffee_sip_b: "assets/avatar/idle_11_coffee_sip/coffee_frame_04_sip_b.png",

  glasses_reach: "assets/avatar/idle_12_glasses_adjust/glasses_frame_02_reach.png",
  glasses_push:  "assets/avatar/idle_12_glasses_adjust/glasses_frame_03_push.png",

  salute_mid: "assets/avatar/idle_13_cap_salute/salute_frame_02_mid.png",
  salute_tap: "assets/avatar/idle_13_cap_salute/salute_frame_03_tap.png",

  stroke_chin: "assets/avatar/idle_14_beard_stroke/stroke_frame_02_chin.png",
  stroke_down: "assets/avatar/idle_14_beard_stroke/stroke_frame_03_stroke_down.png",

  pencil_tucked: "assets/avatar/idle_15_carpenter_pencil/pencil_frame_01_tucked.png",
  pencil_slide:  "assets/avatar/idle_15_carpenter_pencil/pencil_frame_02_slide_up.png",
  pencil_ready:  "assets/avatar/idle_15_carpenter_pencil/pencil_frame_03_ready.png",

  groove_1: "assets/avatar/idle_16_headphone_groove/groove_frame_01_neutral.png",
  groove_2: "assets/avatar/idle_16_headphone_groove/groove_frame_02_bob_down.png",
  groove_3: "assets/avatar/idle_16_headphone_groove/groove_frame_03_bob_deep.png",

  ukulele_1: "assets/avatar/idle_17_ukulele_strum/ukulele_frame_01_ready.png",
  ukulele_2: "assets/avatar/idle_17_ukulele_strum/ukulele_frame_02_strum_up.png",
  ukulele_3: "assets/avatar/idle_17_ukulele_strum/ukulele_frame_03_strum_down.png",

  gum_small: "assets/avatar/idle_18_bubblegum/gum_frame_01_small.png",
  gum_big:   "assets/avatar/idle_18_bubblegum/gum_frame_02_big.png",
  gum_pop:   "assets/avatar/idle_18_bubblegum/gum_frame_03_pop.png",

  sketch_1: "assets/avatar/idle_19_fineliner_sketch/sketch_frame_01_start.png",
  sketch_2: "assets/avatar/idle_19_fineliner_sketch/sketch_frame_02_draw.png",
  sketch_3: "assets/avatar/idle_19_fineliner_sketch/sketch_frame_03_finish.png",

  tea_inhale: "assets/avatar/idle_20_cozy_tea/tea_frame_01_inhale.png",
  tea_cozy_a: "assets/avatar/idle_20_cozy_tea/tea_frame_02_cozy_a.png",
  tea_cozy_b: "assets/avatar/idle_20_cozy_tea/tea_frame_03_cozy_b.png",

  // --- KATEGORIE 3 (#21 bis #30: RAHMEN-INTERAKTIONEN & POP-OUT-EFFEKTE) ---
  lean_raise: "assets/avatar/idle_21_ring_lean/lean_frame_01_raise.png",
  lean_rest:  "assets/avatar/idle_21_ring_lean/lean_frame_02_rest.png",
  lean_smirk: "assets/avatar/idle_21_ring_lean/lean_frame_03_smirk.png",

  peek_mid:   "assets/avatar/idle_22_ring_peek/peek_frame_01_duck_mid.png",
  peek_low:   "assets/avatar/idle_22_ring_peek/peek_frame_02_peek_low.png",
  peek_pop:   "assets/avatar/idle_22_ring_peek/peek_frame_03_pop_up.png",

  knock_windup:  "assets/avatar/idle_23_glass_knock/knock_frame_01_windup.png",
  knock_tap:     "assets/avatar/idle_23_glass_knock/knock_frame_02_tap_a.png",
  knock_between: "assets/avatar/idle_23_glass_knock/knock_frame_03_between.png",

  wave_center: "assets/avatar/idle_24_wave_popout/wave_frame_01_center.png",
  wave_left:   "assets/avatar/idle_24_wave_popout/wave_frame_02_left.png",
  wave_right:  "assets/avatar/idle_24_wave_popout/wave_frame_03_right.png",

  thumb_rise:    "assets/avatar/idle_25_thumbsup_popout/thumb_frame_01_rise.png",
  thumb_pop:     "assets/avatar/idle_25_thumbsup_popout/thumb_frame_02_pop.png",
  thumb_sparkle: "assets/avatar/idle_25_thumbsup_popout/thumb_frame_03_sparkle.png",

  caplift_grab:   "assets/avatar/idle_26_cap_lift/caplift_frame_01_grab.png",
  caplift_high:   "assets/avatar/idle_26_cap_lift/caplift_frame_02_high.png",
  caplift_settle: "assets/avatar/idle_26_cap_lift/caplift_frame_03_settle.png",

  polish_left:  "assets/avatar/idle_27_ring_polish/polish_frame_01_left.png",
  polish_right: "assets/avatar/idle_27_ring_polish/polish_frame_02_right.png",
  polish_top:   "assets/avatar/idle_27_ring_polish/polish_frame_03_top.png",

  sidelean_mid:  "assets/avatar/idle_28_side_lean/sidelean_frame_01_right_mid.png",
  sidelean_far:  "assets/avatar/idle_28_side_lean/sidelean_frame_02_right_far.png",
  sidelean_left: "assets/avatar/idle_28_side_lean/sidelean_frame_03_left_peek.png",

  confetti_toss:   "assets/avatar/idle_29_confetti_throw/confetti_frame_01_toss.png",
  confetti_burst:  "assets/avatar/idle_29_confetti_throw/confetti_frame_02_burst.png",
  confetti_shower: "assets/avatar/idle_29_confetti_throw/confetti_frame_03_shower.png",

  jump_pop:  "assets/avatar/idle_30_startle_jump/jump_frame_01_pop.png",
  jump_air:  "assets/avatar/idle_30_startle_jump/jump_frame_02_air.png",
  jump_land: "assets/avatar/idle_30_startle_jump/jump_frame_03_land.png"
};

let currentBreathingFrameIdx = 0;
let activeMicroIdleOverride = null; // Aktiver Frame-Pfad aus #2 bis #30
let activeIdleTimeouts = [];

function runMicroIdleSequence(seq, manual = false) {
  if (activeMicroIdleOverride && !manual) return;
  if (manual) {
    activeIdleTimeouts.forEach(t => clearTimeout(t));
    activeIdleTimeouts = [];
  }
  seq.forEach(step => {
    const tid = setTimeout(() => {
      activeMicroIdleOverride = step.src;
      refreshHudIdleAvatar();
    }, step.delay);
    activeIdleTimeouts.push(tid);
  });
}

// Alle Frames (#1 bis #30) beim Start vorladen für absolut flackerfreie Wiedergabe
const ALL_PRELOAD_IDLE_URLS = [
  ...BREATHING_IDLE_FRAMES,
  ...IDLE_MICRO_FRAMES.glint,
  ...Object.values(IDLE_MICRO_FRAMES).filter(v => typeof v === "string")
];
ALL_PRELOAD_IDLE_URLS.forEach(src => {
  const pre = new Image();
  pre.src = src;
});

function getIdleAvatarFrameUrl() {
  if (activeMicroIdleOverride) return activeMicroIdleOverride;
  return BREATHING_IDLE_FRAMES[currentBreathingFrameIdx] || Engine.PLAYER_DESIGN_REF.profileRef;
}

function getAvatarFrameUrl() {
  const s = Engine.getState();
  if (s.settings && s.settings.useProfileBadgeInHud && !isExcitedOverride && !pinnedStateId) {
    return getIdleAvatarFrameUrl();
  }
  const st = getActivePlayerStateObj();
  if (!isExcitedOverride && st && st.id === "state_01_neutral") {
    return getIdleAvatarFrameUrl();
  }
  return st ? st.portrait : "assets/avatar/avatar_happy.png";
}

function refreshHudIdleAvatar() {
  const s = Engine.getState();
  if (!isExcitedOverride && (!s.settings || s.settings.useProfileBadgeInHud || !pinnedStateId)) {
    const st = getActivePlayerStateObj();
    if ((s.settings && s.settings.useProfileBadgeInHud) || (st && st.id === "state_01_neutral")) {
      const img = document.getElementById("header-avatar-img");
      if (img) img.src = getIdleAvatarFrameUrl();
    }
  }
  const modalPreview = document.getElementById("modal-profile-ref-img");
  if (modalPreview) modalPreview.src = getIdleAvatarFrameUrl();
}

// #1: Ruhiges Atmen (8 Frames * 500ms = 4.0 Sekunden Zyklus)
setInterval(() => {
  currentBreathingFrameIdx = (currentBreathingFrameIdx + 1) % BREATHING_IDLE_FRAMES.length;
  if (!activeMicroIdleOverride) refreshHudIdleAvatar();
}, 500);

// #2: Doppel-Blinzeln (alle 6,5 Sekunden)
function triggerDoubleBlink(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.blink_half,   delay: 0 },
    { src: IDLE_MICRO_FRAMES.blink_closed, delay: 65 },
    { src: null,                           delay: 140 },
    { src: IDLE_MICRO_FRAMES.blink_half,   delay: 230 },
    { src: IDLE_MICRO_FRAMES.blink_closed, delay: 295 },
    { src: IDLE_MICRO_FRAMES.blink_half,   delay: 375 },
    { src: null,                           delay: 440 }
  ], manual);
}
setInterval(() => triggerDoubleBlink(false), 6500);

// #3: Brillenglas-Glanz / Glint (alle 9,5 Sekunden)
function triggerGlassesGlint(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.glint[0], delay: 0 },
    { src: IDLE_MICRO_FRAMES.glint[1], delay: 75 },
    { src: IDLE_MICRO_FRAMES.glint[2], delay: 150 },
    { src: IDLE_MICRO_FRAMES.glint[3], delay: 225 },
    { src: IDLE_MICRO_FRAMES.glint[4], delay: 300 },
    { src: null,                       delay: 380 }
  ], manual);
}
setInterval(() => triggerGlassesGlint(false), 9500);

// #4: Augenbrauen-Wippen (alle 11,5 Sekunden)
function triggerEyebrowWiggle(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.brow_mid,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.brow_high, delay: 95 },
    { src: IDLE_MICRO_FRAMES.brow_mid,  delay: 280 },
    { src: IDLE_MICRO_FRAMES.brow_high, delay: 390 },
    { src: IDLE_MICRO_FRAMES.brow_mid,  delay: 750 },
    { src: null,                        delay: 880 }
  ], manual);
}
setInterval(() => triggerEyebrowWiggle(false), 11500);

// #5: Blick durch den Raum (alle 14,5 Sekunden)
function triggerRoomGaze(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.gaze_mid,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.gaze_room, delay: 120 },
    { src: IDLE_MICRO_FRAMES.gaze_mid,  delay: 1350 },
    { src: null,                        delay: 1520 }
  ], manual);
}
setInterval(() => triggerRoomGaze(false), 14500);

// #6: Zufriedenes Schmunzeln (alle 17,5 Sekunden)
function triggerSmirk(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.smirk_mid,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.smirk_full, delay: 130 },
    { src: IDLE_MICRO_FRAMES.smirk_mid,  delay: 1150 },
    { src: null,                         delay: 1320 }
  ], manual);
}
setInterval(() => triggerSmirk(false), 17500);

// #7: Schiebermützen-Ruckler (alle 20,5 Sekunden)
function triggerCapTwitch(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.cap_low,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.cap_high, delay: 260 },
    { src: IDLE_MICRO_FRAMES.cap_low,  delay: 480 },
    { src: IDLE_MICRO_FRAMES.cap_high, delay: 620 },
    { src: null,                       delay: 820 }
  ], manual);
}
setInterval(() => triggerCapTwitch(false), 20500);

// #8: Nachdenkliches Kopfneigen (alle 23,5 Sekunden)
function triggerHeadTilt(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.tilt_mid,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.tilt_full, delay: 150 },
    { src: IDLE_MICRO_FRAMES.tilt_mid,  delay: 1350 },
    { src: null,                        delay: 1550 }
  ], manual);
}
setInterval(() => triggerHeadTilt(false), 23500);

// #9: Sanftes bestätigendes Nicken (alle 26,5 Sekunden)
function triggerConfirmNod(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.nod_mid,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.nod_down, delay: 110 },
    { src: IDLE_MICRO_FRAMES.nod_mid,  delay: 260 },
    { src: null,                       delay: 380 },
    { src: IDLE_MICRO_FRAMES.nod_mid,  delay: 520 },
    { src: IDLE_MICRO_FRAMES.nod_down, delay: 630 },
    { src: IDLE_MICRO_FRAMES.nod_mid,  delay: 800 },
    { src: null,                       delay: 930 }
  ], manual);
}
setInterval(() => triggerConfirmNod(false), 26500);

// #10: Vergnügtes Bart- & Nasenspitzen-Zucken (alle 29,5 Sekunden)
function triggerBeardTwitch(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.beard_a, delay: 0 },
    { src: IDLE_MICRO_FRAMES.beard_b, delay: 110 },
    { src: IDLE_MICRO_FRAMES.beard_a, delay: 220 },
    { src: IDLE_MICRO_FRAMES.beard_b, delay: 330 },
    { src: IDLE_MICRO_FRAMES.beard_a, delay: 440 },
    { src: null,                      delay: 580 }
  ], manual);
}
setInterval(() => triggerBeardTwitch(false), 29500);

// ============================================================================
// KATEGORIE 2 TRIGGER-FUNKTIONEN (#11 BIS #20: CHARAKTER-GIMMICKS & REQUISITEN)
// ============================================================================

// #11: Kaffee-Schluck
function triggerCoffeeSip(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.coffee_raise, delay: 0 },
    { src: IDLE_MICRO_FRAMES.coffee_sip_a, delay: 180 },
    { src: IDLE_MICRO_FRAMES.coffee_sip_b, delay: 620 },
    { src: IDLE_MICRO_FRAMES.coffee_sip_a, delay: 1080 },
    { src: IDLE_MICRO_FRAMES.coffee_raise, delay: 1450 },
    { src: null,                           delay: 1650 }
  ], manual);
}

// #12: Brille zurechtrücken
function triggerGlassesAdjust(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.glasses_reach, delay: 0 },
    { src: IDLE_MICRO_FRAMES.glasses_push,  delay: 160 },
    { src: IDLE_MICRO_FRAMES.glasses_reach, delay: 460 },
    { src: IDLE_MICRO_FRAMES.glasses_push,  delay: 620 },
    { src: IDLE_MICRO_FRAMES.glasses_reach, delay: 880 },
    { src: null,                            delay: 1060 }
  ], manual);
}

// #13: Tippen an den Mützenschirm
function triggerCapSalute(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.salute_mid, delay: 0 },
    { src: IDLE_MICRO_FRAMES.salute_tap, delay: 160 },
    { src: IDLE_MICRO_FRAMES.salute_mid, delay: 420 },
    { src: IDLE_MICRO_FRAMES.salute_tap, delay: 560 },
    { src: IDLE_MICRO_FRAMES.salute_mid, delay: 820 },
    { src: null,                         delay: 980 }
  ], manual);
}

// #14: Nachdenkliches Bart-Streichen
function triggerBeardStroke(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.stroke_chin, delay: 0 },
    { src: IDLE_MICRO_FRAMES.stroke_down, delay: 280 },
    { src: IDLE_MICRO_FRAMES.stroke_chin, delay: 620 },
    { src: IDLE_MICRO_FRAMES.stroke_down, delay: 940 },
    { src: IDLE_MICRO_FRAMES.stroke_chin, delay: 1280 },
    { src: null,                          delay: 1480 }
  ], manual);
}

// #15: Zimmermannsbleistift hinter dem Ohr
function triggerCarpenterPencil(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.pencil_tucked, delay: 0 },
    { src: IDLE_MICRO_FRAMES.pencil_slide,  delay: 260 },
    { src: IDLE_MICRO_FRAMES.pencil_ready,  delay: 520 },
    { src: IDLE_MICRO_FRAMES.pencil_slide,  delay: 1050 },
    { src: IDLE_MICRO_FRAMES.pencil_tucked, delay: 1320 },
    { src: null,                            delay: 1580 }
  ], manual);
}

// #16: Kopfhörer-Groove & Musik-Vibes
function triggerHeadphoneGroove(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.groove_1, delay: 0 },
    { src: IDLE_MICRO_FRAMES.groove_2, delay: 220 },
    { src: IDLE_MICRO_FRAMES.groove_3, delay: 440 },
    { src: IDLE_MICRO_FRAMES.groove_1, delay: 660 },
    { src: IDLE_MICRO_FRAMES.groove_2, delay: 880 },
    { src: IDLE_MICRO_FRAMES.groove_3, delay: 1100 },
    { src: IDLE_MICRO_FRAMES.groove_1, delay: 1320 },
    { src: null,                       delay: 1550 }
  ], manual);
}

// #17: Ukulele-Akkord anschlagen
function triggerUkuleleStrum(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.ukulele_1, delay: 0 },
    { src: IDLE_MICRO_FRAMES.ukulele_2, delay: 220 },
    { src: IDLE_MICRO_FRAMES.ukulele_3, delay: 420 },
    { src: IDLE_MICRO_FRAMES.ukulele_2, delay: 640 },
    { src: IDLE_MICRO_FRAMES.ukulele_3, delay: 860 },
    { src: IDLE_MICRO_FRAMES.ukulele_1, delay: 1150 },
    { src: null,                        delay: 1380 }
  ], manual);
}

// #18: Rosa Kaugummi-Blase (90er LucasArts Hommage)
function triggerBubblegum(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.gum_small, delay: 0 },
    { src: IDLE_MICRO_FRAMES.gum_big,   delay: 380 },
    { src: IDLE_MICRO_FRAMES.gum_pop,   delay: 980 },
    { src: IDLE_MICRO_FRAMES.smirk_full,delay: 1220 },
    { src: null,                        delay: 1500 }
  ], manual);
}

// #19: Fineliner-Skizze / Zentangle kritzeln
function triggerFinelinerSketch(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.sketch_1, delay: 0 },
    { src: IDLE_MICRO_FRAMES.sketch_2, delay: 320 },
    { src: IDLE_MICRO_FRAMES.sketch_3, delay: 640 },
    { src: IDLE_MICRO_FRAMES.sketch_2, delay: 960 },
    { src: IDLE_MICRO_FRAMES.sketch_3, delay: 1280 },
    { src: null,                       delay: 1580 }
  ], manual);
}

// #20: Dampfende Teetasse & Augen-Entspannung
function triggerCozyTea(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.tea_inhale, delay: 0 },
    { src: IDLE_MICRO_FRAMES.tea_cozy_a, delay: 280 },
    { src: IDLE_MICRO_FRAMES.tea_cozy_b, delay: 780 },
    { src: IDLE_MICRO_FRAMES.tea_cozy_a, delay: 1280 },
    { src: IDLE_MICRO_FRAMES.tea_inhale, delay: 1620 },
    { src: null,                         delay: 1850 }
  ], manual);
}

// ============================================================================
// KATEGORIE 3 TRIGGER-FUNKTIONEN (#21 BIS #30: RAHMEN-INTERAKTIONEN & POP-OUTS)
// ============================================================================

// #21: Auf dem Ring abstützen
function triggerRingLean(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.lean_raise, delay: 0 },
    { src: IDLE_MICRO_FRAMES.lean_rest,  delay: 200 },
    { src: IDLE_MICRO_FRAMES.lean_smirk, delay: 650 },
    { src: IDLE_MICRO_FRAMES.lean_rest,  delay: 1250 },
    { src: IDLE_MICRO_FRAMES.lean_raise, delay: 1550 },
    { src: null,                         delay: 1750 }
  ], manual);
}

// #22: Über den Rand spähen (Abtauchen & Hochspähen)
function triggerRingPeek(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.peek_mid, delay: 0 },
    { src: IDLE_MICRO_FRAMES.peek_low, delay: 180 },
    { src: IDLE_MICRO_FRAMES.peek_mid, delay: 1150 },
    { src: IDLE_MICRO_FRAMES.peek_pop, delay: 1320 },
    { src: null,                       delay: 1520 }
  ], manual);
}

// #23: Ring-Klopfen (von innen gegen die Scheibe klopfen)
function triggerGlassKnock(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.knock_windup,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.knock_tap,     delay: 140 },
    { src: IDLE_MICRO_FRAMES.knock_between, delay: 320 },
    { src: IDLE_MICRO_FRAMES.knock_tap,     delay: 480 },
    { src: IDLE_MICRO_FRAMES.knock_windup,  delay: 720 },
    { src: null,                            delay: 900 }
  ], manual);
}

// #24: Rauswinken über den Rahmen
function triggerWavePopout(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.wave_center, delay: 0 },
    { src: IDLE_MICRO_FRAMES.wave_left,   delay: 160 },
    { src: IDLE_MICRO_FRAMES.wave_right,  delay: 340 },
    { src: IDLE_MICRO_FRAMES.wave_left,   delay: 520 },
    { src: IDLE_MICRO_FRAMES.wave_right,  delay: 700 },
    { src: IDLE_MICRO_FRAMES.wave_center, delay: 880 },
    { src: null,                          delay: 1080 }
  ], manual);
}

// #25: Daumen-Hoch-Pop-Out
function triggerThumbsUpPopout(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.thumb_rise,    delay: 0 },
    { src: IDLE_MICRO_FRAMES.thumb_pop,     delay: 150 },
    { src: IDLE_MICRO_FRAMES.thumb_sparkle, delay: 320 },
    { src: IDLE_MICRO_FRAMES.thumb_pop,     delay: 980 },
    { src: IDLE_MICRO_FRAMES.thumb_rise,    delay: 1180 },
    { src: null,                            delay: 1350 }
  ], manual);
}

// #26: Schiebermütze lüften
function triggerCapLift(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.caplift_grab,   delay: 0 },
    { src: IDLE_MICRO_FRAMES.caplift_high,   delay: 180 },
    { src: IDLE_MICRO_FRAMES.caplift_settle, delay: 680 },
    { src: IDLE_MICRO_FRAMES.caplift_grab,   delay: 920 },
    { src: null,                             delay: 1120 }
  ], manual);
}

// #27: Rahmen von innen polieren
function triggerRingPolish(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.polish_left,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.polish_right, delay: 260 },
    { src: IDLE_MICRO_FRAMES.polish_top,   delay: 520 },
    { src: IDLE_MICRO_FRAMES.polish_right, delay: 780 },
    { src: IDLE_MICRO_FRAMES.polish_left,  delay: 1040 },
    { src: null,                           delay: 1280 }
  ], manual);
}

// #28: Seitenwechsel-Blick (weit seitlich herauslehnen)
function triggerSideLean(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.sidelean_mid,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.sidelean_far,  delay: 180 },
    { src: IDLE_MICRO_FRAMES.sidelean_mid,  delay: 820 },
    { src: IDLE_MICRO_FRAMES.sidelean_left, delay: 1080 },
    { src: null,                            delay: 1550 }
  ], manual);
}

// #29: Konfetti- & Pixel-Funken-Wurf
function triggerConfettiThrow(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.confetti_toss,   delay: 0 },
    { src: IDLE_MICRO_FRAMES.confetti_burst,  delay: 200 },
    { src: IDLE_MICRO_FRAMES.confetti_shower, delay: 650 },
    { src: IDLE_MICRO_FRAMES.confetti_toss,   delay: 1150 },
    { src: null,                              delay: 1400 }
  ], manual);
}

// #30: Schreck-Hüpfer (überraschter Hopser nach oben)
function triggerStartleJump(manual = false) {
  runMicroIdleSequence([
    { src: IDLE_MICRO_FRAMES.jump_pop,  delay: 0 },
    { src: IDLE_MICRO_FRAMES.jump_air,  delay: 180 },
    { src: IDLE_MICRO_FRAMES.jump_land, delay: 360 },
    { src: null,                        delay: 560 }
  ], manual);
}

// Rotierender Auto-Scheduler für Kategorie 2 & 3 (spielt alle 32 Sekunden abwechselnd ein Gimmick/Pop-Out ab)
const SPECIAL_IDLE_ROTATION = [
  triggerCoffeeSip,
  triggerRingLean,
  triggerGlassesAdjust,
  triggerRingPeek,
  triggerCapSalute,
  triggerGlassKnock,
  triggerBeardStroke,
  triggerWavePopout,
  triggerCarpenterPencil,
  triggerThumbsUpPopout,
  triggerHeadphoneGroove,
  triggerCapLift,
  triggerUkuleleStrum,
  triggerRingPolish,
  triggerBubblegum,
  triggerSideLean,
  triggerFinelinerSketch,
  triggerConfettiThrow,
  triggerCozyTea,
  triggerStartleJump
];
let currentSpecialIdleIdx = 0;
setInterval(() => {
  if (!activeMicroIdleOverride) {
    SPECIAL_IDLE_ROTATION[currentSpecialIdleIdx](false);
    currentSpecialIdleIdx = (currentSpecialIdleIdx + 1) % SPECIAL_IDLE_ROTATION.length;
  }
}, 32000);

function updateAvatarSprite() {
  const img = document.getElementById("header-avatar-img");
  if (img) img.src = getAvatarFrameUrl();
}

function triggerExcitedAvatar() {
  if (typeof pulseMiniStatPill === 'function') pulseMiniStatPill();
  isExcitedOverride = true;
  updateAvatarSprite();
  setTimeout(() => {
    isExcitedOverride = false;
    updateAvatarSprite();
  }, 2600);
}

// --- 3. HUD (CHARAKTERBOGEN B3, B4, B6, B8, B10, D10) & RAUM RENDERN ---
function renderAll() {
  const s = Engine.getState();
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };
  setTxt("hud-gold", s.character.gold);
  setTxt("hud-streak", s.character.streak);
  setTxt("hud-mb", s.character.mb);
  setTxt("hud-level", s.character.level);
  setTxt("hud-xp", s.character.xp);
  setTxt("hud-ap", s.character.ap);
  setTxt("hud-max-ap", s.character.maxAp);
  setTxt("hud-hp", s.character.hp);

  // Update v0.50: Live Mini-Stat-Pille direkt unter dem Avatar-Ring
  setTxt("pill-gold", s.character.gold);
  setTxt("pill-ap", s.character.ap);
  setTxt("pill-streak", s.character.streak);
  const pillEl = document.getElementById("mini-stat-pill");
  if (pillEl) {
    if (s.settings && s.settings.miniStatPillCollapsed) {
      pillEl.classList.add("collapsed");
    } else {
      pillEl.classList.remove("collapsed");
    }
  }

  const ringEl = document.getElementById("avatar-progress-ring");
  if (ringEl) {
    const mbVal = Math.max(0, Math.min(100, Number(s.character.mb) || 0));
    ringEl.style.background = `conic-gradient(#ff7a00 0% ${mbVal}%, #3b2314 ${mbVal}% 100%)`;
  }

  const roomName = s.settings.currentRoom || "Flur";
  setTxt("header-room-label", roomName);

  updateAvatarSprite();
  renderCurrentRoom(roomName);
}

function getDynamicCleaningObject(roomName) {
  const dirtLvl = Engine.getRoomDirtLevel(roomName);
  if (dirtLvl <= 0) return null;
  const cfg = Engine.ASSETS.doorCleaningCoords && Engine.ASSETS.doorCleaningCoords[roomName];
  if (!cfg) return null;
  const mult = Engine.getDirtMultiplier(dirtLvl);
  const toolLabels = {
    1: "🧹 Besen an der Tür (Stufe 1: Leicht unordentlich – Frühstart-Bonus x2.0!)",
    2: "🧹 Kehrset an der Tür (Stufe 2: Mittelmäßig unordentlich – Bonus x1.7)",
    3: "🔌 Staubsauger (Stufe 3: Dreckig / Chaos – Bonus x1.4)"
  };
  return {
    id: `CLEAN_DYNAMIC_${roomName}`,
    raum: roomName,
    name: cfg.taskName,
    anzeigeName: `${toolLabels[dirtLvl]} → ${cfg.taskName}`,
    zielTabelle: cfg.zielTabelle,
    verknuepfung: cfg.verknuepfung,
    spriteUrl: Engine.ASSETS.cleaningToolSprites[dirtLvl],
    leftPct: cfg.leftPct,
    topPct: cfg.topPct,
    widthPct: cfg.widthPct,
    heightPct: cfg.heightPct,
    zIndex: cfg.zIndex || 20,
    xp: cfg.baseXp,
    gold: cfg.baseGold,
    mb: cfg.baseMb,
    ap: cfg.baseAp,
    dirtLevel: dirtLvl,
    dirtMultiplier: mult,
    isDirtCleaner: true
  };
}

function renderCurrentRoom(roomName) {
  const canvas = document.getElementById("room-canvas");
  const layer = document.getElementById("room-hotspots-layer");
  canvas.setAttribute("data-room", roomName);

  const dirtLvl = Engine.getRoomDirtLevel(roomName);
  const dirtyList = Engine.ASSETS.dirtyBackgrounds && Engine.ASSETS.dirtyBackgrounds[roomName];
  const bgUrl = (dirtyList && dirtyList[dirtLvl]) || Engine.ASSETS.backgrounds[roomName] || Engine.ASSETS.backgrounds["Flur"];
  canvas.style.backgroundImage = `url('${bgUrl}')`;

  // Aktiven Tageszeiten-Lichtfilter (Morgen, Tag, Golden Hour, Nacht + Lampen/Kerzen) & UI-Rahmen anwenden
  renderAmbientLighting(roomName);
  renderUiFrameOverlay(roomName);

  const baseObjects = Engine.ROOM_OBJECTS[roomName] || [];
  const dynCleanObj = getDynamicCleaningObject(roomName);
  const objects = dynCleanObj ? [...baseObjects, dynCleanObj] : baseObjects;
  const completed = Engine.getState().completedToday || {};

  // Wenn wir auf dem Dashboard sind: Die 3 häufigsten Aktivitäten als Haftnotizen direkt auf der Kork-Pinnwand rendern!
  const top3PostitsHtml = (roomName === "Dashboard" || roomName === "Arbeitszimmer")
    ? (Engine.getTop3FrequentActivities ? Engine.getTop3FrequentActivities() : []).map((fav, idx) => {
        const isFavDone = !!completed[fav.id];
        const shortWords = (fav.shortLabel || fav.name || "").split(" ").slice(0, 2).join(" ");
        const iconVisual = fav.iconUrl
          ? `<img src="${fav.iconUrl}" class="postit-icon-img" alt="${fav.name}" onerror="this.outerHTML='<span class=\'postit-emoji\'>${fav.icon || '⭐'}</span>'">`
          : `<span class="postit-emoji">${fav.icon || "⭐"}</span>`;
        const freqInfo = fav.countInLog > 0 ? `${fav.countInLog}× im Log` : `Top #${idx + 1}`;
        return `
          <div class="pinnwand-postit-hotspot ${isFavDone ? 'done-today' : ''} ${(typeof isDevMode !== 'undefined' && isDevMode && devSelectedId === 'POSTIT_SLOT_' + fav.slotNr) ? 'dev-selected-object' : ''}"
               data-dev-id="POSTIT_SLOT_${fav.slotNr}"
               style="left: ${fav.leftPct}%; top: ${fav.topPct}%; width: ${fav.widthPct}%; height: ${fav.heightPct}%; z-index: ${fav.zIndex || 22}; transform: rotate(${fav.rotDeg || 0}deg);"
               title="⚡ Schnellzugriff #${idx + 1} (${freqInfo}): ${fav.name} — 1-Tap Direkt-Abhaken (+${fav.xp || 0} XP, +${fav.mb || 0} MB)"
               onclick="event.stopPropagation(); if(typeof isDevMode !== 'undefined' && isDevMode){ selectDevObject('POSTIT_SLOT_${fav.slotNr}'); return; } quickCompleteTopActivity(${idx})">
            <img src="${fav.postitSprite}" class="postit-bg-img" alt="Post-it #${idx + 1}">
            <div class="postit-content">
              ${iconVisual}
              <div class="postit-title">${shortWords}</div>
              <div class="postit-xp-tag">+${fav.xp || 0}XP${fav.mb ? ` • +${fav.mb}MB` : ''}</div>
            </div>
            ${isFavDone ? '<span class="sprite-done-badge" style="top:18%; left:82%; font-size:10px; padding:1px 4px;">✓</span>' : ''}
          </div>
        `;
      }).join("")
    : "";

  layer.innerHTML = objects.map(obj => {
    const isDone = !!completed[obj.id];
    const displayTitle = obj.anzeigeName || obj.name;

    // 1. Null-Naht-Rendering für freigestellte Raum-Sprites (z. B. im neuen Flur)
    if (obj.spriteUrl && obj.widthPct !== undefined) {
      const clipStyle = obj.clipPath ? `clip-path: ${obj.clipPath}; -webkit-clip-path: ${obj.clipPath};` : "";
      const rotStyle = obj.rotDeg ? `transform: rotate(${obj.rotDeg}deg);` : "";
      const isDevSel = (typeof isDevMode !== "undefined" && isDevMode && devSelectedId === obj.id) ? "dev-selected-object" : "";
      return `
        <div class="room-sprite-hotspot ${isDone ? 'done-today' : ''} ${isDevSel}"
             data-dev-id="${obj.id}"
             style="left: ${obj.leftPct}%; top: ${obj.topPct}%; width: ${obj.widthPct}%; height: ${obj.heightPct}%; z-index: ${obj.zIndex || 12}; ${clipStyle} ${rotStyle}"
             title="${displayTitle}"
             onclick="if(typeof isDevMode !== 'undefined' && isDevMode){ event.stopPropagation(); selectDevObject('${obj.id}'); return; } handleHotspotClick('${roomName}', '${obj.id}')">
          <img src="${obj.spriteUrl}" alt="${displayTitle}">
          ${isDone ? '<span class="sprite-done-badge">✓</span>' : ''}
        </div>
      `;
    }

    // 2. Hotspot-Rendering für Objekte aus "Frontend_Raum_Objekte" (inkl. iconUrl aus Spalte G)
    const iconHtml = obj.iconUrl
      ? `<img src="${obj.iconUrl}" alt="${obj.iconName || displayTitle}" style="width:28px; height:28px; object-fit:contain; image-rendering:auto;" onerror="this.outerHTML='<span class=\'badge-hotspot-icon\'>${obj.icon || '✨'}</span>'">`
      : `<span class="badge-hotspot-icon">${isDone ? '✅' : (obj.icon || '✨')}</span>`;

    return `
      <div class="room-hotspot badge-hotspot ${isDone ? 'done-today' : ''}"
           style="left: ${obj.xPct}%; top: ${obj.yPct}%;"
           title="${displayTitle}"
           onclick="handleHotspotClick('${roomName}', '${obj.id}')">
        ${iconHtml}
        <span class="badge-hotspot-label">${displayTitle.split(' ')[0]}</span>
      </div>
    `;
  }).join("") + top3PostitsHtml;
}

// --- 1-TAP SCHNELLZUGRIFF FÜR DIE 3 HAFTNOTIZEN AUF DER DASHBOARD-PINNWAND ---
function quickCompleteTopActivity(slotIdx) {
  if (!Engine.getTop3FrequentActivities) return;
  const top3 = Engine.getTop3FrequentActivities();
  const fav = top3[slotIdx];
  if (!fav) return;

  const rName = fav.raum || Engine.getState().settings.currentRoom || "Dashboard";
  const dirtBefore = Engine.getRoomDirtLevel ? Engine.getRoomDirtLevel(rName) : 0;
  const isClean = !!(fav.isDirtCleaner || (fav.name && (fav.name.includes("Samstagsputz") || fav.name.includes("aufräumen") || fav.name.includes("Tisch abwischen"))));
  const mult = (isClean && dirtBefore >= 1 && Engine.getDirtMultiplier) ? Engine.getDirtMultiplier(dirtBefore) : 1.0;
  const finalXp = Math.round((Number(fav.xp) || 0) * mult);
  const finalGold = Math.round((Number(fav.gold) || 0) * mult);

  Engine.completeObject(fav);
  triggerExcitedAvatar();
  renderAll();
  const bonusTxt = mult > 1.0 ? ` [🧹 Putz-Bonus x${mult.toFixed(1)}!]` : "";
  showLootToast(`📌 Schnell-Quest #${slotIdx + 1}: "${fav.name}" erledigt! (+${finalXp} XP, +${finalGold} G, +${fav.mb || 0} MB)${bonusTxt}`);
}

function handleHotspotClick(roomName, objId) {
  const baseObjects = Engine.ROOM_OBJECTS[roomName] || [];
  const dynCleanObj = getDynamicCleaningObject(roomName);
  const objects = dynCleanObj ? [...baseObjects, dynCleanObj] : baseObjects;
  const obj = objects.find(o => o.id === objId);
  if (!obj) return;

  if (obj.isMapDoor) {
    openMapModal();
    return;
  }
  if (obj.isShopTrigger) {
    openShopModal();
    return;
  }

  selectedObject = obj;
  document.getElementById("obj-modal-title").textContent = `${obj.zielTabelle}: ${obj.name}`;

  const previewWrap = document.getElementById("obj-modal-preview-wrap");
  const primaryImgUrl = obj.spriteUrl || obj.iconUrl;
  if (primaryImgUrl) {
    const fallbackUrl = (obj.iconUrl && obj.iconUrl !== primaryImgUrl) ? obj.iconUrl : "";
    previewWrap.innerHTML = `
      <img src="${primaryImgUrl}"
           alt="${obj.name}"
           class="obj-hero-img"
           onclick="this.classList.toggle('zoomed')"
           title="Antippen zum Vergrößern / Reinzoomen"
           onerror="${fallbackUrl ? `this.onerror=null; this.src='${fallbackUrl}';` : `this.outerHTML='<div class=\'obj-hero-emoji\'>${obj.icon || '✨'}</div>'`}">
      <span class="obj-hero-zoom-hint">🔍 Antippen für Zoom</span>
    `;
  } else {
    previewWrap.innerHTML = `<div id="obj-modal-icon" class="obj-hero-emoji">${obj.icon || "✨"}</div>`;
  }

  const dirtLvl = Engine.getRoomDirtLevel(roomName);
  const isCleaningQuest = !!(obj.isDirtCleaner || (obj.name && (obj.name.includes("Samstagsputz") || obj.name.includes("aufräumen") || obj.name.includes("Tisch abwischen"))));
  const mult = (isCleaningQuest && dirtLvl >= 1) ? Engine.getDirtMultiplier(dirtLvl) : 1.0;
  const effXp = Math.round((Number(obj.xp) || 0) * mult);
  const effGold = Math.round((Number(obj.gold) || 0) * mult);
  const multBadge = mult > 1.0 ? ` <span style="background:#16a34a; color:#fff; padding:2px 7px; border-radius:99px; font-size:11px;">🧹 Putz-Multiplikator x${mult.toFixed(1)}!</span>` : "";

  const sheetInfo = obj.verknuepfung ? ` (Tabellen-Zelle: ${obj.zielTabelle}!${obj.verknuepfung})` : "";
  document.getElementById("obj-modal-desc").innerHTML = `${obj.anzeigeName || obj.name}${sheetInfo}${multBadge}`;
  document.getElementById("obj-modal-rewards").innerHTML = `
    <span class="reward-pill">+${effXp} XP ${mult > 1.0 ? `(statt ${obj.xp})` : ''}</span>
    <span class="reward-pill">+${effGold} Gold ${mult > 1.0 ? `(statt ${obj.gold})` : ''}</span>
    <span class="reward-pill">+${obj.mb || 0} MB</span>
    <span class="reward-pill">+${obj.ap || 0} AP</span>
  `;
  openModal("object-modal");
}

function confirmObjectAction() {
  if (!selectedObject) return;
  const rName = selectedObject.raum || Engine.getState().settings.currentRoom || "Flur";
  const dirtBefore = Engine.getRoomDirtLevel(rName);
  const isClean = !!(selectedObject.isDirtCleaner || (selectedObject.name && (selectedObject.name.includes("Samstagsputz") || selectedObject.name.includes("aufräumen") || selectedObject.name.includes("Tisch abwischen"))));
  const mult = (isClean && dirtBefore >= 1) ? Engine.getDirtMultiplier(dirtBefore) : 1.0;
  const finalXp = Math.round((Number(selectedObject.xp) || 0) * mult);
  const finalGold = Math.round((Number(selectedObject.gold) || 0) * mult);

  Engine.completeObject(selectedObject);
  closeModal("object-modal");
  triggerExcitedAvatar();
  renderAll();
  const bonusTxt = mult > 1.0 ? ` [🧹 Früh-Putz-Bonus x${mult.toFixed(1)} – Raum blitzblank!]` : "";
  showLootToast(`✅ "${selectedObject.name}" (+${finalXp} XP, +${finalGold} G, +${selectedObject.mb} MB)${bonusTxt}`);
}

function setCurrentRoomDirt(level) {
  const rName = Engine.getState().settings.currentRoom || "Flur";
  Engine.setRoomDirtLevel(rName, level);
  renderAll();
  openCharacterModal();
  const labels = {
    0: "✨ Stufe 0: Blitzblank (Standard)",
    1: "🧹 Stufe 1: Leicht unordentlich (Besen an der Tür • Bonus x2.0!)",
    2: "🧹 Stufe 2: Mittelmäßig unordentlich (Kehrset • Bonus x1.7)",
    3: "🔌 Stufe 3: Dreckig / Chaos (Staubsauger • Bonus x1.4)"
  };
  showLootToast(`${rName}: ${labels[level]}`);
}

// --- 4. NEUE INTERAKTIVE WOHNUNGS-MAP ---
function openMapModal() {
  const currentRoom = Engine.getState().settings.currentRoom;
  const mapCanvas = document.getElementById("interactive-map-canvas");
  if (mapCanvas) {
    mapCanvas.innerHTML = Engine.ROOMS.map(r => {
      const clipStyle = r.clipPath ? `clip-path: ${r.clipPath}; -webkit-clip-path: ${r.clipPath};` : "";
      return `
        <div class="map-room-sprite ${r.id === currentRoom ? 'active-room' : ''}"
             style="left: ${r.leftPct}%; top: ${r.topPct}%; width: ${r.widthPct}%; height: ${r.heightPct}%; z-index: ${r.zIndex || 5}; ${clipStyle}"
             onclick="selectRoom('${r.id}')"
             title="${r.id} betreten (${r.desc})">
          <img src="${r.mapSprite}" alt="${r.id}">
        </div>
      `;
    }).join("");
  }
  openModal("map-modal");
}

function selectRoom(roomId) {
  const s = Engine.getState();
  s.settings.currentRoom = roomId;
  Engine.saveState();
  closeModal("map-modal");
  renderAll();
}

// --- 5. SHOP MODAL (EXAKT DEINE 6 ITEMS AUS TABELLENBLATT "Shop") ---
function openShopModal() {
  const body = document.getElementById("shop-modal-body");
  body.innerHTML = Engine.SHOP_ITEMS.map(item => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; border:2px solid #fed7aa; border-radius:12px; margin-bottom:8px;">
      <div>
        <div style="font-weight:800; font-size:14px;">🛒 ${item.name}</div>
        <div style="font-size:12px; color:#64748b;">Preis: <strong>${item.preisGold} Gold</strong> • AP-Kosten: <strong>${item.kostenAp} AP</strong></div>
      </div>
      <button class="top-btn" onclick="redeemShopItem('${item.id}')">Kaufen</button>
    </div>
  `).join("");
  openModal("shop-modal");
}

function redeemShopItem(itemId) {
  const item = Engine.SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return;
  const res = Engine.buyShopItem(item);
  showLootToast(res.msg);
  if (res.ok) {
    triggerExcitedAvatar();
    closeModal("shop-modal");
    renderAll();
  }
}

// --- 6. QUESTLOG, ACHIEVEMENTS & GOOGLE SHEET SYNC MODAL ---
function openLogModal() {
  const s = Engine.getState();
  const list = document.getElementById("log-entries-list");
  const logs = s.questlog || [];

  const achHtml = Engine.ACHIEVEMENTS.map(a => `
    <div style="font-size:12px; padding:4px 0;">
      ${a.status === "JA" ? "🏆" : "🔒"} <strong>${a.name}</strong> (${a.bedingung}) – Bonus: +${a.goldBonus} G / +${a.xpBonus} XP
    </div>
  `).join("");

  const logHtml = logs.map(l => `
    <div style="padding:6px 0; border-bottom:1px solid #e2e8f0; font-size:12px;">
      <strong>[${l.datum} ${l.uhrzeit}]</strong> ${l.aktivitaet} <em>(${l.typ})</em>
      <span style="color:#ea580c; font-weight:700;">[XP: ${l.xp} | MB: ${l.mb} | G: ${l.gold} | AP: ${l.ap}]</span>
    </div>
  `).join("");

  list.innerHTML = `
    <div style="background:#fff7ed; border:1.5px solid #ff7a00; border-radius:10px; padding:8px; margin-bottom:10px; font-size:12px;">
      <strong>🎯 Aktives Hauptziel (C14):</strong> ${s.character.aktuelleQuest} (${s.character.levelProgressText})<br>
      <strong>🏅 Achievements (Tabellenblatt):</strong>
      ${achHtml}
    </div>
    <div style="font-weight:800; font-size:13px; margin-bottom:4px;">📜 Questlog (Spalten A–H):</div>
    ${logHtml}
  `;
  openModal("log-modal");
}

async function manualSheetSync() {
  showLootToast("🔄 Synchronisiere mit Google Sheet...");
  const res = await Engine.fetchFromGoogleSheet();
  if (res && res.ok) {
    renderAll();
    showLootToast("✅ Charakterbogen-Werte erfolgreich aus Google Sheet geladen!");
  } else {
    showLootToast("ℹ️ Lokale Tabellen-Werte aktiv (Level 25 | 9424 Gold | 94% MB).");
  }
}

function openCharacterModal() {
  const s = Engine.getState();
  const ref = Engine.PLAYER_DESIGN_REF;
  const activeSt = getActivePlayerStateObj();
  const useBadge = !!(s.settings && s.settings.useProfileBadgeInHud);

  const statesGridHtml = ref.states.map(st => {
    const isSelected = (pinnedStateId === st.id) || (!pinnedStateId && activeSt.id === st.id);
    return `
      <div onclick="selectPlayerStatePreview('${st.id}')"
           style="cursor:pointer; border:2px solid ${isSelected ? '#ff7a00' : '#e2e8f0'}; background:${isSelected ? '#fff7ed' : '#ffffff'}; border-radius:12px; padding:8px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:space-between;">
        <img src="${st.portrait}" alt="${st.label}" style="height:78px; object-fit:contain; image-rendering:auto; margin-bottom:4px;">
        <div style="font-size:11px; font-weight:800; color:#1e293b;">#${st.nr} ${st.label}</div>
        <div style="font-size:10px; color:#64748b;">${st.mbRange}</div>
      </div>
    `;
  }).join("");

  const body = document.getElementById("character-modal-body");
  if (body) {
    body.innerHTML = `
      <div style="display:flex; align-items:center; gap:14px; background:#fff7ed; border:2px solid #fed7aa; border-radius:14px; padding:12px; margin-bottom:12px;">
        <img id="modal-profile-ref-img" src="${getIdleAvatarFrameUrl()}" alt="Profilbild Referenz" style="width:96px; height:96px; border-radius:50%; object-fit:contain; object-position:center bottom; padding-top:4px; border:3.5px solid #ff7a00; image-rendering:auto; background:radial-gradient(circle at 50% 40%, #fff9db 0%, #ffd43b 70%, #f76707 100%); flex-shrink:0;">
        <div style="flex:1;">
          <div style="font-weight:900; font-size:15px; color:#9a3412;">Offizielle Designreferenz (Paddy)</div>
          <div style="font-size:12px; color:#475569; margin-top:2px;">
            <strong>Aktueller Raum:</strong> ${s.settings.currentRoom || "Flur"} • <strong>State:</strong> ${activeSt.label}<br>
            🪙 <strong>${s.character.gold} Gold</strong> • 🧠 <strong>${s.character.mb}% MB</strong> • ⚡ <strong>${s.character.ap}/${s.character.maxAp} AP</strong><br>
            ⭐ <strong>Lvl ${s.character.level}</strong> (${s.character.xp} XP) • ❤️ <strong>${s.character.hp} HP</strong> • 🔥 Streak: <strong>${s.character.streak}</strong>
          </div>
          <div style="margin-top:6px; display:flex; gap:5px; flex-wrap:wrap;">
            <button class="secondary-btn" style="font-size:11px; padding:4px 8px;" onclick="closeModal('character-modal'); openMapModal();">🗺️ Karte</button>
            <button class="secondary-btn" style="font-size:11px; padding:4px 8px;" onclick="closeModal('character-modal'); openRoomBookModal();">📋 Raum-Buch</button>
            <button class="secondary-btn" style="font-size:11px; padding:4px 8px;" onclick="closeModal('character-modal'); openShopModal();">🐷 Shop</button>
            <button class="secondary-btn" style="font-size:11px; padding:4px 8px;" onclick="closeModal('character-modal'); openLogModal();">📜 Chronik</button>
            <button class="secondary-btn" style="font-size:11px; padding:4px 8px; border-color:#ff7a00; color:#9a3412;" onclick="closeModal('character-modal'); openSettingsModal();">⚙️ Einstellungen</button>
          </div>
          <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap;">
            <button class="secondary-btn" style="font-size:11px; padding:4px 8px;" onclick="toggleHudProfileBadge()">
              ${useBadge ? '🔄 HUD: Dynamische 10 States nutzen' : '🖼️ HUD: Rundes Profilbild fixieren'}
            </button>
            <button class="secondary-btn" style="font-size:11px; padding:4px 8px;" onclick="selectPlayerStatePreview(null)">
              ⚡ Auto-Modus (nach MB%)
            </button>
          </div>
        </div>
      </div>
      ${(Engine.isRoomDirtEnabled && Engine.isRoomDirtEnabled(s.settings.currentRoom || "Flur")) ? `
      <div style="background:#fefce8; border:2px solid #facc15; border-radius:12px; padding:10px; margin-bottom:10px;">
        <div style="font-weight:800; font-size:12px; color:#854d0e; margin-bottom:6px;">
          🧹 RAUM-ZUSTAND & VERSTÄRKERLOGIK (${s.settings.currentRoom || "Flur"}: Aktuell Stufe ${Engine.getRoomDirtLevel(s.settings.currentRoom || "Flur")} • Multiplikator x${Engine.getDirtMultiplier(Engine.getRoomDirtLevel(s.settings.currentRoom || "Flur")).toFixed(1)}):
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="setCurrentRoomDirt(0)">✨ Stufe 0: Sauber (x1.0)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px; border-color:#16a34a; color:#166534;" onclick="setCurrentRoomDirt(1)">🧹 Stufe 1: Leicht + Besen (x2.0!)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px; border-color:#ea580c; color:#9a3412;" onclick="setCurrentRoomDirt(2)">🧹 Stufe 2: Mittel + Kehrset (x1.7)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px; border-color:#dc2626; color:#991b1b;" onclick="setCurrentRoomDirt(3)">🔌 Stufe 3: Dreckig + Sauger (x1.4)</button>
        </div>
      </div>` : `
      <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:8px 10px; margin-bottom:10px; font-size:11.5px; color:#166534; font-weight:700;">
        ✨ <strong>${s.settings.currentRoom || "Dashboard"}:</strong> Dauerhaft sauber (Keine Müll-Logik in diesem Bereich – ${s.settings.currentRoom === "Kinderzimmer" ? "Ronjas eigenes Reich zum Aufräumen lernen!" : "reines Fokus-Dashboard!"}).
      </div>`}
      <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:12px; padding:10px; margin-bottom:10px;">
        <div style="font-weight:800; font-size:12px; color:#1e293b; margin-bottom:6px;">
          ✨ KATEGORIE 1: SUBTILE MIKRO-BEWEGUNGEN #1–#10 (ANTIPPEN ZUM TESTEN):
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="activeMicroIdleOverride=null; refreshHudIdleAvatar(); showLootToast('🫁 #1 Ruhiges Atmen (4s Dauer-Loop aktiv)');">🫁 #1 Ruhiges Atmen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerDoubleBlink(true); showLootToast('👀 #2 Doppel-Blinzeln ausgelöst!');">👀 #2 Doppel-Blinzeln</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerGlassesGlint(true); showLootToast('✨ #3 Brillenglas-Glanz ausgelöst!');">✨ #3 Brillen-Glint</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerEyebrowWiggle(true); showLootToast('🤨 #4 Augenbrauen-Wippen ausgelöst!');">🤨 #4 Brauen-Wippen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerRoomGaze(true); showLootToast('👁️ #5 Blick durch den Raum ausgelöst!');">👁️ #5 Raum-Blick</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerSmirk(true); showLootToast('😏 #6 Zufriedenes Schmunzeln ausgelöst!');">😏 #6 Schmunzeln</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerCapTwitch(true); showLootToast('🧢 #7 Schiebermützen-Ruckler ausgelöst!');">🧢 #7 Mützen-Ruckler</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerHeadTilt(true); showLootToast('🤔 #8 Nachdenkliches Kopfneigen ausgelöst!');">🤔 #8 Kopfneigen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerConfirmNod(true); showLootToast('😌 #9 Bestätigendes Nicken ausgelöst!');">😌 #9 Sanftes Nicken</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerBeardTwitch(true); showLootToast('🧔 #10 Vergnügtes Bart-Zucken ausgelöst!');">🧔 #10 Bart-Zucken</button>
        </div>
      </div>
      <div style="background:#fff7ed; border:1.5px solid #fed7aa; border-radius:12px; padding:10px; margin-bottom:12px;">
        <div style="font-weight:800; font-size:12px; color:#9a3412; margin-bottom:6px;">
          🎸 KATEGORIE 2: CHARAKTER-GIMMICKS & REQUISITEN #11–#20 (ANTIPPEN ZUM TESTEN):
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerCoffeeSip(true); showLootToast('☕ #11 Kaffee-Schluck ausgelöst!');">☕ #11 Kaffee-Schluck</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerGlassesAdjust(true); showLootToast('🤓 #12 Brille zurechtrücken ausgelöst!');">🤓 #12 Brille rücken</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerCapSalute(true); showLootToast('🫡 #13 Tippen an Mützenschirm ausgelöst!');">🫡 #13 Mützenschirm-Tipp</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerBeardStroke(true); showLootToast('🧔‍♂️ #14 Bart-Streichen ausgelöst!');">🧔‍♂️ #14 Bart-Streichen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerCarpenterPencil(true); showLootToast('✏️ #15 Zimmermannsbleistift ausgelöst!');">✏️ #15 Holz-Bleistift</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerHeadphoneGroove(true); showLootToast('🎧 #16 Kopfhörer-Groove ausgelöst!');">🎧 #16 Kopfhörer-Groove</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerUkuleleStrum(true); showLootToast('🎸 #17 Ukulele-Akkord ausgelöst!');">🎸 #17 Ukulele-Strum</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerBubblegum(true); showLootToast('🫧 #18 Kaugummi-Blase ausgelöst!');">🫧 #18 Kaugummi-Blase</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerFinelinerSketch(true); showLootToast('✒️ #19 Fineliner-Zentangle ausgelöst!');">✒️ #19 Fineliner-Skizze</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerCozyTea(true); showLootToast('🍵 #20 Dampfende Teetasse ausgelöst!');">🍵 #20 Teetasse genießen</button>
        </div>
      </div>
      <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:12px; padding:10px; margin-bottom:12px;">
        <div style="font-weight:800; font-size:12px; color:#166534; margin-bottom:6px;">
          🖼️ KATEGORIE 3: RAHMEN-INTERAKTIONEN & POP-OUTS #21–#30 (ANTIPPEN ZUM TESTEN):
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerRingLean(true); showLootToast('💪 #21 Auf dem Ring abstützen ausgelöst!');">💪 #21 Ring-Abstützen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerRingPeek(true); showLootToast('🫣 #22 Über den Rand spähen ausgelöst!');">🫣 #22 Rand-Spähen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerGlassKnock(true); showLootToast('✊ #23 Ring-Klopfen gegen Scheibe ausgelöst!');">✊ #23 Scheibe klopfen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerWavePopout(true); showLootToast('👋 #24 Rauswinken über den Rahmen ausgelöst!');">👋 #24 Rauswinken</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerThumbsUpPopout(true); showLootToast('👍 #25 Daumen-Hoch-Pop-Out ausgelöst!');">👍 #25 Daumen-Pop-Out</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerCapLift(true); showLootToast('🎩 #26 Mütze lüften ausgelöst!');">🎩 #26 Mütze lüften</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerRingPolish(true); showLootToast('🧽 #27 Rahmen polieren ausgelöst!');">🧽 #27 Rahmen polieren</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerSideLean(true); showLootToast('↔️ #28 Seitenwechsel-Blick ausgelöst!');">↔️ #28 Seiten-Lehnen</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerConfettiThrow(true); showLootToast('🎉 #29 Konfetti- & Pixel-Funken-Wurf ausgelöst!');">🎉 #29 Konfetti-Wurf</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px;" onclick="triggerStartleJump(true); showLootToast('❗ #30 Schreck-Hüpfer ausgelöst!');">❗ #30 Schreck-Hüpfer</button>
        </div>
      </div>
      <div style="font-weight:800; font-size:12px; color:#475569; margin-bottom:8px;">
        🎭 ALLE 10+1 AVATAR-STATES (ANTIPPEN ZUM TESTEN IM PROFILRAHMEN):
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(125px, 1fr)); gap:8px;">
        ${statesGridHtml}
      </div>
    `;
  }
  openModal("character-modal");
}

function selectPlayerStatePreview(stateId) {
  pinnedStateId = stateId;
  updateAvatarSprite();
  openCharacterModal();
  if (stateId) {
    const st = Engine.PLAYER_DESIGN_REF.states.find(x => x.id === stateId);
    if (st) showLootToast(`🧢 Spielerfigur-State aktiviert: #${st.nr} ${st.label}`);
  } else {
    showLootToast("⚡ Spielerfigur wieder im automatischen MB%-Modus!");
  }
}

function toggleHudProfileBadge() {
  const s = Engine.getState();
  s.settings.useProfileBadgeInHud = !s.settings.useProfileBadgeInHud;
  Engine.saveState();
  updateAvatarSprite();
  openCharacterModal();
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}

function showLootToast(text) {
  const t = document.getElementById("loot-toast");
  if (!t) return;
  t.textContent = text;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 2800);
}


// --- 7. RAUM-AUFGABENBUCH (ALLE EINTRAEGE AUS SPALTE M "Raum" & SPALTE N "Repräsentiert durch") ---
function openRoomBookModal(filterRoom) {
  const currentRoom = filterRoom || Engine.getState().settings.currentRoom || "Flur";
  const allRooms = ["Flur", "Wohnzimmer", "Schlafzimmer", "Küche", "Badezimmer", "Kinderzimmer", "Dashboard", "Alle"];
  const catalog = Engine.getRoomCatalog(currentRoom);
  const completed = Engine.getState().completedToday || {};

  document.getElementById("room-book-title").textContent = `📋 Raum-Buch: ${currentRoom}`;

  const tabsHtml = `
    <div style="display:flex; gap:5px; flex-wrap:wrap; margin-bottom:10px;">
      ${allRooms.map(r => `
        <button class="secondary-btn"
                style="padding:4px 8px; font-size:11px; ${r === currentRoom ? 'background:#ff7a00; color:#fff; border-color:#ea580c;' : ''}"
                onclick="openRoomBookModal('${r}')">
          ${r}
        </button>
      `).join("")}
    </div>
  `;

  // Mappe Raum-Objekte nach Namen, damit auch im Raum-Buch die großen Sprites/Icons angezeigt werden
  const allRoomObjsByName = {};
  Object.keys(Engine.ROOM_OBJECTS).forEach(rk => {
    (Engine.ROOM_OBJECTS[rk] || []).forEach(ro => {
      if (ro.name && !allRoomObjsByName[ro.name]) {
        allRoomObjsByName[ro.name] = ro;
      }
    });
  });

  const renderItemCard = (item) => {
    const done = !!completed[item.id];
    const badgeColor = item.zielTabelle === "Aufgaben" ? "#ea580c" : "#0284c7";
    const matchedRo = allRoomObjsByName[item.name];
    const thumbUrl = matchedRo ? (matchedRo.spriteUrl || matchedRo.iconUrl) : "";
    const thumbHtml = thumbUrl
      ? `<img src="${thumbUrl}" class="room-book-thumb" alt="${item.name}" title="Große Objekt-Vorschau öffnen" style="cursor:pointer;" onclick="if('${matchedRo ? matchedRo.raum : ''}' && '${matchedRo ? matchedRo.id : ''}'){ closeModal('room-book-modal'); handleHotspotClick('${matchedRo ? matchedRo.raum : ''}', '${matchedRo ? matchedRo.id : ''}'); }">`
      : `<div class="room-book-thumb" style="display:flex; align-items:center; justify-content:center; font-size:26px;">${item.zielTabelle === "Aufgaben" ? "🧹" : "✨"}</div>`;
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; padding:8px 10px; border:1.5px solid ${done ? '#86efac' : '#fed7aa'}; background:${done ? '#f0fdf4' : '#ffffff'}; border-radius:10px; margin-bottom:6px;">
        ${thumbHtml}
        <div style="flex:1;">
          <div style="font-size:11px; font-weight:800; color:${badgeColor};">
            🪑 ${item.repraesentiertDurch} <span style="color:#94a3b8; font-weight:600;">(${item.zielTabelle}!${item.cellRef})</span>
          </div>
          <div style="font-size:13px; font-weight:700; color:#1e293b;">${done ? '✅ ' : ''}${item.name}</div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">
            +${item.xp} XP • +${item.mb} MB • +${item.gold || 0} Gold • +${item.ap || 0} AP
          </div>
        </div>
        <button class="top-btn" style="padding:6px 10px; font-size:12px;" onclick="completeCatalogEntry('${item.zielTabelle}', '${item.cellRef}', '${currentRoom}')">
          ${done ? 'Nochmal' : 'Erledigen'}
        </button>
      </div>
    `;
  };

  const aufHtml = catalog.aufgaben.length
    ? catalog.aufgaben.map(renderItemCard).join("")
    : `<div style="font-size:12px; color:#64748b; margin-bottom:8px;">Keine Haushalts-/Fokus-Aufgaben in diesem Raum.</div>`;

  const mbHtml = catalog.mbAktivitaeten.length
    ? catalog.mbAktivitaeten.map(renderItemCard).join("")
    : `<div style="font-size:12px; color:#64748b;">Keine MB-Aktivitäten in diesem Raum.</div>`;

  document.getElementById("room-book-body").innerHTML = `
    ${tabsHtml}
    <div style="font-weight:800; font-size:12px; color:#9a3412; margin:8px 0 4px;">🧹 AUFGABEN IM RAUM (${catalog.aufgaben.length}):</div>
    ${aufHtml}
    <div style="font-weight:800; font-size:12px; color:#0369a1; margin:12px 0 4px;">🧠 MB-AKTIVITÄTEN & ERHOLUNG IM RAUM (${catalog.mbAktivitaeten.length}):</div>
    ${mbHtml}
  `;

  openModal("room-book-modal");
}

function completeCatalogEntry(zielTabelle, cellRef, currentFilterRoom) {
  const cat = Engine.getRoomCatalog("Alle");
  const list = zielTabelle === "Aufgaben" ? cat.aufgaben : cat.mbAktivitaeten;
  const item = list.find(x => x.cellRef === cellRef);
  if (!item) return;

  Engine.completeObject(item);
  triggerExcitedAvatar();
  renderAll();
  openRoomBookModal(currentFilterRoom);
  showLootToast(`✅ "${item.name}" erledigt (+${item.xp} XP, +${item.gold || 0} G, +${item.mb} MB)`);
}


// --- 2b. DEZENTER LUPEN-HINWEIS FÜR OFFENE GEGENSTÄNDE (v0.31: Kein Dauer-Blinken mehr!) ---
let hintTimer = null;
function triggerObjectHints(durationMs = 2600) {
  const canvas = document.getElementById("room-canvas");
  const btn = document.getElementById("hint-magnifier-btn");
  if (!canvas) return;

  clearTimeout(hintTimer);
  canvas.classList.add("show-object-hints");
  if (btn) btn.classList.add("active-hint");

  hintTimer = setTimeout(() => {
    canvas.classList.remove("show-object-hints");
    if (btn) btn.classList.remove("active-hint");
  }, durationMs);
}

// Optional: Auch langes Gedrückthalten auf den Raum-Hintergrund zeigt kurz die offenen Objekte
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("room-canvas");
  if (!canvas) return;
  let pressTimer = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.target === canvas || e.target.id === "room-hotspots-layer") {
      pressTimer = setTimeout(() => triggerObjectHints(2600), 450);
    }
  });
  ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
    canvas.addEventListener(evt, () => clearTimeout(pressTimer));
  });
});



// ============================================================================
// 8. EINSTELLUNGEN, WOW-RING-ADDONS & ROBUSTER SWIPE-RAUMWECHSEL (v0.51)
// ============================================================================
function toggleMiniStatPill() {
  const s = Engine.getState();
  s.settings.miniStatPillCollapsed = !s.settings.miniStatPillCollapsed;
  Engine.saveState();
  renderAll();
}

function pulseMiniStatPill() {
  const pillEl = document.getElementById("mini-stat-pill");
  if (!pillEl) return;
  pillEl.classList.remove("pulse-loot");
  void pillEl.offsetWidth;
  pillEl.classList.add("pulse-loot");
}

function renderUiFrameOverlay(roomName) {
  const s = Engine.getState();
  const activeFrameId = (s.settings && s.settings.uiFrame) || "frame_1_wood_gold";
  const framesList = (Engine.ASSETS && Engine.ASSETS.uiFrames) || [];
  const frameObj = framesList.find(f => f.id === activeFrameId) || framesList[0];

  const overlayEl = document.getElementById("ui-frame-overlay");
  if (overlayEl) {
    if (frameObj && frameObj.overlayUrl) {
      overlayEl.style.backgroundImage = `url('${frameObj.overlayUrl}')`;
      overlayEl.style.opacity = "1";
    } else {
      overlayEl.style.backgroundImage = "none";
      overlayEl.style.opacity = "0";
    }
  }

  // UI-Upgrade 2: Smart-Badge oben rechts (Raumname + Erledigt-Zähler + Putz-Bonus nur in den 5 Wohnräumen mit Müll-Logik)
  const badgeEl = document.getElementById("ui-frame-room-badge");
  if (badgeEl) {
    const rName = roomName || (s.settings && s.settings.currentRoom) || "Dashboard";
    const roomMeta = (Engine.ROOMS || []).find(r => r.id === rName);
    const rIcon = roomMeta ? roomMeta.icon : "🏠";
    const displayRoom = rName;
    const showBadge = (frameObj && frameObj.showRoomBadge) || (s.settings && s.settings.showRoomBadgeOnFrame);

    // Zähle heute erledigte Quests im aktuellen Raum
    const roomObjs = (Engine.ROOM_OBJECTS[rName] || []).filter(o => !o.isMapDoor && !o.isShopTrigger);
    const completed = s.completedToday || {};
    const doneCount = roomObjs.filter(o => !!completed[o.id]).length;
    const totalCount = roomObjs.length;

    // Prüfe, ob dieser Raum überhaupt die Müll-Logik nutzt (Dashboard & Kinderzimmer haben keine Müll-Logik!)
    const hasDirtLogic = Engine.isRoomDirtEnabled ? Engine.isRoomDirtEnabled(rName) : false;
    let dirtPillHtml = "";
    if (hasDirtLogic) {
      const dirtLvl = Engine.getRoomDirtLevel ? Engine.getRoomDirtLevel(rName) : 0;
      const mult = Engine.getDirtMultiplier ? Engine.getDirtMultiplier(dirtLvl) : 1.0;
      if (dirtLvl === 0) {
        dirtPillHtml = `<span class="smart-badge-dirt-pill" style="background:#0284c7;" onclick="event.stopPropagation(); showLootToast('✨ ${displayRoom} ist blitzblank (Stufe 0)!');" title="Raum ist sauber">✨ Sauber</span>`;
      } else {
        const bgCol = dirtLvl === 1 ? "#16a34a" : (dirtLvl === 2 ? "#ea580c" : "#dc2626");
        const toolIcon = dirtLvl === 3 ? "🔌" : "🧹";
        dirtPillHtml = `<span class="smart-badge-dirt-pill" style="background:${bgCol};" onclick="event.stopPropagation(); handleHotspotClick('${rName}', 'CLEAN_DYNAMIC_${rName}');" title="Direkt aufräumen mit Multiplikator x${mult.toFixed(1)}!">${toolIcon} x${mult.toFixed(1)}</span>`;
      }
    }

    const timePhase = Engine.getActiveTimePhase ? Engine.getActiveTimePhase() : { icon: "☀️", label: "Tageslicht", shortLabel: "Tag", isAuto: true };
    const timePillHtml = `<span class="smart-badge-time-pill" onclick="event.stopPropagation(); cycleTimeOfDayMode();" title="Tageszeit-Licht: ${timePhase.label} (${timePhase.isAuto ? 'Automatisch nach Uhrzeit' : 'Manuell fixiert'} – Antippen zum Durchschalten)">${timePhase.icon}</span>`;

    if (showBadge) {
      badgeEl.innerHTML = `
        <span class="smart-badge-room-btn" onclick="openMapModal()" title="Wohnungs-Grundriss öffnen">
          ${rIcon} ${displayRoom}
          <span class="smart-badge-count">${doneCount}/${totalCount} ✓</span>
        </span>
        ${timePillHtml}
        ${dirtPillHtml}
      `;
      badgeEl.classList.remove("hidden");
    } else {
      badgeEl.classList.add("hidden");
    }
  }

  // UI-Upgrade 3: Unteres 7-Raum-Schnell-Dock rendern
  renderBottomRoomDock(roomName);
}

function renderBottomRoomDock(roomName) {
  const dockEl = document.getElementById("bottom-room-dock");
  if (!dockEl) return;
  const s = Engine.getState();
  if (s.settings && s.settings.showBottomRoomDock === false) {
    dockEl.classList.add("hidden");
    return;
  }
  dockEl.classList.remove("hidden");

  const currentRoom = roomName || (s.settings && s.settings.currentRoom) || "Dashboard";
  const orderedRooms = [
    { id: "Flur",         icon: "🚪", label: "Flur" },
    { id: "Dashboard",    icon: "🏠", label: "Dashboard" },
    { id: "Wohnzimmer",   icon: "🛋️", label: "Wohnzimmer" },
    { id: "Küche",        icon: "🍳", label: "Küche" },
    { id: "Badezimmer",   icon: "🚿", label: "Badezimmer" },
    { id: "Schlafzimmer", icon: "🛏️", label: "Schlafzimmer" },
    { id: "Kinderzimmer", icon: "🦄", label: "Kinderzimmer" }
  ];

  dockEl.innerHTML = orderedRooms.map(r => {
    const isAct = r.id === currentRoom;
    const hasDirt = Engine.isRoomDirtEnabled ? Engine.isRoomDirtEnabled(r.id) : false;
    const dLvl = (hasDirt && Engine.getRoomDirtLevel) ? Engine.getRoomDirtLevel(r.id) : 0;
    const dotCol = dLvl === 1 ? "#22c55e" : (dLvl === 2 ? "#f97316" : (dLvl === 3 ? "#ef4444" : ""));
    const dotHtml = dLvl > 0 ? `<span class="dock-dirt-dot" style="background:${dotCol};"></span>` : "";
    return `
      <button class="dock-room-btn ${isAct ? 'active-dock-room' : ''}"
              onclick="event.stopPropagation(); selectRoom('${r.id}');"
              title="${r.label}${hasDirt ? (dLvl > 0 ? ' (Putz-Stufe ' + dLvl + ')' : ' (Sauber)') : ''}">
        ${r.icon}
        ${dotHtml}
      </button>
    `;
  }).join("");
}

// ============================================================================
// ROBUSTER HORIZONTALER SWIPE-RAUMWECHSEL (TOUCH + POINTER/MAUS + KEYBOARD)
// ============================================================================
const SWIPE_ROOM_ORDER = ["Flur", "Dashboard", "Wohnzimmer", "Küche", "Badezimmer", "Schlafzimmer", "Kinderzimmer"];
let lastSwipeTimestamp = 0;

function cycleRoomBySwipe(direction) {
  const now = Date.now();
  if (now - lastSwipeTimestamp < 220) return; // Entprellung gegen Doppel-Auslösung (Touch + Pointer)
  lastSwipeTimestamp = now;

  // Nicht swipen, falls gerade ein Modal geöffnet ist oder der PC-Entwicklermodus aktiv ist
  if (document.querySelector(".modal-backdrop.active")) return;
  if (typeof isDevMode !== "undefined" && isDevMode) return;

  const s = Engine.getState();
  const cur = (s.settings && s.settings.currentRoom) || "Dashboard";
  const idx = SWIPE_ROOM_ORDER.indexOf(cur);
  const nextIdx = (idx + direction + SWIPE_ROOM_ORDER.length) % SWIPE_ROOM_ORDER.length;
  const nextRoom = SWIPE_ROOM_ORDER[nextIdx];
  selectRoom(nextRoom);
  showLootToast(`⇄ Raumwechsel: ${nextRoom}`);
}

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("room-canvas");
  if (!canvas) return;

  let startX = null;
  let startY = null;
  let swipeWasTriggered = false;

  // Verhindert, dass ein Wischen, das zufällig auf einem Sprite beginnt, beim Loslassen das Klick-Modal öffnet
  canvas.addEventListener("click", (e) => {
    if (swipeWasTriggered) {
      e.stopPropagation();
      e.preventDefault();
      swipeWasTriggered = false;
    }
  }, true);

  // Verhindert das native Ziehen (Drag-Ghost) von Sprite-Bildern auf Desktop/Mobile
  canvas.addEventListener("dragstart", (e) => e.preventDefault());

  // 1. Native Touch-Events für Smartphones (Samsung Internet / Chrome Mobile)
  canvas.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    swipeWasTriggered = false;
  }, { passive: true });

  canvas.addEventListener("touchend", (e) => {
    if (startX === null || startY === null || !e.changedTouches || !e.changedTouches.length) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    startX = null;
    startY = null;

    if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      swipeWasTriggered = true;
      cycleRoomBySwipe(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  // 2. Pointer-Events für Maus-Drag am PC & Stifteingabe
  let ptrStartX = null;
  let ptrStartY = null;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return; // Touch wird bereits über touchstart/touchend abgewickelt
    ptrStartX = e.clientX;
    ptrStartY = e.clientY;
    swipeWasTriggered = false;
  });

  window.addEventListener("pointerup", (e) => {
    if (e.pointerType === "touch" || ptrStartX === null || ptrStartY === null) return;
    const dx = e.clientX - ptrStartX;
    const dy = e.clientY - ptrStartY;
    ptrStartX = null;
    ptrStartY = null;

    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.25) {
      swipeWasTriggered = true;
      cycleRoomBySwipe(dx < 0 ? 1 : -1);
    }
  });

  // 3. Bonus: Pfeiltasten Links/Rechts auf der Tastatur wechseln im Spielmodus den Raum (im Dev-Modus steuern sie das Feintuning!)
  window.addEventListener("keydown", (e) => {
    if (document.querySelector(".modal-backdrop.active")) return;
    if (typeof isDevMode !== "undefined" && isDevMode) return;
    if (e.key === "ArrowLeft") cycleRoomBySwipe(-1);
    if (e.key === "ArrowRight") cycleRoomBySwipe(1);
  });
});

function openSettingsModal() {
  const s = Engine.getState();
  const activeFrameId = (s.settings && s.settings.uiFrame) || "frame_1_wood_gold";
  const showRoomBadge = !!(s.settings && s.settings.showRoomBadgeOnFrame);
  const showDock = s.settings ? (s.settings.showBottomRoomDock !== false) : true;
  const useBadge = !!(s.settings && s.settings.useProfileBadgeInHud);
  const liveSync = !!(s.settings && s.settings.liveSheetSync);
  const currentRoom = (s.settings && s.settings.currentRoom) || "Dashboard";
  const hasDirtLogic = Engine.isRoomDirtEnabled ? Engine.isRoomDirtEnabled(currentRoom) : false;
  const dirtLvl = Engine.getRoomDirtLevel ? Engine.getRoomDirtLevel(currentRoom) : 0;
  const mult = Engine.getDirtMultiplier ? Engine.getDirtMultiplier(dirtLvl) : 1.0;

  const framesList = (Engine.ASSETS && Engine.ASSETS.uiFrames) || [];
  const bgPreviewUrl = Engine.ASSETS.backgrounds[currentRoom] || "assets/bg_livingroom_me.jpg";

  const framesHtml = framesList.map(f => {
    const isSel = f.id === activeFrameId;
    const thumbStyle = f.overlayUrl
      ? `background-image: url('${f.overlayUrl}'), url('${bgPreviewUrl}'); background-size: 100% 100%, cover; background-position: center;`
      : `background-image: url('${bgPreviewUrl}'); background-size: cover; background-position: center;`;
    return `
      <div class="settings-option-card ${isSel ? 'active-frame' : ''}" onclick="selectUiFrame('${f.id}')">
        <div class="settings-frame-thumb" style="${thumbStyle}"></div>
        <div style="flex:1;">
          <div style="font-size:13px; font-weight:800; color:#1e293b;">
            ${isSel ? '✅ ' : '🖼️ '}${f.label}
          </div>
          <div style="font-size:11px; color:#64748b; margin-top:2px;">
            ${f.desc}
          </div>
        </div>
      </div>
    `;
  }).join("");

  const dirtSettingsSectionHtml = hasDirtLogic
    ? `
      <div style="background:#fefce8; border:2px solid #facc15; border-radius:14px; padding:12px; margin-bottom:12px;">
        <div style="font-weight:900; font-size:13px; color:#854d0e; margin-bottom:6px;">
          🧹 2. RAUM-VERSCHMUTZUNG & PUTZ-MULTIPLIKATOR (${currentRoom}: Stufe ${dirtLvl} • x${mult.toFixed(1)}):
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px; ${dirtLvl === 0 ? 'background:#eab308; color:#fff;' : ''}" onclick="setCurrentRoomDirtFromSettings(0)">✨ Stufe 0: Sauber (x1.0)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px; ${dirtLvl === 1 ? 'background:#16a34a; color:#fff;' : ''}" onclick="setCurrentRoomDirtFromSettings(1)">🧹 Stufe 1: Besen (x2.0!)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px; ${dirtLvl === 2 ? 'background:#ea580c; color:#fff;' : ''}" onclick="setCurrentRoomDirtFromSettings(2)">🧹 Stufe 2: Kehrset (x1.7)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 9px; ${dirtLvl === 3 ? 'background:#dc2626; color:#fff;' : ''}" onclick="setCurrentRoomDirtFromSettings(3)">🔌 Stufe 3: Sauger (x1.4)</button>
        </div>
      </div>`
    : `
      <div style="background:#f0fdf4; border:1.5px solid #86efac; border-radius:14px; padding:10px 12px; margin-bottom:12px; font-size:12px; color:#166534; font-weight:700;">
        ✨ <strong>2. Raum-Zustand (${currentRoom}):</strong> Für das Dashboard und das Kinderzimmer ist die Müll-Logik deaktiviert (immer sauber!).
      </div>`;

  const body = document.getElementById("settings-modal-body");
  if (body) {
    body.innerHTML = `
      <div style="background:#fff7ed; border:2px solid #fed7aa; border-radius:14px; padding:12px; margin-bottom:12px;">
        <div style="font-weight:900; font-size:13px; color:#9a3412; margin-bottom:8px;">
          🖼️ 1. UI-UMRAHMUNG FÜR DIE HINTERGRUNDBILDER WÄHLEN:
        </div>
        ${framesHtml}
        <div style="margin-top:8px; display:flex; justify-content:space-between; align-items:center; padding-top:8px; border-top:1px dashed #fdba74;">
          <span style="font-size:12px; font-weight:700; color:#475569;">🏷️ Smart-Raum-Plakette oben rechts</span>
          <button class="secondary-btn" style="font-size:11px; padding:4px 10px; ${showRoomBadge ? 'background:#ff7a00; color:#fff; border-color:#ea580c;' : ''}" onclick="toggleRoomBadgeSetting()">
            ${showRoomBadge ? 'Ein' : 'Aus'}
          </button>
        </div>
        <div style="margin-top:6px; display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:12px; font-weight:700; color:#475569;">🧭 1-Tap Raum-Dock am unteren Rand</span>
          <button class="secondary-btn" style="font-size:11px; padding:4px 10px; ${showDock ? 'background:#ff7a00; color:#fff; border-color:#ea580c;' : ''}" onclick="toggleBottomDockSetting()">
            ${showDock ? 'Ein' : 'Aus'}
          </button>
        </div>
      </div>

      ${dirtSettingsSectionHtml}

      <div style="background:#eef2ff; border:2px solid #a5b4fc; border-radius:14px; padding:12px; margin-bottom:12px;">
        <div style="font-weight:900; font-size:13px; color:#312e81; margin-bottom:6px;">
          🌅 3. TAGESZEITEN-LICHTWECHSEL (${Engine.getActiveTimePhase ? Engine.getActiveTimePhase().label : "Aktiv"}):
        </div>
        <div style="font-size:11px; color:#4338ca; margin-bottom:8px;">
          Passt Lichtstimmung, Abendsonne & warmen Lampen-/Kerzenschein automatisch an die echte Uhrzeit an (oder manuell zum Testen):
        </div>
        <div style="display:flex; gap:5px; flex-wrap:wrap;">
          <button class="secondary-btn" style="font-size:11px; padding:5px 8px; ${((s.settings && s.settings.timeOfDayMode) || 'auto') === 'auto' ? 'background:#4f46e5; color:#fff; border-color:#4338ca;' : ''}" onclick="setTimeOfDayMode('auto')">🕒 Auto (Echtzeit)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 8px; ${(s.settings && s.settings.timeOfDayMode) === 'morning' ? 'background:#0284c7; color:#fff; border-color:#0369a1;' : ''}" onclick="setTimeOfDayMode('morning')">🌅 Morgen (5–9h)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 8px; ${(s.settings && s.settings.timeOfDayMode) === 'day' ? 'background:#eab308; color:#fff; border-color:#ca8a04;' : ''}" onclick="setTimeOfDayMode('day')">☀️ Tag (9–17h)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 8px; ${(s.settings && s.settings.timeOfDayMode) === 'golden' ? 'background:#ea580c; color:#fff; border-color:#c2410c;' : ''}" onclick="setTimeOfDayMode('golden')">🌇 Golden Hour (17–21h)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 8px; ${(s.settings && s.settings.timeOfDayMode) === 'night' ? 'background:#1e1b4b; color:#fde047; border-color:#312e81;' : ''}" onclick="setTimeOfDayMode('night')">🌙 Nacht + Lampen (ab 21h)</button>
          <button class="secondary-btn" style="font-size:11px; padding:5px 8px; ${(s.settings && s.settings.timeOfDayMode) === 'off' ? 'background:#64748b; color:#fff;' : ''}" onclick="setTimeOfDayMode('off')">⚪ Aus</button>
        </div>
      </div>

      <div style="background:#f8fafc; border:1.5px solid #cbd5e1; border-radius:14px; padding:12px;">
        <div style="font-weight:900; font-size:13px; color:#1e293b; margin-bottom:8px;">
          ⚡ 4. HUD, TAGES-INTRO & GOOGLE-SHEET-SYNC:
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-size:12px; font-weight:700; color:#475569;">🧢 Avatar-Modus oben links</span>
          <button class="secondary-btn" style="font-size:11px; padding:4px 10px;" onclick="toggleHudProfileBadge(); openSettingsModal();">
            ${useBadge ? 'Festes Idle-Porträt' : 'Dynamische MB%-States'}
          </button>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <span style="font-size:12px; font-weight:700; color:#475569;">☁️ Live Google-Sheet-Synchronisation</span>
          <button class="secondary-btn" style="font-size:11px; padding:4px 10px; ${liveSync ? 'background:#16a34a; color:#fff; border-color:#15803d;' : ''}" onclick="toggleLiveSheetSync()">
            ${liveSync ? 'Aktiv' : 'Pausiert'}
          </button>
        </div>
        <div style="display:flex; gap:6px; flex-wrap:wrap; padding-top:6px; border-top:1px solid #e2e8f0;">
          <button class="secondary-btn" style="font-size:11px;" onclick="closeModal('settings-modal'); replayDailyIntro();">🎬 5s-Intro abspielen</button>
          <button class="secondary-btn" style="font-size:11px;" onclick="manualSheetSync()">🔄 Jetzt mit Sheet syncen</button>
          <button class="secondary-btn" style="font-size:11px;" onclick="Engine.exportBackup()">💾 JSON-Backup</button>
        </div>
      </div>
    `;
  }
  openModal("settings-modal");
}

function selectUiFrame(frameId) {
  const s = Engine.getState();
  s.settings.uiFrame = frameId;
  if (frameId === "frame_3_comic_ink") {
    s.settings.showRoomBadgeOnFrame = true;
  }
  Engine.saveState();
  renderAll();
  openSettingsModal();
  const fObj = (Engine.ASSETS.uiFrames || []).find(f => f.id === frameId);
  if (fObj) {
    showLootToast(`🖼️ ${fObj.label} aktiviert!`);
  }
}

function toggleRoomBadgeSetting() {
  const s = Engine.getState();
  s.settings.showRoomBadgeOnFrame = !s.settings.showRoomBadgeOnFrame;
  Engine.saveState();
  renderAll();
  openSettingsModal();
}

function toggleBottomDockSetting() {
  const s = Engine.getState();
  s.settings.showBottomRoomDock = s.settings.showBottomRoomDock === false ? true : false;
  Engine.saveState();
  renderAll();
  openSettingsModal();
}

function setCurrentRoomDirtFromSettings(level) {
  const rName = Engine.getState().settings.currentRoom || "Flur";
  Engine.setRoomDirtLevel(rName, level);
  renderAll();
  openSettingsModal();
  showLootToast(`🧹 ${rName}: Verschmutzungs-Stufe ${level} gesetzt!`);
}

function toggleLiveSheetSync() {
  const s = Engine.getState();
  s.settings.liveSheetSync = !s.settings.liveSheetSync;
  Engine.saveState();
  openSettingsModal();
  showLootToast(s.settings.liveSheetSync ? "☁️ Live Sheet-Sync aktiviert!" : "⏸️ Live Sheet-Sync pausiert.");
}



// ============================================================================
// 9. VERSTECKTER PC-ENTWICKLERMODUS (NUR PER TASTENKOMBINATION AM PC: Strg+Shift+D oder Alt+D)
// ============================================================================
let isDevMode = false;
let devSelectedId = null;
let devDragState = null;

function getEditableObjectsForCurrentRoom() {
  const s = Engine.getState();
  const rName = (s.settings && s.settings.currentRoom) || "Dashboard";
  const list = [...(Engine.ROOM_OBJECTS[rName] || [])];
  const dynClean = getDynamicCleaningObject(rName);
  if (dynClean) list.push(dynClean);
  if (rName === "Dashboard" && Engine.getTop3FrequentActivities) {
    Engine.getTop3FrequentActivities().forEach(p => {
      list.push({
        id: `POSTIT_SLOT_${p.slotNr}`,
        raum: "Dashboard",
        name: `Post-it #${p.slotNr} (${p.name})`,
        leftPct: p.leftPct,
        topPct: p.topPct,
        widthPct: p.widthPct,
        heightPct: p.heightPct,
        zIndex: p.zIndex || 22,
        rotDeg: p.rotDeg || 0,
        isPostitSlot: true
      });
    });
  }
  return list;
}

function getSelectedDevObject() {
  if (!devSelectedId) return null;
  return getEditableObjectsForCurrentRoom().find(o => o.id === devSelectedId) || null;
}

function toggleDevMode(forceState) {
  isDevMode = typeof forceState === "boolean" ? forceState : !isDevMode;
  const canvas = document.getElementById("room-canvas");
  const bar = document.getElementById("dev-inspector-bar");
  if (canvas) {
    canvas.classList.toggle("dev-mode-active", isDevMode);
  }
  if (isDevMode) {
    const objs = getEditableObjectsForCurrentRoom();
    if (!devSelectedId || !objs.some(o => o.id === devSelectedId)) {
      devSelectedId = objs.length ? objs[0].id : null;
    }
    renderAll();
    renderDevInspector();
    showLootToast("🛠️ PC-Entwicklermodus AKTIV (Strg+Shift+D oder Alt+D zum Beenden)");
  } else {
    devSelectedId = null;
    if (bar) bar.classList.add("hidden");
    renderAll();
    showLootToast("🎮 Normaler Spielmodus wieder aktiv!");
  }
}

function selectDevObject(objId) {
  devSelectedId = objId;
  renderAll();
  renderDevInspector();
}

function renderDevInspector() {
  const bar = document.getElementById("dev-inspector-bar");
  if (!bar) return;
  if (!isDevMode) {
    bar.classList.add("hidden");
    return;
  }
  bar.classList.remove("hidden");

  const obj = getSelectedDevObject();
  const rName = (Engine.getState().settings && Engine.getState().settings.currentRoom) || "Dashboard";

  if (!obj) {
    bar.innerHTML = `
      <div class="dev-header-row">
        <span class="dev-obj-title">🛠️ Dev-Editor (${rName}): Objekt anklicken!</span>
        <button class="dev-mini-btn warn" onclick="toggleDevMode(false)">✕ Beenden</button>
      </div>
    `;
    return;
  }

  const l = Number(obj.leftPct || 0).toFixed(2);
  const t = Number(obj.topPct || 0).toFixed(2);
  const w = Number(obj.widthPct || 10).toFixed(2);
  const h = Number(obj.heightPct || 10).toFixed(2);
  const z = Number(obj.zIndex || 12);
  const rot = Number(obj.rotDeg || 0).toFixed(1);

  bar.innerHTML = `
    <div class="dev-header-row">
      <span class="dev-obj-title" title="${obj.id}: ${obj.name}">🛠️ [${obj.id}] ${obj.name}</span>
      <button class="dev-mini-btn warn" onclick="toggleDevMode(false)" title="Entwicklermodus schließen (Alt+D)">✕ Beenden</button>
    </div>
    <div class="dev-coords-readout">
      left: <strong>${l}%</strong> | top: <strong>${t}%</strong> | width: <strong>${w}%</strong> | height: <strong>${h}%</strong> | z: <strong>${z}</strong> | rot: <strong>${rot}°</strong>
    </div>
    <div class="dev-btn-row">
      <button class="dev-mini-btn" onclick="nudgeDevObject(-0.2, 0)" title="Links (Pfeiltaste Links)">◀</button>
      <button class="dev-mini-btn" onclick="nudgeDevObject(0, -0.2)" title="Hoch (Pfeiltaste Hoch)">▲</button>
      <button class="dev-mini-btn" onclick="nudgeDevObject(0, 0.2)" title="Runter (Pfeiltaste Runter)">▼</button>
      <button class="dev-mini-btn" onclick="nudgeDevObject(0.2, 0)" title="Rechts (Pfeiltaste Rechts)">▶</button>
      <button class="dev-mini-btn" onclick="scaleDevObject(1.04)" title="Größer skalieren (+4% / Mausrad hoch)">🔍+</button>
      <button class="dev-mini-btn" onclick="scaleDevObject(0.96)" title="Kleiner skalieren (-4% / Mausrad runter)">🔍-</button>
      <button class="dev-mini-btn" onclick="rotateDevObject(-1.5)" title="Gegen Uhrzeigersinn drehen">↺</button>
      <button class="dev-mini-btn" onclick="rotateDevObject(1.5)" title="Im Uhrzeigersinn drehen">↻</button>
      <button class="dev-mini-btn" onclick="changeDevZIndex(1)" title="Ebene nach vorne (Z-Index +1)">Ebene ▲</button>
      <button class="dev-mini-btn" onclick="changeDevZIndex(-1)" title="Ebene nach hinten (Z-Index -1)">Ebene ▼</button>
    </div>
    <div class="dev-btn-row" style="margin-bottom:0;">
      <button class="dev-mini-btn accent" onclick="copyDevRoomJson()" title="Koordinaten dieses Raums als JSON/JS in die Zwischenablage kopieren">📋 Raum-Coords kopieren</button>
      <button class="dev-mini-btn" onclick="resetSelectedDevObject()" title="Nur dieses Objekt auf Werkseinstellung zurücksetzen">🔄 Objekt-Reset</button>
      <button class="dev-mini-btn warn" onclick="resetCurrentRoomDevLayout()" title="Alle Objekte im Raum auf Werkseinstellung zurücksetzen">🗑️ Raum-Reset</button>
    </div>
  `;
}

function round2(val) {
  return Math.round(Number(val) * 100) / 100;
}

function nudgeDevObject(dxPct, dyPct) {
  const obj = getSelectedDevObject();
  if (!obj) return;
  const newLeft = round2((Number(obj.leftPct) || 0) + dxPct);
  const newTop = round2((Number(obj.topPct) || 0) + dyPct);
  Engine.updateObjectLayout(obj.id, { leftPct: newLeft, topPct: newTop });
  renderAll();
  renderDevInspector();
}

function scaleDevObject(factor) {
  const obj = getSelectedDevObject();
  if (!obj) return;
  const oldW = Number(obj.widthPct) || 15;
  const oldH = Number(obj.heightPct) || 15;
  const newW = Math.max(2, round2(oldW * factor));
  const newH = Math.max(2, round2(oldH * factor));
  // Zentriert skalieren
  const newLeft = round2((Number(obj.leftPct) || 0) - (newW - oldW) / 2);
  const newTop = round2((Number(obj.topPct) || 0) - (newH - oldH) / 2);
  Engine.updateObjectLayout(obj.id, {
    leftPct: newLeft,
    topPct: newTop,
    widthPct: newW,
    heightPct: newH
  });
  renderAll();
  renderDevInspector();
}

function rotateDevObject(deltaDeg) {
  const obj = getSelectedDevObject();
  if (!obj) return;
  const newRot = Math.round(((Number(obj.rotDeg) || 0) + deltaDeg) * 10) / 10;
  Engine.updateObjectLayout(obj.id, { rotDeg: newRot });
  renderAll();
  renderDevInspector();
}

function changeDevZIndex(deltaZ) {
  const obj = getSelectedDevObject();
  if (!obj) return;
  const newZ = Math.max(1, Math.min(50, (Number(obj.zIndex) || 12) + deltaZ));
  Engine.updateObjectLayout(obj.id, { zIndex: newZ });
  renderAll();
  renderDevInspector();
}

function resetSelectedDevObject() {
  const obj = getSelectedDevObject();
  if (!obj) return;
  Engine.resetObjectLayout(obj.id);
  renderAll();
  renderDevInspector();
  showLootToast(`🔄 "${obj.name}" auf Original-Position zurückgesetzt!`);
}

function resetCurrentRoomDevLayout() {
  const rName = (Engine.getState().settings && Engine.getState().settings.currentRoom) || "Dashboard";
  Engine.resetRoomLayout(rName);
  renderAll();
  renderDevInspector();
  showLootToast(`🗑️ Raum "${rName}" komplett auf Werks-Layout zurückgesetzt!`);
}

function copyDevRoomJson() {
  const rName = (Engine.getState().settings && Engine.getState().settings.currentRoom) || "Dashboard";
  const codeStr = Engine.exportRoomLayoutCode(rName);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(codeStr).then(() => {
      showLootToast(`📋 Koordinaten für "${rName}" in die Zwischenablage kopiert!`);
    }).catch(() => {
      prompt("Koordinaten kopieren (Strg+C):", codeStr);
    });
  } else {
    prompt("Koordinaten kopieren (Strg+C):", codeStr);
  }
}

// PC-Tastatur-Steuerung & Maus-Drag-Handler für den Entwicklermodus
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("room-canvas");
  if (!canvas) return;

  // 1. AUSSCHLIESSLICH PC-Tastenkombination: Strg + Shift + D oder Alt + D (bzw. F2)
  window.addEventListener("keydown", (e) => {
    const isCtrlShiftD = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "D" || e.key === "d");
    const isAltD = e.altKey && (e.key === "d" || e.key === "D");
    if (isCtrlShiftD || isAltD) {
      e.preventDefault();
      toggleDevMode();
      return;
    }

    if (!isDevMode) return;

    // Escape beendet den Entwicklermodus
    if (e.key === "Escape") {
      e.preventDefault();
      toggleDevMode(false);
      return;
    }

    // Im aktiven Entwicklermodus: Pfeiltasten verschieben das markierte Objekt um 0.1% (mit Shift um 1.0%)
    const step = e.shiftKey ? 1.0 : 0.1;
    if (e.key === "ArrowLeft")  { e.preventDefault(); nudgeDevObject(-step, 0); }
    if (e.key === "ArrowRight") { e.preventDefault(); nudgeDevObject(step, 0); }
    if (e.key === "ArrowUp")    { e.preventDefault(); nudgeDevObject(0, -step); }
    if (e.key === "ArrowDown")  { e.preventDefault(); nudgeDevObject(0, step); }
    if (e.key === "+" || e.key === "=") { e.preventDefault(); scaleDevObject(1.03); }
    if (e.key === "-")                  { e.preventDefault(); scaleDevObject(0.97); }
  });

  // 2. Freies Ziehen (Drag & Drop) mit der Maus im aktiven Entwicklermodus
  canvas.addEventListener("pointerdown", (e) => {
    if (!isDevMode) return;
    // Ignoriere Klicks auf die Dev-Inspektor-Leiste selbst
    if (e.target.closest("#dev-inspector-bar") || e.target.closest("#bottom-room-dock") || e.target.closest(".floating-avatar-hud")) {
      return;
    }
    const hotspotEl = e.target.closest("[data-dev-id]");
    if (!hotspotEl) return;

    e.preventDefault();
    e.stopPropagation();
    const objId = hotspotEl.getAttribute("data-dev-id");
    devSelectedId = objId;
    const obj = getSelectedDevObject();
    if (!obj) return;

    const rect = canvas.getBoundingClientRect();
    devDragState = {
      id: objId,
      el: hotspotEl,
      startX: e.clientX,
      startY: e.clientY,
      origLeft: Number(obj.leftPct) || 0,
      origTop: Number(obj.topPct) || 0,
      canvasW: rect.width || 390,
      canvasH: rect.height || 844
    };

    document.querySelectorAll(".dev-selected-object").forEach(el => el.classList.remove("dev-selected-object"));
    hotspotEl.classList.add("dev-selected-object");
    renderDevInspector();
  });

  window.addEventListener("pointermove", (e) => {
    if (!isDevMode || !devDragState) return;
    const dxPx = e.clientX - devDragState.startX;
    const dyPx = e.clientY - devDragState.startY;
    const newLeft = round2(devDragState.origLeft + (dxPx / devDragState.canvasW) * 100);
    const newTop = round2(devDragState.origTop + (dyPx / devDragState.canvasH) * 100);

    // Direktes Live-Update im DOM für butterweiches 60fps Ziehen
    if (devDragState.el) {
      devDragState.el.style.left = `${newLeft}%`;
      devDragState.el.style.top = `${newTop}%`;
    }
    Engine.updateObjectLayout(devDragState.id, { leftPct: newLeft, topPct: newTop });
    renderDevInspector();
  });

  window.addEventListener("pointerup", () => {
    if (!isDevMode || !devDragState) return;
    devDragState = null;
    renderAll();
    renderDevInspector();
  });

  // 3. Mausrad-Skalierung (Wheel) auf dem ausgewählten Objekt im Entwicklermodus
  canvas.addEventListener("wheel", (e) => {
    if (!isDevMode || !devSelectedId) return;
    if (e.target.closest("#dev-inspector-bar")) return;
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.03 : 0.97;
    scaleDevObject(factor);
  }, { passive: false });
});



// ============================================================================
// 10. AUTOMATISCHER TAGESZEITEN-LICHTWECHSEL & WARMER LAMPEN-/KERZENSCHEIN (v0.54)
// ============================================================================
function renderAmbientLighting(roomName) {
  const canvas = document.getElementById("room-canvas");
  const ambientEl = document.getElementById("ambient-lighting-layer");
  if (!canvas || !ambientEl || !Engine.getActiveTimePhase) return;

  const rName = roomName || (Engine.getState().settings && Engine.getState().settings.currentRoom) || "Dashboard";
  const phase = Engine.getActiveTimePhase();

  // Entferne alte Phasen-Klassen
  ["time-phase-morning", "time-phase-day", "time-phase-golden", "time-phase-night"].forEach(cls => {
    canvas.classList.remove(cls);
  });
  ["phase-morning", "phase-day", "phase-golden", "phase-night"].forEach(cls => {
    ambientEl.classList.remove(cls);
  });

  if (phase.id === "off" || phase.id === "day") {
    canvas.classList.add("time-phase-day");
    ambientEl.classList.add("phase-day");
    ambientEl.innerHTML = "";
    return;
  }

  canvas.classList.add(`time-phase-${phase.id}`);
  ambientEl.classList.add(`phase-${phase.id}`);

  // In der Golden Hour (dezent, 55% Intensität) und vor allem im Nachtlicht (ab 21 Uhr, 100% Intensität)
  // leuchten die raumspezifischen Hängelampen, Kronleuchter, Schreibtischlampen und Kerzen warm auf!
  if (phase.id === "night" || phase.id === "golden") {
    const glows = (Engine.ASSETS.roomLampGlows && Engine.ASSETS.roomLampGlows[rName]) || [];
    const scaleAlpha = phase.id === "golden" ? 0.55 : 1.0;
    ambientEl.innerHTML = glows.map(g => {
      const flickerCls = g.flicker ? "candle-flicker" : "";
      return `
        <div class="room-lamp-glow ${flickerCls}"
             style="left: ${g.cx}%; top: ${g.cy}%; width: ${g.rx * 2.2}%; height: ${g.ry * 2.2}%; opacity: ${scaleAlpha}; background: radial-gradient(circle, ${g.color} 0%, rgba(255, 160, 40, 0.18) 52%, transparent 76%);">
        </div>
      `;
    }).join("");
  } else {
    ambientEl.innerHTML = "";
  }
}

function setTimeOfDayMode(mode) {
  const s = Engine.getState();
  s.settings.timeOfDayMode = mode;
  Engine.saveState();
  renderAll();
  if (document.getElementById("settings-modal").classList.contains("active")) {
    openSettingsModal();
  }
  const phase = Engine.getActiveTimePhase();
  showLootToast(`${phase.icon} Lichtstimmung: ${phase.label} (${mode === 'auto' ? 'Auto nach Uhrzeit' : 'Manuell'})`);
}

function cycleTimeOfDayMode() {
  const order = ["auto", "morning", "day", "golden", "night", "off"];
  const s = Engine.getState();
  const cur = (s.settings && s.settings.timeOfDayMode) || "auto";
  const next = order[(order.indexOf(cur) + 1) % order.length];
  setTimeOfDayMode(next);
}

// Prüft jede Minute automatisch, ob ein Tageszeiten-Wechsel (z. B. 17:00 Golden Hour oder 21:00 Nachtlicht) ansteht
setInterval(() => {
  const s = Engine.getState();
  if (!s.settings || s.settings.timeOfDayMode === "auto") {
    const rName = (s.settings && s.settings.currentRoom) || "Dashboard";
    renderAmbientLighting(rName);
  }
}, 60000);
