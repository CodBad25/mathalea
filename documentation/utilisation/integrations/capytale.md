# Utilisation avec Capytale

Dans Capytale, une activité MathALÉA charge MathALÉA dans une iframe avec un mode recorder. MathALÉA communique avec Capytale par `postMessage` via le protocole de l'activité.

## Modes d'affichage

- `conception` : création ou édition d'une séance côté professeur.
- `assignment` : activité côté élève.
- `review` : relecture des réponses, notes et commentaires.

## Données échangées

Capytale sauvegarde les paramètres de séance et les réponses d'élèves. MathALÉA récupère les paramètres d'activité, signale les modifications et envoie les résultats lorsque l'élève valide.

Le code d'intégration côté MathALÉA est dans `src/lib/handleCapytale.ts`.

Pour un exercice de type « app » (iframe tierce), la remontée du score suit le
protocole décrit dans
[Apps externes](../../developpement/maintenance-moteur/architecture/apps-externes.md).

## Perte de connexion avec Capytale

Si l'élève n'est plus en mesure d'enregistrer sa copie (session Capytale expirée, coupure réseau, page parente qui ne répond plus), la copie est verrouillée pour éviter qu'il travaille sans que ses réponses soient enregistrées.

- La librairie RPC utilisée ne gère aucun timeout : `callCapytale()` en ajoute un (15 s) pour qu'une page parente muette soit détectée au lieu de laisser la promesse indéfiniment en attente.
- Tout échec de `saveStudentAssignment` qui n'est pas une erreur métier (« copie rendue » ou « Copie verrouillée », qui donnent un simple message temporaire) passe le store `capytaleConnectionLost` à `true`.
- `CapytaleConnectionLostModal.svelte`, monté dans `App.svelte` quand `recorder=capytale`, affiche alors une modale bloquante (non fermable par Échap) : l'élève ne peut plus modifier sa copie.
- La sauvegarde en échec est conservée et rejouée automatiquement avec un délai croissant (3 s, 5 s, 10 s, 20 s puis 30 s), ou immédiatement via le bouton « Réessayer maintenant ». Dès qu'elle aboutit, la copie est déverrouillée et l'élève est informé que ses réponses ont bien été enregistrées.
- Bugsnag n'est notifié qu'une seule fois par coupure, pas à chaque tentative.

Les tests unitaires correspondants sont dans `tests/unit/capytaleSaveConnection.test.ts`.
