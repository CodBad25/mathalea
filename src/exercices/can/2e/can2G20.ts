import { pointAbstrait } from '../../../lib/2d/PointAbstrait'
import { tracePoint } from '../../../lib/2d/TracePoint'
import { vide2d } from '../../../lib/2d/Vide2d'
import { droite } from '../../../lib/2d/droites'
import { repere } from '../../../lib/2d/reperes'
import { segment } from '../../../lib/2d/segmentsVecteurs'
import { latex2d } from '../../../lib/2d/textes'
import { milieu } from '../../../lib/2d/utilitairesPoint'
import { bleuMathalea } from '../../../lib/colors'
import { KeyboardType } from '../../../lib/interactif/claviers/keyboard'
import { ecritureAlgebrique, rienSi1 } from '../../../lib/outils/ecritures'
import { miseEnEvidence } from '../../../lib/outils/embellissements'
import FractionEtendue from '../../../modules/FractionEtendue'
import { context } from '../../../modules/context'
import { mathalea2d } from '../../../modules/mathalea2d'
import { randint } from '../../../modules/outils'
import ExerciceSimple from '../../ExerciceSimple'
export const titre = 'Déterminer une équation de droite (graphique)'
export const interactifReady = true
export const interactifType = 'mathLive'
export const dateDePublication = '15/11/2022'
export const dateDeModifImportante = '08/07/2025'
/**
 * Modèle d'exercice très simple pour la course aux nombres
 * @author Gilles Mora

 *
*/

export const uuid = '1f967'

export const refs = {
  'fr-fr': ['can2G20'],
  'fr-ch': ['11QCM-8', '1mQCM-11'],
}
export default class EquationDroite extends ExerciceSimple {
  constructor() {
    super()
    this.typeExercice = 'simple'
    this.nbQuestions = 1
    this.versionQcmDisponible = true
    this.formatChampTexte = KeyboardType.clavierDeBaseAvecFraction
  }

  nouvelleVersion() {
    const xA = 0
    const yA = randint(1, 4)
    const xB = randint(-5, 5, 0)
    const yB = randint(0, 4)

    const o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })
    const A = pointAbstrait(xA, yA)
    const B = pointAbstrait(xB, yB)

    // Pour l'affichage du coefficient directeur, on utilise toujours le point le plus à gauche
    let pointRef, pointCible
    if (xA < xB) {
      // A est à gauche, B est à droite
      pointRef = A
      pointCible = B
    } else {
      // B est à gauche, A est à droite
      pointRef = B
      pointCible = A
    }

    const pointHorizontal = pointAbstrait(pointCible.x, pointRef.y)
    const sHorizontal = segment(pointRef, pointHorizontal)
    const sVertical =
      pointCible.y === pointHorizontal.y
        ? vide2d()
        : segment(pointCible, pointHorizontal)

    // On utilise toujours xB - xA et yB - yA pour la fraction (cohérent avec l'équation finale)
    const maFraction = new FractionEtendue(yB - yA, xB - xA)

    sVertical.epaisseur = 2
    sVertical.pointilles = 5
    sHorizontal.epaisseur = 2
    sHorizontal.pointilles = 5

    const lA = latex2d('A', xA, yA + 0.5, { letterSize: 'scriptsize' })
    const traceA = tracePoint(A, 'black')
    const lB = latex2d('B', xB, yB + 0.5, { letterSize: 'scriptsize' })

    // Labels pour les déplacements (on affiche la valeur absolue si nécessaire)
    const deltaX = pointCible.x - pointRef.x
    const deltaY = pointCible.y - pointRef.y
    const lHorizontal = latex2d(
      `${deltaX}`,
      milieu(pointRef, pointHorizontal).x,
      pointRef.y + 0.3,
      { color: 'red', letterSize: 'scriptsize' },
    )
    const lVertical = latex2d(
      `${deltaY}`,
      pointCible.x + 0.5,
      milieu(pointCible, pointHorizontal).y,
      { color: bleuMathalea, letterSize: 'scriptsize' },
    )

    const traceB = tracePoint(B, 'black')
    const d = droite(A, B, '', bleuMathalea)
    d.epaisseur = 2
    traceA.taille = 3
    traceA.epaisseur = 2
    traceB.taille = 3
    traceB.epaisseur = 2

    const xmin = -6
    const ymin = -1
    const xmax = 6
    const ymax = 5
    const r1 = repere({
      xMin: xmin,
      xMax: xmax,
      xUnite: 1,
      yMin: ymin,
      yMax: ymax,
      yUnite: 1,
      thickHauteur: 0.1,
      xLabelMin: xmin + 1,
      xLabelMax: xmax - 1,
      yLabelMax: ymax - 1,
      yLabelMin: ymin + 1,
      axeXStyle: '->',
      axeYStyle: '->',
      yLabelDistance: 1,
      yLabelEcart: 0.3,
      grilleSecondaire: true,
      grilleSecondaireYDistance: 1,
      grilleSecondaireXDistance: 1,
      grilleSecondaireYMin: ymin - 0.1,
      grilleSecondaireYMax: ymax + 0.1,
      grilleSecondaireXMin: xmin - 0.1,
      grilleSecondaireXMax: xmax + 0.1,
    })

    const objet = mathalea2d(
      {
        xmin,
        xmax,
        ymin: ymin - 0.25,
        ymax: ymax + 0.25,
        pixelsParCm: 30,
        scale: 0.75,
        style: 'margin: auto',
      },
      d,
      r1,
      traceA,
      traceB,
      o,
    )
    const objetC = mathalea2d(
      {
        xmin,
        xmax,
        ymin,
        ymax: ymax + 0.25,
        pixelsParCm: 30,
        scale: 0.75,
        style: 'margin: auto',
      },
      d,
      r1,
      traceA,
      lA,
      lB,
      traceB,
      o,
      sHorizontal,
      sVertical,
      lHorizontal,
      lVertical,
    )

    if (context.isAmc) this.versionQcm = false
    this.question = this.versionQcm
      ? ''
      : "Donner l'équation réduite de la droite.<br>"
    this.question += `${objet}`
    this.question += this.versionQcm
      ? "<br>L'équation réduite de cette droite est : "
      : ''

    if (yB === yA) {
      this.reponse = this.versionQcm
        ? `$y= ${yA}$`
        : [`y=${yA}`, `y=0x + ${yA}`, `y=0 \\cdot x + ${yA}`]
      this.correction = `La droite est horizontale. On en déduit que son coefficient directeur est $m=0$.<br>
        Son ordonnée à l'origine est $${yA}$, ainsi l'équation réduite de la droite est $${miseEnEvidence(`y=${yA}`)}$.`
      this.distracteurs = [`$y=x + ${yA}$`, `$x=${yA}$`, `$y=${rienSi1(yA)}x$`]
    } else {
      // On utilise toujours le déplacement affiché graphiquement pour la correction
      this.correction = `Le coefficient directeur $m$ de la droite $(AB)$ est donné par : <br>
$m=\\dfrac{${miseEnEvidence(deltaY, bleuMathalea)}}{${miseEnEvidence(deltaX, 'red')}}${maFraction.texSimplificationAvecEtapes()}$.<br>`

      if ((yB - yA) / (xB - xA) === 1) {
        this.correction += `Son ordonnée à l'origine est $${yA}$, ainsi l'équation réduite de la droite est $${miseEnEvidence(`y=x${yA === 0 ? '' : `${ecritureAlgebrique(yA)}`}`)}$.`
      } else if ((yB - yA) / (xB - xA) === -1) {
        this.correction += `Son ordonnée à l'origine est $${yA}$, ainsi l'équation réduite de la droite est $${miseEnEvidence(`y=-x${yA === 0 ? '' : `${ecritureAlgebrique(yA)}`}`)}$.`
      } else {
        this.correction += `Son ordonnée à l'origine est $${yA}$, ainsi l'équation réduite de la droite est $${miseEnEvidence(`y=${maFraction.texFractionSimplifiee}x${yA === 0 ? '' : `${ecritureAlgebrique(yA)}`}`)}$.`
      }
      this.correction += `<br>${objetC}<br>`

      // Les réponses sont toujours basées sur la vraie équation y = mx + p où m = (yB-yA)/(xB-xA) et p = yA
      if ((yB - yA) / (xB - xA) === 1 || (yB - yA) / (xB - xA) === -1) {
        this.reponse = this.versionQcm
          ? `$y= ${rienSi1(maFraction.valeurDecimale)}x${yA === 0 ? '' : ` ${ecritureAlgebrique(yA)}`}$`
          : [
              `y=${maFraction.valeurDecimale}x${ecritureAlgebrique(yA)}`,
              `y=\\frac{${yB - yA}}{${xB - xA}}x${ecritureAlgebrique(yA)}`,
              `y=\\frac{${yA - yB}}{${xA - xB}}x${ecritureAlgebrique(yA)}`,
            ]
      } else {
        this.reponse = this.versionQcm
          ? `$y= ${maFraction.texFractionSimplifiee}x${yA === 0 ? '' : ` ${ecritureAlgebrique(yA)}`}$`
          : [
              `y=${maFraction.texFraction}x${ecritureAlgebrique(yA)}`,
              `y=\\frac{${yB - yA}}{${xB - xA}}x${ecritureAlgebrique(yA)}`,
              `y=\\frac{${yA - yB}}{${xA - xB}}x${ecritureAlgebrique(yA)}`,
            ]
      }

      if (this.versionQcm) {
        // Distracteurs basés sur des erreurs classiques
        if ((yB - yA) / (xB - xA) === 1 || (yB - yA) / (xB - xA) === -1) {
          this.distracteurs = [
            `$y= ${rienSi1(maFraction.multiplieEntier(-1).valeurDecimale)}x${ecritureAlgebrique(yA)}$`, // Coefficient opposé
            `$y=${yA}$`, // Droite horizontale (erreur)
            `$y= ${rienSi1(yA)}x${ecritureAlgebrique(-yA)}$`, // Fraction inversée
          ]
        } else {
          this.distracteurs = [
            `$y= ${maFraction.multiplieEntier(-1).texFractionSimplifiee}x${ecritureAlgebrique(yA)}$`, // Coefficient opposé
            `$y=${yA}$`, // Droite horizontale (erreur)
            `$y= ${new FractionEtendue(xB - xA, yB - yA).texFractionSimplifiee}x${ecritureAlgebrique(yA)}$`, // Fraction inversée
          ]
        }
      }
    }
  }
}
