#!/usr/bin/env python3
"""
Build-Skript: stufen-rechner.html → stufen-rechner-build.html (Single-File)
Ersetzt <!-- INCLUDE: src/filename.js --> mit <script>...</script>
Kopiert Ergebnis auch nach docs/index.html fuer GitHub Pages.
"""
import re
import os
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(BASE_DIR, "stufen-rechner.html")
OUTPUT_FILE = os.path.join(BASE_DIR, "stufen-rechner-build.html")
DOCS_FILE = os.path.join(BASE_DIR, "docs", "index.html")

INCLUDE_PATTERN = re.compile(r'<!--\s*INCLUDE:\s*(.+?)\s*-->')


def build():
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

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        f.write(result)
    print(f"  Build: {OUTPUT_FILE}")

    os.makedirs(os.path.dirname(DOCS_FILE), exist_ok=True)
    shutil.copy2(OUTPUT_FILE, DOCS_FILE)
    print(f"  Kopie: {DOCS_FILE}")


if __name__ == "__main__":
    print("bAV 2-Stufen-Foerderung – Build")
    build()
    print("  Fertig.")
