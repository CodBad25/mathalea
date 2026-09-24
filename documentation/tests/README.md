# Tests et CI

Index des documents liés aux tests locaux, à la CI GitLab et aux rapports d'exercices.

| Titre                 | Rôle                                                                                | Public                               | Source / statut                | Lien                                             |
| --------------------- | ----------------------------------------------------------------------------------- | ------------------------------------ | ------------------------------ | ------------------------------------------------ |
| CI GitLab             | Décrire les tâches GitLab CI et leur reproduction locale                            | Développeurs, mainteneurs            | Documentation durable renommée | [ci-gitlab.md](ci-gitlab.md)                     |
| Erreurs console E2E   | Expliquer le test Playwright qui détecte les erreurs console                        | Développeurs, mainteneurs CI         | Documentation durable renommée | [erreurs-console-e2e.md](erreurs-console-e2e.md) |
| Rapports d'exercices  | Lancer et lire les rapports `interactif` et `AMCNum`                                | Développeurs d'exercices             | Documentation durable renommée | [rapports-exercices.md](rapports-exercices.md)   |
| Stabilité des tirages | Garantir que les corrigés partagés restent valides après modification d'un exercice | Développeurs d'exercices, relecteurs | Documentation durable          | [stabilite-exercices.md](stabilite-exercices.md) |

## Écrire un test

Les tests utilisent [Vitest](https://vitest.dev/api/expect.html) ; les tests de
bout en bout pilotent un navigateur avec Playwright.

| Type | Emplacement | Modèle | Lancement |
| --- | --- | --- | --- |
| Unitaire (fonction, classe) | `tests/unit/` | `tests/unit/grandeur.test.ts` | `pnpm test:unit` |
| Unitaire à côté du code | `src/**/*.test.ts` | `src/lib/interactif/checks/atoms.test.ts` | `pnpm test:src` |
| Interactivité de bout en bout | `tests/e2e/tests/interactivity/` | `tests/e2e/tests/dev/mathLive.moule.test.ts` | `pnpm test:e2e:interactivity` |

Pour lancer un seul fichier :

```sh
pnpm exec vitest run tests/unit/grandeur.test.ts
```

Pour un test d'interactivité : dupliquer `mathLive.moule.test.ts`, remplacer
`moule` par le format testé, renseigner l'URL de l'exercice et construire une
bonne ou une mauvaise réponse selon `question.isCorrect` en suivant les
commentaires du fichier, puis le déplacer dans
`tests/e2e/tests/interactivity/`. Les tests de bout en bout utilisent le serveur
Vite de `http://localhost:5173` (`pnpm dev`).

Pour vérifier une option de comparaison, ajouter un cas à
`tests/unit/fonctionsDeComparaison.test.ts`.
