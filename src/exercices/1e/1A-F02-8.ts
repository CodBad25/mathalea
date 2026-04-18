import { repere } from '../../lib/2d/reperes'
import { latex2d } from '../../lib/2d/textes'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'

import { courbe } from '../../lib/2d/Courbe'
import { point } from '../../lib/2d/PointAbstrait'
import { tracePoint } from '../../lib/2d/TracePoint'
import { deuxColonnes } from '../../lib/format/miseEnPage'
import { spline } from '../../lib/mathFonctions/Spline'
import { mathalea2d } from '../../modules/mathalea2d'
import ExerciceQcmA from '../ExerciceQcmA'
import { bleuMathalea } from '../../lib/colors'
export const dateDePublication = '24/07/2025'
export const uuid = '7f5f6'
/**
 *
 * @author Gilles Mora avec IA (Claude)
 */
export const refs = {
  'fr-fr': ['1A-F02-8'],
  'fr-ch': [],
}
type Noeud = {
  x: number
  y: number
  deriveeGauche: number
  deriveeDroit: number
  isVisible: boolean
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre =
  "Trouver les abscisses solutions d'une inéquation avec un graphique"
export default class auto1AF2 extends ExerciceQcmA {
  spline!: ReturnType<typeof spline>
  versionOriginale: () => void = () => {
    const o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })

    const fonc = (x: number) => 0.1 * (x - 4) * (x - 1) * (x + 3)
    const labelB = latex2d(
      'B',
      -1,
      0.1 * (-1 - 4) * (-1 - 1) * (-1 + 3) + 0.5,
      {
        // 0.1*(-1- 4) * (-1 - 1) * (-1 +3)
        color: 'black',
        letterSize: 'normalsize',
      },
    )
    const A = point(-3.5, 0.1 * (-3.5 - 4) * (-3.5 - 1) * (-3.5 + 3))

    const TA = tracePoint(A)
    const labelA = latex2d(
      'A',
      -3.8,
      0.1 * (-3.5 - 4) * (-3.5 - 1) * (-3.5 + 3) + 0.4,
      {
        color: 'black',
        letterSize: 'normalsize',
      },
    )
    const B = point(-1, 0.1 * -5 * -2 * 2)

    const TB = tracePoint(B)

    const R = point(0.5, 0.1 * (0.5 - 4) * (0.5 - 1) * (0.5 + 3))

    const TR = tracePoint(R)
    const labelR = latex2d(
      'R',
      0.6,
      0.1 * (0.5 - 4) * (0.5 - 1) * (0.5 + 3) + 0.5,
      {
        color: 'black',
        letterSize: 'normalsize',
      },
    )
    const S = point(3.5, 0.1 * (3.5 - 4) * (3.5 - 1) * (3.5 + 3))

    const TS = tracePoint(S)
    const labelS = latex2d(
      'S',
      3.7,
      0.1 * (3.5 - 4) * (3.5 - 1) * (3.5 + 3) - 0.4,
      {
        color: 'black',
        letterSize: 'normalsize',
      },
    )
    const repere1 = repere({
      xMin: -5,
      xMax: 5,
      yMin: -4,
      yMax: 4,
      grilleX: false,
      grilleY: false,
      axesEpaisseur: 1.5,
      grilleSecondaire: false,
      xThickListe: [0],
      yThickListe: [0],
      xLabelListe: [-6],
      yLabelListe: [-6],
    })

    const objetsEnonce = [repere1] //, courbe1

    this.enonce = `${deuxColonnes(
      `On a représenté une courbe $\\mathscr{C}$ d'une fonction $f$.<br><br>
    Les points $A$, $B$, $R$ et $S$ appartiennent à $\\mathscr{C}$.<br><br>
    Leurs abscisses sont notées respectivement $x_A$, $x_B$, $x_C$ et $x_D$.
 `,
      mathalea2d(
        Object.assign(
          { pixelsParCm: 20, scale: 0.6, style: 'margin: auto' },
          {
            xmin: -5,
            ymin: -5,
            xmax: 5,
            ymax: 5,
          },
        ),
        TA,
        TB,
        TR,
        TS,
        labelA,
        labelB,
        labelR,
        labelS,
        objetsEnonce,
        o,
        courbe(fonc, { repere: repere1, color: bleuMathalea, epaisseur: 2 }),
      ),
    )}`

    this.enonce += `L'inéquation $x\\times f(x) > 0$ est vérifiée par :`

    // fixeBordures(objetsEnonce))
    this.correction = `L'inéquation est vérifiée lorsque $x$ et $f(x)$ sont de même signe, c'est-à-dire lorsque $x$ et $f(x)$ sont tous les deux positifs ou tous les deux négatifs.<br>
    Ici,  $x_A$ et $f(x_A)$ sont tous les deux négatifs. Aussi, $x_R$ et $f(x_R)$ sont tous les deux positifs.<br>
    L'inéquation est donc vérifiée pour $${miseEnEvidence('x_A \\text{ et } x_R')}$.`

    this.reponses = [
      '$x_A$ et $x_R$',
      '$x_A$ et $x_B$',
      '$x_A$, $x_R$ et $x_S$',
      '$x_R$ et $x_S$',
    ]
  }

  versionAleatoire = () => {
    // Fonction utilitaire pour formater une liste avec "et" avant le dernier élément
    const formaterListe = (elements: string[]): string => {
      if (elements.length === 0) return ''
      if (elements.length === 1) return elements[0]
      if (elements.length === 2) return elements.join(' \\text{ et } ')

      // Pour 3 éléments ou plus : "A, B et C"
      const dernierElement = elements[elements.length - 1]
      const autresElements = elements.slice(0, -1)
      return autresElements.join(', ') + ' \\text{ et } ' + dernierElement
    }

    const noeuds1: Noeud[] = [
      { x: -3.5, y: -3.5, deriveeGauche: 2, deriveeDroit: 2, isVisible: false },
      { x: -2.5, y: -1.5, deriveeGauche: 2, deriveeDroit: 2, isVisible: true },
      { x: -1.5, y: 1, deriveeGauche: 2, deriveeDroit: 3, isVisible: true },
      { x: -0.3, y: 3, deriveeGauche: 0, deriveeDroit: 0, isVisible: false },
      { x: 0.5, y: 2, deriveeGauche: -1, deriveeDroit: -2, isVisible: true },
      {
        x: 1.5,
        y: 0,
        deriveeGauche: -1.5,
        deriveeDroit: -1.5,
        isVisible: false,
      },
      { x: 3, y: -2, deriveeGauche: 0, deriveeDroit: 0, isVisible: false },
      { x: 4, y: -0.5, deriveeGauche: 1, deriveeDroit: 1.5, isVisible: true },
      { x: 5, y: 1, deriveeGauche: 0.5, deriveeDroit: 1, isVisible: false },
    ]
    const mesFonctions = [noeuds1]

    function aleatoiriseCourbe(listeFonctions: Noeud[][]) {
      const coeffX = 1 // Pas de symétrie par rapport à l'axe des ordonnées pour le test
      const coeffY = choice([-1, 1]) // Symétrie par rapport à l'axe des abscisses seulement
      const deltaX = 0
      const deltaY = 0
      const choix = choice(listeFonctions)
      return choix.map((noeud) =>
        Object({
          x: (noeud.x + deltaX) * coeffX,
          y: (noeud.y + deltaY) * coeffY,
          deriveeGauche: noeud.deriveeGauche * coeffX * coeffY,
          deriveeDroit: noeud.deriveeDroit * coeffX * coeffY,
          isVisible: noeud.isVisible,
        }),
      )
    }

    let bornes = { xMin: 0, xMax: 0, yMin: 0, yMax: 0 }

    const o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })
    const nuage = aleatoiriseCourbe(mesFonctions)
    const theSpline = spline(nuage)
    this.spline = theSpline
    bornes = theSpline.trouveMaxes()

    // Récupérer les points visibles et les trier par abscisse croissante
    const pointsVisibles = [
      { index: 1, x: theSpline.x[1], y: theSpline.y[1] },
      { index: 2, x: theSpline.x[2], y: theSpline.y[2] },
      { index: 4, x: theSpline.x[4], y: theSpline.y[4] },
      { index: 7, x: theSpline.x[7], y: theSpline.y[7] },
    ].sort((a, b) => a.x - b.x)

    // Choix aléatoire des noms de points
    const nomsPoints = [
      choice(['A', 'B', 'C', 'D']), // Premier point (le plus à gauche)
      choice(['E', 'F', 'G', 'H']), // Deuxième point
      choice(['R', 'S', 'T']), // Troisième point
      choice(['U', 'V']), // Quatrième point (le plus à droite)
    ]

    // Assigner les labels avec les noms choisis aléatoirement
    const decalageX = 0.5
    const decalageY = 0.3
    const labelPoint1 = latex2d(
      nomsPoints[0],
      pointsVisibles[0].x - decalageX,
      pointsVisibles[0].y + decalageY,
      { color: 'black', letterSize: 'normalsize' },
    )
    const labelPoint2 = latex2d(
      nomsPoints[1],
      pointsVisibles[1].x - decalageX,
      pointsVisibles[1].y + decalageY,
      { color: 'black', letterSize: 'normalsize' },
    )
    const labelPoint3 = latex2d(
      nomsPoints[2],
      pointsVisibles[2].x + decalageX,
      pointsVisibles[2].y + decalageY,
      { color: 'black', letterSize: 'normalsize' },
    )
    const labelPoint4 = latex2d(
      nomsPoints[3],
      pointsVisibles[3].x + decalageX,
      pointsVisibles[3].y + decalageY,
      { color: 'black', letterSize: 'normalsize' },
    )

    const repere1 = repere({
      xMin: bornes.xMin - 1,
      xMax: bornes.xMax + 1,
      yMin: bornes.yMin - 1,
      yMax: bornes.yMax + 1,
      grilleX: false,
      grilleY: false,
      axesEpaisseur: 1.5,
      grilleSecondaire: false,
      xThickListe: [0],
      yThickListe: [0],
      xLabelListe: [-6],
      yLabelListe: [-6],
    })

    const courbe1 = theSpline.courbe({
      epaisseur: 2,
      ajouteNoeuds: true,
      optionsNoeuds: { color: 'black', taille: 3, style: '.', epaisseur: 2 },
      color: bleuMathalea,
    })

    const objetsEnonce = [repere1, courbe1]

    // Choix aléatoire du type d'inéquation
    const typeInequation = choice(['>', '<'])

    // Analyse des signes pour chaque point (dans l'ordre trié)
    const points = [
      { nom: nomsPoints[0], x: pointsVisibles[0].x, y: pointsVisibles[0].y },
      { nom: nomsPoints[1], x: pointsVisibles[1].x, y: pointsVisibles[1].y },
      { nom: nomsPoints[2], x: pointsVisibles[2].x, y: pointsVisibles[2].y },
      { nom: nomsPoints[3], x: pointsVisibles[3].x, y: pointsVisibles[3].y },
    ]

    // Fonction pour vérifier si un point satisfait l'inéquation x*f(x) > 0 ou < 0
    const satisfaitInequation = (
      point: { x: number; y: number },
      type: string,
    ) => {
      const produit = point.x * point.y
      return type === '>' ? produit > 0 : produit < 0
    }

    // Trouver les points qui satisfont l'inéquation
    const pointsSolution = points.filter((point) =>
      satisfaitInequation(point, typeInequation),
    )

    // Créer la bonne réponse en utilisant la fonction de formatage
    const bonneReponse = formaterListe(pointsSolution.map((p) => `x_${p.nom}`))

    // Créer des réponses alternatives
    const tousLesPoints = points.map((p) => `x_${p.nom}`)
    const reponsesAlternatives = [
      // Quelques combinaisons fausses
      formaterListe(
        points
          .filter((point) => !satisfaitInequation(point, typeInequation))
          .slice(0, 2)
          .map((p) => `x_${p.nom}`),
      ),
      formaterListe(tousLesPoints.slice(0, 3)),
      formaterListe(tousLesPoints.slice(1, 3)),
    ].filter((rep) => rep !== bonneReponse && rep.length > 0)

    // S'assurer qu'on a 3 réponses alternatives différentes
    while (reponsesAlternatives.length < 3) {
      const combinaison = choice([
        [0, 1],
        [0, 2],
        [0, 3],
        [1, 2],
        [1, 3],
        [2, 3],
      ])
      const nouvelleReponse = formaterListe(
        combinaison.map((i) => `x_${points[i].nom}`),
      )
      if (
        !reponsesAlternatives.includes(nouvelleReponse) &&
        nouvelleReponse !== bonneReponse
      ) {
        reponsesAlternatives.push(nouvelleReponse)
      }
    }

    // Créer la liste des noms pour l'énoncé
    const listeNomsPoints = formaterListe(nomsPoints)

    this.enonce = `${deuxColonnes(
      `On a représenté une courbe $\\mathscr{C}$ d'une fonction $f$.<br><br>
Les points $${listeNomsPoints}$ appartiennent à $\\mathscr{C}$.<br><br>
Leurs abscisses sont notées respectivement $${formaterListe(nomsPoints.map((nom) => `x_${nom}`))}$.<br><br>
 `,
      mathalea2d(
        Object.assign(
          { pixelsParCm: 22, scale: 0.6, style: 'margin: auto' },
          {
            xmin: bornes.xMin - 1,
            ymin: bornes.yMin - 1,
            xmax: bornes.xMax + 1,
            ymax: bornes.yMax + 1,
          },
        ),
        labelPoint1,
        labelPoint2,
        labelPoint3,
        labelPoint4,
        objetsEnonce,
        o,
      ),
    )}`

    this.enonce += `L'inéquation $x\\times f(x) ${typeInequation} 0$ est vérifiée par :`

    // Explication pour la correction
    const explicationSigne =
      typeInequation === '>'
        ? "lorsque $x$ et $f(x)$ sont de même signe, c'est-à-dire lorsque $x$ et $f(x)$ sont tous les deux positifs ou tous les deux négatifs"
        : "lorsque $x$ et $f(x)$ sont de signes opposés, c'est-à-dire lorsque l'un est positif et l'autre négatif"

    // Détail des vérifications pour chaque point solution
    const detailsSolution = pointsSolution
      .map((point) => {
        const signeX = point.x > 0 ? 'positif' : 'négatif'
        const signeY = point.y > 0 ? 'positif' : 'négatif'
        return `$x_${point.nom}$ est ${signeX} et $f(x_${point.nom})$ est ${signeY}`
      })
      .join('. Aussi, ')

    this.correction = `L'inéquation est vérifiée ${explicationSigne}.<br>
Ici, ${detailsSolution}.<br>
L'inéquation est donc vérifiée pour $${miseEnEvidence(bonneReponse)}$.`

    this.reponses = [
      `$${bonneReponse}$`,
      `$${reponsesAlternatives[0]}$`,
      `$${reponsesAlternatives[1]}$`,
      `$${reponsesAlternatives[2]}$`,
    ]
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}
