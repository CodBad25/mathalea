# Système d'interactivité

Le système d'interactivité permet aux exercices de recevoir des réponses dans le navigateur, de les normaliser, puis de les vérifier avec un comparateur adapté. Les guides de mise en oeuvre sont séparés dans [rendre un exercice interactif](../guides/rendre-un-exercice-interactif.md) et [créer un custom element (convention MathALÉA)](../guides/creer-un-custom-element.md).

## Interactivité obligatoire

Un exercice peut définir `interactifObligatoire = true` lorsqu'il ne possède pas de version HTML non interactive. Dans les vues HTML, ce drapeau impose `interactif = true`, remplace un éventuel paramètre URL `i=0` par `i=1` et masque le bouton de bascule. Les exports papier restent libres de désactiver l'interactivité pour leur rendu.

## Formats interactifs

Les formats sont définis par `InteractivityType` dans `src/lib/types.ts`. Les formats courants sont :

Les custom elements maison sont désormais centralisés dans `src/lib/customElements/`. Les helpers métier d'injection et de vérification restent, selon les cas, dans `src/lib/interactif/` ou dans le module du custom element concerné.

| Format             | Usage                                                    | Fichiers principaux                                                                                                |
| ------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `mathlive`         | Champ MathLive pour une réponse mathématique             | `src/lib/interactif/questionMathLive.ts`, `src/lib/interactif/mathLive.ts`                                         |
| `fillInTheBlank`   | Texte à trous MathLive, réponses `champ1`, `champ2`, ... | `src/lib/interactif/questionMathLive.ts`                                                                           |
| `tableauMathlive`  | Cellules MathLive nommées `L1C1`, `L1C2`, ...            | `src/lib/interactif/questionMathLive.ts`, `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`                   |
| `texte`            | Champ texte HTML                                         | `src/lib/interactif/questionMathLive.ts`                                                                           |
| `qcm`              | Cases à cocher ou boutons radio                          | `src/lib/interactif/qcm.ts`                                                                                        |
| `listeDeroulante`  | Liste déroulante HTML custom                             | `src/lib/customElements/ListeDeroulanteElement.ts`, `src/lib/interactif/listeDeroulante/ListeDeroulante.ts`        |
| `dnd`              | Glisser-déposer                                          | `src/lib/interactif/DragAndDrop.ts`                                                                                |
| `cliqueFigure`     | Clics sur objets de figure                               | `src/lib/interactif/cliqueFigure.ts`, `src/lib/interactif/gestionInteractif.ts`                                    |
| `svgSelection`     | Sélection de SVG avec somme de valeurs                   | `src/lib/interactif/questionSvgSelection/questionSvgSelection.ts`, `src/lib/customElements/SvgSelectionElement.ts` |
| `custom`           | Vérification fournie par l'exercice ou un méta-exercice  | `src/lib/interactif/gestionInteractif.ts`                                                                          |
| `tableur`          | Réponse de type feuille de calcul                        | `src/lib/customElements/MySpreadSheet.ts`                                                                          |
| `MetaInteractif2d` | Champs dans une figure MathALÉA 2D                       | `src/lib/2d/interactif2d.ts`, `src/lib/interactif/gestionInteractif.ts`                                            |
| `multiMathfield`   | Plusieurs champs MathLive coordonnés                     | `src/lib/customElements/MultiMathfield.ts`, `src/lib/interactif/setMathfield.ts`                                   |

## Réponses attendues

`handleAnswers()` dans `src/lib/interactif/gestionInteractif.ts` est l'entrée moderne pour déclarer les réponses attendues :

```ts
handleAnswers(exercice, question, reponses, params)
```

La fonction initialise `autoCorrection[question]`, choisit ou déduit `formatInteractif`, normalise les valeurs et associe un comparateur. Par défaut, le comparateur est `fonctionComparaison()` depuis `src/lib/interactif/comparisonFunctions.ts`. Si `params.formatInteractif` n'est pas fourni, `handleAnswers()` déduit `fillInTheBlank` quand une clé `champ1` existe, `tableauMathlive` quand une clé `LxCy` existe, sinon il reprend le format déjà posé sur la question ou utilise `mathlive`.

Les clés de `reponses` dépendent du format :

| Clé                             | Format                                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `reponse`                       | Champ unique `mathlive`, `texte`, `listeDeroulante`, `svgSelection`                                    |
| `champ1`, `champ2`, ...         | `fillInTheBlank`                                                                                       |
| `L1C1`, `L1C2`, ...             | `tableauMathlive`                                                                                      |
| `rectangle1`, `rectangle2`, ... | `dnd`                                                                                                  |
| `field0`, `field1`, ...         | `multiMathfield`, `MetaInteractif2d`                                                                   |
| `sheetAnswer`                   | `tableur`                                                                                              |
| `bareme`                        | Fonction de barème partiel                                                                             |
| `feedback`                      | Fonction de feedback global                                                                            |
| `callback`                      | Vérification personnalisée avec score détaillé pour les formats vérifiés par `verifQuestionMathLive()` |

Chaque réponse peut fournir `value`, `compare` et `options`. Les valeurs métier comme `FractionEtendue`, `Decimal`, `Grandeur`, `Hms`, `Complexe` et `number` sont converties en chaînes avant comparaison. Sans options explicites, une réponse numériquement valide reçoit automatiquement l'option `nombreDecimalSeulement`.

`setReponse()` existe encore dans `src/lib/interactif/gestionInteractif.ts`, mais sert d'adaptateur de compatibilité. Les nouveaux exercices doivent préférer `handleAnswers()`.

## Pipeline de vérification

`exerciceInteractif()` dans `src/lib/interactif/gestionInteractif.ts` parcourt les questions et délègue selon `formatInteractif`.

| Format                                                   | Vérification                                                                                                                                                    |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mathlive`, `fillInTheBlank`, `tableauMathlive`, `texte` | `verifQuestionMathLive()` dans `src/lib/interactif/mathLive.ts`                                                                                                 |
| `multiMathfield`                                         | `MultiMathfieldElement.verifQuestion()` dans `src/lib/customElements/MultiMathfield.ts`                                                                         |
| `MetaInteractif2d`                                       | `verifQuestionMetaInteractif2d()`                                                                                                                               |
| `qcm`                                                    | `verifQuestionQcm()` dans `src/lib/interactif/qcm.ts`                                                                                                           |
| `listeDeroulante`                                        | `ListeDeroulanteElement.verifQuestion()`                                                                                                                        |
| `svgSelection`                                           | `verifQuestionSvgSelection()`                                                                                                                                   |
| `dnd`                                                    | `verifDragAndDrop()`                                                                                                                                            |
| `tableur`                                                | `MySpreadsheetElement.verifQuestion()` dans `src/lib/customElements/MySpreadSheet.ts`                                                                           |
| `cliqueFigure`                                           | `verifQuestionCliqueFigure()` dans `src/lib/interactif/cliqueFigure.ts`                                                                                         |
| `custom`                                                 | correction globale de l'exercice quand `exercice.interactifType === 'custom'`, ou fonction `correctionInteractives` à l'index de question pour un méta-exercice |

Les fonctions de vérification retournent un résultat exploitable par le score et affichent le retour visuel associé à la question.

### Exception `multiMathfield` pour le feedback visuel

`MultiMathfieldElement` ne suit pas le schéma habituel d'un unique `span#resultatCheckEx...Q...` global par question.

- Chaque champ MathLive du composant possède son propre `span` de feedback (`#check-multi-mathfieldEx...Q...-field...`) pour afficher le résultat champ par champ.
- Il n'y a donc pas de `resultatCheck` global à créer dans l'énoncé pour ce format.

Cette exception est volontaire car une question `multiMathfield` porte plusieurs saisies indépendantes et le retour attendu est local à chaque champ.

## Affichage des réponses élèves dans les corrections CAN

La vue des corrections d'une Course aux nombres (`src/components/display/can/presentationalComponents/Solutions.svelte`) rappelle la réponse donnée par l'élève sous chaque correction et nettoie le HTML des questions pour l'affichage groupé. Cette logique est isolée dans `src/lib/components/canSolutions.ts` :

- `formatStudentAnswer(questionHtml, rawAnswer)` : formate la réponse brute stockée dans `exercice.answers` pour la ligne « Réponse donnée : ... » ;
- `stripInteractiveWidgets(questionHtml)` : retire ou remplace les éléments interactifs de l'énoncé (mathfields remplacés par des pointillés, etc.).

Les customElements y sont traités de façon générique via le registre `mathaleaCustomElementsRegistry` et les hooks statiques `formatStudentAnswer` / `stripFromQuestionHtml` de `MathaleaCustomElement` (voir [créer un custom element](../guides/creer-un-custom-element.md)). Les autres formats (QCM, champ texte, `MetaInteractif2d`, mathfield par défaut) sont détectés par des marqueurs dans le HTML de la question. Tests : `tests/unit/canSolutions.test.ts`.

## Comparateurs

`fonctionComparaison()` centralise la comparaison des réponses MathLive. Elle applique des nettoyages de saisie, puis active des comportements via `options` : fractions, unités, intervalles, textes avec ou sans casse, coordonnées, suites, ensembles, écriture scientifique, factorisation, puissances, calcul formel, etc.

Pour les exercices qui ont besoin de critères multiples ou d'un score partiel, `src/lib/interactif/checks/` fournit un système de checks composables. Les checks ne remplacent pas `fonctionComparaison()` ; ils la réutilisent notamment via les adaptateurs.

## Fichiers clefs

- `src/lib/customElements/` : implémentations des custom elements MathALÉA.
- `src/lib/types.ts` : types transverses, dont `InteractivityType`.
- `src/lib/interactif/gestionInteractif.ts` : orchestration, `handleAnswers()`, `setReponse()`, `exerciceInteractif()` et dispatch des corrections custom.
- `src/lib/interactif/comparisonFunctions.ts` : `fonctionComparaison()`.
- `src/lib/interactif/checks/` : checks composables et tests unitaires.
- `src/lib/interactif/questionMathLive.ts` : insertion des champs MathLive et textes à trous.
- `src/lib/interactif/mathLive.ts` : vérification des champs MathLive.
- `src/lib/interactif/qcm.ts` : QCM.
- `src/lib/interactif/DragAndDrop.ts` : glisser-déposer.
- `src/lib/customElements/ListeDeroulanteElement.ts` : helpers, rendu et vérification des listes déroulantes.
- `src/lib/interactif/questionSvgSelection/questionSvgSelection.ts` : sélection SVG.
- `src/lib/interactif/trigoCircleSelection/selectionCercleTrigo.ts` : helper métier de sélection sur cercle trigonométrique.
- `src/lib/interactif/setMathfield.ts` : configuration partagée des `math-field` interactifs.
- `src/lib/customElements/MySpreadSheet.ts` : rendu, sérialisation et vérification des réponses `tableur`.
