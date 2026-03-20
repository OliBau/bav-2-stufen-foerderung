// ============================================================================
// BLOCK 3: RECHENKERN (Pure Functions) — ISOLIERT
// ============================================================================
// 1:1-Portierung aus BAUPLAN_FactSheet_Rechenkern.py
// KEINE DOM-Zugriffe, KEIN State, KEINE Seiteneffekte.
// Parameter und Tarif-Tabellen werden UEBERGEBEN (nicht hardcoded).
// Nutzt globale Objekte aus 02-fallback-data.js: BUNDESLAENDER, STEUERKLASSE_FAKTOREN
// ============================================================================

const Rechenkern = (() => {
  "use strict";

  // ── Private Hilfsfunktionen ──

  function r2(x) { return Math.round(x * 100) / 100; }
  function maxwert(a, b) { return a > b ? a : b; }
  function minwert(a, b) { return a < b ? a : b; }

  // ── §32a EStG: Einkommensteuer-Grundtabelle ──

  function stBer(x, p) {
    const y = (x - p.sgfb) / 10000;
    const z = (x - p.stew1) / 10000;

    if (x > p.sgfb && x < p.stew1) {
      return Math.trunc((p.sfak1 * y + p.szus1) * y);
    }
    if (x > p.stew1 && x < p.stew2 + 1) {
      return Math.trunc((p.sfak2 * z + p.szus2) * z + p.szus3);
    }
    if (x > p.stew2 && x < p.stew3 + 1) {
      return Math.trunc(p.sfak3 * x - p.szus4);
    }
    if (x > p.stew3) {
      return Math.trunc(p.sfak4 * x - p.szus5);
    }
    return 0;
  }

  // ── Steuerklasse V: Viertelmethode ──

  function klasseV(zx, p) {
    const st1 = stBer(zx * 1.25, p);
    const st2 = stBer(zx * 0.75, p);
    return maxwert(Math.trunc(zx * 0.14), 2 * (st1 - st2));
  }

  function lstKlV(x, p) {
    let zzx = x;
    let zw_e;

    if (zzx > p.stv2) {
      zw_e = klasseV(p.stv2, p);
    } else {
      zw_e = klasseV(zzx, p);
    }

    const rich_st = maxwert(0, zzx - p.stv3);
    if (rich_st > 0) {
      zzx = p.stv3;
    }

    const result = maxwert(0, (zzx - p.stv2) * p.sfak3);
    zw_e = zw_e + result;

    const zw_e1 = klasseV(p.stv1, p);
    const result2 = maxwert(0, (zzx - p.stv1) * p.sfak3);
    const zw_e2 = minwert(zw_e, zw_e1 + result2);

    return zw_e2 + rich_st * p.sfak4;
  }

  // ── Tarif-Interpolation ──
  // Lineare Interpolation zwischen 35-EUR- und 552-EUR-Tariftabelle
  // Formel: Wert_35 + (Wert_552 - Wert_35) / 517 * (Gesamtbeitrag - 35)

  function interpoliereTarifwert(eintrittsalter, gesamtbeitrag, tab35, tab552, spalte) {
    const zeile35 = tab35[eintrittsalter];
    const zeile552 = tab552[eintrittsalter];
    if (!zeile35 || !zeile552) return 0.0;

    const wert35 = zeile35[spalte];
    const wert552 = zeile552[spalte];

    return wert35 + (wert552 - wert35) / 517.0 * (gesamtbeitrag - 35.0);
  }

  // ── Ueberschuss-Spalten bestimmen ──

  function getUeberschussSpalten(renditeSzenario) {
    const mapping = {
      "1,5": { kap: "kap_ue_15", r: "r_ue_15" },
      "3,0": { kap: "kap_ue_30", r: "r_ue_30" },
      "4,5": { kap: "kap_ue_45", r: "r_ue_45" },
      "6,0": { kap: "kap_ue_60", r: "r_ue_60" },
    };
    return mapping[renditeSzenario] || mapping["4,5"];
  }

  // ── Produkt-Tabellen-Prefix ──

  function getProduktPrefix(produkt) {
    if (produkt === "VarioInvest Rente") return "VIR";
    if (produkt === "FondsRente 70%") return "FR";
    return "5SAR";
  }

  // ── Foerdergrenzen ──

  function getFoerdergrenzen(parameter) {
    const bbg = parameter.bbg_west;
    const steuerfreiJahr = Math.trunc(bbg * 0.08);
    const svFreiJahr = Math.trunc(bbg * 0.04);
    return {
      steuerfrei_jahr: steuerfreiJahr,
      steuerfrei_monat: Math.trunc(steuerfreiJahr / 12),
      sv_frei_jahr: svFreiJahr,
      sv_frei_monat: Math.trunc(svFreiJahr / 12),
      max_gesamtbeitrag: Math.trunc(steuerfreiJahr / 12),
    };
  }

  // ── Produktregel nach Alter ──

  function waehleProduktNachAlter(eintrittsalter, regeln, fallback) {
    fallback = fallback || "FondsRente 70%";
    for (let i = 0; i < regeln.length; i++) {
      const r = regeln[i];
      const ab = r.ab_alter != null ? r.ab_alter : 0;
      const bis = r.bis_alter != null ? r.bis_alter : 99;
      if (eintrittsalter >= ab && eintrittsalter <= bis) {
        return r.produkt;
      }
    }
    return fallback;
  }

  // ── Stufen-AG-Modell: Festbetrag ermitteln ──

  function ermittleAgFestbetrag(stufen, betriebszugehoerigkeitMonate) {
    let aktuell = 0;
    for (let i = 0; i < stufen.length; i++) {
      if (betriebszugehoerigkeitMonate >= stufen[i].monate) {
        aktuell = stufen[i].festbetrag;
      } else {
        break;
      }
    }
    return aktuell;
  }

  // ========================================================================
  // HAUPTBERECHNUNG: berechneFactsheet
  // ========================================================================
  // 1:1 aus Python berechne_factsheet() (Zeile 725-1048)
  // Parameter:
  //   an:              { bruttogehalt, steuerklasse, kirchensteuer, kinderfreibetrag,
  //                      bundesland, pv_kinder, geburtsdatum, bav_alt_an, bav_alt_ag,
  //                      ag_zuschuss_vwl }
  //   stufen:          [{ name, gesamtbeitrag, ag_festbetrag, ag_prozent }]
  //   produkt:         "FondsRente 70%" | "VarioInvest Rente" | "AnsparRente"
  //   renditeSzenario: "1,5" | "3,0" | "4,5" | "6,0"
  //   parameter:       Jahresparameter-Objekt (aus Fallback-Data)
  //   tarifTabellen:   { "FR35": {...}, "FR552": {...}, ... }
  //   aktuellesJahr:   z.B. 2026
  // Returns: Array von BerechnungErgebnis (eines pro Stufe)

  function berechneFactsheet(an, stufen, produkt, renditeSzenario, parameter, tarifTabellen, aktuellesJahr) {
    const results = [];
    const p = parameter;

    // Bundesland-Daten
    const bl = BUNDESLAENDER[an.bundesland];
    if (!bl) throw new Error("Unbekanntes Bundesland: " + an.bundesland);

    // BBG bestimmen (West oder Ost)
    const bbg = bl.bbg_typ === "BBGWest" ? p.bbg_west : p.bbg_ost;
    const kistSatz = bl.kirchensteuer_satz;

    // Produkt-Tabellen-Prefix
    const prdTab = getProduktPrefix(produkt);

    // Eintrittsalter
    const gebJahr = parseInt(an.geburtsdatum.split(".").pop(), 10);
    const eintA = aktuellesJahr - gebJahr;

    // Ueberschuss-Spalten
    const ueSpalten = getUeberschussSpalten(renditeSzenario);

    // Steuerklassen-Konfiguration
    const sk = STEUERKLASSE_FAKTOREN[an.steuerklasse];

    // Sachsen-Sonderregel PV
    const pvbl = an.bundesland === "Sachsen" ? 0.005 : 0.0;

    // PV-Zuschlag Kinderlose
    const pvz = an.pv_kinder > 0 ? 0 : 1;

    // KiSt-Faktor
    const kistF = an.kirchensteuer ? 1 : 0;

    // Defaults fuer optionale Felder
    const bavAltAn = an.bav_alt_an || 0;
    const bavAltAg = an.bav_alt_ag || 0;
    const agZuschussVwl = an.ag_zuschuss_vwl || 0;

    // -- Schleife ueber alle Beitragsstufen --
    for (let si = 0; si < stufen.length; si++) {
      const stufe = stufen[si];

      // === SCHRITT 1: AG-Zuschuss berechnen ===
      const anbdv = r2((stufe.gesamtbeitrag - stufe.ag_festbetrag) / (1 + stufe.ag_prozent));
      const agGes = r2(
        stufe.ag_festbetrag
        + (stufe.gesamtbeitrag - stufe.ag_festbetrag)
          / (1 + stufe.ag_prozent) * stufe.ag_prozent
      );

      // === SCHRITT 2: Steuerliches Brutto ===
      const stBrutto1 = r2(an.bruttogehalt * 12 - bavAltAn * 12 + agZuschussVwl * 12);
      const stBrutto2 = r2(an.bruttogehalt * 12 - bavAltAn * 12 + agZuschussVwl * 12 - anbdv * 12);

      // === SCHRITT 3: SV-Brutto (gedeckelt auf BBG) ===
      const svBrutto1R = r2(minwert(stBrutto1, bbg) / 12);
      const svBrutto1K = r2(minwert(stBrutto1, p.bbg_gkv) / 12);
      const svBrutto2R = r2(minwert(stBrutto2, bbg) / 12);
      const svBrutto2K = r2(minwert(stBrutto2, p.bbg_gkv) / 12);

      // SV-Brutto MIT bAV + 4%-Grenze Rueckrechnung
      const svBrutto2dR = r2(minwert(
        svBrutto2R + maxwert(
          (bavAltAn + anbdv + bavAltAg + agGes) - p.bbg_west / 12 * 0.04, 0
        ), bbg / 12
      ));
      const svBrutto2dK = r2(minwert(
        svBrutto2K + maxwert(
          (bavAltAn + anbdv + bavAltAg + agGes) - p.bbg_west / 12 * 0.04, 0
        ), p.bbg_gkv / 12
      ));

      // === SCHRITT 4: SV-Beitraege OHNE bAV ===
      let grvb1, gavb1, gkvb1, gpvb1;
      if (svBrutto1R > 2000) {
        grvb1 = svBrutto1R * p.bs_grv / 2;
        gavb1 = svBrutto1R * p.bs_alv / 2;
        gkvb1 = svBrutto1K * (p.bs_gkv + p.dgkv_zus) / 2;
        gpvb1 = svBrutto1K * (
          p.bs_pv / 2
          - Math.max(an.pv_kinder - 1, 0) * 0.0025
          + p.zus_pv * pvz
          + pvbl
        );
      } else {
        // Gleitzone (Uebergangsbereich 556-2000 EUR)
        const faktor = 2000 / (2000 - 556);
        grvb1 = faktor * (svBrutto1R - 556) * p.bs_grv / 2;
        gavb1 = faktor * (svBrutto1R - 556) * p.bs_alv / 2;
        gkvb1 = faktor * (svBrutto1K - 556) * (p.bs_gkv + p.dgkv_zus) / 2;
        gpvb1 = (
          faktor * (svBrutto1K - 556) * (p.bs_pv / 2)
          - Math.max(an.pv_kinder - 1, 0) * 0.0025
          + (
            p.glz_fak * 556
            + (faktor - (556 / (2000 - 556)) * p.glz_fak)
              * (svBrutto1K - 556)
          ) * (p.zus_pv * pvz + pvbl)
        );
      }

      // === SCHRITT 5: SV-Beitraege MIT bAV ===
      let grvb2, gavb2, gkvb2, gpvb2;
      if (svBrutto2dR > 2000) {
        grvb2 = svBrutto2dR * p.bs_grv / 2;
        gavb2 = svBrutto2dR * p.bs_alv / 2;
        gkvb2 = svBrutto2dK * (p.bs_gkv + p.dgkv_zus) / 2;
        gpvb2 = svBrutto2dK * (
          p.bs_pv / 2
          - Math.max(an.pv_kinder - 1, 0) * 0.0025
          + p.zus_pv * pvz
          + pvbl
        );
      } else {
        const faktor = 2000 / (2000 - 556);
        grvb2 = faktor * (svBrutto2dR - 556) * p.bs_grv / 2;
        gavb2 = faktor * (svBrutto2dR - 556) * p.bs_alv / 2;
        gkvb2 = faktor * (svBrutto2dK - 556) * (p.bs_gkv + p.dgkv_zus) / 2;
        gpvb2 = (
          faktor * (svBrutto2dK - 556) * (p.bs_pv / 2)
          - Math.max(an.pv_kinder - 1, 0) * 0.0025
          + (
            p.glz_fak * 556
            + (faktor - (556 / (2000 - 556)) * p.glz_fak)
              * (svBrutto2dK - 556)
          ) * (p.zus_pv * pvz + pvbl)
        );
      }

      // === SCHRITT 6: SV-Vorteil ===
      const svGes1 = (grvb1 + gavb1 + gkvb1 + gpvb1) * 12;
      const svGes2 = (grvb2 + gavb2 + gkvb2 + gpvb2) * 12;
      const svVorteil = svGes1 - svGes2;

      // === SCHRITT 7: Vorsorgepauschale ===
      const vorsP1 = Math.ceil(
        svBrutto1R * 12 * p.bs_grv / 2
        + maxwert(
          minwert(p.hbvp * sk.hbvpf, svBrutto1R * 12 * 0.12),
          svBrutto1K * 12 * (
            (p.ebs_gkv + p.dgkv_zus) / 2
            + p.bs_pv / 2
            - Math.max(an.pv_kinder - 1, 0) * 0.0025
            + p.zus_pv * pvz
            + pvbl
          )
        )
      );

      const vorsP2 = Math.ceil(
        svBrutto2R * 12 * p.bs_grv / 2
        + maxwert(
          minwert(p.hbvp * sk.hbvpf, svBrutto2R * 12 * 0.12),
          svBrutto2K * 12 * (
            (p.ebs_gkv + p.dgkv_zus) / 2
            + p.bs_pv / 2
            - Math.max(an.pv_kinder - 1, 0) * 0.0025
            + p.zus_pv * pvz
            + pvbl
          )
        )
      );

      // === SCHRITT 8: Zu versteuerndes Einkommen ===
      const zvEst1 = Math.trunc(
        (stBrutto1 - vorsP1 - p.anpb - p.sapb - p.hhfb * sk.hfbf) / sk.st_tab
      );
      const zvEst2 = Math.trunc(
        (stBrutto2 - vorsP2 - p.anpb - p.sapb - p.hhfb * sk.hfbf) / sk.st_tab
      );

      // zvE fuer Kirchensteuer (mit Kinderfreibetrag)
      const zvKist1 = Math.trunc(
        (stBrutto1 - vorsP1 - p.anpb - p.sapb - p.hhfb * sk.hfbf) / sk.st_tab
        - p.kifb * an.kinderfreibetrag * sk.kifbf
      );
      const zvKist2 = Math.trunc(
        (stBrutto2 - vorsP2 - p.anpb - p.sapb - p.hhfb * sk.hfbf) / sk.st_tab
        - p.kifb * an.kinderfreibetrag * sk.kifbf
      );

      // === SCHRITT 9: Einkommensteuer ===
      let einkSt1, einkSt2, einkKist1, einkKist2;
      if (an.steuerklasse === 5) {
        einkSt1 = lstKlV(zvEst1, p);
        einkSt2 = lstKlV(zvEst2, p);
        einkKist1 = lstKlV(zvKist1, p);
        einkKist2 = lstKlV(zvKist2, p);
      } else {
        einkSt1 = stBer(zvEst1, p) * sk.st_tab;
        einkSt2 = stBer(zvEst2, p) * sk.st_tab;
        einkKist1 = stBer(zvKist1, p) * sk.st_tab;
        einkKist2 = stBer(zvKist2, p) * sk.st_tab;
      }

      // === SCHRITT 10: Gesamtsteuer (ESt + KiSt + SolZ) ===
      const stGes1 = einkSt1
        + einkKist1 * kistSatz * kistF
        + Math.floor(
            maxwert(
              minwert(
                (einkKist1 - p.fg_solz * sk.fg_solf) * 0.119,
                einkKist1 * p.solz
              ), 0
            ) * 100
          ) / 100;

      const stGes2 = einkSt2
        + einkKist2 * kistSatz * kistF
        + Math.floor(
            maxwert(
              minwert(
                (einkKist2 - p.fg_solz * sk.fg_solf) * 0.119,
                einkKist2 * p.solz
              ), 0
            ) * 100
          ) / 100;

      // === SCHRITT 11: Steuervorteil ===
      const stVorteil = stGes1 - stGes2;

      // === SCHRITT 12: Netto-Ergebnis ===
      const nettoVorteil = r2((svVorteil + stVorteil) / 12);
      const nettoAufwand = r2(anbdv - nettoVorteil);

      // === SCHRITT 13: Tarifwerte interpolieren ===
      const tab35Key = prdTab + "35";
      const tab552Key = prdTab + "552";
      const tab35 = tarifTabellen[tab35Key];
      const tab552 = tarifTabellen[tab552Key];

      let garKapital = 0, kapUeberschuss = 0, garRente = 0, bruttoRente = 0;
      if (tab35 && tab552 && eintA <= 62) {
        garKapital = interpoliereTarifwert(eintA, stufe.gesamtbeitrag, tab35, tab552, "kap_gar");
        kapUeberschuss = interpoliereTarifwert(eintA, stufe.gesamtbeitrag, tab35, tab552, ueSpalten.kap);
        garRente = interpoliereTarifwert(eintA, stufe.gesamtbeitrag, tab35, tab552, "r_gar");
        bruttoRente = interpoliereTarifwert(eintA, stufe.gesamtbeitrag, tab35, tab552, ueSpalten.r);
      }

      // === SCHRITT 14: Laufzeit ===
      const laufzeit = 67 - eintA;

      // === Ergebnis ===
      results.push({
        stufen_name: stufe.name,
        nettobeitrag: nettoAufwand,
        staatliche_foerderung: nettoVorteil,
        entgeltumwandlung: r2(nettoAufwand + nettoVorteil),
        ag_zuschuss: agGes,
        gesamtbeitrag: stufe.gesamtbeitrag,
        monatlicher_vorteil: r2(nettoVorteil + agGes),
        nettobeitrag_gesamtlaufzeit: Math.round(nettoAufwand * 12 * laufzeit),
        garantiertes_kapital: garKapital,
        kapital_inkl_ueberschuss: kapUeberschuss,
        garantierte_rente: garRente,
        bruttorente: bruttoRente,
        sv_vorteil_jahr: svVorteil,
        st_vorteil_jahr: stVorteil,
        eintrittsalter: eintA,
        laufzeit_jahre: laufzeit,
      });
    }

    return results;
  }

  // ========================================================================
  // RUECKWAERTSBERECHNUNG: Wunsch-Netto → Gesamtbeitrag
  // ========================================================================

  function berechneRueckwaerts(an, produkt, renditeSzenario, parameter, tarifTabellen, aktuellesJahr, wunschNetto, agFestbetrag, agProzent) {
    const foerdergrenzen = getFoerdergrenzen(parameter);
    const minGesamt = agFestbetrag + 1;
    const maxGesamt = foerdergrenzen.max_gesamtbeitrag;

    function nettoFuerGesamt(gesamt) {
      const stufe = {
        name: "Rueckwaerts",
        gesamtbeitrag: gesamt,
        ag_festbetrag: agFestbetrag,
        ag_prozent: agProzent,
      };
      const erg = berechneFactsheet(an, [stufe], produkt, renditeSzenario, parameter, tarifTabellen, aktuellesJahr);
      return erg[0];
    }

    // Randwerte pruefen
    const ergMin = nettoFuerGesamt(minGesamt);
    if (wunschNetto <= ergMin.nettobeitrag) {
      return { gesamtbeitrag: minGesamt, ergebnis: ergMin, iterationen: 0, konvergiert: true };
    }

    const ergMax = nettoFuerGesamt(maxGesamt);
    if (wunschNetto >= ergMax.nettobeitrag) {
      return { gesamtbeitrag: maxGesamt, ergebnis: ergMax, iterationen: 0, konvergiert: true };
    }

    // Bisection
    let lo = minGesamt, hi = maxGesamt;
    let iterationen = 0;
    for (let i = 0; i < 60; i++) {
      iterationen = i + 1;
      const mid = (lo + hi) / 2;
      const ergMid = nettoFuerGesamt(mid);
      if (ergMid.nettobeitrag < wunschNetto) {
        lo = mid;
      } else {
        hi = mid;
      }
      if (hi - lo < 0.01) break;
    }

    const gesamtbeitrag = (lo + hi) / 2;
    const ergebnis = nettoFuerGesamt(gesamtbeitrag);

    return {
      gesamtbeitrag: gesamtbeitrag,
      ergebnis: ergebnis,
      iterationen: iterationen,
      konvergiert: (hi - lo) < 0.01,
    };
  }

  // ── Public API ──

  return {
    berechne: berechneFactsheet,
    rueckwaerts: berechneRueckwaerts,
    foerdergrenzen: getFoerdergrenzen,
    waehleProdukt: waehleProduktNachAlter,
    ermittleAgFestbetrag: ermittleAgFestbetrag,
    // Fuer Tests:
    _stBer: stBer,
    _interpoliere: interpoliereTarifwert,
    _klasseV: klasseV,
    _lstKlV: lstKlV,
  };
})();
