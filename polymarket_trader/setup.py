"""
Setup-Script: Installiert Dependencies und prüft Konfiguration
Ausführen: python setup.py
"""

import subprocess
import sys
import os


def run(cmd):
    print(f"  > {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"  FEHLER: {result.stderr.strip()}")
        return False
    return True


def main():
    print("=" * 55)
    print("  Polymarket Trading Bot — Setup")
    print("=" * 55)

    # 1. Dependencies installieren
    print("\n[1/3] Installiere Python-Pakete...")
    ok = run(f"{sys.executable} -m pip install -r requirements.txt -q")
    if not ok:
        print("  Fehler beim Installieren. Versuche es manuell mit:")
        print("  pip install -r requirements.txt")
        sys.exit(1)
    print("  Pakete installiert.")

    # 2. .env prüfen
    print("\n[2/3] Prüfe Konfiguration...")
    if not os.path.exists(".env"):
        import shutil
        shutil.copy(".env.example", ".env")
        print("  .env Datei erstellt aus .env.example")
        print(f"  WICHTIG: Öffne .env und trage deine Credentials ein!")
    else:
        # Pflichtfelder prüfen
        from dotenv import dotenv_values
        cfg = dotenv_values(".env")
        missing = []
        for key in ["PRIVATE_KEY", "WALLET_ADDRESS"]:
            if not cfg.get(key) or "hier" in cfg.get(key, ""):
                missing.append(key)
        if missing:
            print(f"  WARNUNG: Folgende Felder in .env fehlen noch: {', '.join(missing)}")
            print("  Im Dry-Run-Modus kann der Bot ohne Credentials starten.")
        else:
            print("  .env Konfiguration sieht gut aus.")

    # 3. Test-Import
    print("\n[3/3] Prüfe Imports...")
    try:
        import websockets
        import aiohttp
        import numpy
        import colorama
        print("  Alle Kern-Pakete importierbar.")
    except ImportError as e:
        print(f"  Import-Fehler: {e}")
        sys.exit(1)

    print("\n" + "=" * 55)
    print("  Setup abgeschlossen!")
    print()
    print("  Starten (Simulation, keine echten Orders):")
    print("    python main.py --dry-run")
    print()
    print("  Starten (Live-Modus):")
    print("    python main.py")
    print("=" * 55)


if __name__ == "__main__":
    main()
