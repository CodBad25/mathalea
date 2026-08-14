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
| [Vue mobile](architecture/vue-mobile.md) | Vue par défaut sur téléphone : tuiles, menus plein écran |
| [Apps externes](architecture/apps-externes.md) | Iframes tierces, protocole `postMessage` et remontée des scores |
| [Plein écran dans Moodle](architecture/moodle-plein-ecran.md) | Bouton plein écran des vues intégrées, natif ou délégué à la page hôte |

## Interactivité

| Sujet | Rôle |
| --- | --- |
| [Système d'interactivité](interactivite/systeme-interactivite.md) | Formats, réponses, comparateurs et pipeline |
| [Convention des custom elements](interactivite/custom-elements.md) | Contrat de création et d'intégration |
| [Réponses LMS](interactivite/reponses-lms.md) | Encodage et transmission Moodle/SCORM |
| [Scratch et Blockly](interactivite/scratch-blockly.md) | Architecture des éditeurs visuels |
| [Tableur](interactivite/tableur.md) | Rendu HTML, sérialisation et sortie imprimable |
| [Relier les étiquettes](interactivite/relier-etiquettes.md) | Appariement interactif et ses sorties LaTeX et Typst |

## Scratch

| Sujet | Rôle |
| --- | --- |
| [`@scratch2latex/scratch-core`](scratch/scratch-core.md) | Mise à jour de `scratchblocks`, dictionnaire français et exports du paquet |

## Exports

| Sujet | Rôle |
| --- | --- |
| [Moteur AMC](exports/amc.md) | Structures, inférence, normalisation et rendu |
| [Vue Typst](exports/typst.md) | Conversion et compilation dans le navigateur |
| [Vue LaTeX](exports/tex.md) | Éditeur et aperçu PDF, réglages globaux et par exercice |
| [Vue Flash-cards](exports/flashcards.md) | Cartes question/réponse en Typst |
| [Vue TBI](exports/tbi.md) | Vidéoprojection : dispositions, actions au survol, horloge |
| [Vue Diaporama](exports/diaporama.md) | Diapositives, décompte, alternance question/correction |

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
