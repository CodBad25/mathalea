#!/usr/bin/env python3
"""
Restauration des fichiers archivés : lit archive_log.json, copie chaque fichier
archivé vers son emplacement d'origine en lui redonnant son nom original.
Écrase silencieusement tout fichier existant portant le même nom.
Permet aussi de supprimer des entrées du journal pour le garder propre.
"""

import json
import shutil
from pathlib import Path

LOG_FILE = "archive_log.json"


def load_log(log_path: Path) -> list:
    """Charge le journal JSON."""
    with open(log_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_log(log_path: Path, entries: list) -> None:
    """Sauvegarde le journal JSON."""
    with open(log_path, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def restore_file(entry: dict, root: Path) -> bool:
    """Restaure un fichier archivé vers son chemin d'origine."""
    archived = root / entry["archived_path"]
    original = root / entry["original_path"]

    if not archived.exists():
        print(f"  ✗  Fichier archivé introuvable : '{entry['archived_path']}'")
        return False

    # Crée les dossiers intermédiaires si nécessaire
    original.parent.mkdir(parents=True, exist_ok=True)

    shutil.copy2(archived, original)
    print(f"  ✓  '{entry['archived_name']}' → restauré en : '{entry['original_path']}'")
    return True


def select_entries(entries: list) -> tuple[list, list]:
    """Demande à l'utilisateur quelles entrées sélectionner.
    Retourne (entrées_sélectionnées, indices_sélectionnés)."""
    choix = input(
        "Entrées : (A) toutes  |  (N) choisir par numéro  →  "
    ).strip().upper()

    if choix == "A":
        return list(entries), list(range(len(entries)))

    if choix == "N":
        raw  = input("Numéros (séparés par ';') : ")
        nums = [n.strip() for n in raw.split(";") if n.strip()]
        selected = []
        indices  = []
        for n in nums:
            if n.isdigit() and 1 <= int(n) <= len(entries):
                idx = int(n) - 1
                if idx not in indices:
                    indices.append(idx)
                    selected.append(entries[idx])
            else:
                print(f"  ⚠  Numéro ignoré (invalide) : '{n}'")
        return selected, indices

    print("Choix non reconnu. Abandon.")
    return [], []


def main() -> None:
    root     = Path(__file__).parent.resolve()
    log_path = root / LOG_FILE

    print(f"Racine du projet : {root}")
    print(f"Journal          : {LOG_FILE}\n")

    if not log_path.exists():
        print(f"Aucun journal trouvé ({LOG_FILE}). Rien à faire.")
        return

    entries = load_log(log_path)

    if not entries:
        print("Le journal est vide. Rien à faire.")
        return

    print(f"{len(entries)} entrée(s) dans le journal :\n")
    for i, entry in enumerate(entries, 1):
        print(f"  [{i}] {entry['archived_name']}  →  {entry['original_path']}  (archivé le {entry['archived_at']})")

    print()
    action = input(
        "Action : (R) restaurer des fichiers  |  (S) supprimer des entrées du journal  →  "
    ).strip().upper()

    if action not in ("R", "S"):
        print("Choix non reconnu. Abandon.")
        return

    print()
    selected, indices = select_entries(entries)

    if not selected:
        print("Aucune entrée sélectionnée.")
        return

    print()

    if action == "R":
        ok = sum(restore_file(e, root) for e in selected)
        print(f"\n{ok}/{len(selected)} fichier(s) restauré(s).")

    elif action == "S":
        for e in selected:
            print(f"  🗑  '{e['archived_name']}' supprimé du journal.")
        remaining = [e for i, e in enumerate(entries) if i not in indices]
        save_log(log_path, remaining)
        print(f"\n{len(selected)} entrée(s) supprimée(s). {len(remaining)} entrée(s) restante(s).")

    print("Terminé.")


if __name__ == "__main__":
    main()