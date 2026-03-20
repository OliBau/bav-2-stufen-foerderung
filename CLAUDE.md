# CLAUDE.md – bAV 2-Stufen-Förderung

## Projektüberblick

Interaktiver HTML-Rechner für die **firmenfinanzierte betriebliche Altersvorsorge in zwei Stufen**,
primär ausgerichtet auf Gesellschafter-Geschäftsführer (GGF) einer GmbH.

Das Tool lebt als **Single-File-HTML auf GitHub Pages** und ist über einen QR-Code oder URL
teilbar. Es startet als neutrale Version (kein Firmenbranding) und wird in einer Ausbaustufe
individualisierbar (AG-spezifisch wie beim bav-dashboard).

---

## Ordnerstruktur (Ziel)

```
bav-2 Stufen Förderung/
├── CLAUDE.md               ← Diese Datei
├── STATUS.md               ← Aktueller Projektstand
├── SPEC.md                 ← Vollständige Spezifikation (Quelle der Wahrheit)
├── src/
│   ├── rechenkern.js       ← Kopie/Ableitung aus bav-factsheet (03-rechenkern.js)
│   └── firmensteuern.js    ← Neues Modul: KSt, GewSt, Ausschüttung
├── stufen-rechner.html     ← Entwicklungsversion (lesbar, Multi-file-Includes)
├── stufen-rechner-build.html ← Build-Output (Single-File, minified)
├── build.py                ← Build-Skript (analog zu bav-factsheet/build.py)
└── tests/
    └── test-rechenkern.html ← Rechenkern-Tests im Browser
```

---

## Abhängigkeiten / Schwesterprojekte

| Ressource | Pfad | Verwendung |
|---|---|---|
| Rechenkern (Python) | `../bav-factsheet/BAUPLAN_FactSheet_Rechenkern.py` | Referenz-Implementierung, nicht direkt importiert |
| Rechenkern (JS) | `../bav-factsheet/src/03-rechenkern.js` | **Kopieren** als Basis für `src/rechenkern.js` |
| Tarif-Tabellen + Parameter | `../bav-factsheet/src/02-fallback-data.js` | **Kopieren** – enthält FR35/FR552/VIR35/VIR552 Tariftabellen, Jahresparameter 2025/2026, Produktregeln (`produktRegeln`) |
| Erweiterungsrechner | `../bav-factsheet/src/04-erweiterungsrechner.js` | Referenz für GRV-Logik (optional, v2) |
| Dashboard UI-Referenz | `../bav-dashboard/output/Muster GmbH & Co. KG/bav-dashboard_Muster-GmbH-Co-KG_L.html` | Design-System, CSS-Variablen, Komponenten-Stil |
| Dashboard Template | `../bav-dashboard/template/master-dashboard-leistung.html` | Layout-Struktur, Sektionenaufbau |

> **Wichtig:** Den Rechenkern aus bav-factsheet KOPIEREN und anpassen, nicht per Import
> verlinken. Das Tool muss als Standalone-HTML auf GitHub Pages laufen.

---

## Tech-Stack

- **Ausgabe:** Single-File-HTML (kein Framework, kein Bundler)
- **Hosting:** GitHub Pages (`OliBau/bav-2-stufen-foerderung`, Branch `gh-pages` oder `main/docs`)
- **Entwicklung:** Multi-File in `src/` → `python build.py` → Single-File-Build
- **CSS:** CSS Custom Properties (Design-System wie bav-dashboard, neutrale Blau-Palette)
- **JS:** Vanilla JS, kein jQuery, kein React
- **Charts:** SVG-basierte Balkendiagramme (inline, wie bav-dashboard – kein Chart.js)
- **Rechenkern:** JS-Portierung des validierten Python-Kerns aus bav-factsheet

---

## UI/UX-Prinzipien (aus bav-dashboard übernehmen)

Das bav-dashboard hat ein ausgereiftes Design-System – konsequent übernehmen:

- **Farbsystem:** CSS Custom Properties (`--primary`, `--primary-dark`, `--primary-medium`, `--primary-light`, `--bg`, `--card`, `--text`, `--text-muted`)
- **Neutrale Palette:** #003B7E Blau (kein Firmenbranding in Version 1)
- **Karten-Komponenten:** `.info-block` mit Icon + Hover-Effekt
- **Balkendiagramme:** Horizontale gestapelte Balken mit Legende (wie Förderungsbalken im Dashboard)
- **Header:** Gradient-Header mit Hero-Nav-Pills
- **Rechner-Sektion:** Eingaben links / Ergebnisblock rechts (oder gestapelt auf Mobile)
- **Typografie:** Arial/Helvetica, `clamp()` für responsive Schriftgrößen
- **Toggle-Elemente:** Für Kirchensteuer, KV-Typ, Äquivalenzrechnungen (CSS-Toggle ohne JS-Bibliothek)
- **Rendite-Pill-Toggle:** 4-Option Pill-Group für 1,5% / 3,0% / 4,5% / 6,0% (live-Update)
- **Leistungs-Hero-Card:** Dunkel, dominant, große Zahlen – Kapital + Rente + Hebel-Zeile
- **Stage-Cards:** Nebeneinander für Stufe 1 und Stufe 2, kleinere Darstellung
- **Laufzeit-Bar:** CSS-Progressbar Heute (Alter) → Renteneintritt 67

---

## Deployment-Workflow

```bash
# Entwicklung
# Dateien in src/ bearbeiten, dann:
python build.py   # → erzeugt stufen-rechner-build.html

# GitHub Pages
git add stufen-rechner-build.html
git commit -m "Update: [Beschreibung]"
git push origin main
# → Erreichbar unter: https://olibau.github.io/bav-2-stufen-foerderung/
```

QR-Code für die URL in Beratungspräsentationen nutzbar.

---

## Ausbaustufen (Roadmap)

| Version | Inhalt |
|---|---|
| **v1 – Neutral** | Vollständiger Rechner ohne Firmenbranding, auf GitHub Pages |
| **v2 – Parametrisiert** | JSON-Config pro Firma (wie bav-dashboard), Generator-Skript |
| **v3 – Supabase** | Firmendaten aus DB (analog bav-factsheet Phase 2) |

---

## Nicht in Scope (v1)

- Steueroptimierung Auszahlungsphase (nachgelagerte Besteuerung der Rente)
- Einzel-Tarifvergleich (Produktempfehlung DV vs. UK)
- SV-Pflicht-Check für GGF (Annahme: beherrschender GGF = nicht SV-pflichtig)
- Mehr als eine Rechtsform (nur GmbH in v1)
