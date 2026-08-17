# Vue Typst

La vue Typst (`v=typst` dans l'URL) génère une fiche d'exercices au format [Typst](https://typst.app/docs/), compilée directement dans le navigateur. Elle est accessible depuis les boutons d'export de la page d'accueil (comme la vue A4, uniquement sur `localhost` ou avec `?beta=1`).

## Interfaces

Trois modes d'affichage, mémorisés dans `localStorage` (`mathaleaTypstView`) :

- **Code** : l'éditeur (CodeMirror) seul ;
- **Côte à côte** : le code à gauche, l'aperçu à droite ;
- **Aperçu** : le document compilé seul.

Le code est éditable : chaque modification recompile le document (débounce de 500 ms) et met à jour l'aperçu, en conservant le dernier rendu valide en cas d'échec.

En tête du panneau « Réglages du document », `shared/ExportViewLinks.svelte` affiche des liens vers les deux autres exports Typst — [Flash-cards](flashcards.md) et [Diaporama PDF](diaporama-pdf.md) — qui reprennent les exercices en place (`$globalOptions.v`), sans repasser par la page d'accueil. Le même composant équipe les trois vues, chacune montrant les deux autres.

## Éditeur de code

L'éditeur est CodeMirror 6, configuré par `editor/typstEditorSetup.ts` (`typstEditorExtensions()`) : numéros de lignes, coloration syntaxique Typst, repliage, curseurs multiples, recherche, et thème clair ou sombre suivant celui de l'application (compartiment reconfiguré par `setEditorTheme`, appelé depuis un `$effect` sur le store `darkMode`).

- **Coloration syntaxique** : `editor/typstLanguage.ts` définit un `StreamLanguage` Typst (tokeniseur ligne à ligne, pas un analyseur complet) couvrant commentaires, balisage (titres, listes, gras, italique, littéral), mode code après `#` et formules `$…$`. Les noms de jetons émis sont des noms de tags standard, colorés tels quels par `oneDark` (sombre) et `defaultHighlightStyle` (clair). Le `languageData` fournit les jetons de commentaire, ce qui active « commenter / décommenter » (Ctrl/Cmd + /).
- **Raccourcis** : ceux de `defaultKeymap`, `searchKeymap`, `historyKeymap` et `foldKeymap`, plus quelques ajouts (Ctrl/Cmd + Entrée pour compiler sans attendre le débounce, Ctrl/Cmd + Maj + D pour dupliquer une ligne, Ctrl/Cmd + L pour sélectionner la ligne, Ctrl/Cmd + Alt + ↑/↓ pour ajouter un curseur). Pas de Ctrl/Cmd + S : Safari ouvre sa boîte d'enregistrement de page avant même que l'événement clavier n'atteigne la page, `preventDefault()` ne peut donc rien y changer. Le bouton « Raccourcis » de la barre d'outils (modes Code et Côte à côte) en affiche la liste, avec la touche de modification adaptée à la plateforme.
- **Interface en français** : `editor/editorPhrases.ts` traduit les chaînes de CodeMirror via `EditorState.phrases` (panneau de recherche de Ctrl/Cmd + F, boîte « Aller à la ligne » de Alt + G, annonces pour lecteurs d'écran).
- **Sélection** : `app.css` redéfinit globalement `::selection` avec une couleur de texte noire, illisible sur le fond sombre de l'éditeur. `drawSelection()` dessine le fond de sélection et un correctif de thème (`Prec.highest`) rétablit `color: inherit` sur le texte sélectionné.
- **Repliage** : il n'y a pas d'arbre syntaxique exploitable, le `foldService` se fonde donc sur l'indentation — ce qui correspond à la structure du code généré (exercices, corrections et listes de questions sont des blocs indentés).

## Erreurs de compilation

`typstDiagnostics.ts` transforme les lignes brutes renvoyées par le compilateur (format « unix » : `main.typ:ligne:colonne[-ligne:colonne]: sévérité: message`, positions comptées à partir de 1) en `TypstDiagnostic` : position, sévérité, message traduit en français et piste de résolution. La table de règles (`RULES`) va du plus spécifique au plus général ; un message non couvert reste affiché en anglais, jugé plus utile qu'une approximation, et le message d'origine reste consultable dans le panneau. Un même message répété sur une même ligne n'est affiché qu'une fois, et un diagnostic venant d'un paquet importé est signalé comme tel (sa ligne ne correspond à rien dans l'éditeur).

Côté interface (`Typst.svelte`) :

- le panneau de diagnostics est sous les deux volets, donc visible aussi en mode « Code » ; il se replie, et se rouvre dès qu'une nouvelle erreur apparaît ;
- chaque diagnostic est cliquable (« ligne N ») et amène le curseur sur la position concernée (`revealPosition`), en basculant en « Côte à côte » si on était en « Aperçu » ;
- les lignes fautives sont surlignées dans l'éditeur et marquées d'une pastille dans une marge dédiée (`setEditorMarkers`) ; pendant la frappe, les marqueurs suivent les décalages de lignes jusqu'à la compilation suivante ;
- quand la compilation échoue, un bouton **« Revenir à la dernière version qui compilait »** rétablit le dernier code ayant produit un document (`lastGoodCode`, mémorisé à chaque compilation réussie). L'opération passe par l'historique de CodeMirror : elle est annulable par Ctrl/Cmd + Z.

## Double-clic sur l'aperçu : aller au code

Un double-clic sur l'aperçu (`jumpToSourceFromClick` dans `Typst.svelte`) bascule en « Côte à côte » (si on était en « Aperçu ») et amène le curseur sur l'exercice ou la correction affiché au point cliqué :

1. le clic est converti en coordonnées SVG (mêmes unités que les repères de la palette de mise en page, voir `computeOverlayWidgets`) ;
2. la page cliquée est retrouvée dans `previewPages`, puis le dernier repère `exo`/`corr` (parmi ceux publiés par `buildTypstDocument`, voir la section « Palette de mise en page ») rencontré au-dessus du point cliqué détermine l'exercice ;
3. `findExerciseSourceLine` cherche la ligne où le contenu est réellement éditable. Pour un énoncé, c'est le titre `// ----- Exercice N -----` de sa définition (`#let exN = exo.with(...)`) : le repère `#mathalea-anchor("exo", N)` ne précède que l'appel `#exN()` de la section « Énoncés », où il n'y a rien à modifier. À défaut de définition (mode fusionné, où le contenu suit le repère) — et toujours pour une correction, qui n'a pas de définition séparée — la ligne visée est celle du repère `#mathalea-anchor("exo"|"corr", N)` ;
4. `revealPosition` (dans `editor/typstEditorSetup.ts`) y place le curseur, en dépliant d'abord tout bloc replié qui la contiendrait (`foldedRanges`/`unfoldEffect`).

Un double-clic sur un contrôle de la palette de mise en page (bouton, champ) est ignoré : elle a déjà son propre comportement.

## Palette de mise en page

Le bouton « Mise en page » de la barre d'outils affiche des contrôles par-dessus l'aperçu (`TypstLayoutOverlay.svelte`) :

- dans la marge de page (la plus proche de la colonne concernée), à hauteur de chaque liste de questions (environnement `tasks`) : nombre de colonnes (1 à 4) et espacement vertical (pas de 0,25 em) — l'énoncé (`exN`) et sa correction (`exN-corr`) se règlent indépendamment ;
- dans la marge droite, au début de chaque exercice : insertion/modification d'un texte ou d'un titre de section (`#section[...]`, helper émis dans le préambule) **avant** cet exercice, nombre de questions (`nbQuestions`) et suppression de l'exercice (retire aussi son entrée de `exercicesParams`). Quand le nombre de questions change, les questions déjà affichées sont figées (`frozenInputs`, vidé par « Nouvelles données ») : la régénération ne rebrasse pas leurs valeurs, seules les questions ajoutées sont nouvelles ;
- entre les exercices : deux boutons de saut de page et de saut de colonne (ce dernier seulement en document multicolonne) — une fois insérés, ils deviennent des badges bien visibles, retirables d'un clic (le saut de page ferme et rouvre le bloc `en-colonnes`, `#pagebreak` étant interdit dans un conteneur) ;
- à gauche du titre de la fiche : édition du titre, du sous-titre et de la ligne d'en-tête (ces champs ne sont plus dans la fenêtre Réglages ; la valeur est reportée dans les réglages persistés) — absente si l'habillage en-tête est `Aucun`, faute de bloc à éditer ;
- en haut de la page de garde (quand un modèle est choisi) : édition de l'intitulé, de la session, de la matière, de la durée, de la mention de bas de page et des consignes — même mécanisme que le titre de la fiche, voir [Page de garde](#page-de-garde) ;
- sur le pied de la première page (si affiché) : édition de son texte — voir [En-tête et pied de page](#en-tête-et-pied-de-page).

Fonctionnement :

1. `buildTypstDocument` émet des repères invisibles `#mathalea-anchor(kind, num)` (métadonnées Typst portant la position `here().position()` en pt) devant chaque `#tasks` (`kind: "tasks"`, ou `"tasks-corr"` dans une correction), devant chaque exercice (`kind: "exo"`), aux points d'insertion (`kind: "gap"`, `num: 0` avant le premier exercice), devant le bloc de titre (`kind: "header"`, absent si l'habillage est `Aucun`), devant la page de garde (`kind: "cover"`, absente sans modèle choisi) et dans le pied de page (`kind: "footer"`, seulement sur la première page physique — voir « En-tête et pied de page »). Ils n'ont aucun impact sur la mise en page (vérifié au pixel près).
2. Après chaque compilation, `typstCompiler.ts` interroge le document (`world.query({ selector: '<mathalea-anchor>' })`, même monde de compilation que le rendu SVG) et renvoie les repères (`TypstAnchor`).
3. `Typst.svelte` convertit ces positions en pourcentages du conteneur de l'aperçu (via la géométrie des pages renvoyée par `separatePages`) et place les contrôles.

Les contrôles font des **éditions ciblées du code** dans CodeMirror (pas de régénération) : les boutons modifient les lignes `#let exN-colonnes`/`#let exN-gutter`, les insertions ajoutent une ligne marquée `// mathalea:insertion` après le repère de gap. Elles sont donc annulables (Ctrl+Z) et présentes dans le `.typ` exporté. Ces éditions ne marquent **pas** le code comme « modifié à la main » (`isEdited`) : puisqu'elles survivent à la régénération via le carry-over, elles ne déclenchent pas l'avertissement d'écrasement — seule la frappe directe dans l'éditeur le fait.

À la régénération (réglages, « Nouvelles données »), `harvestCarryOver` relit ces ajustements dans le code courant et les réémet (paramètre `carryOver` de `buildTypstDocument`) : ils survivent à la régénération, contrairement aux autres modifications manuelles. « Réinitialiser les réglages du document » les efface.

## Ajouter un exercice depuis l'aperçu

Le dernier repère de la palette (après le dernier exercice, ou seul repère
d'une fiche vide) porte un bouton **« Ajouter un exercice »** qui ouvre une
modale de navigation dans les référentiels
([`addExercise/TypstAddExerciseModal.svelte`](../../../../src/components/setup/typst/addExercise/TypstAddExerciseModal.svelte)) :

- même parcours que la vue mobile (rubrique > niveau > thèmes > sous-thèmes),
  à partir des rubriques déclarées pour la vue `typst` dans
  [`src/json/mobileMenu.json`](../../../../src/json/mobileMenu.json) (voir
  [Vue mobile — rubriques](../architecture/vue-mobile.md#rubriques-affichées--srcjsonmobilemenujson)) :
  Collège, Lycée général, Lycée professionnel, **Course aux nombres** et
  **Ressources complémentaires** (annales d'examens et ressources partenaires,
  banques d'exercices ajoutées comprises) — ces deux dernières ne sont pas
  proposées sur téléphone ;
- au bout d'un thème, chaque exercice est affiché **en aperçu HTML**
  ([`addExercise/TypstExercisePreview.svelte`](../../../../src/components/setup/typst/addExercise/TypstExercisePreview.svelte)),
  avec une roue dentée qui ouvre le panneau `Settings` de la vue prof et un
  bouton « Ajouter ». Les aperçus sont chargés paresseusement
  (`IntersectionObserver`) : un thème de cinquante exercices ne charge que les
  modules visibles ;
- l'exercice prévisualisé vit dans la carte, hors de `exercicesParams` : les
  réglages faits à la roue dentée sont portés par les paramètres transmis à
  l'ajout. Après un ajout, la carte tire une nouvelle graine (recliquer
  n'ajoute donc pas deux fois le même énoncé) et un badge rappelle combien de
  fois la ressource est déjà dans la fiche ;
- un exercice statique (annale, banque externe) n'a rien à régler : sa roue
  dentée est masquée, comme dans la barre d'exercice de la palette.

On peut naviguer, ajouter plusieurs exercices, puis fermer la modale
(« Valider », croix, Échap ou clic sur le fond).

Côté `Typst.svelte`, `addExerciseToSheet` ajoute les paramètres à
`exercicesParams` (donc à l'URL), charge l'exercice avec le même
`buildExercise` que le chargement de la fiche
([`lib/components/exercisesUtils.ts`](../../../../src/lib/components/exercisesUtils.ts)),
relit les sources `.typ`/images statiques puis régénère le code. Les réglages
de la palette ne sont pas décalés : l'ajout se fait après le dernier exercice,
aucun numéro existant ne change (une insertion de texte présente au dernier
repère se retrouve donc avant le nouvel exercice). Contrairement aux autres
actions qui régénèrent le code, ouvrir la modale ne demande pas confirmation
même si le code a été modifié à la main (`isEdited`) : comme `deleteExercise`,
ajouter un exercice est déjà un geste délibéré, et bloquer la modale derrière
l'avertissement générique interdirait tout ajout tant que le code a été
retouché à la main.

## Lignes en pointillés (« Lignes pour écrire »)

Bouton (icône liste, `bx-detail`) de la barre d'outils de chaque exercice (à côté de « Éditer le code Typst ») : ajoute des lignes en pointillés (pour que l'élève y écrive), réglées **par exercice** — soit après le corps entier de l'exercice, soit après chaque question de cet exercice (y compris la dernière). Le popover règle l'emplacement, le nombre de lignes (0 par défaut : rien ne s'affiche tant qu'il n'est pas incrémenté) et l'espacement (2 em par défaut, pas de 0,5) ; « Retirer » efface le réglage. Ne s'applique jamais à la correction.

Comme la fusion d'exercices (`onToggleMergeBefore`), le réglage change la structure du document (les appels s'intercalent après chaque question en mode « Après chaque question ») : il régénère donc tout le code plutôt que de l'éditer ponctuellement. Porté par `TypstCarryOver.writingLines` (`Record<number, { position, count, spacing }>`, clé = numéro d'exercice 1-based), il survit à la régénération comme les autres réglages de la palette. Chaque appel généré `#mathalea-lignes(n, gutter: ...em)` est tagué d'un marqueur `// mathalea:lignes-fin(N)` ou `// mathalea:lignes-apres(N)`, relu par `harvestCarryOver` (comme `// mathalea:insertion` pour les insertions de texte) ; `shiftCarryOver`/`swapCarryOver` décalent ces réglages à la suppression/au déplacement d'un exercice, comme `tasksLayout`/`codeOverrides`. Le helper Typst réutilisable `#mathalea-lignes(n, gutter: ...)` (`MATHALEA_WRITING_LINES_HELPER` dans `buildTypstDocument.ts`) n'est déclaré dans le préambule que s'il est effectivement utilisé, et ne produit aucun rendu (ni espace) tant que `n` vaut 0.

## En-tête et pied de page

Réglages des Réglages du document, indépendants l'un de l'autre :

- **Habillage en-tête** (`TypstDocumentOptions.headerStyle`) : `Épuré`,
  `Cartouche`, `Cadre` ou **`Aucun`** — ce dernier n'émet aucun bloc de titre
  (`headerBlock` renvoie `[]`), la fiche commence alors directement par le
  premier exercice. Les variables `titre`/`sous-titre`/`entete` restent
  déclarées (le pied de page peut toujours y renvoyer), mais le repère
  `#mathalea-anchor("header", 0)`, lui, n'est **pas** émis dans ce cas : sans
  bloc de titre affiché, il n'y a rien à éditer à cet endroit sur l'aperçu.
  Choisir un modèle de [page de garde](#page-de-garde) bascule automatiquement
  cet habillage sur `Aucun` (la page de garde porte déjà le titre ; un second
  bloc en page 2 ferait doublon) — un choix explicite plus tard dans le
  sélecteur reste possible et n'est pas écrasé ensuite.
- **Pied de page** (`TypstDocumentOptions.showFooter`/`footerText`) : une
  case à cocher dans le volet (`footer: none,` côté Typst quand décochée) ;
  le texte, lui, se modifie **directement sur l'aperçu** (icône sur le pied
  de la première page), comme le titre et la page de garde. Le texte est
  déclaré en variable (`#let pied-page = "..."`) et référencé par les trois
  habillages, qui n'en diffèrent donc plus que par la mise en forme (ligne,
  couleur) — avant ce réglage, chaque habillage imprimait un texte différent
  en dur (« MathALÉA — coopmaths.fr », « MathALÉA · coopmaths.fr », « CC
  BY-SA · MathALÉA »).
  - Le pied de page se répète sur **chaque** page (`#set page(footer:
    context [...])`), à la différence du titre ou de la page de garde qui
    n'apparaissent qu'une fois : un seul point d'édition suffit, donc le
    repère `#mathalea-anchor("footer", 0)` n'est émis que sur la première
    page **physique**, via `#if here().page() == 1 [...]`. `here().page()`
    (numéro de page physique) est utilisé plutôt que `counter(page).get()` :
    ce dernier est remis à 1 par `#counter(page).update(1)` au début de
    chaque sujet suivant (plusieurs versions, voir « Page de garde » plus
    bas) — l'icône réapparaîtrait alors en tête de chaque sujet plutôt
    qu'une seule fois sur toute la fiche.

## Page de garde

Réglage `TypstDocumentOptions.coverPage` (section « Page de garde » des
Réglages du document), sur le modèle des modèles d'épreuve de la vue PDF
(`ExamTemplateEngine`, [`latex/LatexConfig.ts`](../../../../src/components/setup/latex/LatexConfig.ts)).
Cinq modèles : **Aucune** (défaut), **Évaluation**, **Brevet des collèges**,
**BAC** et **Course aux nombres**.

L'intitulé, la session, la matière, la durée, la mention en bas de page
(« Tournez la page S.V.P. ») et les consignes se modifient **directement sur
l'aperçu** (bouton `bx-edit` en haut de la page de garde), sur le modèle du
titre/sous-titre/en-tête de la fiche (voir « Palette de mise en page »
ci-dessous) ; le barème, lui, reste dans les Réglages du document (exercice
par exercice, avec son total).

Comme `titre`/`sous-titre`/`entete`, les textes sont déclarés en variables en
tête de document puis référencés par l'appel — une édition depuis l'aperçu
modifie ainsi la ligne `#let couverture-titre = "..."` (édition ciblée du
code, sans régénération) plutôt que l'argument nommé :

```typst
#let couverture-titre = "Brevet des collèges"
#let couverture-session = "Juin 2026"
#let couverture-matiere = "MATHÉMATIQUES"
#let couverture-duree = "2 heures"
#let couverture-consignes = ("L’usage de la calculatrice est autorisé.",)
#let couverture-note-fin = "Tournez la page S.V.P."
…
#mathalea-couverture(
  titre: couverture-titre,
  session: couverture-session,
  matiere: couverture-matiere,
  duree: couverture-duree,
  consignes: couverture-consignes,
  bareme: (6, 4, 4, 2.5, 3.5),
  note-fin: couverture-note-fin,
)
```

- Deux aides seulement, déclarées uniquement quand un modèle est choisi :
  `#mathalea-couverture` (Évaluation, Brevet, BAC) et
  `#mathalea-couverture-can`, plus `#mathalea-champ` (« Nom : ...... »)
  commune aux deux. Ce qui distingue les trois premiers modèles n'est pas
  réglable — c'est ce qui *fait* le modèle — et tient en trois arguments
  (`COVER_TEMPLATE_LAYOUT`) : `identite` (champs Nom/Prénom/Classe/Date) et
  `colonne-note` (colonne vide où porter la note) pour l'évaluation,
  `hasNoteFin` (affiche la mention de bas de page — son texte, lui, reste
  réglable, voir plus haut) pour le Brevet et le BAC.
  `couverture-session`/`couverture-matiere`/`couverture-note-fin` sont
  toujours déclarées, y compris quand le modèle actif ne les référence pas
  (une variable Typst non lue ne produit ni erreur ni avertissement) : la
  palette garde ainsi les mêmes variables quel que soit le modèle, et
  masque simplement les champs sans objet (Session/Matière/mention pour
  « can », mention pour « Évaluation »).
- Le barème est proposé à un point par question, comme la vue PDF
  (`buildExamExercices` de [`lib/LatexGroup.ts`](../../../../src/lib/LatexGroup.ts)) ;
  chaque ligne a sa croix de suppression (comme `TexSettingsPane`) et
  « Reprendre les exercices de la fiche » le réaligne après un ajout ou une
  suppression, en gardant les points déjà saisis.
- Changer de modèle **remplace les textes qui n'ont pas été personnalisés**
  (`isDefaultCoverText`, étendu à `noteFin`) et conserve les autres : passer
  du Brevet à la Course aux nombres ne garde pas « Durée : 2 heures » ni
  « calculatrice autorisée », qui la contrediraient, mais un intitulé réécrit
  à la main survit. Choisir un modèle bascule aussi l'**habillage en-tête sur
  `Aucun`** (voir « En-tête et pied de page » plus haut) : la page de garde
  porte déjà le titre, un second bloc en page 2 ferait doublon.
- Avec plusieurs versions (Sujet A, B…), la page de garde ouvre **chaque**
  sujet (mêmes variables partagées) ; l'aide et le repère d'édition
  (`#mathalea-anchor("cover", 0)`), eux, ne sont émis qu'une fois — seul le
  premier sujet est éditable depuis l'aperçu, comme l'en-tête et le pied de
  page.
- Fiche entièrement composée d'exercices « can » (identifiant contenant
  `can`) : la détection automatique de `canMode` (voir « Mode « Course aux
  nombres » (tableau) » ci-dessous) sélectionne aussi le format **A5**, la
  page de garde **Course aux nombres** et l'habillage en-tête **Aucun**, sauf
  si un lien partagé fixe déjà l'un de ces réglages individuellement.

La page de garde « Course aux nombres » reprend `\pageDeGardeCan` de la sortie
LaTeX ([`lib/latex/preambuleTex.ts`](../../../../src/lib/latex/preambuleTex.ts))
— identité, case « Score : ... / n », consignes cochées, titre du sujet — sans
les logos des académies ni de l'APMEP, remplacés par le **dé de MathALÉA**. La
durée et le nombre de questions produisent leurs deux premières consignes (le
décompte suit la fiche, énoncés du tableau compris) ; les suivantes sont
libres.

Le dé est embarqué dans le document comme les figures mathalea2d
(`#let mathalea-logo = image(bytes("<svg…>"), format: "svg", width: 3.4cm)`),
qui reste donc autonome. `mathaleaLogo.ts` en porte une version allégée de
`public/assets/svg/logo_mathalea.svg` : métadonnées d'Inkscape et décimales
superflues retirées (14,7 ko → 8,1 ko, rendu identique), attributs entre
apostrophes pour s'inscrire tel quel dans le littéral Typst sans échappement.

Les petites capitales ne sont pas employées ici : la police Libertinus Serif
embarquée dans le compilateur WASM n'a pas de table `smcp`, `#smallcaps` y est
sans effet (vérifié).

## Mode « Course aux nombres » (tableau)

Case à cocher des Réglages du document (`TypstDocumentOptions.canMode`) : pendant Typst du style `Can` de la sortie LaTeX (`lib/Latex.ts`). Toutes les questions de tous les exercices sont rassemblées dans **un seul tableau** (numéro, énoncé, réponse à compléter, colonne « Jury »), et les corrections sont numérotées à la suite, dans le même ordre que les lignes du tableau.

- **Détection automatique** (`Typst.svelte`, au chargement) : si la fiche ne
  contient que des exercices « can » (identifiant contenant `can`, ex.
  `can6M20`), `canMode` est coché par défaut, le format passe en **A5**
  (feuille de passation plus petite), la [page de garde](#page-de-garde)
  bascule sur le modèle **Course aux nombres** et l'habillage en-tête sur
  **Aucun** (même raison que le choix manuel d'un modèle de page de garde :
  elle porte déjà le titre du sujet). Chacun de ces quatre réglages n'est
  appliqué que s'il n'a pas déjà été fixé par un lien partagé
  (`canModeSetFromUrl`/`pageFormatSetFromUrl`/`coverTemplateSetFromUrl`/
  `headerStyleSetFromUrl`) : rouvrir une fiche déjà réglée autrement ne
  l'écrase pas.
- Le tableau est produit par le helper Typst `#can-tableau(enonces, reponses, jury: true, entetes: ..., fond: ..., hauteur-ligne: ...)` (`MATHALEA_CAN_TABLE_HELPER` dans `buildTypstDocument.ts`), déclaré dans le préambule seulement quand il sert, comme les autres aides. `enonces` et `reponses` sont deux listes de contenus de même longueur ; les proportions des colonnes et l'en-tête répété en haut de chaque page reprennent le `longtblr` de l'environnement `TableauCan` (`lib/latex/preambuleTex.ts`). Les arguments nommés restent modifiables dans l'éditeur (retirer la colonne « Jury » avec `jury: false`, par exemple).
- Les réponses à compléter viennent de `listeCanReponsesACompleter` (exposée par `TypstExerciseInput.canAnswers`), les énoncés de `listeCanEnonces` à défaut de `listeQuestions` (`canQuestions`) — même repli qu'en LaTeX. `buildInputs` (`Typst.svelte`) les renseigne comme les autres contenus, et `frozenInputs` les fige avec les questions quand le nombre de questions change.
- La consigne et l'introduction des exercices ne sont pas reprises (comme en LaTeX) : le tableau ne montre que les énoncés.
- Le paquet `exercise-bank` n'est pas importé (il n'y a plus de titre d'exercice à habiller) : les réglages « Fusionner les exercices », « Style des exercices », « Afficher la référence » et « QR-code » sont désactivés dans ce mode.
- Les corrections sont dans un environnement `tasks` unique pour toute la fiche (une seule liste, numérotée comme les lignes du tableau) : elles se répartissent donc sur plusieurs colonnes, indispensable avec la [correction minimale](#correction-minimale) où chaque réponse tient en quelques caractères. Ses variables de mise en page portent le préfixe `ex0-corr` — le numéro 0, qu'aucun exercice ne porte, la distingue des listes de questions tout en restant reconnu par la palette, par `harvestCarryOver` et par `shiftCarryOver`/`swapCarryOver` (qui ne renumérotent que les exercices, à partir de 1).
- Palette de mise en page : le repère `exo` de chaque exercice est émis **dans sa première cellule** (une métadonnée n'occupe aucune place, le contenu n'est pas décalé), la barre de l'exercice reste donc disponible ; seuls les repères `gap` qui encadrent le tableau existent (0 et le dernier), car entre deux lignes d'un même tableau une insertion ou un saut de page n'aurait pas de sens. `TypstLayoutOverlay` reçoit `canMode` et masque en conséquence les boutons sans effet (insertion avant l'exercice, édition du code de l'exercice, lignes pour écrire). Les insertions héritées de gaps intermédiaires (passage par le mode fiche) sont réémises après le tableau plutôt que perdues.

## Correction minimale

Case à cocher des Réglages du document (`TypstDocumentOptions.minimalCorrections`, désactivée quand la correction n'est pas affichée) : quand une correction met sa réponse en évidence en orange, seule cette réponse est imprimée — le raisonnement disparaît. Une correction sans mise en évidence, ou dont la mise en évidence utilise une autre couleur (choisie justement pour ne pas désigner la réponse, voir `lib/outils/ecritures.ts`), est conservée telle quelle.

`minimalCorrection` (`components/setup/typst/minimalCorrection.ts`) reconnaît les **deux** façons de mettre une réponse en évidence :

- `miseEnEvidence()` — dans une formule, produit `{\color{#F15929}\boldsymbol{…}}`. Repérée par `occurrencesMiseEnEvidence` (`components/setup/diaporama/answersTable.ts`, partagée avec le tableau des réponses du diaporama), qui tient compte des accolades imbriquées ;
- `texteEnCouleurEtGras()` — hors formule, produit en HTML un `<span>` orange et gras ; c'est ce qu'emploient les exercices à QCM pour désigner la bonne réponse. Repérée par un balayage des spans qui compte les imbrications. Les repères de sous-question de `numAlpha` (`a)`, `b)`…), orange et gras eux aussi, sont exclus : ils ne désignent aucune réponse.

Les réponses trouvées sont remises dans leur ordre d'apparition, dédoublonnées, puis réémises telles quelles (donc toujours en orange) séparées par un cadratin `&emsp;`. Le réglage s'applique au seul endroit où les corrections passent dans le code généré : `computeGeneratedExercises` (fiche normale, fusionnée, code autonome de la modale d'édition) et `buildCanVersionContent` (tableau « Course aux nombres »). Dans les deux cas les corrections sont dans un environnement `tasks` en `auto-fit` : une fois réduites à leur réponse, elles se répartissent d'elles-mêmes sur plusieurs colonnes, réglables depuis la palette de l'aperçu.

## Persistance dans l'URL

Toutes les modifications de la fiche sont sauvegardées dans l'URL (paramètre `typstParam`, JSON encodé en base64) pour pouvoir la recharger à l'identique ou la partager :

- `options` : les réglages du document (`TypstDocumentOptions` — format, orientation, polices, titre/sous-titre/en-tête, nombre de versions, page de garde…). Une fiche partagée avant l'arrivée d'un réglage, ou pointant un modèle de page de garde qui n'existe plus, retombe sur les valeurs par défaut (`sanitizeCoverPage`) ;
- `carryOver` : les réglages de la palette de mise en page (`harvestCarryOver` — colonnes/espacement des questions par exercice, textes et sections insérés, sauts de page et de colonne, fusions, zoom/alignement des figures).

La liste des exercices, leurs graines et leurs réglages restent portés par les paramètres habituels de l'URL (`exercicesParams`), mis à jour par le store du même nom : suppression, déplacement, changement de graine ou de nombre de questions y sont déjà reflétés.

`persistToUrl` (dans `Typst.svelte`) est appelée après chaque modification (réglage du document ou édition de la palette, via le `updateListener` de CodeMirror). Comme la vue A4 avec `a4Param`, elle écrit dans `typstParamStore` (source de vérité), redéclenche l'écrivain d'URL de l'app (`mathaleaUpdateUrlFromExercicesParams`, sinon sa prochaine écriture débouncée réécrirait l'URL sans `typstParam`) puis pose immédiatement le paramètre avec `history.replaceState`. Au chargement, `parsed.carryOver` est réinjecté dans la première génération du code (`buildCode` part de `urlCarryOver` tant que l'éditeur n'existe pas). `typstParam` est aussi le canal par lequel le diaporama transmet son nombre de vues (`goToTypstWithSeries`).

## Visite guidée

`src/lib/onboarding/typstTour.ts` (driver.js) présente la vue : modes d'affichage, aperçu, palette de mise en page, ajout d'un exercice (démontré par de vrais clics dans la modale), réglages du document — dont les liens vers les deux autres exports —, versions et export. Elle se déclenche au premier passage (hors mobile, hors `localhost`, hors lien partagé) et se relance depuis le bouton « Aide ».

Deux précautions, sans lesquelles driver.js reste bloqué à attendre une cible introuvable (`waitForElement`) :

- `ensureTourReadyState()` remet la vue dans l'état ciblé par la visite (mode Aperçu, panneau de réglages ouvert, palette de mise en page affichée) et le restaure à la fin ;
- les étapes dont la cible n'existe pas sur toutes les fiches sont **retirées de la liste** au démarrage : la pastille colonnes/espacement (`findTasksWidget`, absente d'une fiche « Course aux nombres » sans correction, puisque ses questions sont dans un tableau), le saut de page et l'ajout d'exercice. Le compteur d'étapes s'ajuste donc à la fiche.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/components/setup/typst/Typst.svelte` | La vue : barre d'outils, éditeur, aperçu, exports |
| `src/lib/onboarding/typstTour.ts` | Visite guidée de la vue (driver.js) |
| `src/components/setup/typst/TypstLayoutOverlay.svelte` | Palette de mise en page dessinée par-dessus l'aperçu |
| `src/components/setup/typst/addExercise/TypstAddExerciseModal.svelte` | Modale « Ajouter un exercice » (navigation dans les référentiels) |
| `src/components/setup/typst/addExercise/TypstExercisePreview.svelte` | Aperçu d'un exercice dans cette modale (réglages et ajout) |
| `src/components/setup/typst/buildTypstDocument.ts` | Génère le code Typst complet (en-tête, exercices, corrections) |
| `src/components/setup/typst/latexToTypst.ts` | Convertit le HTML des exercices et les formules LaTeX en Typst |
| `src/components/setup/typst/minimalCorrection.ts` | Réduit une correction à ses réponses mises en évidence en orange |
| `src/components/setup/typst/mathaleaLogo.ts` | Dé de MathALÉA (SVG allégé) embarqué par la page de garde « Course aux nombres » |
| `src/components/setup/typst/typstCompiler.ts` | Compilation dans le navigateur via typst.ts (WASM) |
| `src/components/setup/typst/typstDiagnostics.ts` | Lecture et traduction en français des diagnostics du compilateur |
| `src/components/setup/typst/editor/typstEditorSetup.ts` | Extensions CodeMirror de l'éditeur (thèmes, raccourcis, marqueurs d'erreur) |
| `src/components/setup/typst/editor/typstLanguage.ts` | Coloration syntaxique Typst (`StreamLanguage`) |
| `src/components/setup/typst/editor/editorPhrases.ts` | Traduction française de l'interface de CodeMirror |

## Pipeline de génération

1. Les exercices sont chargés comme dans la vue A4 (`buildExercisesList`, graines `alea`, contenu HTML avec formules KaTeX en `$...$`), en régénérant chaque exercice avec `context.isHtml = true` et `context.isTypst = true` (le rendu HTML est réutilisé, pas le rendu LaTeX). Voir [Variantes d'exercices — branches de rendu](../../auteurs-exercices/complements/variantes-exercices.md#branches-de-rendu) pour ce que cela implique côté code d'exercice (branches `context.isHtml` qui posent un composant interactif non convertible).
2. `buildTypstDocument` assemble le document : réglages éditables en tête de fichier (`#let colonnes`, `#let corrige`, `#let couleur`), en-tête de fiche, un bloc par exercice, section corrections dans un `#if corrige [...]`.
3. `htmlToTypst` convertit chaque contenu : balises simples (`<br>`, `<b>`, `<i>`, `<sup>`, listes...) vers le balisage Typst, échappement des caractères spéciaux, et formules LaTeX converties par [tex2typst](https://github.com/qwinsi/tex2typst).

Particularités de la conversion des formules (`latexMathToTypst`) :

- virgule décimale française rendue sans espace (`3,5` → `3","5`) ;
- `\num`/`\numprint` dépliés en conservant les espaces fines (`\,`) ;
- espaces LaTeX explicites (`\thinspace`, `\medspace`, `\thickspace`) normalisées vers les espaces mathématiques Typst ;
- les espaces sources qui bordent une chaîne de texte (`#txt("…")`, `" "`) sont supprimées : contrairement à LaTeX, Typst rend en mode maths l'espace qui précède ou suit une chaîne, elle s'ajouterait donc à celle contenue dans le `\text{…}` (`5\text{ cm}`) ou à l'espace insécable qui précède (`5~\text{cm}`) et afficherait une double espace ;
- la mise en évidence `{\color{...}\boldsymbol{...}}` de `miseEnEvidence` est convertie en `#text(fill: rgb("..."))` ;
- en cas d'échec de conversion, la formule est insérée verbatim entre guillemets.

### Figures SVG

Les figures SVG (mathalea2d) sont **embarquées dans le document** : chaque figure est déclarée en tête de fichier (`#let fig-N = image(bytes("<svg...>"), format: "svg", width: ...pt)`) et référencée dans le corps. Le document reste autonome (il compile aussi avec le CLI `typst`). La largeur reprend celle de la figure (96 px CSS = 72 pt). `sanitizeSvg` corrige au passage le SVG pour le parseur XML strict de Typst (point-virgule parasite entre attributs généré par `lib/2d/textes.ts`, entités HTML indéfinies en XML, attributs dupliqués).

Pour les figures mathalea2d qui contiennent des labels KaTeX (`divLatex`), seul le tracé géométrique part dans le SVG. Les labels sont extraits depuis l'annotation TeX KaTeX, convertis en Typst, puis placés par les helpers `mathalea-label` et `mathalea-figure`. Le code généré reste donc éditable côté Typst sans réinjecter le HTML visible de KaTeX.

### Tableaux

Les tableaux LaTeX visuels (`tabular`, `tblr`, ou `array` avec bordures/`\hline`) sont convertis en tableaux Typst avec le package [`tblr`](https://typst.app/universe/package/tblr). L'import `#import "@preview/tblr:0.5.0": *` est ajouté uniquement quand un tableau de ce type est généré. Les commandes `\def\arraystretch{...}` et `\renewcommand{\arraystretch}{...}` sont interprétées comme un agrandissement vertical des cellules (`inset.y`), puis retirées du code final.

Les environnements mathématiques non visuels (`aligned`, `cases`, `array` sans bordures) restent des expressions mathématiques converties par `tex2typst`.

### Schémas en barres et figures 3D

Les schémas en barres (`SchemaEnBoite`, HTML en grille CSS `SchemaContainer`) sont convertis en grilles Typst natives : boîtes avec fond et bordures (les côtés partagés, `border-left: none`, ne sont pas doublés), accolades et flèches étirées sur la largeur de leur cellule par le helper `mathalea-schema-span` (`stretch(brace.t)`/`stretch(<->)`). Les accolades latérales (`latexAccoladeRight`, rares) ne sont pas rendues.

Les empilements de cubes des exercices de motifs (`<canvas-3d>`, rendu WebGL Three.js) n'ont pas d'image extractible : les cubes décrits par l'attribut `content` (JSON) sont redessinés en SVG isométrique (`canvas3dToSvg`), embarqué comme les autres figures. Un contenu 3D sans cubes est remplacé par un encart.

### Images

Chaque `<img>` du contenu HTML d'un exercice (pas seulement les annales scannées) est préchargé par `prefetchStaticImages` (`Typst.svelte`) : ses octets sont récupérés par `fetch` (mis en cache via `cachedBytes`), enregistrés dans le système de fichiers virtuel du compilateur, puis embarqués comme les autres figures. Le chemin virtuel reprend l'extension réelle de l'image (Typst en déduit le format). Une image dont la récupération échoue (hôte externe n'autorisant pas le CORS, réseau indisponible) reste un encart grisé « image non convertie », sans bloquer le reste de la fiche.

Les tableaux HTML (par opposition aux tableaux LaTeX visuels, voir ci-dessus) ne sont **pas convertis** : un encart grisé « tableau non converti » les remplace.

## Compilation dans le navigateur

`typstCompiler.ts` s'appuie sur `@myriaddreamin/typst.ts` : le compilateur WASM (~27 Mo, polices incluses) et le moteur de rendu sont chargés à la première compilation (import dynamique, URL des `.wasm` résolues par Vite). L'aperçu est un rendu SVG du document ; le bouton « Télécharger le PDF » compile en vrai PDF côté client, sans serveur.

## Tests

- `src/components/setup/typst/latexToTypst.test.ts` : conversion des formules et du HTML ;
- `src/components/setup/typst/typstDiagnostics.test.ts` : lecture du format « unix » et traduction des messages ;
- `src/components/setup/typst/buildTypstDocument.test.ts` : structure du document généré. Les cas qui lancent le binaire externe `typst compile` sont exécutés en local quand le CLI `typst` est installé, ignorés en CI par défaut, et réactivables avec `TYPST_CLI_TESTS=1` pour un job dédié ;
- `pnpm typst:check:compile` : vérification explicite par compilation CLI Typst pour les environnements qui installent le binaire `typst`.
