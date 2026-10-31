/**
 * ============================================================================
 * ADHD-QUEST VISUAL POINT & CLICK CONTROLLER v0.24
 * (Puristisches Avatar-Porträt mit Gefühlszuständen & Blick-Loop + In-World Tür
 *  + Arbeitszimmer als Startraum mit Sparschwein & Tageschronik)
 * ============================================================================
 */
let pendingAction = null;
let lookPhase = "center"; // "center", "right", "left"
let isExcitedOverride = false;

function dismissIntroScreen() {
  const intro = document.getElementById("intro-screen");
  if (intro) intro.classList.add("hidden");
}

// Bestimmt anhand von Geisteskraft (MB) das aktuelle Gefühls-Porträt + Blickrichtung
function getAvatarFrameUrl() {
  if (isExcitedOverride) {
    return "assets/avatar/avatar_excited.png";
  }
  const s = Engine.getState();
  const mbPct = (s.character.mb / s.character.maxMb) * 100;

  if (mbPct >= 75) {
    if (lookPhase === "right") return "assets/avatar/avatar_happy_right.png";
    if (lookPhase === "left") return "assets/avatar/avatar_happy_left.png";
    return "assets/avatar/avatar_happy_center.png";
  } else if (mbPct >= 45) {
    if (lookPhase === "right") return "assets/avatar/avatar_neutral_right.png";
    if (lookPhase === "left") return "assets/avatar/avatar_neutral_left.png";
    return "assets/avatar/avatar_neutral_center.png";
  } else if (mbPct >= 20) {
    return "assets/avatar/avatar_tired.png";
  } else {
    return "assets/avatar/avatar_exhausted.png";
  }
}

function getMoodDescription(mbPct) {
  if (mbPct >= 75) return "😄 Voller Fokus & Energie (Geisteskraft hoch)";
  if (mbPct >= 45) return "🙂 Ausgeglichen & Aufmerksam";
  if (mbPct >= 20) return "😪 Müde – Zeit für eine MB-Erholung!";
  return "😰 Erschöpft – Gönn dir dringend Ruhe!";
}

function updateAvatarVisual() {
  const imgEl = document.getElementById("avatar-img");
  const ringEl = document.getElementById("avatar-ring");
  const lvlBadge = document.getElementById("avatar-lvl-badge");
  if (!imgEl || !ringEl) return;

  imgEl.src = getAvatarFrameUrl();

  const s = Engine.getState();
  const c = s.character;
  const mbPct = Math.max(0, Math.min(100, (c.mb / c.maxMb) * 100));

  // Level-Fortschritt oder MB-Fortschritt als leuchtender Conic-Gradient-Ring (Instagram/Duolingo-Stil)
  const nextLvlXp = Math.pow(c.level, 2) * 100;
  const prevLvlXp = Math.pow(c.level - 1, 2) * 100;
  const lvlPct = Math.min(100, Math.max(8, Math.round(((c.xp - prevLvlXp) / Math.max(1, nextLvlXp - prevLvlXp)) * 100)));
  const ringDeg = Math.round((lvlPct / 100) * 360);

  let ringColor = "#ff7a00";
  if (isExcitedOverride) {
    ringColor = "#28a745";
  } else if (mbPct < 20) {
    ringColor = "#dc3545";
  } else if (mbPct >= 75) {
    ringColor = "#ff7a00";
  } else {
    ringColor = "#ff9800";
  }

  ringEl.style.background = `conic-gradient(${ringColor} ${ringDeg}deg, rgba(255, 255, 255, 0.45) 0deg)`;
  if (lvlBadge) {
    lvlBadge.textContent = `Lv.${c.level}`;
  }
}

function updateGoalPill() {
  const pillText = document.getElementById("goal-pill-text");
  const pillPct = document.getElementById("goal-pill-pct");
  const pillBar = document.getElementById("goal-pill-bar");
  if (!pillText || !pillPct || !pillBar) return;

  const pinned = Engine.getPinnedShopProgress();
  if (!pinned || pinned.length === 0) {
    pillText.textContent = "🐷 Sparschwein-Shop";
    pillPct.textContent = "";
    pillBar.style.width = "100%";
    return;
  }
  // Zeige das erste angepinnte Ziel, das noch nicht bei 100% ist (oder das erste überhaupt)
  const activeGoal = pinned.find(p => p.percent < 100) || pinned[0];
  pillText.innerHTML = `${activeGoal.icon} Ziel: <strong>${activeGoal.name}</strong> (${activeGoal.current}/${activeGoal.target} ${activeGoal.currency})`;
  pillPct.textContent = `${activeGoal.percent}%`;
  pillBar.style.width = `${activeGoal.percent}%`;
}

// Fliegende Loot-Partikel (Münzen, Sterne, Gehirn-Energie) zum Porträt oben links!
function spawnLootParticlesToAvatar(xp, gold, mb) {
  const shell = document.querySelector(".app-shell");
  const ringEl = document.getElementById("avatar-ring");
  if (!shell || !ringEl) return;

  const icons = ["⭐", "✨"];
  if (gold > 0) icons.push("🪙", "🪙");
  if (mb > 0) icons.push("🧠", "💚");

  icons.forEach((symbol, idx) => {
    const p = document.createElement("div");
    p.className = "loot-particle";
    p.textContent = symbol;
    const startX = 160 + (Math.random() * 80 - 40);
    const startY = 480 + (Math.random() * 60 - 30);
    p.style.left = `${startX}px`;
    p.style.top = `${startY}px`;
    shell.appendChild(p);

    setTimeout(() => {
      const targetX = 58 - startX + (Math.random() * 16 - 8);
      const targetY = 58 - startY + (Math.random() * 16 - 8);
      p.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.45)`;
      p.style.opacity = "0.15";
    }, 30 + idx * 75);

    setTimeout(() => p.remove(), 880 + idx * 75);
  });

  ringEl.classList.add("avatar-celebrate");
  setTimeout(() => ringEl.classList.remove("avatar-celebrate"), 1400);
}

// Lebendiger Blick-Loop: Lässt dein Porträt alle paar Sekunden aufmerksam durch den Raum schauen
function startAvatarLookLoop() {
  setInterval(() => {
    if (isExcitedOverride) return;
    const roll = Math.random();
    if (roll < 0.55) {
      lookPhase = "center";
    } else if (roll < 0.80) {
      lookPhase = "right";
    } else {
      lookPhase = "left";
    }
    updateAvatarVisual();
  }, 2600);
}

function renderDashboard() {
  const s = Engine.getState();
  const currentRoom = s.settings.currentRoom || "Arbeitszimmer";

  // 1. Avatar-Porträt & Sparziel-Pille aktualisieren
  updateAvatarVisual();
  updateGoalPill();

  // 2. Raum-Kulisse & Dezenten Raum-Namen setzen
  const canvas = document.getElementById("room-canvas");
  canvas.setAttribute("data-room", currentRoom);

  const roomMeta = Engine.ROOMS.find(r => r.id === currentRoom) || Engine.ROOMS[0];
  document.getElementById("room-banner").innerHTML = `${roomMeta.icon} <strong>${roomMeta.id}</strong>`;

  // 3. In-World Objekte des aktuellen Raums rendern (Nur Kontur-Schimmer, keine Textschilder!)
  const roomTasks = s.catalog.tasks
    .filter(t => t.raum === currentRoom)
    .map(t => ({ ...t, spotType: "task" }));

  const roomMbs = s.catalog.mbActivities
    .filter(m => m.raum === currentRoom)
    .map(m => ({ ...m, spotType: "mb" }));

  const allSpots = [...roomTasks, ...roomMbs];
  const container = document.getElementById("hotspots-layer");

  let spotsHtml = allSpots.map(spot => {
    const isTask = spot.spotType === "task";

    // A) Ausgeschnittenes Original-Sprite (Null-Naht-Trick + grünes Erledigt-Häkchen)
    if (spot.isSceneSprite && spot.iconUrl) {
      return `
        <div class="scene-sprite-spot ${isTask ? 'task-spot' : 'mb-spot'} ${spot.completedToday ? 'done-spot' : ''}"
             style="left: ${spot.leftPct}%; top: ${spot.topPct}%; width: ${spot.widthPct}%; height: ${spot.heightPct}%;"
             title="${spot.objekt}: ${spot.name}${spot.completedToday ? ' (Heute bereits erledigt ✓)' : ''}"
             onclick="openSpotPopup('${spot.spotType}', '${spot.id}')">
          <img src="${spot.iconUrl}" alt="${spot.objekt}">
          ${spot.completedToday ? '<span class="done-check-badge">✓</span>' : ''}
        </div>
      `;
    }

    // B) Freistehendes In-World-Objekt (Komplett ohne Text-Badge, nur Kontur-Glow!)
    let visualHtml = `<span class="inworld-emoji-fallback">${spot.completedToday ? '✅' : spot.icon}</span>`;
    if (spot.iconUrl) {
      visualHtml = `
        <img src="${spot.iconUrl}" alt="${spot.objekt}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span class="inworld-emoji-fallback" style="display:none;">${spot.icon}</span>
      `;
    }

    return `
      <div class="inworld-icon-spot ${isTask ? 'task-spot' : 'mb-spot'} ${spot.completedToday ? 'done-spot' : ''}"
           style="left: ${spot.x}%; top: ${spot.y}%;"
           title="${spot.objekt}: ${spot.name}"
           onclick="openSpotPopup('${spot.spotType}', '${spot.id}')">
        ${visualHtml}
      </div>
    `;
  }).join("");

  // 4. NAHTLOSE ORIGINAL-SPRITES IM STARTRAUM "ARBEITSZIMMER" (Null-Naht-Trick!):
  //    - Originales rosa Sparschwein auf dem Tisch -> öffnet den Shop!
  //    - Originales aufgeschlagenes Buch rechts auf dem Tisch -> öffnet Tageschronik & Statistik!
  //    - Originale Zimmertür rechts im Bild -> öffnet den Wohnungs-Grundriss (Map)!
  if (currentRoom === "Arbeitszimmer") {
    spotsHtml += `
      <div class="scene-sprite-spot"
           style="left: 39.03%; top: 54.39%; width: 21.10%; height: 8.69%; z-index: 9;"
           title="Sparschwein: Belohnungs-Shop öffnen"
           onclick="openShopModal()">
        <img src="assets/arbeitszimmer_sprites/sprite_arb_sparschwein.png" alt="Sparschwein-Shop">
      </div>
      <div class="scene-sprite-spot"
           style="left: 58.23%; top: 61.33%; width: 23.00%; height: 3.32%; z-index: 8;"
           title="Aufgeschlagenes Buch: Tageschronik & Statistik öffnen"
           onclick="openLogModal()">
        <img src="assets/arbeitszimmer_sprites/sprite_arb_chronik_buch.png" alt="Tageschronik & Statistik">
      </div>
      <div class="scene-sprite-spot"
           style="left: 78.69%; top: 27.25%; width: 21.31%; height: 47.56%; z-index: 5;"
           title="Zimmertür: Wohnungs-Grundriss (Raum wechseln)"
           onclick="openMapModal()">
        <img src="assets/arbeitszimmer_sprites/sprite_arb_tuer.png" alt="Tür zur Map">
      </div>
    `;
  }

  // 5. NAHTLOSE ZIMMERTÜR IM WOHNZIMMER (Null-Naht-Trick!):
  //    - Originale Holztür links oben im Wohnzimmer -> öffnet den Wohnungs-Grundriss (Map)!
  if (currentRoom === "Wohnzimmer") {
    spotsHtml += `
      <div class="scene-sprite-spot"
           style="left: 0.0%; top: 16.21%; width: 16.24%; height: 31.15%; z-index: 5;"
           title="Wohnzimmertür: Wohnungs-Grundriss (Raum wechseln)"
           onclick="openMapModal()">
        <img src="assets/wohnzimmer_sprites/sprite_woh_tuer.png" alt="Tür zur Map">
      </div>
    `;
  }

  // 6. NAHTLOSE ZIMMERTÜR IM BADEZIMMER (Null-Naht-Trick!):
  //    - Originale Holztür am linken Rand im Badezimmer -> öffnet den Wohnungs-Grundriss (Map)!
  if (currentRoom === "Badezimmer") {
    spotsHtml += `
      <div class="scene-sprite-spot"
           style="left: 0.0%; top: 27.63%; width: 5.68%; height: 54.34%; z-index: 5;"
           title="Badezimmertür: Wohnungs-Grundriss (Raum wechseln)"
           onclick="openMapModal()">
        <img src="assets/badezimmer_sprites/sprite_bad_tuer.png" alt="Tür zur Map">
      </div>
    `;
  }

  // 7. NAHTLOSE ZIMMERTÜR IM SCHLAFZIMMER (Null-Naht-Trick!):
  //    - Originale Holztür an der linken Wand im Schlafzimmer -> öffnet den Wohnungs-Grundriss (Map)!
  if (currentRoom === "Schlafzimmer") {
    spotsHtml += `
      <div class="scene-sprite-spot"
           style="left: 0.0%; top: 24.56%; width: 16.93%; height: 40.26%; z-index: 5;"
           title="Schlafzimmertür: Wohnungs-Grundriss (Raum wechseln)"
           onclick="openMapModal()">
        <img src="assets/schlafzimmer_sprites/sprite_sch_tuer.png" alt="Tür zur Map">
      </div>
    `;
  }

  container.innerHTML = spotsHtml;
}

// --- MODAL 1: CHARAKTERBOGEN & AUSFÜHRLICHE WERTE (Klick auf dein Porträt oben links) ---
function openCharacterModal() {
  const s = Engine.getState();
  const c = s.character;
  const mbPct = Math.round((c.mb / c.maxMb) * 100);
  const hpPct = Math.round((c.hp / c.maxHp) * 100);
  const nextLvlXp = Math.pow(c.level, 2) * 100;
  const prevLvlXp = Math.pow(c.level - 1, 2) * 100;
  const lvlProgress = Math.min(100, Math.max(0, Math.round(((c.xp - prevLvlXp) / Math.max(1, nextLvlXp - prevLvlXp)) * 100)));

  document.getElementById("char-modal-body").innerHTML = `
    <div class="char-sheet-top">
      <img src="${getAvatarFrameUrl()}" class="char-sheet-avatar" alt="Porträt">
      <div>
        <div style="font-weight:800; font-size:16px; color:#e65100;">Stufe ${c.level} Abenteurer</div>
        <div style="font-size:12px; font-weight:700; color:#1e293b; margin-top:2px;">${getMoodDescription(mbPct)}</div>
        <div style="font-size:11px; color:#64748b; margin-top:3px;">🔥 Aktueller Streak: <strong>${c.streak} Tage</strong></div>
      </div>
    </div>

    <div class="char-bar-wrap">
      <div class="char-bar-label">
        <span>🧠 Geisteskraft (MB)</span>
        <span>${c.mb} / ${c.maxMb} MB (${mbPct}%)</span>
      </div>
      <div class="char-bar-bg">
        <div class="char-bar-fill" style="width:${mbPct}%;"></div>
      </div>
    </div>

    <div class="char-bar-wrap">
      <div class="char-bar-label">
        <span>❤️ Lebensenergie (HP)</span>
        <span>${c.hp} / ${c.maxHp} HP</span>
      </div>
      <div class="char-bar-bg">
        <div class="char-bar-fill" style="width:${hpPct}%; background:#28a745;"></div>
      </div>
    </div>

    <div class="char-bar-wrap" style="margin-bottom:14px;">
      <div class="char-bar-label">
        <span>⭐ Erfahrung (Level ${c.level})</span>
        <span>${c.xp} / ${nextLvlXp} XP</span>
      </div>
      <div class="char-bar-bg">
        <div class="char-bar-fill" style="width:${lvlProgress}%; background:#ff7a00;"></div>
      </div>
    </div>

    <div class="char-stats-grid">
      <div class="char-stat-card">
        <span class="char-stat-label">🪙 Goldmünzen</span>
        <span class="char-stat-val">${c.gold} G</span>
      </div>
      <div class="char-stat-card">
        <span class="char-stat-label">🐾 Aktionspunkte</span>
        <span class="char-stat-val">${c.ap} AP</span>
      </div>
      <div class="char-stat-card">
        <span class="char-stat-label">📈 Heute verdient</span>
        <span class="char-stat-val">+${s.meta.dailyEarned.xp} XP / +${s.meta.dailyEarned.gold} G</span>
      </div>
      <div class="char-stat-card">
        <span class="char-stat-label">🌿 Heutige MB</span>
        <span class="char-stat-val">+${s.meta.dailyEarned.mb} MB</span>
      </div>
    </div>

    <div style="display:flex; gap:8px;">
      <button class="primary-cta" style="flex:1; padding:10px; font-size:13px;" onclick="closeModal('char-modal'); selectRoom('Arbeitszimmer');">
        🏠 Ins Arbeitszimmer
      </button>
      <button class="primary-cta" style="flex:1; padding:10px; font-size:13px; background:#1e293b;" onclick="closeModal('char-modal')">
        Weiter im Raum
      </button>
    </div>
  `;
  openModal("char-modal");
}

// --- MODAL 2: ZENTRIERTE QUEST-KARTE / HERO-POPUP (Antwort 5B) ---
function openSpotPopup(type, id) {
  const s = Engine.getState();
  const list = type === "task" ? s.catalog.tasks : s.catalog.mbActivities;
  const item = list.find(entry => entry.id === id);
  if (!item) return;

  pendingAction = { type, id };
  const goldTxt = Array.isArray(item.gold) ? `${item.gold[0]}–${item.gold[1]}` : item.gold;

  const heroVisual = item.iconUrl
    ? `<img src="${item.iconUrl}" class="popup-hero-icon" alt="${item.objekt}" onerror="this.style.display='none'">`
    : `<div style="font-size:48px; margin-bottom:6px;">${item.icon}</div>`;

  document.getElementById("spot-modal-title").innerHTML = `${item.icon} ${item.objekt}`;
  document.getElementById("spot-modal-body").innerHTML = `
    <div style="text-align:center;">
      ${heroVisual}
      <p style="font-size:16px; font-weight:800; margin:4px 0 6px 0;">${item.name}</p>
      <p style="font-size:12px; color:#64748b; margin:0 0 10px 0;">
        Raum: <strong>${item.raum}</strong> | Typ: <strong>${type === 'task' ? '🧹 Aufgabe' : '🌿 Erholung (MB)'}</strong>
      </p>
      <div class="reward-pills">
        ${item.xp > 0 ? `<span class="reward-pill">⭐ +${item.xp} XP</span>` : ''}
        ${item.mb > 0 ? `<span class="reward-pill">🧠 +${item.mb} MB</span>` : ''}
        ${goldTxt !== 0 && goldTxt !== "0" ? `<span class="reward-pill">🪙 +${goldTxt} Gold</span>` : ''}
        ${item.ap > 0 ? `<span class="reward-pill">⚡ +${item.ap} AP</span>` : ''}
      </div>
      <button class="primary-cta" onclick="confirmSpotAction()">✨ LOOT SAMMELN & ABHAKEN!</button>
    </div>
  `;
  openModal("spot-modal");
}

function confirmSpotAction() {
  if (!pendingAction) return;
  const { type, id } = pendingAction;
  closeModal("spot-modal");

  const res = type === "task" ? Engine.completeTask(id) : Engine.completeMB(id);
  if (res.status === "success") {
    const e = res.logEntry;
    // Porträt jubelt für 2,5 Sekunden mit Sternchen in den Augen + Partikel fliegen zum Porträt!
    isExcitedOverride = true;
    updateAvatarVisual();
    spawnLootParticlesToAvatar(e.xp, e.gold, e.mb);
    if (res.isDopamineSurge) {
      const canvasEl = document.getElementById("room-canvas");
      if (canvasEl) {
        canvasEl.classList.add("surge-flash");
        setTimeout(() => canvasEl.classList.remove("surge-flash"), 850);
      }
    }
    setTimeout(() => {
      isExcitedOverride = false;
      updateAvatarVisual();
    }, 2500);

    showFloatingLoot(`${res.isDopamineSurge ? '💎 CRITICAL DOPAMIN-SURGE!<br>' : ''}✅ +${e.xp} XP | ${e.gold > 0 ? '+'+e.gold+' G | ' : ''}${e.mb > 0 ? '+'+e.mb+' MB | ' : ''}+${e.ap} AP`);
    if (res.levelResult && res.levelResult.leveledUp) {
      setTimeout(() => {
        alert(`🎉 LEVEL UP! Du hast Level ${res.levelResult.newLevel} erreicht! (+${res.levelResult.goldBonus} Gold Bonus)`);
      }, 300);
    }
  }
  pendingAction = null;
}

// --- MODAL 3: INTERAKTIVE KARTE (NUR bg_map_orig.png MIT FREIGESTELLTEN RAUM-SPRITES!) ---
function openMapModal() {
  const currentRoom = Engine.getState().settings.currentRoom;
  const mapCanvas = document.getElementById("interactive-map-canvas");
  if (mapCanvas) {
    mapCanvas.innerHTML = Engine.ROOMS.map(r => {
      const clipStyle = r.clipPath ? `clip-path: ${r.clipPath}; -webkit-clip-path: ${r.clipPath};` : "";
      return `
        <div class="map-room-sprite ${r.id === currentRoom ? 'active-room' : ''}"
             style="left: ${r.leftPct}%; top: ${r.topPct}%; width: ${r.widthPct}%; height: ${r.heightPct}%; z-index: ${r.zIndex || 5}; ${clipStyle}"
             title="${r.id} betreten (${r.desc})"
             onclick="selectRoom('${r.id}')">
          <img src="${r.mapSprite}" alt="${r.id}">
        </div>
      `;
    }).join("");
  }
  openModal("map-modal");
}

function selectRoom(roomName) {
  Engine.setRoom(roomName);
  closeModal("map-modal");
}

// --- MODAL 4: SPARSCHWEIN-SHOP (Über das Sparschwein im Arbeitszimmer) ---
function openShopModal() {
  const s = Engine.getState();
  const pinned = Engine.getPinnedShopProgress();

  document.getElementById("shop-pinned-section").innerHTML = `
    <div style="font-size:11px; font-weight:800; color:#e65100; text-transform:uppercase; margin-bottom:6px;">
      🎯 Deine 3 Haupt-Belohnungsziele (Gold: ${s.character.gold} G | AP: ${s.character.ap} AP)
    </div>
    ${pinned.map(p => `
      <div style="background:#fff3e0; border:1.5px solid #ffb74d; border-radius:10px; padding:8px 10px; margin-bottom:6px;">
        <div style="display:flex; justify-content:space-between; font-size:12px; font-weight:800;">
          <span>${p.icon} ${p.name}</span>
          <span>${p.percent}%</span>
        </div>
        <div class="char-bar-bg" style="margin:5px 0;">
          <div class="char-bar-fill" style="width:${p.percent}%;"></div>
        </div>
        <div style="font-size:10px; color:#64748b; font-weight:700;">
          Fortschritt: ${p.current} / ${p.target} ${p.currency}${p.apCost ? ' (+ ' + p.apCost + ' AP)' : ''}
        </div>
      </div>
    `).join("")}
  `;

  document.getElementById("shop-list").innerHTML = s.catalog.shop.map(item => {
    const costLabel = `${item.goldCost > 0 ? item.goldCost + ' G ' : ''}${item.apCost > 0 ? '+ ' + item.apCost + ' AP' : ''}`;
    return `
      <div class="list-item-row">
        <div>
          <strong>${item.icon || '🛒'} ${item.name}</strong><br>
          <span style="font-size:11px; color:#64748b;">Kosten: ${costLabel}</span>
        </div>
        <button class="mini-btn" style="padding:6px 12px; font-size:12px;" onclick="handleDirectPurchase('${item.id}')">
          Einlösen
        </button>
      </div>
    `;
  }).join("");
  openModal("shop-modal");
}

function handleDirectPurchase(id) {
  const res = Engine.buyShopItem(id);
  if (res.status === "denied") {
    showFloatingLoot(`🔒 ${res.message}`);
  } else if (res.status === "success") {
    isExcitedOverride = true;
    updateAvatarVisual();
    setTimeout(() => { isExcitedOverride = false; updateAvatarVisual(); }, 2500);
    showFloatingLoot(`🎉 Eingelöst: ${res.item.name}${res.extraInfo || ''}`);
    if (document.getElementById("shop-modal").classList.contains("active")) {
      openShopModal();
    }
  }
}

// --- MODAL 5: TAGESCHRONIK & STATISTIK (Über das Chronik-Buch im Arbeitszimmer) ---
function openLogModal() {
  const s = Engine.getState();
  const d = s.meta.dailyEarned;

  document.getElementById("log-stats-summary").innerHTML = `
    <div style="background:#fff3e0; border:1.5px solid #ffb74d; border-radius:10px; padding:10px; font-size:12px;">
      <strong>📊 Heutige Tagesbilanz (${s.meta.lastActiveDate}):</strong><br>
      ⭐ <strong>+${d.xp} XP</strong> &nbsp;|&nbsp; 🪙 <strong>+${d.gold} Gold</strong> &nbsp;|&nbsp; 🧠 <strong>+${d.mb} MB</strong> &nbsp;|&nbsp; ⚡ <strong>+${d.ap} AP</strong>
    </div>
  `;

  document.getElementById("log-list").innerHTML = s.questlog.slice(0, 25).map(q => `
    <div class="list-item-row" style="font-size:11px;">
      <div>
        <strong>${q.name}</strong><br>
        <span style="color:#64748b;">${q.date} ${q.time} (${q.category})</span>
      </div>
      <div style="text-align:right; font-weight:bold;">
        ${q.xp ? `+${q.xp}XP ` : ''}${q.gold ? `${q.gold > 0 ? '+' : ''}${q.gold}G ` : ''}${q.mb ? `+${q.mb}MB ` : ''}${q.ap ? `${q.ap > 0 ? '+' : ''}${q.ap}AP` : ''}
      </div>
    </div>
  `).join("") || "<p style='color:#64748b; font-size:12px;'>Noch keine Einträge in der heutigen Chronik.</p>";
  openModal("log-modal");
}

function openModal(id) {
  document.getElementById(id).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
}

function showFloatingLoot(htmlText) {
  const shell = document.querySelector(".app-shell");
  const el = document.createElement("div");
  el.className = "floating-loot";
  el.innerHTML = htmlText;
  shell.appendChild(el);
  setTimeout(() => el.remove(), 1600);
}

function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const res = Engine.importBackup(e.target.result);
    if (res.status === "success") {
      showFloatingLoot("📥 Spielstand erfolgreich geladen!");
      closeModal("log-modal");
    } else {
      alert(res.message);
    }
  };
  reader.readAsText(file);
}

window.onEngineUpdate = renderDashboard;
function initRoomSwipeNavigation() {
  const canvas = document.getElementById("room-canvas");
  if (!canvas) return;
  let touchStartX = 0;
  let touchStartY = 0;

  canvas.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });

  canvas.addEventListener("touchend", (e) => {
    if (e.changedTouches.length === 1) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      // Horizontaler Swipe (> 75px) wechselt direkt ins Nachbarzimmer
      if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        const rooms = Engine.ROOMS.map(r => r.id);
        const cur = Engine.getState().settings.currentRoom || "Arbeitszimmer";
        const idx = rooms.indexOf(cur);
        const nextIdx = dx < 0 ? (idx + 1) % rooms.length : (idx - 1 + rooms.length) % rooms.length;
        selectRoom(rooms[nextIdx]);
      }
    }
  }, { passive: true });
}

document.addEventListener("DOMContentLoaded", () => {
  renderDashboard();
  startAvatarLookLoop();
  initRoomSwipeNavigation();
  setTimeout(dismissIntroScreen, 4200);
});
