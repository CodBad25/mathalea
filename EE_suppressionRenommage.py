#!/usr/bin/env python3
"""
Archive des fichiers : copie avec horodatage, suppression de l'original,
et enregistrement du mapping dans 'archive_log.json' à la racine.
"""

import json
import os
import shutil
from datetime import datetime
from pathlib import Path

LOG_FILE = "archive_log.json"


def find_file(filename: str, root: Path) -> Path | None:
    """Recherche récursive d'un fichier à partir de la racine."""
    for match in root.rglob(filename):
        if match.resolve() == Path(__file__).resolve():
            continue
        if match.name == LOG_FILE:
            continue
        return match
    return None


def load_log(log_path: Path) -> list:
    """Charge le journal existant ou retourne une liste vide."""
    if log_path.exists():
        with open(log_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def save_log(log_path: Path, entries: list) -> None:
    """Sauvegarde le journal JSON."""
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def archive_file(filename: str, root: Path, log_entries: list) -> None:
    """Copie le fichier avec horodatage, supprime l'original, logue l'opération."""
    filename = filename.strip()
    if not filename:
        return

    source = find_file(filename, root)

    if source is None:
        print(f"  ✗  '{filename}' — fichier introuvable dans l'arborescence.")
        return

    now = datetime.now()
    day_str  = now.strftime("%d%m")
    hour_str = now.strftime("%H%M")

    stem      = source.stem
    extension = source.suffix
    new_name  = f"{stem}_{day_str}_{hour_str}{extension}"
    dest      = source.parent / new_name

    # Éviter d'écraser une archive existante
    if dest.exists():
        counter = 1
        while dest.exists():
            new_name = f"{stem}_{day_str}_{hour_str}_{counter}{extension}"
            dest = source.parent / new_name
            counter += 1

    shutil.copy2(source, dest)
    print(f"  ✓  '{filename}' → copie créée    : '{dest.relative_to(root)}'")

    os.remove(source)
    print(f"     Original supprimé             : '{source.relative_to(root)}'")

    # Enregistrement dans le journal
    log_entries.append({
        "original_name":  filename,
        "original_path":  str(source.relative_to(root)),
        "archived_name":  new_name,
        "archived_path":  str(dest.relative_to(root)),
        "archived_at":    now.isoformat(timespec="seconds"),
    })


def main() -> None:
    root     = Path(__file__).parent.resolve()
    log_path = root / LOG_FILE

    print(f"Racine du projet : {root}")
    print(f"Journal          : {LOG_FILE}\n")

    raw       = input("Noms de fichiers (séparés par ';') : ")
    filenames = raw.split(";")

    log_entries = load_log(log_path)

    print()
    for filename in filenames:
        archive_file(filename, root, log_entries)

    save_log(log_path, log_entries)
    print(f"\nJournal mis à jour ({len(log_entries)} entrée(s) au total).")
    print("Terminé.")


if __name__ == "__main__":
    main()