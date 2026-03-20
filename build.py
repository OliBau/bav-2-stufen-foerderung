#!/usr/bin/env python3
"""
Build-Skript: stufen-rechner.html → stufen-rechner-build.html (Single-File)
Ersetzt <!-- INCLUDE: src/filename.js --> mit <script>...</script>
Erzeugt obfuskierte Version fuer docs/index.html (GitHub Pages).

Nutzung:
    python build.py                  # Build mit Obfuskierung (Standard)
    python build.py --no-obfuscate   # Build ohne Obfuskierung (Entwicklung)
"""
import re
import os
import sys
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "stufen-rechner.html")
OUTPUT_FILE = os.path.join(BASE_DIR, "stufen-rechner-build.html")
DOCS_FILE = os.path.join(BASE_DIR, "docs", "index.html")

INCLUDE_PATTERN = re.compile(r'<!--\s*INCLUDE:\s*(.+?)\s*-->')


# ── JS-Minifizierung (aus bav-dashboard uebernommen) ──

def minify_js(js_code):
    """Minifiziert JavaScript: Kommentare entfernen, Whitespace komprimieren."""
    result = re.sub(r'(?<!:)//(?!/).*?$', '', js_code, flags=re.MULTILINE)
    result = re.sub(r'/\*.*?\*/', '', result, flags=re.DOTALL)
    result = re.sub(r'[ \t]+', ' ', result)
    result = re.sub(r'\n\s*\n', '\n', result)
    result = re.sub(r' ?\{ ?', '{', result)
    result = re.sub(r' ?\} ?', '}', result)
    result = re.sub(r' ?; ?', ';', result)
    result = re.sub(r' ?, ?', ',', result)
    result = re.sub(r'^\s+', '', result, flags=re.MULTILINE)
    result = result.strip()
    return result


# ── CSS-Minifizierung ──

def minify_css(css_code):
    """Minifiziert CSS: Kommentare und ueberflüssigen Whitespace entfernen."""
    result = re.sub(r'/\*.*?\*/', '', css_code, flags=re.DOTALL)
    result = re.sub(r'\s+', ' ', result)
    result = re.sub(r' ?\{ ?', '{', result)
    result = re.sub(r' ?\} ?', '}', result)
    result = re.sub(r' ?; ?', ';', result)
    result = re.sub(r' ?, ?', ',', result)
    result = re.sub(r' ?: ?', ':', result)
    result = result.strip()
    return result


# ── Anti-Kopier-Schutz ──

ANTI_COPY_SCRIPT = """
<script>
(function(){var d=document;d.addEventListener('contextmenu',function(e){e.preventDefault();});
d.addEventListener('keydown',function(e){if(e.ctrlKey&&(e.key==='u'||e.key==='U'||e.key==='s'||e.key==='S')){e.preventDefault();}
if(e.key==='F12'){e.preventDefault();}
if(e.ctrlKey&&e.shiftKey&&(e.key==='I'||e.key==='i'||e.key==='J'||e.key==='j')){e.preventDefault();}});
var s=d.createElement('style');s.textContent='body{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;}input,select,button{-webkit-user-select:auto;-moz-user-select:auto;user-select:auto;}';d.head.appendChild(s);
setInterval(function(){if((window.outerWidth-window.innerWidth>200)||(window.outerHeight-window.innerHeight>200)){if(!d.getElementById('_dp')){var o=d.createElement('div');o.id='_dp';o.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.97);z-index:99999;display:flex;align-items:center;justify-content:center;font:600 1.2rem Arial;color:#333;text-align:center;padding:2rem;';o.textContent='Bitte schliessen Sie die Entwicklertools, um den Rechner zu nutzen.';d.body.appendChild(o);}}else{var x=d.getElementById('_dp');if(x)x.remove();}},1500);
})();
</script>
""".strip()


def protect_html(html):
    """Minifiziert JS/CSS und fuegt Anti-Kopier-Schutz ein."""

    # 1. Alle <script>-Bloecke minifizieren
    script_pattern = re.compile(r'(<script[^>]*>)(.*?)(</script>)', re.DOTALL)
    matches = list(script_pattern.finditer(html))

    if matches:
        print(f"\n  JavaScript-Minifizierung ({len(matches)} Script-Block(e))...")
        total_before = 0
        total_after = 0

        for match in reversed(matches):
            js_code = match.group(2).strip()
            if not js_code or len(js_code) < 50:
                continue

            minified = minify_js(js_code)
            total_before += len(js_code)
            total_after += len(minified)

            new_block = match.group(1) + minified + match.group(3)
            html = html[:match.start()] + new_block + html[match.end():]

        if total_before > 0:
            ratio = total_after / total_before * 100
            print(f"    JS: {total_before:,} -> {total_after:,} Zeichen ({ratio:.0f}%)")

    # 2. <style>-Bloecke minifizieren
    style_pattern = re.compile(r'(<style[^>]*>)(.*?)(</style>)', re.DOTALL)
    style_matches = list(style_pattern.finditer(html))

    if style_matches:
        print(f"  CSS-Minifizierung ({len(style_matches)} Style-Block(e))...")
        for match in reversed(style_matches):
            css_code = match.group(2).strip()
            if not css_code or len(css_code) < 50:
                continue
            minified = minify_css(css_code)
            new_block = match.group(1) + minified + match.group(3)
            html = html[:match.start()] + new_block + html[match.end():]

    # 3. Anti-Kopier-Schutz vor </body> einfuegen
    html = html.replace('</body>', ANTI_COPY_SCRIPT + '\n</body>')
    print("  Anti-Kopier-Schutz eingefuegt")

    # 4. HTML-Kommentare entfernen
    html = re.sub(r'<!--.*?-->', '', html, flags=re.DOTALL)
    print("  HTML-Kommentare entfernt")

    # 5. Ueberflüssige Leerzeilen entfernen
    html = re.sub(r'\n\s*\n', '\n', html)

    print("  Schutz abgeschlossen.")
    return html


def build(do_obfuscate=True):
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        html = f.read()

    def replace_include(match):
        filepath = match.group(1).strip()
        full_path = os.path.join(BASE_DIR, filepath)
        if not os.path.exists(full_path):
            print(f"  WARNUNG: {filepath} nicht gefunden!")
            return match.group(0)
        with open(full_path, "r", encoding="utf-8") as inc:
            content = inc.read()
        if filepath.endswith(".js"):
            return f"<script>\n{content}\n</script>"
        elif filepath.endswith(".css"):
            return f"<style>\n{content}\n</style>"
        return content

    result = INCLUDE_PATTERN.sub(replace_include, html)

    # Lesbare Version immer lokal speichern
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(result)
    print(f"  Lesbare Version:    {OUTPUT_FILE}")

    # Obfuskierte Version fuer GitHub Pages
    if do_obfuscate:
        protected = protect_html(result)
        original_size = len(result)
        protected_size = len(protected)
        ratio = protected_size / original_size * 100
        print(f"\n  Gesamtkompression: {original_size:,} -> {protected_size:,} Zeichen ({ratio:.0f}%)")
    else:
        protected = result
        print("  KEIN Schutz (--no-obfuscate)")

    os.makedirs(os.path.dirname(DOCS_FILE), exist_ok=True)
    with open(DOCS_FILE, "w", encoding="utf-8") as f:
        f.write(protected)
    print(f"  GitHub Pages:       {DOCS_FILE}")


if __name__ == "__main__":
    do_obfuscate = "--no-obfuscate" not in sys.argv
    print("bAV 2-Stufen-Foerderung – Build")
    print(f"  Schutz: {'AKTIV' if do_obfuscate else 'DEAKTIVIERT'}")
    build(do_obfuscate)
    print("\n  Fertig.")
