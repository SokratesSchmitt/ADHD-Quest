/**
 * ============================================================================
 * ADHD QUEST – GOOGLE APPS SCRIPT BACKEND (API.gs v0.3)
 * ============================================================================
 * Liest beim GET-Request (`doGet`):
 * 1. Charakterbogen (MB, HP, Level, XP, Gold, AP, aktuelle Quest)
 * 2. Frontend_Raum_Objekte (alle Hotspots inkl. Flur & Küche mit posX/posY, Verknüpfung, Tabelle, Icon & Sound)
 * 3. MB Aktivitaeten (inkl. Spalte M "Raum", Spalte N "Repräsentiert durch" & Spalte O "Adresse Grafik")
 * 4. Aufgaben (inkl. Spalte M "Raum" & Spalte N "Repräsentiert durch")
 * 5. Shop (alle Belohnungen inkl. Preis & AP-Kosten)
 * 6. Raum_adressen (alle Hintergrundbild-URLs inkl. Flur, Schlafzimmer, Kinderzimmer)
 *
 * Verarbeitet beim POST-Request (`doPost`):
 * - `action: "processAction"` für `MB Aktivitaeten`, `Aufgaben` und `Shop`
 * - Berechnet neue Charakterwerte, setzt die Checkbox im jeweiligen Reiter und schreibt ins `Questlog`.
 */

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const charSheet = ss.getSheetByName("Charakterbogen");
    const roomObjSheet = ss.getSheetByName("Frontend_Raum_Objekte");
    const mbSheet = ss.getSheetByName("MB Aktivitaeten");
    const aufgabenSheet = ss.getSheetByName("Aufgaben");
    const shopSheet = ss.getSheetByName("Shop");
    const adressenSheet = ss.getSheetByName("Raum_adressen");

    // 1. Charakterbogen auslesen
    const currentMB = Number(charSheet.getRange("B3").getValue()) || 0;
    const currentHP = Number(charSheet.getRange("B4").getValue()) || 54;
    const currentLevel = Number(charSheet.getRange("B6").getValue()) || 1;
    const currentXP = Number(charSheet.getRange("B8").getValue()) || 0;
    const levelProgress = String(charSheet.getRange("C8").getValue() || "");
    const currentGold = Number(charSheet.getRange("B10").getValue()) || 0;
    const currentAP = Number(charSheet.getRange("D10").getValue()) || 0;
    const currentQuest = String(charSheet.getRange("C14").getValue() || "");

    // 2. MB Aktivitaeten inkl. Spalte M (Raum) & Spalte N (Repräsentiert durch) auslesen
    let mbActivities = [];
    const mbMapByCell = {};
    const mbMapByName = {};
    if (mbSheet) {
      const mbData = mbSheet.getDataRange().getValues();
      for (let i = 1; i < mbData.length; i++) {
        const name = String(mbData[i][0] || "").trim();
        if (name) {
          const item = {
            row: i + 1,
            cellRef: "A" + (i + 1),
            name: name,
            mb: Number(mbData[i][1]) || 0,
            xp: Number(mbData[i][2]) || 0,
            spass: Boolean(mbData[i][3]),
            kompetenz: Boolean(mbData[i][4]),
            soziales: Boolean(mbData[i][5]),
            selbstwert: Boolean(mbData[i][6]),
            ap: Number(mbData[i][7]) || 0,
            status: Boolean(mbData[i][8]),
            raum: String(mbData[i][12] || "").trim(),             // Spalte M: Raum
            repraesentiertDurch: String(mbData[i][13] || "").trim(), // Spalte N: Repräsentiert durch
            grafikUrl: String(mbData[i][14] || "").trim()         // Spalte O: Adresse Grafik
          };
          mbActivities.push(item);
          mbMapByCell[item.cellRef] = item;
          mbMapByName[item.name] = item;
        }
      }
    }

    // 3. Aufgaben inkl. Spalte M (Raum) & Spalte N (Repräsentiert durch) auslesen
    let aufgabenList = [];
    const aufgabenMapByCell = {};
    const aufgabenMapByName = {};
    if (aufgabenSheet) {
      const aufData = aufgabenSheet.getDataRange().getValues();
      for (let i = 1; i < aufData.length; i++) {
        const name = String(aufData[i][0] || "").trim();
        if (name && name !== "Raum") {
          const item = {
            row: i + 1,
            cellRef: "A" + (i + 1),
            name: name,
            mb: Number(aufData[i][1]) || 0,
            xp: Number(aufData[i][2]) || 0,
            spass: Boolean(aufData[i][3]),
            kompetenz: Boolean(aufData[i][4]),
            soziales: Boolean(aufData[i][5]),
            selbstwert: Boolean(aufData[i][6]),
            gold: Number(aufData[i][7]) || 0,
            ap: Number(aufData[i][8]) || 0,
            status: Boolean(aufData[i][9]),
            raum: String(aufData[i][12] || "").trim(),             // Spalte M: Raum
            repraesentiertDurch: String(aufData[i][13] || "").trim(), // Spalte N: Repräsentiert durch
            grafikUrl: String(aufData[i][14] || "").trim()         // Spalte O: Adresse Grafik
          };
          aufgabenList.push(item);
          aufgabenMapByCell[item.cellRef] = item;
          aufgabenMapByName[item.name] = item;
        }
      }
    }

    // 4. Frontend_Raum_Objekte auslesen und direkt mit den Ziel-Zeilen aus Aufgaben / MB Aktivitaeten anreichern
    let roomObjects = [];
    if (roomObjSheet) {
      const roData = roomObjSheet.getDataRange().getValues();
      for (let i = 1; i < roData.length; i++) {
        if (roData[i][0]) {
          const verknuepfung = String(roData[i][4] || "").trim(); // Spalte E (z.B. "A13")
          const zielTabelle = String(roData[i][5] || "").trim();  // Spalte F ("Aufgaben" oder "MB Aktivitaeten")

          let linkedItem = null;
          if (zielTabelle === "Aufgaben") {
            linkedItem = aufgabenMapByCell[verknuepfung] || aufgabenMapByName[roData[i][1]] || null;
          } else if (zielTabelle === "MB Aktivitaeten") {
            linkedItem = mbMapByCell[verknuepfung] || mbMapByName[roData[i][1]] || null;
          }

          roomObjects.push({
            raum: String(roData[i][0]).trim(),           // Spalte A
            beschreibung: String(roData[i][1]).trim(),   // Spalte B
            posX: Number(String(roData[i][2]).replace(",", ".")) || 0, // Spalte C
            posY: Number(String(roData[i][3]).replace(",", ".")) || 0, // Spalte D
            verknuepfung: verknuepfung,                  // Spalte E
            zielTabelle: zielTabelle,                    // Spalte F
            iconUrl: String(roData[i][6] || "").trim(),  // Spalte G
            soundUrl: String(roData[i][7] || "").trim(), // Spalte H
            id: String(roData[i][8] || "").trim(),       // Spalte I
            iconName: String(roData[i][9] || "").trim(), // Spalte J
            soundName: String(roData[i][10] || "").trim(), // Spalte K
            // Automatisch verknüpfte Original-Werte aus "Aufgaben" bzw. "MB Aktivitaeten":
            aufgabeName: linkedItem ? linkedItem.name : String(roData[i][1]).trim(),
            repraesentiertDurch: linkedItem && linkedItem.repraesentiertDurch ? linkedItem.repraesentiertDurch : String(roData[i][1]).trim(),
            xp: linkedItem ? linkedItem.xp : 0,
            mb: linkedItem ? linkedItem.mb : 0,
            gold: linkedItem && linkedItem.gold !== undefined ? linkedItem.gold : 0,
            ap: linkedItem ? linkedItem.ap : 0,
            status: linkedItem ? linkedItem.status : false
          });
        }
      }
    }

    // 5. Shop-Items auslesen
    let shopItems = [];
    if (shopSheet) {
      const sData = shopSheet.getDataRange().getValues();
      for (let i = 1; i < sData.length; i++) {
        const sName = String(sData[i][0] || "").trim();
        if (sName) {
          shopItems.push({
            id: "SHOP_" + i,
            name: sName,
            preisGold: Number(sData[i][1]) || 0,
            status: Boolean(sData[i][2]),
            kostenAp: Number(sData[i][4]) || 0
          });
        }
      }
    }

    // 6. Raum_adressen auslesen
    let raumAdressen = {};
    if (adressenSheet) {
      const aData = adressenSheet.getDataRange().getValues();
      for (let i = 1; i < aData.length; i++) {
        const rName = String(aData[i][0] || "").trim();
        const rUrl = String(aData[i][1] || "").trim();
        if (rName && rUrl) {
          raumAdressen[rName] = rUrl
            .replace("https://github.com/", "https://raw.githubusercontent.com/")
            .replace("/blob/", "/");
        }
      }
    }

    const responseData = {
      status: "success",
      data: {
        mb: currentMB,
        hp: currentHP,
        level: currentLevel,
        xp: currentXP,
        levelProgress: levelProgress,
        gold: currentGold,
        ap: currentAP,
        aktuelleQuest: currentQuest,
        raumAdressen: raumAdressen,
        objects: roomObjects,
        mbAktivitaeten: mbActivities,
        aufgaben: aufgabenList,
        shop: shopItems
      }
    };

    return ContentService.createTextOutput(JSON.stringify(responseData))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// --- POST-REQUEST: Daten ans Sheet senden & verarbeiten ---
function doPost(e) {
  try {
    const requestData = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const charSheet = ss.getSheetByName("Charakterbogen");
    const questlogSheet = ss.getSheetByName("Questlog");

    if (requestData.action === "processAction") {
      const type = requestData.type;     // "MB Aktivitaeten", "Aufgaben" oder "Shop"
      const itemName = requestData.name; // Exakter Name in Spalte A

      const targetSheet = ss.getSheetByName(type);
      if (!targetSheet) {
        throw new Error("Tabellenblatt '" + type + "' existiert nicht.");
      }

      const data = targetSheet.getDataRange().getValues();
      let diffMB = 0, diffXP = 0, diffGold = 0, diffAP = 0;
      let rowIndex = -1;
      let checkboxCol = -1;

      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(itemName).trim()) {
          rowIndex = i + 1;
          if (type === "MB Aktivitaeten") {
            diffMB = Number(data[i][1]) || 0;
            diffXP = Number(data[i][2]) || 0;
            diffAP = Number(data[i][7]) || 0; // Spalte H
            checkboxCol = 9;                  // Spalte I
          } else if (type === "Aufgaben") {
            diffMB = Number(data[i][1]) || 0;
            diffXP = Number(data[i][2]) || 0;
            diffGold = Number(data[i][7]) || 0; // Spalte H
            diffAP = Number(data[i][8]) || 0;   // Spalte I
            checkboxCol = 10;                   // Spalte J
          } else if (type === "Shop") {
            diffGold = -(Number(data[i][1]) || 0); // Spalte B
            diffAP = -(Number(data[i][4]) || 0);   // Spalte E
            checkboxCol = 3;                       // Spalte C
          }
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error("Eintrag '" + itemName + "' in Tabelle '" + type + "' nicht gefunden.");
      }

      const currentMB = Number(charSheet.getRange("B3").getValue()) || 0;
      const currentXP = Number(charSheet.getRange("B8").getValue()) || 0;
      const currentGold = Number(charSheet.getRange("B10").getValue()) || 0;
      const currentAP = Number(charSheet.getRange("D10").getValue()) || 0;

      let newMB = Math.min(Math.max(currentMB + diffMB, 0), 100);
      let newXP = currentXP + diffXP;
      let newGold = Math.max(currentGold + diffGold, 0);
      let newAP = Math.max(currentAP + diffAP, 0);

      charSheet.getRange("B3").setValue(newMB);
      charSheet.getRange("B8").setValue(newXP);
      charSheet.getRange("B10").setValue(newGold);
      charSheet.getRange("D10").setValue(newAP);

      targetSheet.getRange(rowIndex, checkboxCol).setValue(true);

      if (questlogSheet) {
        const now = new Date();
        const dateString = Utilities.formatDate(now, Session.getScriptTimeZone(), "dd.MM.yyyy");
        const timeString = Utilities.formatDate(now, Session.getScriptTimeZone(), "HH:mm:ss");
        questlogSheet.appendRow([
          dateString,
          timeString,
          itemName,
          type,
          diffXP,
          diffMB,
          diffGold,
          diffAP
        ]);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Aktion erfolgreich verarbeitet und ins Questlog eingetragen",
        data: { mb: newMB, xp: newXP, gold: newGold, ap: newAP }
      })).setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Unbekannte Aktion: " + requestData.action);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
