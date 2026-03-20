# bAV 2-Stufen-Förderung – Projektstatus

## Stand: 20.03.2026

### Phase 0: Konzeption – abgeschlossen

Spezifikation vollständig erarbeitet (Cowork-Session, 20.03.2026).
Basis: Vorlage Zurich "Firmenfinanzierte bAV" + Rechenkern aus bav-factsheet.

---

## Nächster Schritt – Phase 1: Implementierung

**Übergabe an Claude Code:**

```bash
cd C:\Users\bauma\Desktop\Claude\projekte\bav-2 Stufen Förderung
```

Claude liest CLAUDE.md + SPEC.md und beginnt mit Phase 1.

**Startbefehl:**
> „Lies CLAUDE.md und SPEC.md. Implementiere Phase 1: Single-File-HTML-Rechner
> nach Spezifikation, mit Rechenkern aus bav-factsheet und Design-System aus
> bav-dashboard Muster-Dashboard. Starte mit der Projektstruktur und dem Rechenkern."

---

## Phasenplan

### Phase 1 – Rechner (Ziel: funktionierendes HTML)

- [ ] Projektstruktur anlegen (`src/`, `tests/`, `build.py`)
- [ ] Rechenkern kopieren (`bav-factsheet/src/03-rechenkern.js` → `src/rechenkern.js`)
- [ ] Firmensteuern-Modul neu: `src/firmensteuern.js` (KSt, GewSt, Ausschüttungsäquivalenz)
- [ ] Eingabeblock implementieren (alle Felder lt. SPEC.md)
- [ ] Betrachtung 1: Unternehmensebene (KSt + GewSt)
- [ ] Betrachtung 2: Äquivalenz Gehaltserhöhung
- [ ] Betrachtung 3: Äquivalenz Gewinnausschüttung (toggle-bar)
- [ ] Balkendiagramme für Betrachtung 1 (wie bav-dashboard)
- [ ] Build-Skript + Single-File-Output
- [ ] GitHub Repo anlegen + GitHub Pages aktivieren

### Phase 2 – Informationsteil + Individualisierung

- [ ] Info-Sektionen (wie bav-dashboard: "So funktioniert's", FAQ-ähnlich)
- [ ] AG-Banner (Firmenname, Berater-Kontakt)
- [ ] JSON-Config-System (wie bav-dashboard)
- [ ] Generator-Skript für kundenspezifische Versionen

### Phase 3 – Fachliche Abnahme-Dokumentation

Wenn das Tool steht, wird ein **PDF-Dokument** erstellt, das zwei Zielgruppen bedient:

**Zielgruppe A – Fachberater bAV:**
- Wie funktioniert der Rechner? (Eingaben, Ergebnisblöcke, Bedienung)
- Welche Produkte liegen zugrunde? (FondsRente 70%, AnsparRente)
- Auf welchen Tariftabellen basiert die Leistungsberechnung? (Zürich 2026)
- Was bedeuten Garantiewert / Überschussbeteiligung / Rendite-Szenarien?

**Zielgruppe B – Steuerberater (Review):**
- Steuerliche Systematik Unternehmensbetrachtung: KSt + SolZ + GewSt, §-Nachweise
- Steuerliche Systematik Äquivalenz Gehaltserhöhung: Grenzsteuersatz, SV-Annahmen
- Steuerliche Systematik Äquivalenz Gewinnausschüttung: Abgeltungsteuer / Teileinkünfte
- Was der Rechner vereinfacht / nicht modelliert (Hinweis auf Grenzen)

**Format:** PDF (Skill: `pdf/SKILL.md`) – professionell gesetzt, kein Firmenbranding.
**Startbefehl:** „Erstelle die Technische Dokumentation bAV 2-Stufen-Förderung als PDF
  (SPEC.md Abschnitt 10 + Steuerliche Systematik aus SPEC.md Abschnitt 3–5)."

- [ ] Technische Dokumentation PDF erstellen (Berater-Version)
- [ ] Steuerliche Prüfungsunterlage PDF erstellen (Steuerberater-Version)

### Phase 4 – Ausbau (später)

- [ ] Supabase-Anbindung für AG-Verwaltung
- [ ] Mehr Rechtsformen (AG, Einzelunternehmen)

---

## Wichtige Referenz-Dateien für Claude Code

| Datei | Zweck |
|---|---|
| `SPEC.md` | Vollständige Spezifikation (Eingaben, Berechnungen, UI) |
| `../bav-factsheet/src/03-rechenkern.js` | Rechenkern kopieren (506 Zeilen, validiert) |
| `../bav-factsheet/BAUPLAN_FactSheet_Rechenkern.py` | Python-Referenz für Rechenlogik |
| `../bav-dashboard/output/Muster GmbH & Co. KG/bav-dashboard_Muster-GmbH-Co-KG_L.html` | UI/UX-Referenz: Design-System, CSS, Komponenten |
| `../bav-dashboard/template/master-dashboard-leistung.html` | Layout-Referenz |

---

## Repository

- GitHub: `OliBau/bav-2-stufen-foerderung` (noch anzulegen, privat → später public für GitHub Pages)
- GitHub Pages URL (nach Aktivierung): `https://olibau.github.io/bav-2-stufen-foerderung/`
