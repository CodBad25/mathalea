import { repere } from '../../../lib/2d/reperes'
import { latex2d } from '../../../lib/2d/textes'
import { Spline, spline } from '../../../lib/mathFonctions/Spline'
import { choice } from '../../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const dateDeModifImportante = '26/10/2023'
export const interactifReady = true
export const interactifType = 'mathLive'
export const titre = 'Lire une image graphiquement'
/**
 * @author Gilles Mora
  *

*/
export const uuid = '966a6'

export const refs = {
  'fr-fr': ['can3F01'],
  'fr-ch': [],
}
type Noeud = {
  x: number
  y: number
  deriveeGauche: number
  deriveeDroit: number
  isVisible: boolean
}
export default class ImageSpline extends ExerciceSimple {
  spline!: Spline
  constructor() {
    super()
    this.versionQcmDisponible = true
    this.typeExercice = 'simple'
    this.nbQuestions = 1
  }

  nouvelleVersion() {
    const noeuds1: Noeud[] = [
      { x: -4, y: -1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -3, y: 0, deriveeGauche: 1, deriveeDroit: 1, isVisible: true },
      { x: -2, y: 3, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -1, y: 2, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 0, y: 1, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 2, y: 0, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 3, y: -2, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: 4, y: 0, deriveeGauche: 1, deriveeDroit: 1, isVisible: true },
      { x: 5, y: 1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
    ]
    const noeuds2: Noeud[] = [
      { x: -4, y: 0, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -3, y: 2, deriveeGauche: 1, deriveeDroit: 1, isVisible: true },
      { x: -2, y: 3, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: -1, y: 2, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 0, y: 0, deriveeGauche: -1, deriveeDroit: -1, isVisible: true },
      { x: 2, y: -1, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
      { x: 3, y: 0, deriveeGauche: 2, deriveeDroit: 2, isVisible: true },
      { x: 4, y: 2, deriveeGauche: 1, deriveeDroit: 1, isVisible: true },
      { x: 5, y: 3, deriveeGauche: 0, deriveeDroit: 0, isVisible: true },
    ]
    const mesFonctions = [noeuds1, noeuds2]
    function aleatoiriseCourbe(listeFonctions: Noeud[][]) {
      const coeffX = choice([-1, 1]) // symétries ou pas
      const coeffY = choice([-1, 1])
      const deltaX = randint(-2, +2) // translations
      const deltaY = randint(-1, 1) // randint(-2, +2)
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
    const antecedent = randint(0, 8)
    const o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })
    const nuage = aleatoiriseCourbe(mesFonctions)
    const theSpline = spline(nuage)
    this.spline = theSpline
    bornes = theSpline.trouveMaxes()
    const repere1 = repere({
      xMin: bornes.xMin - 1,
      xMax: bornes.xMax + 1,
      yMin: bornes.yMin - 1,
      yMax: bornes.yMax + 1,
      grilleX: false,
      grilleY: false,
      xThickMin: bornes.xMin - 1,
      yThickMin: bornes.yMin - 1,
      yThickMax: bornes.yMax + 1,
      xLabelMin: bornes.xMin,
      yLabelMin: bornes.yMin,
      yLabelMax: bornes.yMax,
      xLabelMax: bornes.xMax,
      xThickMax: bornes.xMax + 1,
      grilleSecondaire: true,
      grilleSecondaireYDistance: 1,
      grilleSecondaireXDistance: 1,
      grilleSecondaireOpacite: 0.5,
      axesEpaisseur: 1.5,
      grilleOpacite: 1,
      grilleSecondaireYMin: bornes.yMin - 1.02,
      grilleSecondaireYMax: bornes.yMax + 1.02,
      grilleSecondaireXMin: bornes.xMin - 1.02,
      grilleSecondaireXMax: bornes.xMax + 1.02,
    })
    const courbe1 = theSpline.courbe({
      epaisseur: 1.5,
      ajouteNoeuds: true,
      optionsNoeuds: { color: 'blue', taille: 2, style: 'x', epaisseur: 2 },
      color: 'blue',
    })
    const objetsEnonce = [repere1, courbe1]

    this.reponse = theSpline.y[antecedent]
    this.distracteurs = [
      `$${theSpline.x[antecedent]}$`,
      `L'image de $${theSpline.x[antecedent]}$ n'existe pas`,
      `$${theSpline.y[0]}$`,
      `$${antecedent}$`,
      `$${theSpline.x[antecedent]}$`,
    ]
    if (this.versionQcm) {
      this.question =
        mathalea2d(
          Object.assign(
            { pixelsParCm: 30, scale: 0.7, style: 'margin: auto' },
            {
              xmin: bornes.xMin - 1,
              ymin: bornes.yMin - 1,
              xmax: bornes.xMax + 1,
              ymax: bornes.yMax + 1,
            },
          ),
          objetsEnonce,
          o,
        ) +
        '<br>' +
        `L'image de $${theSpline.x[antecedent]}$ est : `
    } // fixeBordures(objetsEnonce))
    else {
      this.question =
        `Quelle est l'image de $${theSpline.x[antecedent]}$ ?
    ` +
        mathalea2d(
          Object.assign(
            { pixelsParCm: 30, scale: 0.7, style: 'margin: auto' },
            {
              xmin: bornes.xMin - 1,
              ymin: bornes.yMin - 1,
              xmax: bornes.xMax + 1,
              ymax: bornes.yMax + 1,
            },
          ),
          objetsEnonce,
          o,
        )
    }
    this.correction = `Pour lire l'image de $${theSpline.x[antecedent]}$, on place la valeur de $${theSpline.x[antecedent]}$ sur l'axe des abscisses (axe de lecture  des antécédents) et on lit
    son image  sur l'axe des ordonnées (axe de lecture des images). On obtient :  $f(${theSpline.x[antecedent]})=${miseEnEvidence(theSpline.y[antecedent])}$`
  }
}
