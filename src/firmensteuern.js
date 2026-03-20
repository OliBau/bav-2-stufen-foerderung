// ============================================================================
// FIRMENSTEUERN-MODUL (Pure Functions)
// ============================================================================
// Berechnet Firmensteuer-Ersparnis, Gehaltsaequivalenz, Ausschuettungsaequivalenz
// Keine DOM-Zugriffe, kein State, keine Seiteneffekte.
// ============================================================================

const Firmensteuern = (() => {
  "use strict";

  function r2(x) { return Math.round(x * 100) / 100; }

  // ── Betrachtung 1: Firmensteuer-Ersparnis ──
  // KSt 15% + SolZ 5,5% auf KSt = 15,825%
  // GewSt: Messzahl 3,5% x Hebesatz
  // Seit 2008: GewSt NICHT als Betriebsausgabe abziehbar (§4 Abs.5b EStG)

  function berechneFirmensteuerErsparnis(beitrag_pa, hebesatz_pct) {
    const kst_satz = 0.15;
    const solz_auf_kst = kst_satz * 0.055;
    const kst_effektiv = kst_satz + solz_auf_kst;  // 15,825%
    const gewst_effektiv = (hebesatz_pct / 100) * 0.035;

    const kst_ersparnis = r2(beitrag_pa * kst_effektiv);
    const gewst_ersparnis = r2(beitrag_pa * gewst_effektiv);
    const nettoaufwand = r2(beitrag_pa - kst_ersparnis - gewst_ersparnis);

    return {
      beitrag_pa,
      kst_ersparnis,
      gewst_ersparnis,
      steuerersparnis_gesamt: r2(kst_ersparnis + gewst_ersparnis),
      nettoaufwand,
      kst_satz_effektiv: kst_effektiv,
      gewst_satz_effektiv: gewst_effektiv,
      effektive_kostenquote: r2(nettoaufwand / beitrag_pa),
    };
  }

  // ── Betrachtung 2: Aequivalenz Gehaltserhoehung ──
  // GGF = beherrschend → keine SV-Pflicht
  // Grenzsteuersatz via §32a EStG Ableitung

  function berechneGrenzsteuersatz(jahresgehalt, steuerklasse, parameter) {
    const p = parameter;
    const sk = STEUERKLASSE_FAKTOREN[steuerklasse];

    // Vorsorgepauschale (vereinfacht fuer GGF ohne SV)
    const vorsP = Math.ceil(jahresgehalt * p.bs_grv / 2);
    const zvE = Math.trunc(
      (jahresgehalt - vorsP - p.anpb - p.sapb - p.hhfb * sk.hfbf) / sk.st_tab
    );

    // §32a EStG Grenzsteuersatz (Ableitung der Tarifformel)
    const y = (zvE - p.sgfb) / 10000;
    const z = (zvE - p.stew1) / 10000;

    let grenzsteuersatz;
    if (zvE <= p.sgfb) {
      grenzsteuersatz = 0;
    } else if (zvE <= p.stew1) {
      grenzsteuersatz = (2 * p.sfak1 * y + p.szus1) / 10000;
    } else if (zvE <= p.stew2) {
      grenzsteuersatz = (2 * p.sfak2 * z + p.szus2) / 10000;
    } else if (zvE <= p.stew3) {
      grenzsteuersatz = p.sfak3;
    } else {
      grenzsteuersatz = p.sfak4;
    }

    return Math.min(grenzsteuersatz * sk.st_tab, 0.45);
  }

  function berechneGehaltsaequivalenz(sparbetrag_pm, jahresgehalt, steuerklasse,
                                       kirchensteuerpflichtig, kist_satz, parameter) {
    const grenzsteuersatz = berechneGrenzsteuersatz(jahresgehalt, steuerklasse, parameter);

    // SolZ marginal (voller Satz, GGF-Gehaelter ueber Freigrenze)
    const solz_marginal = grenzsteuersatz * 0.055;

    // KiSt marginal
    const kist_marginal = kirchensteuerpflichtig
      ? grenzsteuersatz * kist_satz / (1 + kist_satz)
      : 0;

    // SV = 0 (beherrschender GGF)
    const gesamtabzugsquote = grenzsteuersatz + solz_marginal + kist_marginal;

    const brutto_erhoehung_pm = r2(sparbetrag_pm / (1 - gesamtabzugsquote));
    const steuerabzug_pm = r2(brutto_erhoehung_pm - sparbetrag_pm);

    return {
      sparbetrag_pm,
      sparbetrag_pa: r2(sparbetrag_pm * 12),
      brutto_erhoehung_pm,
      brutto_erhoehung_pa: r2(brutto_erhoehung_pm * 12),
      steuerabzug_pm,
      steuerabzug_pa: r2(steuerabzug_pm * 12),
      netto_pm: sparbetrag_pm,
      grenzsteuersatz,
      solz_marginal,
      kist_marginal,
      gesamtabzugsquote,
    };
  }

  // ── Betrachtung 3: Aequivalenz Gewinnausschuettung ──
  // Abgeltungsteuer: 25% + SolZ 1,375% = 26,375%
  // KiSt auf AbgSt: 25% x KiSt_Satz / (1 + KiSt_Satz)

  function berechneAusschuettungsaequivalenz(sparbetrag_pa, kirchensteuerpflichtig, kist_satz) {
    const abgst = 0.25;
    const solz = abgst * 0.055;  // 1,375%
    const kist = kirchensteuerpflichtig ? abgst * kist_satz / (1 + kist_satz) : 0;
    const steuer_effektiv = abgst + solz + kist;

    const brutto_ausschuettung = r2(sparbetrag_pa / (1 - steuer_effektiv));
    const steuerabzug = r2(brutto_ausschuettung - sparbetrag_pa);

    return {
      brutto_ausschuettung,
      steuer_effektiv,
      steuerabzug,
      netto: sparbetrag_pa,
    };
  }

  // ── Vergleich bAV vs. Ausschuettung ──

  function berechneVergleich(beitrag_pa, hebesatz_pct, kirchensteuerpflichtig, kist_satz) {
    const firmensteuer = berechneFirmensteuerErsparnis(beitrag_pa, hebesatz_pct);
    const ausschuettung = berechneAusschuettungsaequivalenz(beitrag_pa, kirchensteuerpflichtig, kist_satz);

    return {
      bav: {
        firmenaufwand_pa: beitrag_pa,
        steuerersparnis: firmensteuer.steuerersparnis_gesamt,
        nettoaufwand: firmensteuer.nettoaufwand,
      },
      ausschuettung: {
        firmenaufwand_pa: ausschuettung.brutto_ausschuettung,
        steuerersparnis: 0,
        nettoaufwand: ausschuettung.brutto_ausschuettung,
      },
      vorteil_bav: r2(ausschuettung.brutto_ausschuettung - firmensteuer.nettoaufwand),
    };
  }

  // ── Public API ──

  return {
    firmensteuerErsparnis: berechneFirmensteuerErsparnis,
    gehaltsaequivalenz: berechneGehaltsaequivalenz,
    ausschuettungsaequivalenz: berechneAusschuettungsaequivalenz,
    vergleich: berechneVergleich,
    grenzsteuersatz: berechneGrenzsteuersatz,
  };
})();
