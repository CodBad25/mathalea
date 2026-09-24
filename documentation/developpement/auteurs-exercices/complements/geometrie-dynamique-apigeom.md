# Géométrie dynamique avec apiGeom

[apiGeom](https://forge.apps.education.fr/coopmaths/apiGeom) est la
bibliothèque de géométrie dynamique de l'association. Sa classe `Figure`
affiche une figure statique ou interactive, propose une barre d'outils à
l'élève et fournit des méthodes pour vérifier sa construction.

Modèle : `src/exercices/modèlesExos/20_exercice_classique_apigeom.ts`.
Exemples : les exercices de `src/exercices/geodyn/` et, par exemple,
`src/exercices/5e/5G1B-3.ts` (`rg "from 'apigeom'" src/exercices` les liste
tous).

Vidéos de présentation (anciennes API : `testAngle` est devenu `checkAngle`) :
[rectangle 1](https://podeduc.apps.education.fr/video/27470-programmer-un-exercice-de-geometrie-dynamique-le-rectangle-1/),
[rectangle 2](https://podeduc.apps.education.fr/video/27471-programmer-un-exercice-de-geometrie-dynamique-le-rectangle-2/),
[animation en correction](https://podeduc.apps.education.fr/video/27522-programmer-un-exercice-de-geometrie-dynamique-ajout-dune-animation-en-correction/).

## Créer et afficher une figure

```ts
import Figure from 'apigeom'
import figureApigeom from '../../lib/figureApigeom'

// dans la boucle de nouvelleVersion()
this.figuresApiGeom[i] = new Figure({ xMin: -5.5, yMin: -5.5, width: 330, height: 330 })
const figure = this.figuresApiGeom[i]

const A = figure.create('Point', { x: 0, y: 0, label: 'A', shape: 'o' })
const B = figure.create('Point', { x: 7, y: 2, label: 'B', color: 'blue' })
const AB = figure.create('Line', { point1: A, point2: B })
const C = figure.create('Point', { x: 3, y: 5, label: 'C' })
figure.create('LineParallel', { line: AB, point: C, color: 'blue', thickness: 2 })

figure.setToolbar({ tools: ['POINT', 'LINE', 'DRAG', 'REMOVE'], position: 'top' })

texte += figureApigeom({ exercice: this, i, figure, defaultAction: 'POINT' })
```

- Initialiser `this.figuresApiGeom = []` au début de `nouvelleVersion()` et
  ranger la figure de la question `i` dans `this.figuresApiGeom[i]`.
- `setToolbar()` choisit les outils proposés (`tools`) et la position de la
  barre (`'left'`, `'top'` ou `'none'`). La liste des outils est le type
  `availableButtons` de `apigeom/src/userInterface/availableButtons.ts`.
- `figureApigeom()` (`src/lib/figureApigeom.ts`) insère la figure dans
  l'énoncé. Options : `defaultAction` (outil actif au démarrage, qui doit être
  dans la barre), `idAddendum` (pour distinguer une deuxième figure dans la
  question ou celle de la correction), `isDynamic: false` (figure figée même en
  interactif), `animation`, `hasFeedback`.
- `figureApigeom()` ne produit rien hors HTML : prévoir une figure
  MathALÉA 2D ou un texte pour les sorties LaTeX et Typst.
- Utiliser des couleurs simples (`'blue'`) plutôt que les constantes
  `bleuMathalea`… dans les options apiGeom.

## Vérifier la construction de l'élève

La correction se fait dans `correctionInteractive(i)`, en indexant tout par `i`
(figure, zone de feedback). Le squelette complet, la sauvegarde de la figure
pour Capytale (`figureAnswerJson()`) et les règles d'indexation sont décrits
dans [Correction maison](formats-interactifs.md#correction-maison-custom).

Chaque méthode `check…` renvoie au moins `{ isValid, message }` ; `message`
peut être affiché tel quel à l'élève.

| Méthode | Vérifie |
| --- | --- |
| `checkPoint({ label?, x, y, color? })` | un point aux coordonnées données |
| `checkCoords({ label?, x, y?, checkOnlyAbscissa?, precision?, color? })` | les coordonnées d'un point ; renvoie aussi `points`, les points trouvés |
| `checkDistance({ distance, label1, label2 })` | la distance entre deux points nommés |
| `checkSameDistance({ label1: 'AB', label2: 'CD' })` | deux longueurs égales |
| `checkAngle({ angle, label1, label2, label3 })` | la mesure de l'angle `label1 label2 label3`, au centième près |
| `checkCircleRadius({ center, radius, labelCenter? })` | un cercle de centre et de rayon donnés |
| `checkLine({ point1, point2, color? })` | une droite passant par deux points (coordonnées) |
| `checkSegment({ point1, point2, color? })` | un segment |
| `checkRay({ point1, point2, color? })` | une demi-droite |
| `checkVector({ x, y, xOrigin?, yOrigin?, labelOrigin?, labelPoint2?, color? })` | un vecteur |
| `checkParallel({ label1: 'AB', label2: 'CD' })` | deux droites parallèles |
| `checkPerpendicularBisector({ label1, label2, color? })` | la médiatrice d'un segment |
| `checkPolygon({ points, acceptSegments?, color? })` | un polygone de sommets donnés |
| `checkPolygonByLabels({ labels, color? })` | un polygone par les noms de ses sommets |
| `checkPointOnLine({ labelPt, nameLine })` | un point sur une ligne dont le nom contient `nameLine` |
| `checkPointOnIntersectionLL({ labelPt, nameLine1, nameLine2 })` | un point à l'intersection de deux lignes |
| `checkPointBetween2Points({ labelPt, labelPt1, labelPt2 })` | un point sur le segment `[labelPt1 labelPt2]` |

Pour `nameLine`, une chaîne (`'CD'`) accepte tout segment, demi-droite ou
droite dont le nom la contient ; un tableau (`['(CD)', '(DC)']`) restreint aux
noms listés.

Les signatures font foi dans `apigeom/src/Figure.ts` et
`apigeom/src/check/`. Le dépôt apiGeom contient aussi sa propre documentation
(`docs/`).

## Tester une version locale d'apiGeom

Pour modifier apiGeom et voir l'effet dans MathALÉA, voir
[Tester une version locale d'une dépendance](../../maintenance-moteur/contribution/depannage.md#tester-une-version-locale-dune-dépendance).
