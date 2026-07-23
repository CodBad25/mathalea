# JSON du référentiel et du menu d'exercices

Cette page décrit le rôle de chaque fichier JSON impliqué dans la génération et l'affichage du menu d'exercices (arborescence niveau > thème > exercice, annales, outils, etc.).

## Vue d'ensemble

Deux familles de fichiers coexistent :

- **Fichiers générés** par [tasks/updateMenuInternational.js](../../../../tasks/updateMenuInternational.js) (référentiel des exercices aléatoires) et par `tasks/dictionnaireToReferentiel.js` (référentiel des annales statiques). Ils ne doivent pas être édités à la main.
- **Fichiers maintenus manuellement** : squelettes de référentiel, libellés affichés, contenus de menu annexes (outils, ressources, bibliothèque, applications tierces, liens rapides, carrousel).

Tous ces fichiers sont importés statiquement (ES modules JSON) par le code sous [src/lib](../../../../src/lib) et [src/components](../../../../src/components) ; il n'y a pas de fetch runtime.

## Génération par `tasks/updateMenuInternational.js`

Le script doit être relancé après la création ou la modification d'un exercice. Il parcourt `src/exercices`, extrait les métadonnées de chaque fichier d'exercice (`uuid`, `refs`, `titre`, dates, `features` interactif/amc/qcm) et écrit, séparément pour la France (`FR`) et la Suisse (`CH`) :

| Fichier                                                                              | Rôle                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/json/referentiel2022FR.json`, `src/json/referentiel2022CH.json`                 | Arbre complet niveau > thème > exercice construit à partir du squelette `tasks/emptyRef2022.json` / `tasks/emptyRefCH.json`. C'est le référentiel affiché en tant que section « Exercices aléatoires » du menu (`referentielsStore.ts`).                                                                          |
| `src/json/referentielGeometrieDynamique.json`                                        | Sous-arbre « Géométrie dynamique » extrait de `referentiel2022FR.json` (FR uniquement) et retiré de ce dernier. Alimente la section « Géométrie dynamique » du menu.                                                                                                                                              |
| `src/json/exercicesFR.json`, `src/json/exercicesCH.json`                             | Liste à plat (clé = ref pédagogique) de tous les exercices générés, triée par clé. Sert d'étape intermédiaire à la construction du référentiel ; pas consommée directement ailleurs dans `src/`.                                                                                                                  |
| `src/json/exercicesNonInteractifsFR.json`, `src/json/exercicesNonInteractifsCH.json` | Liste des chemins de fichiers d'exercices dont `interactifReady` n'est pas `true`. Fichier de suivi/inventaire, non consommé au runtime.                                                                                                                                                                          |
| `src/json/uuidsToUrlFR.json`, `src/json/uuidsToUrlCH.json`                           | Dictionnaire `uuid -> chemin du fichier source` (plus quelques entrées fixes pour les outils Svelte comme `spline`, `clavier`, `version`, `equation`). Utilisé par [mathalea.ts](../../../../src/lib/mathalea.ts) et `componentsUtils.ts` pour charger dynamiquement le module d'un exercice à partir de son `uuid`. |
| `src/json/refToUuidFR.json`, `src/json/refToUuidCH.json`                             | Dictionnaire `ref pédagogique -> uuid`. Utilisé par `languagesStore.ts` / `languagesUtils.ts` pour retrouver l'exercice équivalent lors d'un changement de langue/pays (FR ↔ CH) à partir de sa référence pédagogique.                                                                                            |

Entrées manuelles utilisées par le script :

- `tasks/emptyRef2022.json`, `tasks/emptyRefCH.json` : squelette des niveaux/catégories (sans exercices) servant de point de départ à `referentiel2022*.json`. À mettre à jour en cas de création de niveau ou de chapitre.
- `src/json/levelsThemesList.json`, `src/json/levelsThemesListCH.json` : libellés (titres humains) des niveaux, thèmes et sous-thèmes affichés dans le menu, utilisés par `ReferentielNode.svelte` (pas régénérés par le script).

L'apparence d'un noeud du menu dépend à la fois de sa profondeur dans `emptyRef2022.json` et de la fonction `themeCodeisSubthemeCode()` dans `ReferentielNode.svelte`. Cette fonction détecte certains formats de codes comme des sous-thèmes pour masquer le code et appliquer une typographie plus discrète. Si un nouveau format de code est ajouté au référentiel, il peut donc être correctement placé dans l'arbre tout en étant affiché comme un thème principal tant que cette fonction ne reconnait pas son motif.

## Génération par `tasks/dictionnaireToReferentiel.js`

- `src/json/dictionnaireBAC.js`, `dictionnaireDNB.js`, `dictionnaireDNBPRO.js`, `dictionnaireC3.js`, `dictionnaireCrpeCoop.js`, `dictionnaireCrpeDida.js`, `dictionnaireE3C.js`, `dictionnaireEAM.js`, `dictionnaireEVACOM.js`, `dictionnaireFlashBac.js`, `dictionnaireSTI2D.js`, `dictionnaireSTL.js` : sources maintenues à la main listant chaque annale statique (tags, chemins d'images/LaTeX). Ce sont les entrées du script.
- `src/json/referentielStaticFR.json`, `src/json/referentielStaticCH.json` : référentiel des annales d'examens statiques généré à partir des dictionnaires ci-dessus. Consommé par `refUtils.ts` (fusionné dans `baseReferentiel.static`) et par `referentielsStore.ts` (section « Annales examens »).

## Ressources partenaires (MathAdata)

- `src/json/dictionnaireMathadata.js` : source maintenue à la main (même esprit que `dictionnaireBAC.js` et consorts) listant, par chapitre, les exercices statiques partenaires MathAdata (`{ title, exercices: { 'md-000x': { title } } }`).
- `src/lib/components/mathadataReferentiel.ts` : construit à la volée (pas de fichier généré) le référentiel `JSONReferentielObject` correspondant à partir de `dictionnaireMathadata.js`, avec pour chaque exercice `uuid` (préfixe `md-`), `titre`, et `png`/`pngCor`/`tex`/`texCor`/`url`/`urlcor` pointant vers `static/mathadata/tex/<uuid>(.tex|_cor.tex)` et `static/mathadata/tex/png/<uuid>(.png|_cor.png)`. Exporté en tant que `referentielMathadata`, il alimente la section « Ressources partenaires » du menu (`referentielsStore.ts`, FR uniquement) et est fusionné dans les référentiels statiques consommés par `ExerciceStatic.svelte` et `exercisesUtils.ts` pour que ces exercices s'affichent et s'exportent comme les autres statiques.
- Le préfixe d'uuid `md-` est reconnu comme statique par `isStatic()` (`componentsUtils.ts`) et par `mathaleaGetExercicesFromParams()` (`mathalea.ts`, qui utilise `referentielMathadata` au lieu de `referentielStaticFR/CH` pour la résolution de l'uuid).
- `MathadataBanner.svelte` affiche un encart d'information en haut de la liste d'exercices (`Exercices.svelte`) dès qu'un exercice `md-` est présent dans `exercicesParams`.

## Fichiers de contenu du menu (maintenus manuellement)

| Fichier                                    | Rôle                                                                                                                                                                                          | Consommateur principal                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `src/json/referentielsActivation.json`     | Active/désactive chaque section du menu (`aleatoires`, `examens`, `geometrieDynamique`, `outils`, `ressources`, `statiques`, …).                                                              | `referentielsStore.ts`, `refUtils.ts` / `referentielsUtils.ts` (`isReferentielActivated`) |
| `src/json/referentielProfs.json`           | Référentiel de la section « Outils du professeur ».                                                                                                                                           | `referentielsStore.ts`                                                                    |
| `src/json/referentielRessources.json`      | Référentiel de la section « Vos ressources » (ressources HTML importées par l'utilisateur).                                                                                                   | `referentielsStore.ts`                                                                    |
| `src/json/referentielBibliotheque.json`    | Référentiel de la section « Bibliothèque » (FR uniquement).                                                                                                                                   | `referentielsStore.ts`                                                                    |
| `src/json/referentielAppsTierce.json`      | Liste des applications tierces présentées dans la modale dédiée, hors arborescence d'exercices.                                                                                               | `ModalThirdApps.svelte`, `Start.svelte`                                                   |
| `src/json/uuidsRessources.json`            | Dictionnaire `identifiant -> composant/ressource` pour les outils interactifs spéciaux (`iframe`, `video`, `spline`, `clavier`, `equation`, `version`, …), distinct des exercices classiques. | `HeaderExerciceVueProf.svelte`, `Version.svelte`, `ClavierTest.svelte`                    |
| `src/json/quickLinks.json`                 | Contenu des liens rapides affichés sur la page d'accueil.                                                                                                                                     | `QuickLinks.svelte`                                                                       |
| `src/json/carouselContent.json`            | Contenu du carrousel de la page d'accueil.                                                                                                                                                    | `Carousel.svelte`, `MobileCarouselCards.svelte`                                           |
| `src/json/carouselContentForCapytale.json` | Variante du carrousel pour Capytale.                                                                                                                                                          | Non utilisée actuellement (import commenté dans `Carousel.svelte`).                       |

## Dictionnaires de libellés

| Fichier                                                            | Rôle                                                                                          | Consommateur                            |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| `src/json/codeToLevelList.json`, `src/json/codeToLevelListCH.json` | Dictionnaire `code niveau -> titre affiché`.                                                  | `codeToLevelTitle()` dans `refUtils.ts` |
| `src/json/codeToThemeList.json`                                    | Dictionnaire `code thème -> titre affiché` (utilisé en repli si le code n'est pas un niveau). | `codeToLevelTitle()` dans `refUtils.ts` |

## Fichiers non consommés dans `src/` (à supprimer)

Ces fichiers existent dans `src/json/` mais n'ont pas de consommateur identifié dans `src/` au moment de la rédaction de cette page : `exercicesList.json`, `allExercice.json`, `scratchFr.json`, `referentiel2nd.json`, `2ndeAvecSousThemes.json`, `2ndeListeIndividuelle.json`, `3eAvecSousThemes.json`, `3eListeIndividuelle.json`, `4eAvecSousThemes.json`, `4eListeIndividuelle.json`, `5eAvecSousThemes.json`, `5eListeIndividuelle.json`, `6emeAvecSousTheme.json`, `6emeListeIndividuelle.json`.
