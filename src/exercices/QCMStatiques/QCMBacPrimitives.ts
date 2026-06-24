import { courbe } from '../../lib/2d/Courbe'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { polygone } from '../../lib/2d/polygones'
import { repere } from '../../lib/2d/reperes'
import { bleuMathalea } from '../../lib/colors'
import { colorToLatexOrHTML } from '../../lib/2d/colorToLatexOrHtml'
import { buildQcmForExercise } from '../../lib/interactif/qcmBuilder'
import { tableauDeVariation } from '../../lib/mathFonctions/etudeFonction'
import { shuffle } from '../../lib/outils/arrayOutils'
import { mathalea2d } from '../../modules/mathalea2d'
import Exercice from '../Exercice'

export const uuid = 'c0f92'
export const refs = {
  'fr-fr': ['TSA7-31'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Répondre à des QCM Bac : primitives, équations différentielles et intégration'
export const dateDePublication = '06/06/2026'

type Reponse = {
  texte: string
  statut?: boolean
}

type QcmItem = {
  enonce: string | (() => string)
  reponses: Reponse[]
  correction: string | (() => string)
  vertical?: boolean
}

const fonctionPolynesie2024 = (x: number) =>
  0.00196 * x ** 5 -
  0.05764 * x ** 4 +
  0.62643 * x ** 3 -
  3.00524 * x ** 2 +
  5.43449 * x

function graphiquePolynesie2024(avecAire = false): string {
  const r = repere({
    xMin: 0,
    xMax: 6,
    yMin: 0,
    yMax: 4,
    xLabelMin: 0,
    xLabelMax: 6,
    yLabelMin: 0,
    yLabelMax: 4,
    xThickDistance: 1,
    yThickDistance: 1,
    axeXStyle: '->',
    axeYStyle: '->',
    grilleSecondaire: true,
    grilleSecondaireXDistance: 1,
    grilleSecondaireYDistance: 1,
    grilleSecondaireXMin: 0,
    grilleSecondaireXMax: 6,
    grilleSecondaireYMin: 0,
    grilleSecondaireYMax: 4,
  })
  const aire = []
  if (avecAire) {
    const points = []
    for (let x = 1; x <= 5.0001; x += 0.05) {
      points.push(pointAbstrait(x, fonctionPolynesie2024(x)))
    }
    points.push(pointAbstrait(5, 0), pointAbstrait(1, 0))
    const p = polygone(points, 'gray')
    p.couleurDeRemplissage = colorToLatexOrHTML('gray')
    p.opaciteDeRemplissage = 0.35
    aire.push(p)
  }

  return mathalea2d(
    {
      xmin: -0.5,
      xmax: 6.5,
      ymin: -0.5,
      ymax: 4.5,
      pixelsParCm: 25,
      scale: 0.9,
      center: true,
      centerLatex: true,
    },
    r,
    ...aire,
    courbe(fonctionPolynesie2024, {
      repere: r,
      xMin: 0,
      xMax: 6,
      yMin: 0,
      yMax: 4,
      color: bleuMathalea,
      epaisseur: 2,
    }),
  )
}

function tableauVariationsH(): string {
  return tableauDeVariation({
    tabInit: [
      [
        ['$x$', 2, 20],
        ['$\\text{Variations de } h$', 3, 130],
      ],
      ['$-\\infty$', 30, '$+\\infty$', 30],
    ],
    tabLines: [['Var', 10, '-/$-\\infty$', 30, '+/$+\\infty$', 10]],
    espcl: 4.8,
    deltacl: 0.8,
    lgt: 6,
    scale: 0.9,
  })
}

const qcmPrimitives: QcmItem[] = [
  {
    enonce:
      'Soit $f$ la fonction définie sur $]0~;~+\\infty[$ par $f(x) = x^2 \\ln x$.<br>Une primitive $F$ de $f$ sur $]0~;~+\\infty[$ est définie par :',
    reponses: [
      {
        texte:
          '$F(x) = \\dfrac13 x^3 \\left(\\ln x - \\dfrac13 \\right)$',
        statut: true,
      },
      { texte: '$F(x) = \\dfrac13 x^3 (\\ln x - 1)$' },
      { texte: '$F(x) = \\dfrac13 x^2$' },
      { texte: '$F(x) = \\dfrac13 x^2 (\\ln x - 1)$.' },
    ],
    correction:
      'Soit $f$ la fonction définie sur $]0~;~+\\infty[$ par $f(x) = x^2 \\ln x$.<br>Si $F(x) = \\dfrac13 x^3 \\left(\\ln x - \\dfrac13 \\right)$, alors $F\\prime(x) = x^2\\left(\\ln x - \\dfrac13 \\right) + \\dfrac13 x^3 \\times \\dfrac{1}{x} = x^2 \\ln x - \\dfrac13 x^2 + \\dfrac13 x^2 = x^2 \\ln x = f(x)$. Réponse $\\mathbf{a}$.',
  },
  {
    enonce:
      'Soit $f$ la fonction définie sur $\\R$ par $f(x) = \\left(x^2 + 1\\right)\\mathrm{e}^x$.<br>La primitive $F$ de $f$ sur $\\R$ telle que $F(0) = 1$ est définie par :',
    reponses: [
      { texte: '$F(x) = \\left(x^2 - 2x +3\\right)\\mathrm{e}^x$' },
      {
        texte:
          '$F(x) = \\left(x^2 - 2x + 3\\right)\\mathrm{e}^x - 2$',
        statut: true,
      },
      {
        texte:
          '$F(x) = \\left(\\dfrac13 x^3 + x\\right)\\mathrm{e}^x + 1$',
      },
      {
        texte:
          '$F(x) = \\left(\\dfrac13 x^3 + x \\right) \\mathrm{e}^x$',
      },
    ],
    correction:
      'Soit $f$ la fonction définie sur $\\R$ par $f(x) = \\left(x^2 + 1\\right)\\mathrm{e}^x$.<br>Pour la fonction $F$ de la réponse a. on a $F(0)=3$, et pour la fonction $F$ de la réponse d., on a $F(0)=0$. On peut donc éliminer ces deux réponses et tester les deux autres.<br>Si $F(x)= \\left(x^2 - 2x + 3\\right)\\mathrm{e}^x - 2$, alors $F\\prime(x)=\\left (2x-2\\right )\\mathrm{e}^{x} + \\left(x^2 - 2x + 3\\right)\\mathrm{e}^x = \\left(x^2 +1\\right)\\mathrm{e}^x  = f(x)$.<br>De plus $F(0)=3\\mathrm{e}^{0}-2=1$. Réponse $\\mathbf{b}$.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur $]- 1~;~1[$ par $f(x)=\\dfrac{x}{1-x^2}$.<br>Une primitive de $f$ sur $]- 1~;~1[$ est la fonction $g$ définie sur $]- 1~;~1[$ par :',
    reponses: [
      {
        texte: '$g(x)=-\\dfrac12 \\ln\\left(1-x^2\\right)$',
        statut: true,
      },
      { texte: '$g(x)=\\dfrac{1+x^2}{\\left(1-x^2\\right)^2}$' },
      {
        texte:
          '$g(x)=\\dfrac{x^2}{2\\left(x-\\dfrac{x^3}{3}\\right)}$',
      },
      { texte: '$g(x)=\\dfrac{x^2}{2}\\ln\\left(1-x^2\\right)$' },
    ],
    correction:
      'Soit la fonction $g$ définie sur $]- 1~;~1[$ par $g(x)=-\\dfrac12 \\ln\\left(1-x^2\\right)$.<br>En posant $u(x)=1-x^2$, dérivable et non nulle sur $]-1~;~1[$, on a $g\\prime(x) = -2x$ et on sait que $g(x)=-\\dfrac12 \\ln\\left(1-x^2\\right)$ entraîne $g\\prime(x)=-\\dfrac12\\times\\dfrac{-2x}{1-x^2}=\\dfrac{x}{1-x^2}=f(x)$. Réponse $\\mathbf{a}$.',
  },
  {
    enonce:
      'Soit $f$ la fonction définie sur $\\R$ par $f(x)=x\\mathrm{e}^{x^2}$.<br>La primitive $F$ de $f$ sur $\\R$ qui vérifie $F(0)=1$ est définie par :',
    reponses: [
      { texte: '$F(x)=\\dfrac{x^2}{2}\\mathrm{e}^{x^2}$' },
      { texte: '$F(x)=\\dfrac{1}{2}\\mathrm{e}^{x^2}$' },
      { texte: '$F(x)=\\left(1+2x^2\\right)\\mathrm{e}^{x^2}$' },
      {
        texte: '$F(x)=\\dfrac{1}{2}\\mathrm{e}^{x^2}+\\dfrac{1}{2}$',
        statut: true,
      },
    ],
    correction:
      'La fonction $f$ est continue sur $\\R$ donc admet des primitives. Soit $F$ une primitive de $f$.<br>$\\forall x \\in \\R$, $f(x)$ est de la forme $u\\prime(x)\\mathrm{e}^{u(x)}$.<br>En posant $u(x)=x^2$ et $u\\prime(x)=2x$, on remarque que $f(x)=\\dfrac{1}{2}\\times 2x\\mathrm{e}^{x^2}$.<br>$\\forall x \\in \\R$, $F(x)=\\dfrac{1}{2}\\times \\mathrm{e}^{x^2}+k$.<br>Sachant que $F(0)=1$, on a $\\dfrac{1}{2}\\times \\mathrm{e}^0+k=1$, donc $k=\\dfrac12$.<br>Donc $\\forall x \\in \\R$, $F(x)=\\dfrac{1}{2}\\mathrm{e}^{x^2}+\\dfrac{1}{2}$. Réponse $\\mathbf{d}$.',
  },
  {
    enonce:
      'Parmi les primitives de la fonction $f$ définie sur $\\R$ par $f(x)=3\\mathrm{e}^{-x^2}+2$ :',
    reponses: [
      { texte: 'toutes sont croissantes sur $\\R$ ;', statut: true },
      { texte: 'toutes sont décroissantes sur $\\R$ ;' },
      { texte: 'certaines sont croissantes sur $\\R$ ;' },
      {
        texte:
          'toutes sont croissantes sur $]-\\infty~;~0]$ et décroissantes sur $[0~;~+\\infty[$.',
      },
    ],
    correction:
      'La fonction $f$ définie sur $\\R$ par $f(x)=3\\mathrm{e}^{-x^2}+2$ est continue et dérivable. $\\forall x \\in \\R$, $f(x)>0$.<br>Les primitives de $f$ ont pour dérivée $f$, qui est positive sur $\\R$.<br>Donc les fonctions $F$ sont croissantes sur $\\R$. Réponse $\\mathbf{a}$.',
  },
  {
    enonce:
      'La fonction $x \\longmapsto \\ln (x)$ admet pour primitive sur $]0~;~+ \\infty[$ la fonction :',
    reponses: [
      { texte: '$x \\longmapsto \\ln (x)$' },
      { texte: '$x \\longmapsto \\dfrac{1}{x}$' },
      { texte: '$x \\longmapsto x \\ln (x) - x$', statut: true },
      { texte: '$x \\longmapsto \\dfrac{\\ln (x)}{x}$' },
    ],
    correction:
      'Pour déterminer si $f(x)=\\ln(x)$ admet pour primitive l’une des fonctions citées, il suffit de les dériver.<br>Soit $g(x) = x\\ln (x)- x$.<br>La fonction $g$ est dérivable comme somme et produit de fonctions dérivables sur $]0~;~+ \\infty[$ et on a $g\\prime(x)=1\\times \\ln(x)+x\\times \\dfrac{1}{x} - 1= \\ln (x) + 1- 1 = \\ln(x) = f(x)$.<br>La fonction $g$ est donc une primitive de $f$. Réponse $\\mathbf{c}$.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur $\\R$ par $f(x)=x^3\\mathrm{e}^{-x^2}$.<br>Si $F$ est une primitive de $f$ sur $\\R$, alors $F$ peut être définie par :',
    reponses: [
      {
        texte:
          '$F(x)=-\\dfrac16\\left(x^3+1\\right)\\mathrm{e}^{-x^2}$',
      },
      { texte: '$F(x)=-\\dfrac14 x^4\\mathrm{e}^{-x^2}$' },
      {
        texte:
          '$F(x)=-\\dfrac12\\left(x^2+1\\right)\\mathrm{e}^{-x^2}$',
        statut: true,
      },
      {
        texte: '$F(x)=x^2\\left(3-2x^2\\right)\\mathrm{e}^{-x^2}$',
      },
    ],
    correction:
      'Les fonctions $F$ proposées sont continues et dérivables sur $\\R$. Dérivons chacune d’entre-elles. $\\forall x \\in \\R$,<br>pour la proposition a., $F\\prime(x)=-\\dfrac{1}{6}\\mathrm{e}^{-x^2}(-2x^3+3x^2-2x)$ ;<br>pour la proposition b., $F\\prime(x)=-\\dfrac{1}{4}\\mathrm{e}^{-x^2}(4x^3-2x^5)$ ;<br>pour la proposition c., $F\\prime(x)=x^3\\mathrm{e}^{-x^2}$ ;<br>pour la proposition d., $F\\prime(x)=(4x^5-14x^3+6x)\\mathrm{e}^{-x^2}$.<br>Réponse $\\mathbf{c}$.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur $\\R$ par $f(x)=\\mathrm{e}^{2x+1}$.<br>La seule primitive $F$ sur $\\R$ de la fonction $f$ telle que $F(0)=1$ est la fonction :',
    reponses: [
      {
        texte:
          '$x \\longmapsto 2\\mathrm{e}^{2x+1} - 2\\mathrm{e} + 1$',
      },
      { texte: '$x \\longmapsto 2\\mathrm{e}^{2x+1} - \\mathrm{e}$' },
      {
        texte:
          '$x \\longmapsto \\dfrac12\\mathrm{e}^{2x+1} - \\dfrac12 \\mathrm{e} + 1$',
        statut: true,
      },
      { texte: '$x \\longmapsto \\mathrm{e}^{x^2 + x}$' },
    ],
    correction:
      'La fonction $f$ est continue sur $\\R$, donc elle admet des primitives notées $F$. De plus $f(x)$ est de la forme $u\\prime(x)\\mathrm{e}^{u(x)}$ avec $u(x)=2x+1$. En remarquant que $f(x)=\\dfrac{1}{2} \\times 2\\mathrm{e}^{2x+1}$, on a $F(x)=\\dfrac{1}{2}\\mathrm{e}^{2x+1}+k$.<br>Sachant que $F(0)=1$ alors $\\dfrac{1}{2}\\mathrm{e}+k=1$, donc $k=1-\\dfrac{1}{2}\\mathrm{e}$.<br>Donc $F(x)=\\dfrac12\\mathrm{e}^{2x+1} - \\dfrac12 \\mathrm{e} + 1$. Réponse $\\mathbf{c}$.',
  },
  {
    enonce:
      'Si $H$ est une primitive d’une fonction $h$ définie et continue sur $\\R$, et si $k$ est la fonction définie sur $\\R$ par $k(x)=h(2x)$, alors, une primitive $K$ de $k$ est définie sur $\\R$ par :',
    reponses: [
      { texte: '$K(x)=H(2x)$' },
      { texte: '$K(x)=2H(2x)$' },
      { texte: '$K(x)=\\dfrac{1}{2}H(2x)$', statut: true },
      { texte: '$K(x)=2H(x)$' },
    ],
    correction:
      'Réponse c.<br>On dérive la proposition c.<br>Si $K_{\\mathbf{c}} : x \\longmapsto \\dfrac{1}{2} H(2x)$, alors, $\\forall x \\in \\R$, $K_{\\mathbf{c}}\\prime(x)=\\dfrac{1}{2}\\times 2H\\prime(2x)=h(2x)$.<br>On en déduit donc que $K_{\\mathbf{c}}$ est une primitive de $k$ sur $\\R$.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur $\\R$ par $f(x)=x \\mathrm{e}^{x^2-3}$.<br>Une des primitives $F$ de la fonction $f$ sur $\\R$ est définie par :',
    reponses: [
      { texte: '$F(x)=2x\\mathrm{e}^{x^2-3}$' },
      { texte: '$F(x)=\\left(2x^2+1\\right)\\mathrm{e}^{x^2-3}$' },
      { texte: '$F(x)=\\dfrac12 x\\mathrm{e}^{x^2-3}$' },
      { texte: '$F(x)=\\dfrac12 \\mathrm{e}^{x^2-3}$', statut: true },
    ],
    correction:
      'On considère la fonction $f$ définie sur $\\R$ par $f(x) = x \\mathrm{e}^{x^2 - 3}$.<br>Avec $F(x) = \\dfrac12 \\mathrm{e}^{x^2 - 3}$, on a $F\\prime(x) = 2x \\times \\dfrac12\\mathrm{e}^{x^2 - 3} = x\\mathrm{e}^{x^2 - 3} = f(x)$ : réponse $\\mathbf{d}$.',
  },
  {
    enonce:
      'On considère la fonction $f$ définie sur $\\R$ par : $f(x)=\\left(x+1\\right)\\mathrm{e}^x$.<br>Une primitive $F$ de $f$ sur $\\R$ est définie par :',
    reponses: [
      { texte: '$F(x)=1+x\\mathrm{e}^x$', statut: true },
      { texte: '$F(x)=\\left(1+x\\right)\\mathrm{e}^x$' },
      { texte: '$F(x)=\\left(2+x\\right)\\mathrm{e}^x$' },
      {
        texte:
          '$F(x)=\\left(\\dfrac{x^2}{2}+x\\right)\\mathrm{e}^x$',
      },
    ],
    correction:
      'On a $f(x)=(x+1)\\,\\mathrm{e}^{x}=x\\,\\mathrm{e}^{x} + \\,\\mathrm{e}^{x}$. Donc les primitives de $f$ sont de la forme $F(x)=x\\,\\mathrm{e}^{x}+c$ avec $c\\in\\mathbb{R}$. Donc $F(x)=1+x\\,\\mathrm{e}^{x}$ est une primitive de $f$.<br>Réponse a.',
  },
  {
    enonce: () =>
      `On considère une fonction $h$ définie et continue sur $\\R$ dont le tableau de variations est donné ci-dessous :${tableauVariationsH()}On sait que $h(1)=0$. <br>On note $H$ la primitive de $h$ définie sur $\\R$ qui s’annule en $0$.<br>Elle vérifie la propriété :`,
    reponses: [
      { texte: '$H$ est positive sur $]-\\infty~;~0]$.', statut: true },
      { texte: '$H$ est croissante sur $]-\\infty~;~1]$.' },
      { texte: '$H$ est négative sur $]-\\infty~;~1]$.' },
      { texte: '$H$ est croissante sur $\\R$.' },
    ],
    correction:
      'Réponse a.<br>La stricte croissance de $h$ sur $\\R$ et le fait que $h(1) = 0$ permettent de dire que : $\\forall x \\in \\R, \\quad x < 1 \\implies h(x) < 0$.<br>La fonction $H$ étant une primitive de $h$ sur $\\R$, cela équivaut à dire que $h$ est la fonction dérivée de $H$, et donc $H$ a une dérivée négative sur $]-\\infty~;~1[$. $H$ est donc décroissante sur cet intervalle.<br>Cela implique donc que, pour tout $x$ réel inférieur à 0, $x$ et $0$ seront dans $]-\\infty~;~1[$ et donc : $x \\leqslant 0 \\implies H(x) \\geqslant H(0)$, or, comme $H$ s’annule en 0, cela signifie que $H(0) = 0$.<br>Finalement, on a : $x\\leqslant 0 \\implies H(x) \\geqslant 0$ : $H$ est bien à valeurs positives sur $]-\\infty~;~0[$.',
  },
  {
    enonce:
      'Soit $f$ la fonction définie sur $\\R$ par $f(x) = x\\mathrm{e}^x$.<br>Une primitive $F$ sur $\\R$ de la fonction $f$ est définie par :',
    reponses: [
      { texte: '$F(x) = \\dfrac{x^2}{2}\\mathrm{e}^x$' },
      { texte: '$F(x) = (x - 1)\\mathrm{e}^x$', statut: true },
      { texte: '$F(x) = (x + 1)\\mathrm{e}^x$' },
      { texte: '$F(x) = \\dfrac2 x \\mathrm{e}^{x^2}$' },
    ],
    correction:
      'Réponse B.<br>$F$ est dérivable sur $\\R $, en tant que produit de fonctions dérivables sur cet intervalle.<br>$F$ est de la forme $u \\times v$ avec $u(x)=x-1$ et $v(x)=\\mathrm{e}^x$.<br>On a donc, pour tout réel $x$, $u\\prime(x)=1$ et $v\\prime(x)=\\mathrm{e}^x$.<br>$F= u\\prime\\times v + v\\prime\\times u$ donc, pour tout réel $x$, $F\\prime(x) = \\mathrm{e}^x+ (x-1) \\mathrm{e}^x = x\\mathrm{e}^x=f(x)$.<br>Donc $F$ est une primitive de $f$ sur $\\R$.',
  },
  {
    enonce:
      'La solution $f$ de l’équation différentielle $y\\prime=-3y+7$ telle que $f(0)=1$ est la fonction définie sur $\\R$ par :',
    reponses: [
      { texte: '$f(x)=\\mathrm{e}^{-3x}$' },
      {
        texte: '$f(x)=-\\dfrac43 \\mathrm{e}^{-3x}+\\dfrac73$',
        statut: true,
      },
      { texte: '$f(x)=\\mathrm{e}^{-3x}+\\dfrac73$' },
      { texte: '$f(x)=-\\dfrac{10}{3}\\mathrm{e}^{-3x}-\\dfrac73$' },
    ],
    correction:
      'L’équation différentielle $y\\prime=-3y$ a pour solutions les fonctions $x\\longmapsto C\\mathrm{e}^{-3x}$, avec $C\\in\\R$.<br>La fonction $x\\longmapsto \\alpha$ est solution de $y\\prime=-3y+7$ si et seulement si $0=-3\\alpha+7$, c’est-à-dire $\\alpha=\\dfrac73$.<br>On sait qu’alors les solutions de l’équation différentielle $y\\prime=-3y+7$ sont les fonctions $x\\longmapsto C\\mathrm{e}^{-3x}+\\dfrac73$, avec $C\\in\\R$.<br>En particulier, $f(0)=1$ donne $C+\\dfrac73=1$, donc $C=-\\dfrac43$.<br>La seule solution est donc $x\\longmapsto -\\dfrac43 \\mathrm{e}^{-3x}+\\dfrac73$ : réponse $\\mathbf{B}$.',
  },
  {
    enonce: () =>
      `La courbe d’une fonction $f$ définie sur $[0~;~+\\infty[$ est donnée ci-dessous.<br>${graphiquePolynesie2024()}Un encadrement de l’intégrale $I = \\displaystyle\\int_1^5 f(x) \\:\\mathrm{d}x$ est :`,
    reponses: [
      { texte: '$0 \\leqslant I \\leqslant 4$' },
      { texte: '$1 \\leqslant I \\leqslant 5$' },
      { texte: '$5 \\leqslant I \\leqslant 10$', statut: true },
      { texte: '$10 \\leqslant I \\leqslant 15$' },
    ],
    correction: () =>
      `Le dessin est clair, et permet de voir que, sur $[1~;~5]$, la fonction $f$ prend des valeurs comprises entre $1$ et $2,5$.<br>${graphiquePolynesie2024(true)}La surface grise représentant $I = \\displaystyle\\int_1^5 f(x) \\:\\mathrm{d}x$ a donc une aire comprise entre celle du rectangle de largeur $4$ et de hauteur $1$, et celle du rectangle de largeur $4$ et de hauteur $2,5$.<br>Donc $4 \\leqslant I \\leqslant 10$.<br>Réponse $\\mathbf{C}$.`,
  },
  {
    enonce:
      'On considère la fonction $g$ définie sur $\\R$ par $g(x)=x^2\\ln\\left(x^2+4\\right)$.<br>Alors $\\displaystyle\\int_0^2 g\\prime(x)\\:\\mathrm{d}x$ vaut, à $10^{-1}$ près :',
    reponses: [
      { texte: '$4,9$' },
      { texte: '$8,3$', statut: true },
      { texte: '$1,7$' },
      { texte: '$7,5$' },
    ],
    correction:
      'On sait que si $g\\prime$ est la dérivée de $g$, alors $g$ est une primitive de la fonction $g\\prime$, donc : $\\displaystyle\\int_0^2 g\\prime(x)\\:\\mathrm{d}x = \\left[x^2 \\ln \\left(x^2 + 4\\right)\\right]_0^2 = 2^2\\ln \\left(2^2 + 2 \\right) = 4\\ln 4 + 4) = 4\\ln 8$ ou $4\\ln 2^3 = 3 \\times 4 \\ln 2 = 12\\ln 2 \\approx 8,31$ soit 8,3 au dixième près. Réponse $\\mathbf{B}$.',
  },
]

/**
 * Série statique de QCM de Bac sur les primitives, équations différentielles
 * et intégration.
 *
 * @author Stéphane Guyon
 */
export default class QcmPrimitivesStatique extends Exercice {
  constructor() {
    super()
    this.nbQuestions = 3
    this.nbQuestionsModifiable = true
    this.spacing = 2
    this.spacingCorr = 2
  }

  nouvelleVersion() {
    this.listeQuestions = []
    this.listeCorrections = []

    const nbQuestions = Math.min(this.nbQuestions, qcmPrimitives.length)
    const questions = shuffle(qcmPrimitives).slice(0, nbQuestions)

    for (const [index, qcm] of questions.entries()) {
      const qcmData = buildQcmForExercise(this, index, {
        question: typeof qcm.enonce === 'function' ? qcm.enonce() : qcm.enonce,
        correction:
          typeof qcm.correction === 'function'
            ? qcm.correction()
            : qcm.correction,
        propositions: qcm.reponses.map((reponse) => ({
          texte: reponse.texte,
          statut: reponse.statut ?? false,
        })),
        options: {
          vertical: qcm.vertical ?? false,
          ordered: true,
        },
      })

      this.listeQuestions[index] = qcmData.question
      this.listeCorrections[index] = qcmData.correction
    }
  }
}
