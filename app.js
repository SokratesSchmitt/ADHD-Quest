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

function getAvatarFrameUrl() {
  const s = Engine.getState();
  if (s.settings && s.settings.useProfileBadgeInHud && !isExcitedOverride && !pinnedStateId) {
    return Engine.PLAYER_DESIGN_REF.profileRef;
  }
  const st = getActivePlayerStateObj();
  return st ? st.portrait : "assets/avatar/avatar_happy.png";
}

function updateAvatarSprite() {
  const img = document.getElementById("header-avatar-img");
  if (img) img.src = getAvatarFrameUrl();
}

function triggerExcitedAvatar() {
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

function renderCurrentRoom(roomName) {
  const canvas = document.getElementById("room-canvas");
  const layer = document.getElementById("room-hotspots-layer");
  canvas.setAttribute("data-room", roomName);

  const bgUrl = Engine.ASSETS.backgrounds[roomName] || Engine.ASSETS.backgrounds["Flur"];
  canvas.style.backgroundImage = `url('${bgUrl}')`;

  const objects = Engine.ROOM_OBJECTS[roomName] || [];
  const completed = Engine.getState().completedToday || {};

  layer.innerHTML = objects.map(obj => {
    const isDone = !!completed[obj.id];
    const displayTitle = obj.anzeigeName || obj.name;

    // 1. Null-Naht-Rendering für freigestellte Raum-Sprites (z. B. im neuen Flur)
    if (obj.spriteUrl && obj.widthPct !== undefined) {
      const clipStyle = obj.clipPath ? `clip-path: ${obj.clipPath}; -webkit-clip-path: ${obj.clipPath};` : "";
      return `
        <div class="room-sprite-hotspot ${isDone ? 'done-today' : ''}"
             style="left: ${obj.leftPct}%; top: ${obj.topPct}%; width: ${obj.widthPct}%; height: ${obj.heightPct}%; z-index: ${obj.zIndex || 12}; ${clipStyle}"
             title="${displayTitle}"
             onclick="handleHotspotClick('${roomName}', '${obj.id}')">
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
  }).join("");
}

function handleHotspotClick(roomName, objId) {
  const objects = Engine.ROOM_OBJECTS[roomName] || [];
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
  if (obj.spriteUrl) {
    previewWrap.innerHTML = `<img src="${obj.spriteUrl}" alt="${obj.name}" style="max-height:96px; max-width:180px; object-fit:contain; image-rendering:auto; filter:drop-shadow(0 4px 10px rgba(0,0,0,0.25));">`;
  } else if (obj.iconUrl) {
    previewWrap.innerHTML = `<img src="${obj.iconUrl}" alt="${obj.name}" style="width:64px; height:64px; object-fit:contain; image-rendering:auto;" onerror="this.outerHTML='<div style=\'font-size:42px;\'>${obj.icon || '✨'}</div>'">`;
  } else {
    previewWrap.innerHTML = `<div id="obj-modal-icon" style="font-size:42px;">${obj.icon || "✨"}</div>`;
  }

  const sheetInfo = obj.verknuepfung ? ` (Tabellen-Zelle: ${obj.zielTabelle}!${obj.verknuepfung})` : "";
  document.getElementById("obj-modal-desc").textContent = `${obj.anzeigeName || obj.name}${sheetInfo}`;
  document.getElementById("obj-modal-rewards").innerHTML = `
    <span class="reward-pill">+${obj.xp || 0} XP</span>
    <span class="reward-pill">+${obj.gold || 0} Gold</span>
    <span class="reward-pill">+${obj.mb || 0} MB</span>
    <span class="reward-pill">+${obj.ap || 0} AP</span>
  `;
  openModal("object-modal");
}

function confirmObjectAction() {
  if (!selectedObject) return;
  Engine.completeObject(selectedObject);
  closeModal("object-modal");
  triggerExcitedAvatar();
  renderAll();
  showLootToast(`✅ "${selectedObject.name}" verbucht (+${selectedObject.xp} XP, +${selectedObject.gold} G, +${selectedObject.mb} MB)`);
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
        <img src="${ref.profileRef}" alt="Profilbild Referenz" style="width:96px; height:96px; border-radius:50%; object-fit:contain; object-position:center bottom; padding-top:4px; border:3.5px solid #ff7a00; image-rendering:auto; background:radial-gradient(circle at 50% 40%, #fff9db 0%, #ffd43b 70%, #f76707 100%); flex-shrink:0;">
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

  const renderItemCard = (item) => {
    const done = !!completed[item.id];
    const badgeColor = item.zielTabelle === "Aufgaben" ? "#ea580c" : "#0284c7";
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; padding:8px 10px; border:1.5px solid ${done ? '#86efac' : '#fed7aa'}; background:${done ? '#f0fdf4' : '#ffffff'}; border-radius:10px; margin-bottom:6px;">
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
