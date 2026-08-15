# Vue Diaporama PDF

La vue Diaporama PDF (`v=slides` dans l'URL) produit un PDF au format d'un
écran (16/9 ou 4/3) : **une question en grand par page**, puis les corrections.
Elle est compilée dans le navigateur avec [Typst](https://typst.app/docs/),
comme la [vue Typst](typst.md) et la [vue Flash-cards](flashcards.md), et vise
les mêmes usages que la [vue Diaporama](diaporama.md) — la course aux nombres
en particulier — mais sous forme d'un document à projeter (ou à conserver).

Elle est accessible depuis « Plus d'exports » sur la page d'accueil, depuis les
réglages de la vue Diaporama (icône diaporama à côté de « PDF sujets +
corrigés ») et depuis les liens en tête du panneau de réglages des vues Typst
et Flash-cards (`shared/ExportViewLinks.svelte`, qui équipe les trois vues :
chacune renvoie vers les deux autres).

## Principe

1. Les exercices sont chargés et régénérés comme dans la vue Typst
   (`buildExercisesList`, graines `alea`, `context.isTypst = true`).
2. Chaque question devient une diapositive : la question (précédée de la
   consigne de l'exercice s'il en a une) sur une page, sa correction sur une
   autre. Les exercices purement interactifs (`typeExercice` contenant `html`)
   sont signalés dans un bandeau et ignorés.
3. `buildSlidesDocument` convertit les contenus avec `htmlToTypst` (mêmes
   helpers que la fiche : figures SVG embarquées, schémas, QCM) et assemble le
   document : pages `presentation-16-9` (ou `presentation-4-3`), une par
   diapositive, dans l'ordre choisi par le réglage « Contenu ».
4. Le contenu d'une page occupe toute la page (`box(width: 100%, height: 100%)`)
   et son alignement vertical est réglable diapositive par diapositive. Le
   numéro (et « Correction » sur les corrections) est placé dans un coin ; il
   cède le coin haut-gauche au titre quand celui-ci y est ancré.
5. Le pied de page (« MathALÉA - CC BY-SA » par défaut) vit dans la marge : il
   n'empiète pas sur le contenu. Le titre des diapositives ancré **en bas** le
   rejoint sur cette ligne (`ligne-pied`, une grille de trois colonnes) : ils
   sont ainsi alignés verticalement et de même taille (`titre-taille`, commune
   aux deux). Le pied va à droite, sauf si le titre y est déjà ancré, auquel
   cas il passe à gauche — ils ne se chevauchent jamais. Ancré en haut, le
   titre reste posé dans la page (`place`).
6. Le diaporama s'ouvre **toujours** sur sa page de garde
   (`#garde(page-de-garde)`). Voir plus bas.

## Rien ne doit déborder de la page

Une diapositive ne peut pas être coupée : tout ce qui dépasse se retrouverait
par-dessus la page précédente. Deux mécanismes s'en chargent, dans le helper
Typst `diapo` :

- **le bandeau du numéro et du titre.** Tous deux sont posés en `place`, qui ne
  réserve aucune place dans le flux : le contenu passerait dessous. `bandeau()`
  calcule donc la hauteur à réserver en haut et en bas (selon les coins
  réellement occupés — le titre ancré en bas n'en fait pas partie, il est dans
  la marge) et le contenu est mis en retrait d'autant (`inset` du `block`,
  et non `pad`, dont la hauteur automatique ferait perdre le centrage
  vertical) ;
- **l'ajustement automatique** (`ajuster`, réglage « Réduire le texte des
  diapositives trop chargées », actif par défaut). Dans un `layout`, le contenu
  est mesuré à la taille demandée ; s'il dépasse la hauteur disponible (celle
  qui reste après le bandeau), la taille est réduite. Réduire la police diminue
  à la fois la hauteur des lignes et leur nombre : la racine carrée du
  dépassement donne une bonne première estimation, affinée par au plus 8 passes
  de 5 %. Les corrections détaillées (`4C20-1` par exemple) tiennent ainsi sur
  leur page sans réglage manuel.

L'ajustement ne fait que **réduire** : les boutons − / + de l'aperçu gardent la
main quand le contenu tient déjà dans la page.

Aucun paquet de présentation n'est utilisé : ce sont des pages Typst
ordinaires, ce qui garde le code lisible et éditable. Le paquet
[`breather`](https://typst.app/universe/package/breather) est en revanche
importé (réglage « Gestion automatique des espaces verticaux », actif par
défaut) pour écarter les lignes contenant des maths hautes.

## Page de garde

Le document s'ouvre toujours sur une page de garde, sans numéro ni titre de
diapositive : le bloc `#let page-de-garde = [ ... ]`, affiché par le helper
`#garde(...)`. Il montre un **titre** (`garde-titre`, « Calcul mental » par
défaut) et, s'il est renseigné, un **sous-titre** (`garde-sous-titre`, vide par
défaut, en plus petit et en gris).

Ces deux textes ne sont pas dans le panneau de réglages : le crayon de la
pastille de la page de garde (repère `diapo-garde`) ouvre une modale à deux
champs de **texte** — pas de code Typst, contrairement à la modale des
diapositives —, comme la page de garde de la [vue Typst](typst.md). Ils font
partie des options du document (donc persistés dans `localStorage` et rejoués à
chaque régénération) ; le titre donne aussi le nom du fichier exporté.

## Réglages

Panneau latéral, persisté dans `localStorage` (`mathaleaSlidesView`) — rien n'y
concerne la page de garde, qui se règle depuis l'aperçu :

- **Contenu** : questions puis corrections (défaut), chaque correction après sa
  question, questions seules, corrections seules ;
- format (16/9 ou 4/3), taille des questions et des corrections (en points),
  alignements vertical et horizontal, zoom des figures ;
- polices (texte et maths, mêmes listes que la vue Typst) ;
- numérotation des diapositives, mention « Correction », réduction automatique
  du texte des diapositives trop chargées, espaces verticaux automatiques,
  pied de page ;
- titre affiché sur chaque diapositive (texte, ancrage, couleur) ; sa taille
  (`titre-taille`) sert aussi au pied de page, avec lequel il partage sa ligne
  quand il est ancré en bas.

## Contrôles de l'aperçu

Le bouton « Mise en page » affiche sur chaque page une palette (repères
`diapo-question` / `diapo-correction` publiés par le document, voir
`TypstAnchor`) :

| Bouton | Effet |
| --- | --- |
| − / + | taille du texte de cette page (`#let diapo-N-question-taille`) |
| alignement | fait tourner l'alignement vertical : haut → centre → bas |
| crayon | ouvre une modale d'édition du code Typst du contenu de la page |
| ‹ / › | déplace la diapositive dans l'ordre du diaporama |
| œil barré | retire la question du diaporama (question **et** correction) |

La page de garde, elle, n'a qu'un crayon — celui de ses deux textes (voir plus
haut). Les figures ont leur propre palette de zoom (repère `figure`,
`#let fig-N-zoom`), comme dans la vue Typst.

Taille, alignement, zoom des figures, ordre et diapositives masquées sont relus
dans le code courant par `harvestSlidesCarryOver` et réémis à chaque
régénération (changement de réglage, nouvelles données), comme le
`TypstCarryOver` de la fiche. L'ordre est déduit de la suite des appels
`#diapo(...)`, ce qui suit aussi une page déplacée à la main dans le code ; les
diapositives masquées sont mémorisées dans `#let diapos-masquees`. L'édition du
contenu via le crayon, elle, marque le code comme modifié : une régénération
l'écraserait (avertissement avant écrasement).

Le code Typst complet est éditable en mode « Code » (recompilation débouncée).
Exports : PDF (compilation typst.ts dans le navigateur) et fichier `.typ`.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `src/components/setup/slides/Slides.svelte` | La vue : barre d'outils, réglages, aperçu, palette, exports |
| `src/components/setup/slides/buildSlidesDocument.ts` | Génère le code Typst des diapositives |
| `src/components/setup/shared/ExportViewLinks.svelte` | Liens entre les trois exports Typst, en tête de leur panneau de réglages |

La conversion HTML/LaTeX → Typst et la compilation sont partagées avec la vue
Typst (`src/components/setup/typst/latexToTypst.ts`, `typstCompiler.ts`).

## Tests

- `src/components/setup/slides/buildSlidesDocument.test.ts` : structure du
  document généré (ordre des pages selon le contenu choisi, masquage et
  réordonnancement, carry-over, helpers conditionnels).
