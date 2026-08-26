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

## Interactivité dans la vue Course aux nombres

La vue Course aux nombres (`src/components/display/can/Can.svelte`) impose son propre réglage d'interactivité à tous les exercices de la liste, sans tenir compte des réglages individuels (`i` dans l'URL) : le paramètre d'URL `canI` (`canOptions.isInteractive`) fixe `globalOptions.setInteractive` puis `exercice.interactif` pour chaque exercice, avant le découpage en questions.

Avec `canI=0`, les énoncés ne doivent donc contenir aucun champ de saisie ni case à cocher active : les réponses ne sont jamais vérifiées (`Race.svelte` n'appelle `checkAnswers()` qu'en mode interactif) et le score comme la ligne « Réponse donnée » sont masqués. Seuls les exercices `interactifObligatoire` conservent leur interactivité, faute de rendu HTML alternatif.

`canOptions.isInteractive` est un réglage indépendant de `globalOptions.setInteractive`, qui ne concerne que la page Élève classique :

- il se règle dans l'onglet « Course aux nombres » de la page de configuration élève (`src/components/setup/configEleve/ConfigEleve.svelte`), pas dans l'onglet « Présentation classique » ;
- sa valeur par défaut dans `src/lib/stores/canStore.ts` est `true`, pour que les liens antérieurs au paramètre `canI` restent interactifs ;
- le flux Capytale reste l'exception : `handleCapytale()` dérive `isInteractive` de `setInteractive` parce que l'activité Capytale ne transporte qu'un seul réglage d'interactivité.

## Formats interactifs

Les formats sont définis par `InteractivityType` dans `src/lib/types.ts`. Les formats courants sont :

Les custom elements maison sont centralisés dans `src/lib/customElements/`. Dans un exercice, utiliser le helper métier indiqué ci-dessous : il prépare le HTML périphérique et délègue à la méthode `create()` du custom element. Les méthodes `create()` sont des primitives destinées à l'implémentation des helpers et aux infrastructures qui doivent reconstruire un composant, comme `MetaExerciceCan`.

| Format                         | Statut     | Usage                                                                           | Helper d'injection recommandé         | Fichiers principaux                                                                                                                    |
| ------------------------------ | ---------- | ------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `mathlive`                     | Obsolète   | Alias historique de `mathalea-mathfield`                                        | `ajouteChampTexteMathLive()`          | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaMathfield.ts`, `src/lib/interactif/mathLiveVerifications.ts` |
| `fillInTheBlank`               | Obsolète   | Alias historique de `fill-in-the-blank`                                         | `remplisLesBlancs()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/FillInTheBlank.ts`                                                   |
| `tableauMathlive`              | Obsolète   | Alias historique de `tableau-mathlive`                                          | `creeTableauMathliveElement()`        | `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`, `src/lib/customElements/TableauMathlive.ts`                                    |
| `texte`                        | Obsolète   | Alias historique de `mathalea-textfield`                                        | `ajouteChampTexte()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaTextfield.ts`                                                |
| `qcm`                          | Obsolète   | API historique des QCM, rendue en HTML par `mathalea-qcm`                       | `propositionsQcm()`                   | `src/lib/interactif/qcm.ts`, `src/lib/customElements/MathaleaQcm.ts`                                                                   |
| `mathalea-qcm`                 | Moderne    | QCM déclaré par `handleAnswers()`                                               | `addMathaleaQcm()`                    | `src/lib/customElements/MathaleaQcm.ts`                                                                                                |
| `mathalea-branching-qcm`       | Moderne    | QCM dont le choix affiche une question de justification associée                | `addMathaleaBranchingQcm()`           | `src/lib/customElements/MathaleaBranchingQcm.ts`                                                                                       |
| `echiquier-probleme`           | Moderne    | Construction interactive d'un échiquier de problème avec lignes/colonnes libres | `addEchiquierProbleme()`              | `src/lib/customElements/EchiquierProblemeElement.ts`                                                                                   |
| `liste-deroulante`             | Moderne    | Liste déroulante HTML custom                                                    | `choixDeroulant()`                    | `src/lib/customElements/ListeDeroulanteElement.ts`                                                                                     |
| `dnd`                          | Historique | Alias historique de `drag-and-drop`                                             | helpers de `DragAndDrop.ts`           | `src/lib/interactif/DragAndDrop.ts`, `src/lib/customElements/DragAndDropElement.ts`                                                    |
| `drag-and-drop`                | Moderne    | Glisser-déposer                                                                 | `DragAndDrop.ajouteDragAndDrop()`     | `src/lib/interactif/DragAndDrop.ts`, `src/lib/customElements/DragAndDropElement.ts`                                                    |
| `cliqueFigure`                 | Historique | Clics sur objets de figure                                                      | objets SVG et `cliqueFiguresArray`    | `src/lib/customElements/CliqueFigureElement.ts`, `src/lib/interactif/gestionInteractif.ts`                                             |
| `svg-selection`                | Moderne    | Sélection de SVG avec somme de valeurs                                          | `addSvgSelection()`                   | `src/lib/customElements/SvgSelectionElement.ts`                                                                                        |
| `custom`                       | Historique | Vérification fournie par l'exercice ou un méta-exercice                         | fourni par l'exercice                 | `src/lib/interactif/gestionInteractif.ts`                                                                                              |
| `meta-custom`                  | Moderne    | Question `custom` d'un exercice agrégé comme question d'un méta-exercice        | `MetaExerciceCan` (interne)           | `src/lib/customElements/MetaCustomElement.ts`                                                                                          |
| `my-spreadsheet`               | Moderne    | Réponse de type feuille de calcul                                               | `addSheet()`                          | `src/lib/customElements/MySpreadSheet.ts`                                                                                              |
| `MetaInteractif2d`             | Historique | Alias historique de `meta-interactif-2d`                                        | helpers de `interactif2d.ts`          | `src/lib/2d/interactif2d.ts`, `src/lib/customElements/MetaInteractif2dElement.ts`                                                      |
| `meta-interactif-2d`           | Moderne    | Champs MathLive placés dans une figure MathALÉA 2D                              | `mathalea2d()` via `MetaInteractif2d` | `src/lib/2d/interactif2d.ts`, `src/modules/mathalea2d.ts`, `src/lib/customElements/MetaInteractif2dElement.ts`                         |
| `multi-mathfield`              | Moderne    | Plusieurs champs MathLive coordonnés                                            | `addMultiMathfield()`                 | `src/lib/customElements/MultiMathfield.ts`                                                                                             |
| `mathalea-mathfield`           | Moderne    | Champ MathLive simple                                                           | `ajouteChampTexteMathLive()`          | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaMathfield.ts`                                                |
| `fill-in-the-blank`            | Moderne    | Texte à trous MathLive                                                          | `remplisLesBlancs()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/FillInTheBlank.ts`                                                   |
| `mathalea-textfield`           | Moderne    | Champ texte HTML                                                                | `ajouteChampTexte()`                  | `src/lib/interactif/questionMathLive.ts`, `src/lib/customElements/MathaleaTextfield.ts`                                                |
| `tableau-mathlive`             | Moderne    | Tableau de cellules MathLive                                                    | `creeTableauMathliveElement()`        | `src/lib/interactif/tableaux/AjouteTableauMathlive.ts`, `src/lib/customElements/TableauMathlive.ts`                                    |
| `guide-ane`                    | Moderne    | Un guide-âne interactif                                                         | `addGuideAne()`                       | `src/lib/customElements/GuideAne.ts`                                                                                                   |
| `clique-figure`                | Moderne    | Sélection d'une ou plusieurs figures déjà présentes dans l'énoncé               | `addCliqueFigure()`                   | `src/lib/customElements/CliqueFigureElement.ts`                                                                                        |
| `points-cliquables`            | Moderne    | Sélection de points injectés dans une figure MathALÉA 2D existante              | `addPointsCliquables()`               | `src/lib/customElements/PointsCliquablesElement.ts`, `src/modules/mathalea2d.ts`                                                       |
| `objets-cliquables`            | Moderne    | Sélection d'objets géométriques injectés dans une figure MathALÉA 2D existante  | `addObjetsCliquables()`               | `src/lib/customElements/ObjetsCliquablesElement.ts`, `src/modules/mathalea2d.ts`                                                       |
| `demi-droite-interactive`      | Moderne    | Pour placer des points d'abscisses fractionnaires                               | `demiDroiteInteractive()`             | `src/lib/customElements/demi_droite_interactive.ts`                                                                                    |
| `interactive-clock`            | Moderne    | Une horloge interactive                                                         | `handleInteractiveClock()`            | `src/lib/customElements/InteractiveClock.ts`                                                                                           |
| `trigo-circle-selection`       | Moderne    | Un cercle trigo interactif                                                      | `addTrigoCircleSelection()`           | `src/lib/customElements/TrigoCircleSelectionElement.ts`                                                                                |
| `tableau-signes-variations`    | Moderne    | Tableau de signes/variations interactif, export tkz-tab en LaTeX                | `addTableauSignesVariations()`        | `src/lib/customElements/TableauSignesVariationsElement.ts`                                                                             |
| `diagram-pie-assessment`       | Moderne    | Créateur de diagramme circulaire                                                | `addDiagramPieAssessment()`           | `src/lib/customElements/DiagramPieAssessmentElement.ts`                                                                                |
| `diagram-bar-assessment`       | Moderne    | Créateur de diagramme en barres                                                 | `addDiagramBarAssessment()`           | `src/lib/customElements/DiagramBarAssessmentElement.ts`                                                                                |
| `diagram-histogram-assessment` | Moderne    | Créateur d'histogramme                                                          | `addDiagramHistogramAssessment()`     | `src/lib/customElements/DiagramHistogramAssessmentElement.ts`                                                                          |
| `diagram-cartesin-assessment`  | Moderne    | Créateur de diagramme cartésien                                                 | `addDiagramCartesianAssessment()`     | `src/lib/customElements/DiagramCartesianAssessmentElement.ts`                                                                          |

Pour un nouvel exercice, choisir le format moderne dans `handleAnswers()` tout en continuant d'utiliser le helper métier correspondant pour injecter le composant. Les formats obsolètes restent acceptés afin de ne pas migrer en bloc les exercices existants.

## Réponses attendues

`handleAnswers()` dans `src/lib/interactif/gestionInteractif.ts` est l'entrée moderne pour déclarer les réponses attendues. Les QCM historiques au format `qcm` alimentent encore directement `autoCorrection`, tandis que le format `mathalea-qcm` utilise désormais `handleAnswers()` :

```ts
handleAnswers(exercice, question, reponses, params)
```

La fonction initialise `autoCorrection[question]`, choisit ou déduit `formatInteractif`, normalise les valeurs et associe un comparateur. Par défaut, le comparateur est `fonctionComparaison()` depuis `src/lib/interactif/comparisonFunctions.ts`. Si `params.formatInteractif` n'est pas fourni, `handleAnswers()` déduit `fillInTheBlank` quand une clé `champ1` existe, `tableauMathlive` quand une clé `LxCy` existe, sinon il reprend le format déjà posé sur la question ou utilise `mathalea-mathfield`.

Pour `mathalea-qcm`, la valeur est `{ qcm: { propositions, options?, enonce?, correction? } }`. Cette branche copie les propositions vers `autoCorrection[question].propositions` et vers `autoCorrectionAMC` sans les faire passer par les comparateurs champ par champ.

Les clés de `reponses` dépendent du format :

| Clé                             | Format                                                                                                                                                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reponse`                       | Champ unique `mathlive`, `texte`, `liste-deroulante`, `svg-selection`, `guide-ane`, `interactive-clock`, `demi-droite-interactive`, `trigo-circle-selection`                 |
| `reponse`                       | Liste JSON stringifiée pour `points-cliquables`, contenant des objets `{ x: number, y: number, id: string, etat: boolean }`                                                  |
| `reponse`                       | Liste JSON stringifiée pour `objets-cliquables`, contenant des objets typés `point`, `segment`, `droite`, `cercle`, `polygone` ou `polyline`                                 |
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

Les index sans entrée dans `autoCorrection` sont ignorés : un exercice peut donc mélanger des questions interactives et des questions sans réponse attendue (démonstration, rédaction, justification), y compris au milieu de la liste. Ces questions ne sont ni vérifiées ni comptées dans le score. Sans ce filtrage, l'index sans réponse tomberait sur le format `mathlive` par défaut et déclencherait l'erreur « Vérification MathLive appelée sur une question sans réponse » de `getQuestionData()` dans `src/lib/interactif/mathLiveVerifications.ts`.

Exception de compatibilité : si l'exercice porte encore `interactifType = 'custom'`, les questions sans `formatInteractif` explicite sont corrigées comme des questions `custom` historiques, via `correctionInteractive(i)`. Les questions qui déclarent leur propre `autoCorrection[i].formatInteractif` gardent en revanche leur dispatch question par question : un même exercice legacy peut donc mélanger une question `custom` et une question corrigée par le `verifQuestion()` d'un custom element.

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

| Format                         | Vérification                                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mathlive`                     | Routé vers `MathaleaMathfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaMathfield.ts`, vérification terminale d'un champ unique                           |
| `fillInTheBlank`               | Routé vers `FillInTheBlankElement.verifQuestion()` dans `src/lib/customElements/FillInTheBlank.ts`, vérification terminale des prompts `champ1`, `champ2`, ...               |
| `tableauMathlive`              | Routé vers `TableauMathliveElement.verifQuestion()` dans `src/lib/customElements/TableauMathlive.ts`, vérification terminale des cellules `LxCy`                             |
| `texte`                        | Routé vers `MathaleaTextfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaTextfield.ts`, vérification terminale d'un champ texte                            |
| `mathalea-mathfield`           | `MathaleaMathfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaMathfield.ts`, vérification terminale d'un champ unique                                      |
| `fill-in-the-blank`            | `FillInTheBlankElement.verifQuestion()` dans `src/lib/customElements/FillInTheBlank.ts`, vérification terminale des prompts `champ1`, `champ2`, ...                          |
| `mathalea-textfield`           | `MathaleaTextfieldElement.verifQuestion()` dans `src/lib/customElements/MathaleaTextfield.ts`, vérification terminale d'un champ texte                                       |
| `tableau-mathlive`             | `TableauMathliveElement.verifQuestion()` dans `src/lib/customElements/TableauMathlive.ts`, vérification terminale des cellules `LxCy`                                        |
| `multi-mathfield`              | `MultiMathfieldElement.verifQuestion()` dans `src/lib/customElements/MultiMathfield.ts`                                                                                      |
| `MetaInteractif2d`             | Routé vers `MetaInteractif2dElement.verifQuestion()` dans `src/lib/customElements/MetaInteractif2dElement.ts`                                                                |
| `meta-interactif-2d`           | `MetaInteractif2dElement.verifQuestion()` dans `src/lib/customElements/MetaInteractif2dElement.ts`                                                                           |
| `qcm`                          | Routé vers `MathaleaQcmElement.verifQuestion()` dans `src/lib/customElements/MathaleaQcm.ts`                                                                                 |
| `custom`                       | Appelle `exercice.correctionInteractive(i)` pour cette question uniquement ; sert de pont de compatibilité pour les anciens exercices custom                                 |
| `mathalea-qcm`                 | `MathaleaQcmElement.verifQuestion()` dans `src/lib/customElements/MathaleaQcm.ts`                                                                                            |
| `mathalea-branching-qcm`       | `MathaleaBranchingQcmElement.verifQuestion()` dans `src/lib/customElements/MathaleaBranchingQcm.ts`, vérification pondérée du choix et de la justification affichée          |
| `echiquier-probleme`           | `EchiquierProblemeElement.verifQuestion()` dans `src/lib/customElements/EchiquierProblemeElement.ts`, vérification des grandeurs, des objets, puis du type et de l'opération |
| `liste-deroulante`             | `ListeDeroulanteElement.verifQuestion()`                                                                                                                                     |
| `svg-selection`                | `SvgSelectionElement.verifQuestion()` dans `src/lib/customElements/SvgSelectionElement.ts`                                                                                   |
| `dnd`                          | Routé vers `DragAndDropElement.verifQuestion()` dans `src/lib/customElements/DragAndDropElement.ts`                                                                          |
| `drag-and-drop`                | `DragAndDropElement.verifQuestion()` dans `src/lib/customElements/DragAndDropElement.ts`                                                                                     |
| `my-spreadsheet`               | `MySpreadsheetElement.verifQuestion()` dans `src/lib/customElements/MySpreadSheet.ts`                                                                                        |
| `guide-ane`                    | `GuideAne.verifQuestion()` dans `src/lib/customElements/GuideAne.ts`                                                                                                         |
| `trigo-circle-selection`       | `TrigCircleSelectionElement.verifQuestion()` dans `src/lib/customElements/TrigoCircleSelectionElement.ts`                                                                    |
| `demi-droite-interactive`      | `DemiDroiteInteractiveElement.verifQuestion()` dans `src/lib/customElements/demi_droite_interactive.ts`                                                                      |
| `interactive-clock`            | `InteractiveClock.verifQuestion()` dans `src/lib/customElements/InteractiveClock.ts`                                                                                         |
| `tableau-signes-variations`    | `TableauSignesVariationsElement.verifQuestion()` dans `src/lib/customElements/TableauSignesVariationsElement.ts`                                                             |
| `cliqueFigure`                 | Routé vers `CliqueFigureElement.verifQuestion()` dans `src/lib/customElements/CliqueFigureElement.ts`                                                                        |
| `clique-figure`                | `CliqueFigureElement.verifQuestion()` dans `src/lib/customElements/CliqueFigureElement.ts`                                                                                   |
| `points-cliquables`            | `PointsCliquablesElement.verifQuestion()` dans `src/lib/customElements/PointsCliquablesElement.ts`                                                                           |
| `objets-cliquables`            | `ObjetsCliquablesElement.verifQuestion()` dans `src/lib/customElements/ObjetsCliquablesElement.ts`                                                                           |
| `diagram-pie-assessment`       | `DiagramPieAssessment.verifQuestion()` dans `src/lib/customElements/DiagramPieAssessmentElement.ts`                                                                          |
| `diagram-bar-assessment`       | `DiagramBarAssessment.verifQuestion()` dans `src/lib/customElements/DiagramBarAssessmentElement.ts`                                                                          |
| `diagram-histogram-assessment` | `DiagramHistogramAssessment.verifQuestion()` dans `src/lib/customElements/DiagramHistogramAssessmentElement.ts`                                                              |
| `diagram-cartesian-assessment` | `DiagramCartesianAssessment.verifQuestion()` dans `src/lib/customElements/DiagramCartesianAssessmentElement.ts`                                                              |
| `custom`                       | correction globale de l'exercice quand `exercice.interactifType === 'custom'`, ou fonction `correctionInteractives` à l'index de question pour un méta-exercice              |
| `meta-custom`                  | `MetaCustomElement.verifQuestion()` dans `src/lib/customElements/MetaCustomElement.ts`, qui appelle la `correctionInteractive` du sous-exercice enregistrée en callback      |

Les fonctions de vérification retournent un résultat exploitable par le score et affichent le retour visuel associé à la question.

### Échiquier de problème

`echiquier-probleme` sert à faire construire un tableau d'analyse d'énoncé :
les grandeurs sont placées en lignes, les objets en colonnes. Le composant
démarre avec une ligne et une colonne, puis l'élève ajoute les lignes ou
colonnes nécessaires.

Le helper `addEchiquierProbleme(exercice, questionIndex, options)` reçoit les
lignes attendues, les colonnes attendues, les cellules de référence, les choix
proposés et, si besoin, le type d'échiquier et l'opération attendus. L'option
`cellFillMode` règle le comportement des cellules :

- `automatic` : les cellules se remplissent dès que les entêtes correspondantes
  sont choisies ;
- `student` : chaque cellule est complétée par l'élève avec une liste construite
  à partir des valeurs des cellules de référence ;
- `correction` : les cellules sont remplies par les valeurs attendues, sans
  liste déroulante. Ce mode sert au rendu corrigé HTML et aux rendus statiques.

Les cellules peuvent porter `kind: 'given'` ou `kind: 'computed'`. Les cellules
`computed` représentent des résultats intermédiaires ou finaux à produire pour
résoudre le problème. En mode `student`, l'option `cellChoices` permet d'enrichir
la liste proposée avec ces résultats et des distracteurs ; à défaut, la liste est
construite à partir des valeurs de `cells`. Les choix de cellules acceptent les
chaînes simples et les objets de `liste-deroulante`, notamment `{ value, label }`
et `{ value, latex }`. Dès qu'un choix riche est présent, les cellules utilisent
le custom element `liste-deroulante` au lieu d'un `<select>` natif, ce qui permet
le rendu MathLive/KaTeX dans les propositions.

Exemple minimal avec résultats intermédiaires :

```ts
const html = addEchiquierProbleme(this, i, {
  expectedRows: ['Prix unitaire', 'Masse totale', 'Prix total'],
  expectedColumns: ['Pommes', 'Bananes', 'Courses'],
  rowChoices: [
    'Prix unitaire',
    'Masse totale',
    'Prix total',
    'Nombre de fruits',
  ],
  columnChoices: ['Pommes', 'Bananes', 'Courses', 'Clients'],
  cellFillMode: 'student',
  cells: [
    {
      row: 'Prix unitaire',
      column: 'Pommes',
      value: '2 €/kg',
      kind: 'given',
    },
    {
      row: 'Masse totale',
      column: 'Pommes',
      value: '3 kg',
      kind: 'given',
    },
    {
      row: 'Prix total',
      column: 'Pommes',
      value: '6 €',
      kind: 'computed',
    },
  ],
  cellChoices: [
    '2 €/kg',
    '3 kg',
    '6 €',
    { value: '1/2 kg', latex: '\\frac{1}{2}\\text{ kg}' },
  ],
})
```

L'option `simplificationMode: 'grey'` ajoute un bouton de grisage sur chaque
entête de ligne et de colonne. La réponse attendue peut alors préciser
`expectedGreyedRows` et `expectedGreyedColumns` pour vérifier l'échiquier
simplifié conservé par l'élève.

Le score est attribué par groupes de vérification, avec un maximum de 5 points
pour un échiquier complet :

- 1 point si toutes les grandeurs attendues sont présentes ;
- 1 point si tous les objets attendus sont présents ;
- 1 point si toutes les cellules internes sont correctement remplies, seulement
  en mode `cellFillMode: 'student'` ;
- 1 point si tous les éléments à griser sont corrects, seulement en mode
  `simplificationMode: 'grey'` ;
- 1 point si le type d'échiquier et l'opération sont corrects, seulement quand
  `expectedStructure` ou `expectedOperation` est renseigné.

Le maximum affiché dans le bloc de réglages de l'exercice est calculé par
`pointsMaxQuestion()`. Pour rester cohérent avec `verifQuestion()` sans imposer
au helper d'enregistrer `handleAnswers()`, ce calcul lit la réponse attendue
stockée dans `autoCorrection`, puis complète avec les attributs du custom
element présents dans `listeQuestions` (`cell-fill-mode`,
`simplification-mode`, etc.). Les exercices peuvent donc continuer à appeler
`handleAnswers()` uniquement après avoir retenu la question.

Quand `interactivityOn` vaut `false`, le composant affiche l'échiquier corrigé
avec les entêtes, les valeurs attendues et les grisages attendus. En LaTeX et
en Typst, le rendu d'énoncé est un échiquier complet imprimable avec les entêtes
attendues et des `...` dans les cellules à compléter ; la correction affiche les
valeurs attendues.

Le helper n'enregistre pas la réponse attendue : conformément aux habitudes de
MathALÉA, l'exercice doit appeler `handleAnswers()` dans `nouvelleVersion()`
uniquement quand la question est effectivement retenue. La valeur attendue est
habituellement le JSON de l'objet `EchiquierProblemeAnswer`, avec le format
interactif `echiquier-probleme`.

### Exception `multi-mathfield` pour le feedback visuel

`MultiMathfieldElement` ne suit pas le schéma habituel d'un unique `span#resultatCheckEx...Q...` global par question.

- Chaque champ MathLive du composant possède son propre `span` de feedback (`#check-multi-mathfieldEx...Q...-field...`) pour afficher le résultat champ par champ.
- Il n'y a donc pas de `resultatCheck` global à créer dans l'énoncé pour ce format.

Cette exception est volontaire car une question `multi-mathfield` porte plusieurs saisies indépendantes et le retour attendu est local à chaque champ.

### Points cliquables dans une figure MathALÉA 2D

`points-cliquables` est le format moderne pour les exercices où l'élève doit sélectionner des points dans une figure produite par `mathalea2d()`. La figure garde son `id` MathALÉA 2D habituel, puis `addPointsCliquables()` ajoute un custom element coordonnateur qui injecte les groupes SVG des points dans cette figure.

Le helper reçoit :

- `figureId` : id du SVG produit par `mathalea2d({ id: figureId }, ...)` ;
- `points` : liste des points disponibles, avec `etat: false` au départ ;
- les options visuelles `pixelsParCm`, `radius`, `width`, `size` et `color` quand les valeurs par défaut ne conviennent pas.

La réponse attendue est déclarée avec `handleAnswers()` au format `points-cliquables`. La valeur est le JSON stringifié de la même liste de points, avec `etat: true` pour les points qui doivent être sélectionnés et `etat: false` pour les autres.

`PointsCliquablesElement.value` expose toujours le JSON stringifié de l'état courant. Cela permet à `mathaleaWriteStudentPreviousAnswers()` de restaurer une copie Capytale en affectant directement `element.value = studentAnswer`. Quand `interactivityOn` passe à `false`, l'élément conserve les points sélectionnés visibles, retire les listeners, neutralise la zone SVG de clic et utilise un curseur non sélectionnable.

Comme les autres custom elements, le helper ajoute le retour visuel attendu par le moteur : un `span#resultatCheckEx...Q...` pour le smiley et un `div#feedbackEx...Q...` pour d'éventuels retours détaillés.

### Fractions cliquables

`fraction-cliquable` porte l'interactivité des schémas produits par `fractionCliquable()` dans `src/modules/2dinteractif.ts`. Le rendu SVG/TikZ reste assuré par l'objet MathALÉA 2D, mais les listeners de survol et de clic sont installés par le custom element après insertion de la figure dans le DOM.

Le composant expose `value` comme une liste JSON stringifiée de parts `{ id, etat }`. Sans `numeroExercice` ni `questionIndex`, il reste utilisable comme brouillon interactif. Avec ces métadonnées et `handleAnswers(..., { formatInteractif: 'fraction-cliquable' })`, il devient un format évalué par comparaison avec la valeur attendue.

### Labyrinthes

`mathalea-labyrinthe` porte directement le composant de labyrinthe MathALÉA. Il reçoit la graine, les dimensions, l'orientation et les valeurs de cases depuis l'exercice, pilote le modèle pur `Labyrinthe`, rend la grille dans son shadow DOM et expose `value`/`state` comme état sérialisé restaurable.

Son `create()` est contextuel : en HTML, il produit le custom element ; en LaTeX, `renderLatex()` génère le tableau LaTeX du modèle pur `labyrinthe` ; en Typst, `renderTypst()` produit une table Typst native afin d'éviter d'injecter du `tabular` LaTeX dans un marqueur `<mathalea-typst>`.

Les exercices qui héritent de `src/exercices/_Exercice_labyrinthe.ts` gardent une compatibilité `interactifType = 'custom'`, mais leur `autoCorrection[0].formatInteractif` vaut `mathalea-labyrinthe` afin que les flux génériques appellent `MathaleaLabyrintheElement.verifQuestion()`. La classe mère appelle `MathaleaLabyrintheElement.create()` pour l'énoncé comme pour la correction, sans branchement local selon `context`.

`verifQuestion()` sauvegarde `element.value` dans `exercice.answers`, désactive l'interactivité, met à jour `span#resultatCheckEx...` et `div#feedbackEx...`, puis applique le barème historique en quatre points. Par défaut, une victoire donne 4/4 ; sinon le score dépend de la proportion de bonnes cases cliquées.

Pour une correction spécifique, `create()` accepte `verifyCallback` ou `verifyCallbackName`. Les callbacks nommées sont enregistrées avec `MathaleaLabyrintheElement.registerVerificationCallback()` et reçoivent `exercice`, `questionIndex` et `element`, puis retournent `{ isOk, feedback?, score? }`.

### Objets cliquables dans une figure MathALÉA 2D

`objets-cliquables` généralise le principe à plusieurs géométries : `point`, `segment`, `droite`, `cercle`, `polygone` et `polyline`. Le rendu MathALÉA 2D principal reste statique ; le custom element injecte dans le SVG une couche superposée composée d'une forme visible de sélection et d'une hit zone transparente plus large.

Le helper `addObjetsCliquables(exercice, questionIndex, options)` suit la convention des custom elements. Il reçoit `figureId`, la liste `objets`, puis les options visuelles `pixelsParCm`, `hitWidth`, `pointRadius`, `selectedWidth`, `selectedColor` et `hoverColor`. Les droites sont prolongées jusqu'aux bords de la `viewBox` du SVG quand celle-ci est disponible.

La valeur attendue et la valeur élève sont des listes JSON stringifiées d'objets typés avec `id` et `etat`. Le setter `value` restaure les états sélectionnés pour la reprise Capytale. Quand `interactivityOn` vaut `false`, les objets sélectionnés restent visibles, les listeners sont retirés et les hit zones SVG sont neutralisées.

Par défaut, `verifQuestion()` compare l'état de tous les objets à la liste attendue. Pour une correction plus spécifique, le helper accepte `verifyCallback` ou `verifyCallbackName`; la callback reçoit l'exercice, l'index de question, l'élément, les objets attendus et les objets élèves, puis retourne `{ isOk, feedback?, score? }`.

## Barème d'un exercice interactif

`src/lib/interactif/baremeExercice.ts` porte le barème au niveau de l'exercice, à ne pas confondre avec les fonctions de barème question par question de `fonctionsBaremes.ts`.

### Nombre de points maximum

`pointsMaxExercice(exercice)` donne le nombre de points que l'exercice peut rapporter, **avant** toute saisie de l'élève. Il somme les `pointsMaxQuestion()` de chaque entrée non nulle de `autoCorrection`, en déléguant au custom element qui corrige la question (hook statique `pointsMaxQuestion()` de `MathaleaCustomElement`, résolu via `mathaleaCustomElementsRegistry` comme dans `exerciceInteractif()`). Pour un exercice encore marqué `interactifType = 'custom'`, les questions sans entrée `autoCorrection` valent 1 point par compatibilité, mais les questions qui déclarent un `formatInteractif` gardent leur barème propre.

Le calcul est possible sans réponse parce que les fonctions de barème ne dépendent que du nombre de champs : `pointsMaxDuBareme(bareme, nbChamps)` les appelle avec une liste de champs tous justes et lit le second terme du couple `[points, maximum]` retourné.

- une question vaut **1 point** par défaut, ce qui couvre tous les composants à réponse unique ;
- `fill-in-the-blank`, `tableau-mathlive` et `multi-mathfield` comptent leurs champs (`champN`, `LxCy`, noms de champs) et leur appliquent le barème de la question — un texte à trous corrigé en `toutPourUnPoint` vaut donc 1 point, le même corrigé en `toutAUnPoint` vaut un point par trou ;
- `relier-etiquettes` compte un point par lien attendu ;
- une question `custom` historique vaut **1 point** par défaut, comme l'ancien comptage de `correctionInteractive(i)`.

Un composant dont une question peut rapporter plusieurs points doit donc surcharger `pointsMaxQuestion()` pour rester cohérent avec le `score.nbReponses` que retourne son `verifQuestion()`.

### Coefficient multiplicateur

Les paramètres d'un exercice affiché en interactif proposent un réglage « Barème » : le nombre de points maximum y est affiché, assorti de boutons `−` et `+` qui règlent un coefficient multiplicateur entier (`COEFF_BAREME_MIN` à `COEFF_BAREME_MAX`).

- le coefficient est porté par `exercice.coeffBareme`, sauvegardé dans `exercicesParams` et dans l'URL sous le paramètre `coef` (absent quand il vaut 1) ;
- il est appliqué au moment de l'affichage du score par `afficheScore()`, qui multiplie la note obtenue **et** la note maximale : un 3/5 avec un coefficient 2 devient 6/10, dans la vue prof comme dans la vue élève et dans ce qui est transmis au LMS (`numberOfPoints` / `numberOfQuestions`) ;
- la vue Course aux nombres a son propre calcul de score (`gestionCan.ts`) et n'est pas concernée.

Tests : `tests/unit/baremeExercice.test.ts`.

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

Un champ porte donc **deux** identifiants indexés par la question : l'id du wrapper (`<tag>Ex{n}Q{i}`) et l'id legacy (`champTexteEx{n}Q{i}`, exposé par l'attribut `mathfield-id` du wrapper). C'est ce second identifiant qu'utilisent les `verifQuestion()` des wrappers MathLive pour retrouver le champ. Une infrastructure qui réhéberge la question d'un sous-exercice à un autre index — `MetaExerciceCan` pour les CAN et les « Sélections d'automatismes » — doit réindexer **les deux**, sans quoi plusieurs questions partagent le même `mathfield-id` et la vérification échoue sur « champ introuvable ». Le nom du callback de vérification (`champTexteEx{n}Q0-verification`) est en revanche une clé du registre statique du custom element : il ne doit pas être réindexé.

`ajouteQuestionMathlive()` déduit le `formatInteractif` par défaut de son `typeInteractivite` : un `fillInTheBlank` déclare bien `fill-in-the-blank` et est vérifié par `verifyFillInTheBlankMathLive()` (réponses `champ1`, `champ2`, ...) et non par `verifySingleMathLiveField()`, qui n'attend qu'une réponse unique.

Deux niveaux de personnalisation existent :

- dans `handleAnswers()`, une entrée `callback` sur `valeur` permet d'analyser globalement les saisies d'une question avant de calculer le score ;
- côté custom element, `verifyCallback` / `verifyCallbackName` permettent de remplacer complètement la vérification du wrapper quand son helper ou son `create(...)` expose cette option.

## Réhébergement d'une question custom

Un exercice `interactifType = 'custom'` corrige lui-même ses questions : il n'a pas de custom element pour le faire à sa place, et rien n'est affiché par le moteur à sa place (feedback, marque de résultat). Quand `MetaExerciceCan` agrège un tel exercice comme une question parmi d'autres — CAN, « Sélection d'automatismes » —, deux problèmes se posent : plusieurs sous-exercices produiraient les mêmes identifiants DOM (tous en `Q0`), et le moteur générique n'aurait aucun format à router.

`src/lib/customElements/MetaCustomElement.ts` répond au second : le méta-exercice enregistre la `correctionInteractive` du sous-exercice dans un registre statique, ajoute à l'énoncé une ancre invisible `<meta-custom callback-key="…">` et pose `autoCorrection[i].formatInteractif = 'meta-custom'`. Le dispatch, le barème, la vue CAN et la vue question par page passent alors par le registre des `MathaleaCustomElement` comme pour tout autre format. La fermeture enregistrée conserve le sous-exercice, ce qui garantit un `this` correct même quand `correctionInteractive` est une méthode de prototype.

Le premier problème est réglé à la génération plutôt que par réécriture de chaîne. `Exercice.indexQuestionHote` porte l'index de la question dans l'exercice affiché ; `figureApigeom()` l'ajoute à son paramètre `i` pour fabriquer `apigeomEx{n}F{i}`, `resultatCheckEx{n}Q{i}` et `feedbackEx{n}Q{i}`. Une réécriture _a posteriori_ ne conviendrait pas : l'attribut `action` du `<mathalea-dom-ready>` produit par `figureApigeom()` est la clé du registre statique de `DomReadyActionElement`, et la renommer empêcherait le montage de la figure ; l'identifiant du conteneur est par ailleurs capturé dans la fermeture de montage. La clé de `answers` étant l'identifiant de la figure, la générer directement à la bonne valeur est aussi ce qui permet à `collectAnswers()` (`Can.svelte`) et à la relecture de copie (`mathaleaWriteStudentPreviousAnswers()`) de retrouver la réponse.

Un exercice custom est donc agrégeable s'il respecte deux règles, vérifiées par `src/exercices/modèlesExos/20_exercice_classique_apigeom.ts` :

- `correctionInteractive(i)` indexe **tout** par `i` — figure (`this.figuresApiGeom[i]`), `#feedbackEx{n}Q{i}`, `#resultatCheckEx{n}Q{i}` — et jamais en dur par 0 ;
- la figure de la question `i` est rangée dans `this.figuresApiGeom[i]`.

`MetaExerciceCan` déplace la figure de tête du sous-exercice vers l'index de la question affichée avant d'appeler la correction, de sorte que la seconde règle reste vraie une fois l'exercice réhébergé.

Deux cas particuliers subsistent :

- un sous-exercice qui déclare `nouvelleVersion(numeroExercice, numeroQuestion)` place lui-même sa question au bon index : il est relancé avec les coordonnées de l'hôte et ne reçoit pas de décalage, sinon les identifiants seraient décalés deux fois ;
- un exercice qui garde `interactifType = 'custom'` par compatibilité tout en déléguant à un customElement enregistré (cf. `_Exercice_labyrinthe.ts`) n'est pas traité comme custom : c'est son `formatInteractif` qui prime.

`interactifType` est un export de module, recopié sur l'instance par `mathaleaLoadExerciceFromUuid()` uniquement. Un sous-exercice construit directement par un méta-exercice ne le reçoit donc pas : `_automatismesCan.ts` le pose sur la classe (`Exercice.interactifTypeModule`) au chargement du module, et `MetaExerciceCan` le recopie sur l'instance.

Pour les QCM, `MetaExerciceCan` ne dépend toutefois pas de cette métadonnée de module : il reconnaît structurellement une question dont `autoCorrection` contient des `propositions`. Après le rendu par l'API historique `propositionsQcm()`, il pose explicitement `autoCorrection[i].formatInteractif = 'mathalea-qcm'`. Un méta-exercice entièrement composé de QCM ne doit donc pas déclarer artificiellement `interactifType = 'mathLive'` ; chaque question agrégée porte son propre format moderne, utilisé par le dispatch interactif et par l'inférence AMC.

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
- `src/lib/interactif/baremeExercice.ts` : points maximum d'un exercice et coefficient multiplicateur du barème.
- `src/lib/interactif/qcm.ts` : QCM.
- `src/lib/customElements/MathaleaQcm.ts` : custom element `mathalea-qcm`, helper `addMathaleaQcm()` et vérification QCM partagée. En contexte HTML, `propositionsQcm()` injecte ce composant tout en conservant les identifiants internes historiques.
- `src/lib/customElements/MathaleaBranchingQcm.ts` : custom element `mathalea-branching-qcm`, helper `addMathaleaBranchingQcm()` et vérification pondérée d'un choix de QCM suivi d'une question de justification propre à la branche choisie.
- `src/lib/customElements/CliqueFigureElement.ts` : custom element `clique-figure`, helper `addCliqueFigure()` et vérification des questions `cliqueFigure`. Les exercices historiques qui renseignent `cliqueFiguresArray` et appellent `setCliqueFigure()` sont normalisés vers ce tag sans devoir réécrire leurs énoncés.
- `src/lib/customElements/PointsCliquablesElement.ts` : custom element `points-cliquables`, helper `addPointsCliquables()` et vérification des points injectés dans une figure MathALÉA 2D identifiée par `figureId`.
- `src/lib/customElements/ObjetsCliquablesElement.ts` : custom element `objets-cliquables`, helper `addObjetsCliquables()` et vérification d'objets géométriques injectés dans une figure MathALÉA 2D identifiée par `figureId`.
- `src/lib/interactif/DragAndDrop.ts` : builder historique du glisser-déposer.
- `src/lib/customElements/DragAndDropElement.ts` : custom element `drag-and-drop`, wrapper de rendu et vérification des questions `dnd`.
- `src/lib/interactif/setMathfield.ts` : configuration partagée des `math-field` interactifs.
- `src/lib/customElements/DiagramPieAssessmentElement.ts` : custom element `diagram-pie-assessment`, helper `addDiagramPieAssessment()`
- `src/lib/customElements/DiagramBarAssessmentElement.ts` : custom element `diagram-bar-assessment`, helper `addDiagramBarAssessment()`
- `src/lib/customElements/DiagramHistogramAssessmentElement.ts` : custom element `diagram-histogram-assessment`, helper `addDiagramHistogramAssessment()`
- `src/lib/customElements/DiagramCartesianAssessmentElement.ts` : custom element `diagram-cartesian-assessment`, helper `addDiagramCartesianAssessment()`
- `src/lib/customElements/DiagramBuilderElement.ts` : custom element `diagram-builder`, helper `addDiagramBuilder()` (outil prof)
