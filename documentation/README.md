# Documentation MathALÉA

Cette documentation est la source canonique durable du dépôt. Le dossier `old-documentation/` reste une photographie historique de l'ancien wiki : il sert de source de migration, mais les pages d'archives, de transition v2/v3, de roadmap, de TODO et de vie du projet ne sont pas reprises ici.

Les rapports générés et les fichiers exportés archivés sont listés dans [reports/README.md](../reports/README.md).

## Utilisation

Documentation destinée aux utilisatrices et utilisateurs de MathALÉA.

| Titre | Rôle | Lien |
| --- | --- | --- |
| Utiliser MathALÉA | Point d'entrée des usages courants | [utilisation/README.md](utilisation/README.md) |
| Intégrations | Moodle/ELEA, Anki, Capytale, site personnel | [utilisation/integrations/README.md](utilisation/integrations/README.md) |

## Développement

La documentation de développement est séparée en deux familles.

| Titre | Rôle | Lien |
| --- | --- | --- |
| Référence développeur | Architecture, APIs, classes, formats et comportements durables | [developpement/reference/README.md](developpement/reference/README.md) |
| Guides développeur | Procédures concrètes pour coder, exporter, tester ou maintenir | [developpement/guides/README.md](developpement/guides/README.md) |
| Workflow agent-documentation | Règles de réponse et de maintenance documentaire par les agents | [developpement/agent-documentation.md](developpement/agent-documentation.md) |

## Tests

| Titre | Rôle | Lien |
| --- | --- | --- |
| Tests et CI | Index des documents de test, CI et rapports d'exercices | [tests/README.md](tests/README.md) |

## Convention

- `documentation/utilisation/` contient les usages actuels côté enseignant, élève ou plateforme.
- `documentation/developpement/reference/` décrit les systèmes et modules stables : interactivité, exercices, classes mathématiques, APIs internes.
- `documentation/developpement/guides/` explique comment réaliser une tâche : coder un exercice, rendre un exercice interactif, exporter AMC, utiliser les helpers mathématiques.
- `documentation/tests/` décrit les tests locaux, la CI et les rapports générés.
