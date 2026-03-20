# SPEC.md – bAV 2-Stufen-Förderung: Vollständige Spezifikation

> Erarbeitet: 20.03.2026 (Cowork-Session)
> Erweitert: 20.03.2026 – Leistungsdarstellung (Abschnitt 6) hinzugefügt
> Status: Freigegeben für Phase 1

---

## 1. Projektbeschreibung

Interaktiver Rechner für die **firmenfinanzierte betriebliche Altersvorsorge in zwei Stufen**
für Gesellschafter-Geschäftsführer (GGF) einer GmbH.

**Zwei-Stufen-Konzept:**
- **Stufe 1 – Direktversicherung:** Max. 676 €/Monat (= 8 % der BBG 2026 = 8.112 €/Jahr)
- **Stufe 2 – Unterstützungskasse (UK):** Unbegrenzt, keine gesetzliche Obergrenze

Beide Stufen sind **firmenfinanziert** (der Beitrag kommt vollständig vom Unternehmen,
nicht vom Gehalt des GGF). Der Rechner zeigt vier Perspektiven:

1. Was kostet es die Firma wirklich? (nach Firmensteuern)
2. Was würde eine Gehaltserhöhung kosten, die denselben Effekt erzielt?
3. Was würde eine Gewinnausschüttung kosten, die denselben Effekt erzielt?
4. Was kommt dabei für den GGF raus? (Leistungsdarstellung: Kapital + Rente bei Renteneintritt)

---

## 2. Eingaben

### 2.1 Unternehmensblock

| Feld | Typ | Vorbelegung | Validierung |
|---|---|---|---|
| Bundesland | Dropdown (16 Länder) | Nordrhein-Westfalen | Pflicht |
| Rechtsform | Fest: GmbH | GmbH | v1 nur GmbH |
| Gewerbesteuerhebesatz | Zahl (%) | 400 | 200–900, überschreibbar |
| Gewinnermittlung | Fest: Bilanzierung | Bilanzierung | v1 fix |

**Hinweis im UI:** Gewerbesteuerhebesatz ist ortsabhängig. Standardwert 400 % (NRW-Durchschnitt).
Tatsächlichen Hebesatz beim zuständigen Finanzamt erfragen.

### 2.2 GGF-Personalblock

| Feld | Typ | Vorbelegung | Hinweis |
|---|---|---|---|
| Geburtsdatum | Datum (TT.MM.JJJJ) | – | Pflicht; wird für Eintrittsalter + Produktregel benötigt |
| Monatsgehalt brutto | Zahl (€) | – | Pflicht |
| Anzahl Monatsgehälter | Zahl | 12 | Überschreibbar (z.B. 13 für Weihnachtsgeld) |
| Steuerklasse | Dropdown I–V | I | – |
| Anzahl Kinderfreibeträge | Zahl (0,5er-Schritte) | 0 | z.B. 1,0 für 2 Kinder |
| Kirchensteuer | Toggle | nein | Beeinflusst ESt-Berechnung |
| Krankenversicherung | Toggle | PKV | PKV oder GKV freiwillig |

**Altersregel (Produktverfügbarkeit):**
Eintrittsalter = aktuelles Jahr − Geburtsjahr.

| Eintrittsalter | Produkt | Mindestlaufzeit | Hinweis |
|---|---|---|---|
| ≤ 55 | FondsRente 70% | 12 Jahre (67−55) | Standardfall |
| ≥ 56 | AnsparRente | keine Mindestlaufzeit | z.B. GGF 60 J. → 7 Jahre bis 67 |

**Kurze Laufzeiten sind kein Fehler** – ein GGF mit 62 Jahren, der 5.000 €/Monat
in die UK einzahlt, macht das steuerlich motiviert (UK-Beiträge als Betriebsausgabe).
Der Rechner darf keine Laufzeit-Untergrenze einbauen oder warnen.
AnsparRente-Tabellen aus `02-fallback-data.js` müssen solche kurzen Laufzeiten abdecken.

Bei Alter ≥ 56: Stiller Produkt-Wechsel (kein UI-Banner), da AnsparRente der normale
Folgeweg ist und keine Einschränkung darstellt.

**GKV-Hinweis:** Bei GGF mit Gehalt über BBG GKV (5.512,50 €/Monat in 2026) hat die KV-Wahl
keinen Einfluss auf die Äquivalenzrechnung (kein Zusatzbeitrag auf Gehaltserhöhung).
Der Rechner prüft dies und blendet einen Hinweis ein wenn relevant.

**SV-Annahme:** Beherrschender GGF (≥ 50 % Anteile) ist nicht sozialversicherungspflichtig.
Keine SV-Abzüge in den Äquivalenzrechnungen. Hinweis im UI.

### 2.3 BAV-Block

**Modus-Auswahl (Radio/Tabs):**

#### Modus A – Nur Stufe 2 (Unterstützungskasse)
- Direktversicherung vollständig außen vor
- Eingabe: UK-Beitrag (€/Monat), Freifeld

#### Modus B – Stufe 1 + Stufe 2 getrennt
- Feld: „Bereits genutzter DV-Beitrag (€/Monat)" → Vorbelegung 0
- Anzeige: „Verbleibender Spielraum DV: X €/Monat" (= 676 − bereits genutzt)
- Feld: Beitrag Stufe 1 (neu) → Vorbelegung = verbleibender Spielraum, max = verbleibender Spielraum
- Feld: Beitrag Stufe 2 UK → Freifeld

#### Modus C – Gesamtbeitrag mit automatischer Verteilung
- Feld: „Bereits genutzter DV-Beitrag (€/Monat)" → Vorbelegung 0
- Feld: Gesamtbeitrag (€/Monat) → Freifeld
- Automatische Verteilung: Stufe 1 = min(Gesamtbeitrag, verbleibender Spielraum), Stufe 2 = Rest
- **Anzeige der Verteilung:** z.B. „376 € Direktversicherung + 1.624 € Unterstützungskasse"
- **Manuelle Überschreibung:** Beide Werte (Stufe 1 und Stufe 2) bleiben editierbar.
  Nutzer kann z.B. 376 € → 400 € runden. Summe muss nicht zwingend dem Gesamtbeitrag
  entsprechen – bei Abweichung wird die Summe neu angezeigt.
- **Source of Truth nach Überschreibung:** Nach manueller Eingabe sind die Einzelwerte
  (Stufe 1 und Stufe 2) die führenden Größen für alle Berechnungen. Das Gesamtbeitrags-Feld
  aktualisiert sich auf deren Summe und dient danach nur noch als Anzeige. Der initiale
  Gesamtbeitrag ist nur der Startpunkt für die automatische Verteilung.

**Gemeinsame Regel für alle Modi:**
Bestehende DV-Beiträge fließen **nicht** in die Vorteilsberechnung ein.
Die Betrachtungen zeigen ausschließlich den Vorteil der **neuen** Beiträge.

---

## 3. Betrachtung 1 – Unternehmensebene

### Berechnungslogik

```
Neuer Gesamtbeitrag p.a. = (Beitrag_Stufe1_neu + Beitrag_Stufe2) × Anzahl_Monatsgehälter
```

Beide Stufen wirken steuerlich identisch als **Betriebsausgabe**.

**Körperschaftsteuer-Ersparnis (KSt + SolZ):**
```
KSt_Satz = 15 %
SolZ_auf_KSt = 5,5 % × 15 % = 0,825 %
Effektiver_KSt_Satz = 15,825 %
KSt_Ersparnis = Gesamtbeitrag_p.a. × 15,825 %
```

**Gewerbesteuer-Ersparnis:**
```
GewSt_Messzahl = 3,5 %
GewSt_Satz_effektiv = Hebesatz × 3,5 % / 100
  → Beispiel 400 %: 14,0 %
GewSt_Ersparnis = Gesamtbeitrag_p.a. × GewSt_Satz_effektiv
```

**Rechtlicher Hinweis (im UI als Info-Icon):**
Seit der Unternehmensteuerreform 2008 ist die Gewerbesteuer nicht mehr als Betriebsausgabe
abziehbar (§ 4 Abs. 5b EStG). KSt und GewSt werden unabhängig voneinander auf dieselbe
Bemessungsgrundlage berechnet. Diese Vereinfachung ist für die Beratungsindikation geeignet.

**Nettoaufwand:**
```
Nettoaufwand_p.a. = Gesamtbeitrag_p.a. − KSt_Ersparnis − GewSt_Ersparnis
Effektive_Kostenquote = Nettoaufwand_p.a. / Gesamtbeitrag_p.a. × 100 %
```

### Ausgabe Betrachtung 1

```
Jährlicher Beitrag (neu):           XX.XXX €   [davon Stufe 1: X.XXX € / Stufe 2: X.XXX €]
− Körperschaftsteuerersparnis:       X.XXX €   (15,825%)
− Gewerbesteuerersparnis:            X.XXX €   (14,0% bei Hebesatz 400%)
= Nettoaufwand Firma p.a.:          XX.XXX €
  → Firma trägt effektiv XX,X% des Beitrags
```

Visualisierung: Horizontaler gestapelter Balken (wie bav-dashboard):
- Dunkel: Nettoaufwand
- Hellblau: KSt-Ersparnis
- Hellbeige/Grau: GewSt-Ersparnis

---

## 4. Betrachtung 2 – Äquivalenz: Gehaltserhöhung

### Rechenlogik

Frage: Wie viel Brutto-Gehaltserhöhung bräuchte der GGF, damit er netto denselben
Betrag (= neuer Gesamtbeitrag p.m.) privat sparen kann?

```
Jahresgehalt = Monatsgehalt × Anzahl_Monatsgehälter
Grenzsteuersatz = ESt-Grenzsteuersatz via Rechenkern (§ 32a EStG)
SolZ_marginal = Grenzsteuersatz × 5,5 % (nur wenn über Freigrenze)
KiSt_marginal = Grenzsteuersatz × KiSt_Satz (wenn Kirchensteuer aktiv)
SV_marginal = 0 (beherrschender GGF)

Gesamtabzugsquote_marginal = Grenzsteuersatz + SolZ_marginal + KiSt_marginal

Sparbetrag_p.m. = Neuer Gesamtbeitrag p.m.
Benötigte_Gehaltserhöhung_brutto_p.m. = Sparbetrag_p.m. / (1 − Gesamtabzugsquote_marginal)
```

**Kirchensteuer-Berechnung:**
Kirchensteuersatz: Bayern und Baden-Württemberg = 8 %, alle anderen 14 Bundesländer (inkl. NRW) = 9 %.
Quelle: `BUNDESLAENDER`-Objekt in `02-fallback-data.js` – der Rechner liest den Satz daraus, nicht hardcoded.
Da KiSt die ESt-Bemessungsgrundlage nicht direkt mindert (vereinfachte Darstellung):
`KiSt_effektiv = Grenzsteuersatz × KiSt_Satz / (1 + KiSt_Satz)`

### Ausgabe Betrachtung 2

```
Für denselben privaten Sparbetrag (XX.XXX €/Jahr) wäre nötig:

Brutto-Gehaltserhöhung:   X.XXX €/Monat (= XX.XXX €/Jahr)
Davon Lohnsteuer + SolZ:  X.XXX €/Monat
Netto beim GGF:           X.XXX €/Monat (= Sparbetrag)

ℹ Anmerkung: Beherrschender GGF ohne SV-Pflicht angenommen.
  Diese Rechnung vergleicht den Einzahlungsvorteil, nicht die Auszahlungsphase
  (bAV wird nachgelagert besteuert).
```

---

## 5. Betrachtung 3 – Äquivalenz: Gewinnausschüttung

### Steuersystematik (kritische Prüfung)

Dividenden kommen aus bereits versteuertem Unternehmensgewinn – **kein Betriebsausgabenabzug**
für die GmbH. Besteuerung beim GGF über:

**Standard: Abgeltungsteuer (§ 32d Abs. 1 EStG)**
```
AbgSt = 25 %
SolZ_auf_AbgSt = 5,5 % × 25 % = 1,375 %
KiSt (wenn aktiv): ca. 25 % × KiSt_Satz / (1 + KiSt_Satz)
Effektive_Ausschüttungssteuer (ohne KiSt) = 26,375 %
```

**Alternative: Teileinkünfteverfahren (§ 32d Abs. 2 Nr. 3 EStG)**
Wählbar bei GGF mit ≥ 25 % Beteiligung und beruflicher Tätigkeit.
60 % der Dividende × persönlicher Grenzsteuersatz.
Ab ~43,5 % Grenzsteuersatz ist Abgeltungsteuer günstiger.
→ Im Rechner: Hinweis, Abgeltungsteuer als Default (konservativ).

### Rechenlogik

```
Sparbetrag_p.a. = Neuer Gesamtbeitrag p.a.
Brutto_Ausschüttung = Sparbetrag_p.a. / (1 − Ausschüttungssteuer_effektiv)
  → Beispiel ohne KiSt: Sparbetrag / 0,73625
```

Die GmbH zahlt die Brutto-Ausschüttung aus **Nachsteuergewinn** – kein Steuervorteil.

### Vergleichsdarstellung

```
Vergleich: Welchen Aufwand hat die Firma für X.XXX €/Jahr Altersvorsorge für den GGF?

                      bAV (firmenfinanziert)    Gewinnausschüttung
Firmen-Aufwand p.a.   XX.XXX €                  XX.XXX €
Steuerersparnis        X.XXX €                      0 €
Nettoaufwand Firma    XX.XXX €                  XX.XXX €
Vorteil bAV:          XX.XXX € günstiger

ℹ Die Gewinnausschüttung enthält keinen Betriebsausgabenabzug.
  Die bAV spart XX,X% Firmensteuern – das ist der strukturelle Vorteil.
  Hinweis: Teileinkünfteverfahren kann bei niedrigem Grenzsteuersatz günstiger sein.
  Auszahlungsphase nicht berücksichtigt (nachgelagerte Besteuerung bAV).
```

### Toggles

Betrachtung 2 und Betrachtung 3 sind einzeln ein-/ausblendbar.
Default: beide eingeblendet.

---

## 6. Leistungsdarstellung (Ablaufleistung)

### 6.1 Rendite-Szenario: Berater-Auswahl

Der Rendite-Toggle ist eine **Einfachauswahl** – es wird immer nur ein Szenario angezeigt,
nicht alle vier gleichzeitig. Mehrere Szenarien nebeneinander erzeugen zu viele Zahlen
und nehmen dem Berater die Orientierungsfunktion.

**UI: Pill-Button-Gruppe, eines aktiv:**
```
[ 1,5% ]  [ 3,0% ]  [ 4,5% ]  [ 6,0% ← default, aktiv/hervorgehoben ]
```

Default: **6,0 %** (konservative Mindestrendite FondsRente).
Bei Wechsel: alle Leistungswerte in Sektion 5 aktualisieren sich live – alle anderen
Berechnungsblöcke (Firmensteuern, Äquivalenz) bleiben unverändert.

**Berater-Logik:** Der Berater wählt das für das Gespräch passende Szenario und kann
im Gespräch live zwischen den Szenarien wechseln, um die Robustheit des Vorteils zu zeigen.

Interner Key für Rechenkern: `"1,5"` | `"3,0"` | `"4,5"` | `"6,0"` (Komma als Dezimaltrennzeichen).

### 6.2 Rechenlogik

**Produktregel (verbindlich):**
```
Eintrittsalter ≤ 55  →  FondsRente 70%     (Mindestlaufzeit: 67 − 55 = 12 Jahre ✓)
Eintrittsalter ≥ 56  →  AnsparRente        (auch kurze Laufzeiten möglich, z.B. 5 Jahre)
```

Kurze Laufzeiten (z.B. GGF mit 60 Jahren, 5 Jahre UK-Beiträge 4.000–5.000 €/Monat)
sind ein valides Beratungsszenario – primär steuerlich motiviert, nicht renditegetrieben.
Der Rechner muss diese Konstellation korrekt verarbeiten (kein Mindestlaufzeit-Block).
AnsparRente-Tariftabellen aus `02-fallback-data.js` abdecken solche kurzen Laufzeiten.

```javascript
// Eingaben für Rechenkern
const eintrittsalter = aktuellesJahr - geburtsjahr;
const laufzeit = 67 - eintrittsalter;   // Rentenalter fix 67
const produkt = waehleProduktNachAlter(eintrittsalter, produktRegeln);
// Ergibt: FondsRente 70% bei Alter ≤ 55, AnsparRente bei Alter ≥ 56

// Stufe 1 – Direktversicherung (nur wenn Beitrag > 0)
const leistung_dv = berechneFactsheet(
  { geburtsdatum: geburtsdatum },
  [{ gesamtbeitrag: beitrag_stufe1_neu }],
  produkt, renditeSzenario, parameter, tarifTabellen, aktuellesJahr
);

// Stufe 2 – Unterstützungskasse (nur wenn Beitrag > 0)
const leistung_uk = berechneFactsheet(
  { geburtsdatum: geburtsdatum },
  [{ gesamtbeitrag: beitrag_stufe2 }],
  produkt, renditeSzenario, parameter, tarifTabellen, aktuellesJahr
);

// Konsolidiert
const gesamt = {
  kapital_garantiert:     leistung_dv.garantiertes_kapital     + leistung_uk.garantiertes_kapital,
  kapital_inkl_ueberschuss: leistung_dv.kapital_inkl_ueberschuss + leistung_uk.kapital_inkl_ueberschuss,
  rente_garantiert:       leistung_dv.garantierte_rente        + leistung_uk.garantierte_rente,
  rente_inkl_ueberschuss: leistung_dv.bruttorente              + leistung_uk.bruttorente,
};
```

**Wichtig:** Bestehende DV-Altverträge fließen **nicht** in die Leistungsdarstellung ein –
nur die neuen Beiträge (Stufe 1 neu + Stufe 2) werden gerechnet.

### 6.3 UI-Design: Drei-Ebenen-Architektur

**Ebene 1 – Laufzeit-Bar (visuell, ganz oben in der Sektion):**
```
Heute  [Alter: 42]  ████████████████░░░░░░░░░░  Renteneintritt 67  (in 25 Jahren)
```
Einfache CSS-Progressbar. Macht die Laufzeit greifbar.

**Ebene 2 – Zwei Stage-Cards nebeneinander (kleinere Darstellung):**

Jede Card zeigt den **Hebel** pro Stufe: was wurde eingezahlt, was kommt raus.
Damit wird der Zinseszins-Effekt visuell greifbar – nicht nur das Endergebnis.

```
┌─────────────────────────────┐   ┌─────────────────────────────┐
│  STUFE 1                    │   │  STUFE 2                    │
│  Direktversicherung         │   │  Unterstützungskasse        │
│  376 €/Monat                │   │  1.650 €/Monat              │
│  → 113.280 € über 25 Jahre  │   │  → 495.000 € über 25 Jahre  │
│  ─────────────────          │   │  ─────────────────          │
│  Kapital:  223.500 €        │   │  Kapital:  1.020.300 €      │
│  (gar.:    89.200 €)        │   │  (gar.:    408.100 €)       │
│  Rente:    637 €/Monat      │   │  Rente:    2.904 €/Monat    │
│  (gar.:    255 €/Monat)     │   │  (gar.:    1.162 €/Monat)   │
└─────────────────────────────┘   └─────────────────────────────┘
```

Beitrag über Gesamtlaufzeit = `beitrag_p.m. × 12 × laufzeit_jahre` (Nominalwert, kein Zins).
Damit sieht man: Firma zahlt X ein nominal → Y kommt raus → das ist der Faktor.

Wenn nur ein Modus aktiv (z.B. nur UK), wird nur eine Card angezeigt (volle Breite).

**Ebene 3 – Consolidated Hero-Card (volle Breite, dark, dominant):**
```
┌───────────────────────────────────────────────────────────────────┐
│  IHRE GESAMTLEISTUNG BEI RENTENEINTRITT (Alter 67)               │
│                                                                   │
│    1.243.800 €                     3.541 €/Monat                 │
│    Kapitalleistung                 Monatliche Rente               │
│    (davon garantiert: 497.300 €)   (davon garantiert: 1.417 €)   │
│                                                                   │
│  ─────────────────────────────────────────────────────────────── │
│  ✓ Die Firma trägt effektiv nur 16.842 €/Jahr nach Steuern       │
│    für 24.000 €/Jahr Altersvorsorge – der Hebel: 1 : 1,43        │
└───────────────────────────────────────────────────────────────────┘
```

Farben Hero-Card: Dunkelblau (`--primary-dark`) Hintergrund, weiße Schrift.
Kapital-Zahl: sehr groß (`clamp(2rem, 5vw, 3.5rem)`), Renten-Zahl: groß.
Garantie-Hinweis: dezent, `opacity: .75`.
Grüne Zeile unten: verbindet Leistung mit der Unternehmensbetrachtung (Hebel-Effekt).

### 6.4 Hinweistexte (im UI)

- **Kein Alters-Banner nötig** – FondsRente/AnsparRente-Wechsel ist ein stiller interner
  Produktwechsel, keine Einschränkung. Berater kennen die Regel.
- **Unter dem Rendite-Toggle** (klein, dezent): „Renditeszenario gilt für inkl. Überschuss-Werte.
  Garantiewerte sind unabhängig vom gewählten Szenario."
- **Unter dem Hero-Block**: „Die Leistungswerte basieren auf den Tariftabellen 2026 (Zürich).
  Garantiewerte sind verbindlich; Überschussbeteiligungen können variieren.
  Die bAV-Leistungen unterliegen der nachgelagerten Einkommensteuer bei Auszahlung."

---

## 7. UI-Struktur (aktualisiert)

```
┌─────────────────────────────────────────────────────┐
│  HEADER (Gradient, neutral)                          │
│  Titel: "bAV 2-Stufen-Förderung für GGF" + Untertitel│
│  Hero-Pills: Anchors zu den vier Sektionen          │
├─────────────────────────────────────────────────────┤
│  INFO-SEKTIONEN (wie bav-dashboard)                  │
│  „So funktioniert die 2-Stufen-Förderung"           │
│  4 Info-Karten: DV / UK / Firmensteuern / GGF-Vorteil│
├─────────────────────────────────────────────────────┤
│  [1] EINGABEN                                        │
│  ┌──────────────────┐  ┌──────────────────────────┐ │
│  │ Unternehmens-    │  │ GGF-Personal-            │ │
│  │ daten            │  │ daten (inkl. Geburtsdatum)│ │
│  └──────────────────┘  └──────────────────────────┘ │
│  ┌─────────────────────────────────────────────────┐ │
│  │ BAV-Block: Modus A / B / C  (Tabs)             │ │
│  └─────────────────────────────────────────────────┘ │
│  [Berechnen]-Button                                  │
├─────────────────────────────────────────────────────┤
│  [2] BETRACHTUNG 1 – Unternehmensebene              │
│  Balkendiagramm + Tabelle (KSt / GewSt / Netto)    │
├─────────────────────────────────────────────────────┤
│  [3] BETRACHTUNG 2 – Gehaltserhöhung  [Toggle ▼]   │
│  Vergleichstabelle + Hinweis                        │
├─────────────────────────────────────────────────────┤
│  [4] BETRACHTUNG 3 – Gewinnausschüttung  [Toggle ▼] │
│  Vergleichstabelle + Hinweis                        │
├─────────────────────────────────────────────────────┤
│  [5] LEISTUNGSDARSTELLUNG                           │
│  Rendite-Toggle: [1,5%] [3,0%] [4,5%] [6,0%]      │
│  Laufzeit-Bar (Alter → 67)                         │
│  Stage-Cards: Stufe 1 | Stufe 2                    │
│  Hero-Card: Gesamt Kapital + Rente + Hebel-Zeile   │
│  Hinweistexte                                       │
├─────────────────────────────────────────────────────┤
│  FOOTER / Berater-Kontakt (v1: neutral/leer)        │
└─────────────────────────────────────────────────────┘
```

---

## 7. Design-System (aus bav-dashboard übernehmen)

**CSS-Variablen (neutrale Version v1):**
```css
--primary: #003B7E;
--primary-dark: #1A2E4A;
--primary-medium: #4A90C4;
--primary-light: #D6E8F7;
--bg: #EBF3FA;
--card: #FFFFFF;
--text: #1A2E4A;
--text-muted: #6B7B8D;
--radius: 8px;
--font: 'Arial', 'Helvetica Neue', sans-serif;
```

**Balkenfarben:**
```css
--c-nettoaufwand: #1A2E4A;   /* dunkelblau – Nettoaufwand */
--c-kst: #4A90C4;            /* mittelblau – KSt-Ersparnis */
--c-gewst: #B0C4D8;          /* hellblau – GewSt-Ersparnis */
--c-vorteil: #27AE60;        /* grün – Vorteil bAV ggü. Ausschüttung */
```

**Referenz-Dateien für Claude Code:**
- CSS-Klassen: `../bav-dashboard/output/Muster GmbH & Co. KG/bav-dashboard_Muster-GmbH-Co-KG_L.html`
- Struktur-Referenz: `../bav-dashboard/template/master-dashboard-leistung.html`

---

## 8. Rechenkern-Integration

### Benötigte Funktionen aus 03-rechenkern.js

Der Rechenkern (506 Zeilen, validiert mit 174/174 Tests) liefert:

```javascript
// Steuerberechnung (wird für Äquivalenzrechnung Gehaltserhöhung benötigt)
berechneSteuer(jahresgehalt, steuerklasse, kinderfreibetraege, kirchensteuerpflichtig,
               bundesland, krankenversicherung, jahresparameter)
// → gibt zurück: { lohnsteuer, solz, kist, sv_gesamt, netto, grenzsteuersatz }

// Tarifwerte (optional, für spätere Rentenprognose)
getTarifwert(produkt, laufzeit, beitrag)
```

### Neues Modul: firmensteuern.js

```javascript
// KSt + SolZ Ersparnis
function berechneFirmensteuerErsparnis(beitrag_pa, hebesatz_pct) {
  const kst_satz = 0.15;
  const solz_auf_kst = kst_satz * 0.055;
  const kst_effektiv = kst_satz + solz_auf_kst;   // 15,825 %
  const gewst_effektiv = (hebesatz_pct / 100) * 0.035;
  return {
    beitrag_pa,
    kst_ersparnis: beitrag_pa * kst_effektiv,
    gewst_ersparnis: beitrag_pa * gewst_effektiv,
    nettoaufwand: beitrag_pa * (1 - kst_effektiv - gewst_effektiv),
    kst_satz_effektiv: kst_effektiv,
    gewst_satz_effektiv: gewst_effektiv,
  };
}

// Ausschüttungsäquivalenz
function berechneAusschuettungsaequivalenz(sparbetrag_pa, kirchensteuerpflichtig, kist_satz) {
  const abgst = 0.25;
  const solz = abgst * 0.055;
  const kist = kirchensteuerpflichtig ? abgst * kist_satz / (1 + kist_satz) : 0;
  const steuer_effektiv = abgst + solz + kist;
  const brutto_ausschuettung = sparbetrag_pa / (1 - steuer_effektiv);
  return { brutto_ausschuettung, steuer_effektiv, netto: sparbetrag_pa };
}
```

---

## 9. Jahresparameter 2026

Aus bav-factsheet/src/02-fallback-data.js übernehmen:

| Parameter | Wert 2026 |
|---|---|
| BBG RV West | **8.450 €/Monat (101.400 €/Jahr)** |
| BBG GKV | 5.512,50 €/Monat (66.150 €/Jahr) |
| DV-Höchstbeitrag (8 % × 101.400 €/Jahr) | 8.112 €/Jahr = **676 €/Monat** |

> **Quelle:** `bbg_west: 101400` aus `bav-factsheet/src/02-fallback-data.js` (PARAMETER_2026_FALLBACK).
> Im UI als dynamischen Wert aus den Jahresparametern ableiten, nicht hardcoden.
> Formel: `DV_max_monat = Math.trunc(parameter.bbg_west * 0.08 / 12)` → 676 €/Monat.

---

## 10. Deployment

```
GitHub Repo: OliBau/bav-2-stufen-foerderung (privat anlegen, dann für Pages public)
Branch: main
GitHub Pages: /docs/index.html oder main branch root
URL: https://olibau.github.io/bav-2-stufen-foerderung/
```

Build-Output `stufen-rechner-build.html` → als `docs/index.html` committen.

---

## 11. Abnahme-Dokumentation (nach Fertigstellung des Tools)

Nach Abschluss von Phase 1 werden zwei PDF-Dokumente erstellt – kein Firmenbranding,
professionell gesetzt. Erstellung via `pdf`-Skill (`skills/pdf/SKILL.md`).

---

### 11.1 Dokument A – Fachberater-Dokumentation (bAV-Berater)

**Zielgruppe:** BAV-Fachberater, der das Tool vor dem Einsatz verstehen und beurteilen möchte.

**Inhalt:**

*Abschnitt 1 – Wofür ist der Rechner?*
Kurzbeschreibung Konzept 2-Stufen-Förderung, Zielgruppe GGF, firmenfinanzierte bAV.
Unterschied DV (Stufe 1, 676 €/Monat max.) vs. UK (Stufe 2, unbegrenzt).

*Abschnitt 2 – Eingaben und was sie bewirken*
Tabellarische Übersicht aller Eingabefelder mit Erläuterung – für jeden Berater
verständlich, keine Code-Beschreibung. Besonders: Modus A/B/C, Bestandsverträge,
Gewerbesteuerhebesatz, Geburtsdatum.

*Abschnitt 3 – Die vier Ergebnisblöcke*
Was zeigt Unternehmensbetrachtung, Gehaltserhöhungs-Äquivalenz, Ausschüttungs-Äquivalenz
und Leistungsdarstellung jeweils? Was kann man damit im Beratungsgespräch machen?

*Abschnitt 4 – Leistungsdarstellung: Grundlagen*
Welches Produkt? (FondsRente 70% bis 55, AnsparRente ab 56) Woher kommen die Tarifwerte?
(Zürich-Tariftabellen 2026, interpoliert zwischen 35 € und 552 € Referenzbeitrag)
Was bedeuten Garantiewert / inkl. Überschuss / Rendite-Szenarien 1,5 % / 3,0 % / 4,5 % / 6,0 %?
Rentenalter fix 67. Laufzeit = 67 − Eintrittsalter.

*Abschnitt 5 – Was der Rechner nicht leistet*
Auszahlungsphase (nachgelagerte Besteuerung nicht modelliert), kein Produktvergleich,
Annahmen zur SV-Pflicht, nur GmbH als Rechtsform.

---

### 11.2 Dokument B – Steuerliche Prüfungsunterlage (Steuerberater)

**Zielgruppe:** Steuerberater, der die steuerliche Korrektheit der Berechnungslogik prüft.

**Inhalt:**

*Abschnitt 1 – Unternehmensbetrachtung: Steuerliche Grundlagen*
- Beiträge zur firmenfinanzierten bAV = Betriebsausgabe nach § 4 Abs. 4 EStG
- KSt: 15 % nach § 23 KStG; SolZ: 5,5 % nach § 4 SolZG → effektiv 15,825 %
- GewSt: Steuermesszahl 3,5 % nach § 11 Abs. 2 GewStG × Hebesatz
- Keine Wechselwirkung KSt/GewSt seit § 4 Abs. 5b EStG (Unternehmensteuerreform 2008):
  GewSt nicht mehr als Betriebsausgabe abziehbar → unabhängige Berechnung
- Vereinfachung im Rechner: keine Berücksichtigung von Hinzurechnungen nach § 8 GewStG

*Abschnitt 2 – Äquivalenz Gehaltserhöhung: Steuerliche Grundlagen*
- Einkommensteuer nach § 32a EStG (Grundtarif / Splittingtarif)
- SolZ nach § 3 Abs. 3 SolZG (Freigrenze und Milderungszone)
- Kirchensteuer: 8 % (z.B. Bayern, BW) oder 9 % (übrige Länder) auf die Einkommensteuer
- SV-Annahme: Beherrschender GGF nach BSG-Rechtsprechung (≥ 50 % Anteile) nicht
  sozialversicherungspflichtig → kein Arbeitnehmer-Anteil auf Gehaltserhöhung
- Verwendeter Grenzsteuersatz: marginale ESt auf das Jahresgehalt (nicht Durchschnittssteuersatz)
- Kirchensteuer-Formel: `KiSt = ESt_marginal × KiSt_Satz / (1 + KiSt_Satz)`

*Abschnitt 3 – Äquivalenz Gewinnausschüttung: Steuerliche Grundlagen*
- Abgeltungsteuer § 32d Abs. 1 EStG: 25 % + SolZ (1,375 %) = 26,375 % auf Brutto-Ausschüttung
- Alternative Teileinkünfteverfahren § 32d Abs. 2 Nr. 3 EStG: nur Hinweis im Tool,
  nicht gerechnet (zu individuell, Steuersatz-Grenze ca. 43,5 %)
- Dividenden aus versteuertem Gewinn = kein Betriebsausgabenabzug → kein Steuereffekt
  auf Unternehmensseite (Hauptunterschied zur bAV-Beitragsbehandlung)

*Abschnitt 4 – Einschränkungen und Prüfhinweise*
- GewSt-Hinzurechnungen (§ 8 GewStG) nicht modelliert → leichte Unterschätzung GewSt-Last
- Teileinkünfteverfahren nicht gerechnet → konservativere Ausschüttungs-Äquivalenz
- SV-Annahme (kein beherrschender GGF): Falls GGF < 50 % Anteile, wären SV-Beiträge
  zusätzlich zu berücksichtigen → Gehaltserhöhungs-Äquivalenz würde höher ausfallen
- Auszahlungsphase (nachgelagerte ESt auf bAV-Leistungen) explizit nicht Bestandteil
- Gewerbesteuerhebesatz als Eingabe des Beraters: keine Validierung gegen offizielle Hebesätze

---

### 11.3 Technische Hinweise für die PDF-Erstellung

- Skill: `skills/pdf/SKILL.md` (im Skills-Ordner)
- Kein Firmenbranding in v1; neutrale Kopfzeile mit Titel + Datum
- Beide Dokumente separat, aber gleiches Layout
- Quellmaterial: diese SPEC.md, insbesondere Abschnitte 3–6 + 8
- Startbefehl: „Erstelle Dokument A/B aus SPEC.md Abschnitt 11.1/11.2 als PDF."

---

## 12. Nicht in Scope (v1)

- Steueroptimierung Auszahlungsphase
- Vollständiger Tarifvergleich DV vs. UK
- SV-Pflicht-Check GGF (Annahme: beherrschend = nicht SV-pflichtig)
- Weitere Rechtsformen (nur GmbH)
- Teileinkünfteverfahren-Rechner (nur Hinweis im UI)
- Personalisierung / Firmenbranding (v2)
