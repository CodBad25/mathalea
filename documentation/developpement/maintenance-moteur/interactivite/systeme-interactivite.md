# Système d'interactivité

Le système d'interactivité permet aux exercices de recevoir des réponses dans
le navigateur, de les normaliser, puis de les vérifier avec un comparateur
adapté. La mise en œuvre côté exercice est décrite dans
[interactivité simple](../../auteurs-exercices/interactivite-simple.md) et
[formats interactifs spécialisés](../../auteurs-exercices/complements/formats-interactifs.md).
La création d'un composant suit la
[convention des custom elements](custom-elements.md).

## Interactivité obligatoire

Un exercice peut définir `interactifObligatoire = true` lorsqu'il ne possède pas de version HTML non interactive. Dans les vues HTML, ce drapeau impose `interactif = true`, remplace un éventuel paramètre URL `i=0` par `i=1` et masque le bouton de bascule. Les exports papier restent libres de désactiver l'interactivité pour leur rendu.

## Formats interactifs

Les formats sont définis par `InteractivityType` dans `src/lib/types.ts`. Les formats courants sont :

Les custom elements maison sont centralisés dans `src/lib/customElements/`. Dans un exercice, utiliser le helper métier indiqué ci-dessous : il prépare le HTML périphérique et délègue à la méthode `create()` du custom element. Les méthodes `create()` sont des primitives destinées à l'implémentation des helpers et aux infrastructures qui doivent reconstruire un composant, comme `MetaExerciceCan`.

| Format                      | Statut     | Usage                                                             | Helper d'injection recommandé         | Fichiers principaux                                                                                                                    |
| --------------------------- | ---------- | ----------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `mathlive`                  | Obsolète   | Alias historique de `mathalea-mathfield`                          | `ajouteChampTexteMathLive()`          | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaMathfield.ts`, `src/lib/interactif/mathLiveVerifications.ts` |
| `fillInTheBlank`            | Obsolète   | Alias historique de `fill-in-the-blank`                           | `remplisLesBlancs()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/FillInTheBlank.ts`                                                   |
| `tableauMathlive`           | Obsolète   | Alias historique de `tableau-mathlive`                            | `creeTableauMathliveElement()`        | `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`, `src/lib/customElements/TableauMathlive.ts`                                    |
| `texte`                     | Obsolète   | Alias historique de `mathalea-textfield`                          | `ajouteChampTexte()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaTextfield.ts`                                                |
| `qcm`                       | Obsolète   | API historique des QCM, rendue en HTML par `mathalea-qcm`         | `propositionsQcm()`                   | `src/lib/interactif/qcm.ts`, `src/lib/customElements/MathaleaQcm.ts`                                                                   |
| `mathalea-qcm`              | Moderne    | QCM déclaré par `handleAnswers()`                                 | `addMathaleaQcm()`                    | `src/lib/customElements/MathaleaQcm.ts`                                                                                                |
| `liste-deroulante`          | Moderne    | Liste déroulante HTML custom                                      | `choixDeroulant()`                    | `src/lib/customElements/ListeDeroulanteElement.ts`                                                                                     |
| `dnd`                       | Historique | Alias historique de `drag-and-drop`                               | helpers de `DragAndDrop.ts`           | `src/lib/interactif/DragAndDrop.ts`, `src/lib/customElements/DragAndDropElement.ts`                                                    |
| `drag-and-drop`             | Moderne    | Glisser-déposer                                                   | `DragAndDrop.ajouteDragAndDrop()`     | `src/lib/interactif/DragAndDrop.ts`, `src/lib/customElements/DragAndDropElement.ts`                                                    |
| `cliqueFigure`              | Historique | Clics sur objets de figure                                        | objets SVG et `cliqueFiguresArray`    | `src/lib/customElements/CliqueFigureElement.ts`, `src/lib/interactif/gestionInteractif.ts`                                             |
| `svg-selection`             | Moderne    | Sélection de SVG avec somme de valeurs                            | `addSvgSelection()`                   | `src/lib/customElements/SvgSelectionElement.ts`                                                                                        |
| `custom`                    | Historique | Vérification fournie par l'exercice ou un méta-exercice           | fourni par l'exercice                 | `src/lib/interactif/gestionInteractif.ts`                                                                                              |
| `my-spreadsheet`            | Moderne    | Réponse de type feuille de calcul                                 | `addSheet()`                          | `src/lib/customElements/MySpreadSheet.ts`                                                                                              |
| `MetaInteractif2d`          | Historique | Alias historique de `meta-interactif-2d`                          | helpers de `interactif2d.ts`          | `src/lib/2d/interactif2d.ts`, `src/lib/customElements/MetaInteractif2dElement.ts`                                                      |
| `meta-interactif-2d`        | Moderne    | Champs MathLive placés dans une figure MathALÉA 2D                | `mathalea2d()` via `MetaInteractif2d` | `src/lib/2d/interactif2d.ts`, `src/modules/mathalea2d.ts`, `src/lib/customElements/MetaInteractif2dElement.ts`                         |
| `multi-mathfield`           | Moderne    | Plusieurs champs MathLive coordonnés                              | `addMultiMathfield()`                 | `src/lib/customElements/MultiMathfield.ts`                                                                                             |
| `mathalea-mathfield`        | Moderne    | Champ MathLive simple                                             | `ajouteChampTexteMathLive()`          | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaMathfield.ts`                                                |
| `fill-in-the-blank`         | Moderne    | Texte à trous MathLive                                            | `remplisLesBlancs()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/FillInTheBlank.ts`                                                   |
| `mathalea-textfield`        | Moderne    | Champ texte HTML                                                  | `ajouteChampTexte()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaTextfield.ts`                                                |
| `tableau-mathlive`          | Moderne    | Tableau de cellules MathLive                                      | `creeTableauMathliveElement()`        | `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`, `src/lib/customElements/TableauMathlive.ts`                                    |
| `guide-ane`                 | Moderne    | Un guide-âne interactif                                           | `addGuideAne()`                       | `src/lib/customElements/GuideAne.ts`                                                                                                   |
| `clique-figure`             | Moderne    | Sélection d'une ou plusieurs figures déjà présentes dans l'énoncé | `addCliqueFigure()`                   | `src/lib/customElements/CliqueFigureElement.ts`                                                                                        |
| `demi-droite-interactive`   | Moderne    | Pour placer des points d'abscisses fractionnaires                 | `demiDroiteInteractive()`             | `src/lib/customElements/demi_droite_interactive.ts`                                                                                    |
| `interactive-clock`         | Moderne    | Une horloge interactive                                           | `handleInteractiveClock()`            | `src/lib/customElements/InteractiveClock.ts`                                                                                           |
| `trigo-circle-selection`    | Moderne    | Un cercle trigo interactif                                        | `selectionCercleTrigo()`              | `src/lib/customElements/TrigoCircleSelectionElement.ts`                                                                                |
| `tableau-signes-variations` | Moderne    | Tableau de signes/variations interactif, export tkz-tab en LaTeX  | `addTableauSignesVariations()`        | `src/lib/customElements/TableauSignesVariationsElement.ts`                                                                             |

Pour un nouvel exercice, choisir le format moderne dans `handleAnswers()` tout en continuant d'utiliser le helper métier correspondant pour injecter le composant. Les formats obsolètes restent acceptés afin de ne pas migrer en bloc les exercices existants.

## Réponses attendues

`handleAnswers()` dans `src/lib/interactif/gestionInteractif.ts` est l'entrée moderne pour déclarer les réponses attendues. Les QCM historiques au format `qcm` alimentent encore directement `autoCorrection`, tandis que le format `mathalea-qcm` utilise désormais `handleAnswers()` :

```ts
handleAnswers(exercice, question, reponses, params)
```

La fonction initialise `autoCorrection[question]`, choisit ou déduit `formatInteractif`, normalise les valeurs et associe un comparateur. Par défaut, le comparateur est `fonctionComparaison()` depuis `src/lib/interactif/comparisonFunctions.ts`. Si `params.formatInteractif` n'est pas fourni, `handleAnswers()` déduit `fillInTheBlank` quand une clé `champ1` existe, `tableauMathlive` quand une clé `LxCy` existe, sinon il reprend le format déjà posé sur la question ou utilise `mathlive`.

Pour `mathalea-qcm`, la valeur est `{ qcm: { propositions, options?, enonce?, correction? } }`. Cette branche copie les propositions vers `autoCorrection[question].propositions` et vers `autoCorrectionAMC` sans les faire passer par les comparateurs champ par champ.

Les clés de `reponses` dépendent du format :

| Clé                             | Format                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reponse`                       | Champ unique `mathlive`, `texte`, `liste-deroulante`, `svg-selection`, `guide-ane`, `interactive-clock`, `demi-droite-interactive`, `trigo-circle-selection`                 |
| `champ1`, `champ2`, ...         | `fillInTheBlank`                                                                                                                                                             |
| `L1C1`, `L1C2`, ...             | `tableauMathlive`                                                                                                                                                            |
| `rectangle1`, `rectangle2`, ... | `dnd`                                                                                                                                                                        |
| `field0`, `field1`, ...         | `multi-mathfield`, `MetaInteractif2d`                                                                                                                                        |
| `sheetAnswer`                   | `my-spreadsheet`                                                                                                                                                             |
| `bareme`                        | Fonction de barème partiel                                                                                                                                                   |
| `feedback`                      | Fonction de feedback global                                                                                                                                                  |
| `callback`                      | Vérification personnalisée avec score détaillé, utilisée par certains formats historiques ou par des helpers spécialisés quand le comportement champ par champ ne suffit pas |

Chaque réponse peut fournir `value`, `compare` et `options`. Les valeurs métier comme `FractionEtendue`, `Decimal`, `Grandeur`, `Hms`, `Complexe` et `number` sont converties en chaînes avant comparaison. Sans options explicites, une réponse numériquement valide reçoit automatiquement l'option `nombreDecimalSeulement`.

`setReponse()` existe encore dans `src/lib/interactif/gestionInteractif.ts`, mais sert d'adaptateur de compatibilité. Les nouveaux exercices doivent préférer `handleAnswers()`.

## Pipeline de vérification

`exerciceInteractif()` dans `src/lib/interactif/gestionInteractif.ts` parcourt les questions et délègue selon `formatInteractif`.

Avant le dispatch, les formats historiques compatibles sont normalisés vers leur custom element :

| Format historique  | Custom element terminal |
| ------------------ | ----------------------- |
| `mathlive`         | `mathalea-mathfield`    |
| `fillInTheBlank`   | `fill-in-the-blank`     |
| `tableauMathlive`  | `tableau-mathlive`      |
| `texte`            | `mathalea-textfield`    |
| `qcm`              | `mathalea-qcm`          |
| `cliqueFigure`     | `clique-figure`         |
| `dnd`              | `drag-and-drop`         |
| `MetaInteractif2d` | `meta-interactif-2d`    |

Le dispatch utilise `interactivityTypeToCustomElementFormat()` dans `src/lib/types.ts`. La fonction ajoute la compatibilité QCM à la normalisation MathLive sans affecter les branches de construction de `MetaExerciceCan`. Elle est utilisée dans le flux classique (`exerciceInteractif()`), les flux CAN (`gestionCan.ts`, `Can.svelte`) et `QuestionParPage.svelte`. Les wrappers appellent ensuite leur propre `verifQuestion()` terminale. Les helpers historiques restent donc utilisables dans les exercices, mais la correction passe par le registre des `MathaleaCustomElement`.

Les QCM n'installent plus de listener de validation depuis `propositionsQcm()` : le bouton de la vue déclenche l'orchestrateur commun, qui route `qcm` vers `MathaleaQcmElement.verifQuestion()`. `verifQuestionQcm()` reste réexportée par `qcm.ts` pour les rares corrections d'exercice qui la composent explicitement avec une autre vérification.

| Format                      | Vérification                                                                                                                                                    |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mathlive`                  | Routé vers `MathaleaMathfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaMathfield.ts`, vérification terminale d'un champ unique              |
| `fillInTheBlank`            | Routé vers `FillInTheBlankElement.verifQuestion()` dans `src/lib/customElements/FillInTheBlank.ts`, vérification terminale des prompts `champ1`, `champ2`, ...  |
| `tableauMathlive`           | Routé vers `TableauMathliveElement.verifQuestion()` dans `src/lib/customElements/TableauMathlive.ts`, vérification terminale des cellules `LxCy`                |
| `texte`                     | Routé vers `MathaleaTextfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaTextfield.ts`, vérification terminale d'un champ texte               |
| `mathalea-mathfield`        | `MathaleaMathfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaMathfield.ts`, vérification terminale d'un champ unique                         |
| `fill-in-the-blank`         | `FillInTheBlankElement.verifQuestion()` dans `src/lib/customElements/FillInTheBlank.ts`, vérification terminale des prompts `champ1`, `champ2`, ...             |
| `mathalea-textfield`        | `MathaleaTextfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaTextfield.ts`, vérification terminale d'un champ texte                          |
| `tableau-mathlive`          | `TableauMathliveElement.verifQuestion()` dans `src/lib/customElements/TableauMathlive.ts`, vérification terminale des cellules `LxCy`                           |
| `multi-mathfield`           | `MultiMathfieldElement.verifQuestion()` dans `src/lib/customElements/MultiMathfield.ts`                                                                         |
| `MetaInteractif2d`          | Routé vers `MetaInteractif2dElement.verifQuestion()` dans `src/lib/customElements/MetaInteractif2dElement.ts`                                                   |
| `meta-interactif-2d`        | `MetaInteractif2dElement.verifQuestion()` dans `src/lib/customElements/MetaInteractif2dElement.ts`                                                              |
| `qcm`                       | Routé vers `MathaleaQcmElement.verifQuestion()` dans `src/lib/customElements/MathaleaQcm.ts`                                                                    |
| `mathalea-qcm`              | `MathaleaQcmElement.verifQuestion()` dans `src/lib/customElements/MathaleaQcm.ts`                                                                               |
| `liste-deroulante`          | `ListeDeroulanteElement.verifQuestion()`                                                                                                                        |
| `svg-selection`             | `SvgSelectionElement.verifQuestion()` dans `src/lib/customElements/SvgSelectionElement.ts`                                                                      |
| `dnd`                       | Routé vers `DragAndDropElement.verifQuestion()` dans `src/lib/customElements/DragAndDropElement.ts`                                                             |
| `drag-and-drop`             | `DragAndDropElement.verifQuestion()` dans `src/lib/customElements/DragAndDropElement.ts`                                                                        |
| `my-spreadsheet`            | `MySpreadsheetElement.verifQuestion()` dans `src/lib/customElements/MySpreadSheet.ts`                                                                           |
| `guide-ane`                 | `GuideAne.verifQuestion()` dans `src/lib/customElements/GuideAne.ts`                                                                                            |
| `trigo-circle-selection`    | `TrigCircleSelectionElement.verifQuestion()` dans `src/lib/customElements/TrigoCircleSelectionElement.ts`                                                       |
| `demi-droite-interactive`   | `DemiDroiteInteractiveElement.verifQuestion()` dans `src/lib/customElements/demi_droite_interactive.ts`                                                         |
| `interactive-clock`         | `InteractiveClock.verifQuestion()` dans `src/lib/customElements/InteractiveClock.ts`                                                                            |
| `tableau-signes-variations` | `TableauSignesVariationsElement.verifQuestion()` dans `src/lib/customElements/TableauSignesVariationsElement.ts`                                                |
| `cliqueFigure`              | Routé vers `CliqueFigureElement.verifQuestion()` dans `src/lib/customElements/CliqueFigureElement.ts`                                                           |
| `clique-figure`             | `CliqueFigureElement.verifQuestion()` dans `src/lib/customElements/CliqueFigureElement.ts`                                                                      |
| `custom`                    | correction globale de l'exercice quand `exercice.interactifType === 'custom'`, ou fonction `correctionInteractives` à l'index de question pour un méta-exercice |

Les fonctions de vérification retournent un résultat exploitable par le score et affichent le retour visuel associé à la question.

### Exception `multi-mathfield` pour le feedback visuel

`MultiMathfieldElement` ne suit pas le schéma habituel d'un unique `span#resultatCheckEx...Q...` global par question.

- Chaque champ MathLive du composant possède son propre `span` de feedback (`#check-multi-mathfieldEx...Q...-field...`) pour afficher le résultat champ par champ.
- Il n'y a donc pas de `resultatCheck` global à créer dans l'énoncé pour ce format.

Cette exception est volontaire car une question `multi-mathfield` porte plusieurs saisies indépendantes et le retour attendu est local à chaque champ.

## Affichage des réponses élèves dans les corrections CAN

La vue des corrections d'une Course aux nombres (`src/components/display/can/presentationalComponents/Solutions.svelte`) rappelle la réponse donnée par l'élève sous chaque correction et nettoie le HTML des questions pour l'affichage groupé. Cette logique est isolée dans `src/lib/components/canSolutions.ts` :

- `formatStudentAnswer(questionHtml, rawAnswer)` : formate la réponse brute stockée dans `exercice.answers` pour la ligne « Réponse donnée : ... » ;
- `stripInteractiveWidgets(questionHtml)` : retire ou remplace les éléments interactifs de l'énoncé (mathfields remplacés par des pointillés, etc.).

Les customElements y sont traités de façon générique via le registre `mathaleaCustomElementsRegistry` et les hooks statiques `formatStudentAnswer` / `stripFromQuestionHtml` de `MathaleaCustomElement` (voir [créer un custom element](custom-elements.md)). Les autres formats (QCM, champ texte, mathfield par défaut) sont détectés par des marqueurs dans le HTML de la question. Tests : `tests/unit/canSolutions.test.ts`.

## Wrappers MathLive historiques

Les helpers historiques de `src/lib/interactif/questionMathLive.ts` restent les points d'entrée pour les exercices existants :

- `ajouteChampTexteMathLive()` crée un wrapper `mathalea-mathfield` autour du `math-field` interne ;
- `remplisLesBlancs()` crée un wrapper `fill-in-the-blank` autour du `math-field` readonly à prompts ;
- `ajouteChampTexte()` crée un wrapper `mathalea-textfield` autour de l'`input` HTML ;
- `ajouteQuestionMathlive()` reste un helper pratique pour créer un tableau MathLive et déclarer les réponses, mais l'injection pure du composant est portée par `creeTableauMathliveElement()` dans `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`.

Pour préserver les anciens exercices et callbacks, l'identifiant legacy reste porté par l'élément interne :

- champs simples : `champTexteEx${numeroExercice}Q${questionIndex}` ;
- textes à trous : même identifiant sur le `math-field` interne, les prompts étant `champ1`, `champ2`, ... ;
- tableaux : `table#tabMathliveEx${numeroExercice}Q${questionIndex}` et cellules `champTexteEx...LxCy`.

Le wrapper suit la convention des custom elements : son id est préfixé par le tag, par exemple `mathalea-mathfieldEx0Q0`, `fill-in-the-blankEx0Q0`, `mathalea-textfieldEx0Q0` ou `tableau-mathliveEx0Q0`. Les sélecteurs legacy qui ciblent le champ interne continuent donc de fonctionner, tandis que les traitements génériques ciblent le wrapper.

Deux niveaux de personnalisation existent :

- dans `handleAnswers()`, une entrée `callback` sur `valeur` permet d'analyser globalement les saisies d'une question avant de calculer le score ;
- côté custom element, `verifyCallback` / `verifyCallbackName` permettent de remplacer complètement la vérification du wrapper quand son helper ou son `create(...)` expose cette option.

## Comparateurs

`fonctionComparaison()` centralise la comparaison des réponses MathLive. Elle applique des nettoyages de saisie, puis active des comportements via `options` : fractions, unités, intervalles, textes avec ou sans casse, coordonnées, suites, ensembles, écriture scientifique, factorisation, puissances, calcul formel, etc.

Pour les exercices qui ont besoin de critères multiples ou d'un score partiel, `src/lib/interactif/checks/` fournit un système de checks composables. Les checks ne remplacent pas `fonctionComparaison()` ; ils la réutilisent notamment via les adaptateurs.

## Fichiers clefs

- `src/lib/customElements/` : implémentations des custom elements MathALÉA.
- `src/lib/types.ts` : types transverses, dont `InteractivityType`.
- `src/lib/interactif/gestionInteractif.ts` : orchestration, `handleAnswers()`, `setReponse()`, `exerciceInteractif()` et dispatch des corrections custom.
- `src/lib/interactif/comparisonFunctions.ts` : `fonctionComparaison()`.
- `src/lib/interactif/checks/` : checks composables et tests unitaires.
- `src/lib/interactif/questionMathLive.ts` : helpers historiques d'insertion des champs MathLive, textes à trous, champs texte et tableaux.
- `src/lib/interactif/mathLiveVerifications.ts` : primitives terminales utilisées par les wrappers MathLive.
- `src/lib/interactif/fonctionsBaremes.ts` : barèmes partagés comme `toutPourUnPoint` et `toutAUnPoint`.
- `src/lib/interactif/qcm.ts` : QCM.
- `src/lib/customElements/MathaleaQcm.ts` : custom element `mathalea-qcm`, helper `addMathaleaQcm()` et vérification QCM partagée. En contexte HTML, `propositionsQcm()` injecte ce composant tout en conservant les identifiants internes historiques.
- `src/lib/customElements/CliqueFigureElement.ts` : custom element `clique-figure`, helper `addCliqueFigure()` et vérification des questions `cliqueFigure`. Les exercices historiques qui renseignent `cliqueFiguresArray` et appellent `setCliqueFigure()` sont normalisés vers ce tag sans devoir réécrire leurs énoncés.
- `src/lib/interactif/DragAndDrop.ts` : builder historique du glisser-déposer.
- `src/lib/customElements/DragAndDropElement.ts` : custom element `drag-and-drop`, wrapper de rendu et vérification des questions `dnd`.
- `src/lib/interactif/setMathfield.ts` : configuration partagée des `math-field` interactifs.
