# Utilisation avec Capytale

Dans Capytale, une activité MathALÉA charge MathALÉA dans une iframe avec un mode recorder. MathALÉA communique avec Capytale par `postMessage` via le protocole de l'activité.

## Modes d'affichage

- `conception` : création ou édition d'une séance côté professeur.
- `assignment` : activité côté élève.
- `review` : relecture des réponses, notes et commentaires.

## Données échangées

Capytale sauvegarde les paramètres de séance et les réponses d'élèves. MathALÉA récupère les paramètres d'activité, signale les modifications et envoie les résultats lorsque l'élève valide.

Le code d'intégration côté MathALÉA est dans `src/components/utils/handleCapytale.ts`.
