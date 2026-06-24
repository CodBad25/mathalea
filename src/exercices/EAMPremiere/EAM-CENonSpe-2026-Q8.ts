import { repere } from '../../lib/2d/reperes'
import { latex2d } from '../../lib/2d/textes'
import { bleuMathalea } from '../../lib/colors'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { spline } from '../../lib/mathFonctions/Spline'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { mathalea2d } from '../../modules/mathalea2d'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'd136e'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Résoudre graphiquement une inéquation '
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ8CEns2026 extends ExerciceQcmA {
   private appliquerLesValeurs(dx: number, dy: number, isSuperieur: boolean): void {
    // Nœuds soigneusement calibrés pour reproduire la courbe du sujet officiel
    const baseNoeuds = [
      { x: -6, y: -1, deriveeGauche: 4, deriveeDroit: 4, isVisible: false },
      { x: -5, y: 3, deriveeGauche: 2, deriveeDroit: 2, isVisible: false }, // Intersection 1
      { x: -4, y: 4, deriveeGauche: 0, deriveeDroit: 0, isVisible: false }, // Maximum local
      { x: -2, y: 3, deriveeGauche: -1, deriveeDroit: -1, isVisible: false }, // Intersection 2
      { x: 0, y: 0, deriveeGauche: -1, deriveeDroit: -1, isVisible: false }, // Origine
      { x: 3, y: -3, deriveeGauche: 0, deriveeDroit: 0, isVisible: false }, // Minimum local
      { x: 5, y: -0.5, deriveeGauche: 1.5, deriveeDroit: 1.5, isVisible: false }
    ]

    // Application des translations aléatoires
    const noeuds = baseNoeuds.map((n) => ({
      x: n.x + dx,
      y: n.y + dy,
      deriveeGauche: n.deriveeGauche,
      deriveeDroit: n.deriveeDroit,
      isVisible: n.isVisible,
    }))

    const theSpline = spline(noeuds)

    // Définition des bornes mathématiques
    const xMinD = -6 + dx
    const xMaxD = 5 + dx
    const k = 3 + dy       // Ordonnée de la droite de coupe
    const x1 = -5 + dx     // 1ère solution de l'équation
    const x2 = -2 + dx     // 2ème solution de l'équation

    // Définition de la fenêtre d'affichage MathALÉA
    const xMin = xMinD - 1
    const xMax = xMaxD + 1
    const yMin = -4 + dy - 1
    const yMax = 4 + dy + 1

    const r = repere({
      xMin,
      xMax,
      yMin,
      yMax,
      grilleX: true,
      grilleY: true,
      grilleSecondaire: true,
      grilleSecondaireXDistance: 0.5,
      grilleSecondaireYDistance: 0.5,
      axesEpaisseur: 1.5,
    })

    const courbe = theSpline.courbe({
      epaisseur: 1.5,
      ajouteNoeuds: false,
       color: 'red',
    })

    const o = latex2d('\\text{O}', -0.3, -0.3, { letterSize: 'scriptsize' })

    const figure = mathalea2d(
      {
        xmin: xMin - 0.5,
        xmax: xMax + 0.5,
        ymin: yMin - 0.5,
        ymax: yMax + 0.5,
        pixelsParCm: 25,
        scale: 0.55,
        display: 'block', center: true,
      },
      r,
      courbe,
      o
    )

    // Formulation de l'énoncé
    const symbole = isSuperieur ? '\\geqslant' : '\\leqslant'
    this.enonce = `Voici la courbe représentative d'une fonction $f$ définie sur $[${xMinD}\\,;\\,${xMaxD}]$.<br><br>`
    this.enonce += `${figure}<br>`
    this.enonce += `L'ensemble $\\mathcal{S}$ des solutions de l'inéquation $f(x) ${symbole} ${k}$ est :`

    // Préparation des ensembles pour les distracteurs
    const intervalleInterieur = `[${x1}\\,;\\,${x2}]`
    const intervalleExterieur = `[${xMinD}\\,;\\,${x1}] \\cup [${x2}\\,;\\,${xMaxD}]`
    const ensemblePoints = `\\{${x1}\\,;\\,${x2}\\}`
    const pointFaux = `\\{${x1 + 2}\\}` // Point piégé à l'intérieur de l'intervalle comme dans le sujet original

    let correct, dist1
    if (isSuperieur) {
      correct = `\\mathcal{S} = ${intervalleInterieur}`
      dist1 = `\\mathcal{S} = ${intervalleExterieur}`
    } else {
      correct = `\\mathcal{S} = ${intervalleExterieur}`
      dist1 = `\\mathcal{S} = ${intervalleInterieur}`
    }
    const dist2 = `\\mathcal{S} = ${ensemblePoints}`
    const dist3 = `\\mathcal{S} = ${pointFaux}`

    this.reponses = [
      `$${correct}$`,
      `$${dist1}$`,
      `$${dist2}$`,
      `$${dist3}$`
    ]

    // Rédaction de la correction
    const positionLigne = isSuperieur ? 'au-dessus de' : 'en-dessous de'
    const positionCourbe = isSuperieur ? 'au-dessus' : 'en-dessous'
    
    this.correction = `Pour résoudre graphiquement l'inéquation $f(x) ${symbole} ${k}$, on cherche les abscisses des points de la courbe situés ${positionLigne} la droite horizontale d'équation $y = ${k}$ (ou sur cette droite).<br>`
    this.correction += `La courbe coupe cette droite en deux points d'abscisses $x = ${x1}$ et $x = ${x2}$.<br>`
    this.correction += `Elle est située ${positionCourbe} de cette droite pour les abscisses appartenant à l'ensemble $${miseEnEvidence(correct)}$.<br>`
  }

  versionOriginale: () => void = () => {
    // On n'applique aucune translation (0, 0) et on choisit f(x) >= 3 (true)
    this.appliquerLesValeurs(0, 0, true)
  }
  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    let compteur = 0
    do {
      // Translations horizontales et verticales limitées pour garder un bel affichage
      const dx = choice([-2, -1, 0, 1, 2])
      const dy = choice([-2, -1, 0, 1, 2])
      
      // Choix aléatoire du sens de l'inéquation
      const isSuperieur = choice([true, false])

      this.appliquerLesValeurs(dx, dy, isSuperieur)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
    this.options = { vertical: true } // Affichage des propositions en colonne
  }
}