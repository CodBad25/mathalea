# Maintenir le moteur

Ce niveau décrit les contrats, pipelines et modules partagés de MathALÉA. Il
s'adresse aux personnes qui modifient le moteur plutôt qu'à celles qui utilisent
ses helpers dans un exercice.

Pour créer un exercice sans modifier ces contrats, commencez par
[Coder des exercices](../auteurs-exercices/README.md).

## Architecture

| Sujet | Rôle |
| --- | --- |
| [Architecture des exercices](architecture/exercices.md) | Cycle de génération, classes et sorties |
| [JSON du menu des exercices](architecture/menu-exercices.md) | Fichiers générés et consommés par le menu |

## Interactivité

| Sujet | Rôle |
| --- | --- |
| [Système d'interactivité](interactivite/systeme-interactivite.md) | Formats, réponses, comparateurs et pipeline |
| [Convention des custom elements](interactivite/custom-elements.md) | Contrat de création et d'intégration |
| [Réponses LMS](interactivite/reponses-lms.md) | Encodage et transmission Moodle/SCORM |
| [Scratch et Blockly](interactivite/scratch-blockly.md) | Architecture des éditeurs visuels |
| [Tableur](interactivite/tableur.md) | Rendu HTML, sérialisation et sortie imprimable |

## Exports

| Sujet | Rôle |
| --- | --- |
| [Moteur AMC](exports/amc.md) | Structures, inférence, normalisation et rendu |
| [Vue Typst](exports/typst.md) | Conversion et compilation dans le navigateur |
| [Vue Flash-cards](exports/flashcards.md) | Cartes question/réponse en Typst |

## Mathématiques

La [référence mathématique du moteur](mathematiques/README.md) documente les
classes, objets 2D et représentations partagés.

## Contribution

| Sujet | Rôle |
| --- | --- |
| [Workflows de contribution](contribution/workflows.md) | Git, build, tests globaux et diagnostic |
| [Maintenir la documentation](contribution/documentation.md) | Source canonique et protocole de mise à jour |

La CI et les rapports restent indexés dans
[Tests et CI](../../tests/README.md).
