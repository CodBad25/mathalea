import { droite } from '../../lib/2d/droites'
import {  pointAbstrait } from '../../lib/2d/PointAbstrait'
import { repere } from '../../lib/2d/reperes'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { latex2d } from '../../lib/2d/textes'
import { aLeBonNombreDePropsDifferentes } from '../../lib/interactif/qcm'
import { choice } from '../../lib/outils/arrayOutils'
import { reduireAxPlusB } from '../../lib/outils/ecritures'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import FractionEtendue from '../../modules/FractionEtendue'
import { mathalea2d } from '../../modules/mathalea2d'
import ExerciceQcmA from '../ExerciceQcmA'

export const uuid = 'c8ee7'
export const refs = {
  'fr-fr': [],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Retrouver la représentation graphique d\'une droite à partir de son équation réduite'
export const dateDePublication = '02/06/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoQ4CEs2026 extends ExerciceQcmA {
private appliquerLesValeurs(
    num: number,
    den: number,
    p: number,
    d1: [number, number, number],
    d2: [number, number, number],
    d3: [number, number, number]
  ): void {
    const fracM = new FractionEtendue(num, den)
    const equationTex = `$y = ${reduireAxPlusB(fracM, p)}$`

    this.enonce = `Dans un repère orthonormé $(O ; \\vec{\\imath}, \\vec{\\jmath})$, la droite $d$ d’équation réduite ${equationTex} est représentée par :`

    const fenetreMathalea2d = {
      xmin: -4.05,
      xmax: 4.05,
      ymin: -3.05,
      ymax: 6.05,
      pixelsParCm: 20,
      scale: 0.45,
      style: 'margin: auto; display: inline-block; padding: 5px;',
    }

    // Fonction locale pour générer un repère et une droite (utilisée pour les 4 propositions)
    const genererGraphique = (n: number, d_den: number, ord: number, avecCorrection = false) => {
      const r = repere({
        xMin: -4,
        xMax: 4,
        yMin: -3,
        yMax: 6,
        grilleSecondaire: false,
        grilleSecondaireXDistance: 0.5,
        grilleSecondaireYDistance: 0.5,
        // Astuce infaillible : on place les graduations et les labels à 100, loin hors de la zone visible
        xThickListe: [100],
        yThickListe: [100],
        xLabelListe: [100], 
        yLabelListe: [100], 
      })

      // Définition de la droite
      const ptA = pointAbstrait(0, ord)
      const ptB = pointAbstrait(d_den, ord + n)
      const d_trace = droite(ptA, ptB, '', avecCorrection ? 'red' : 'red')
      d_trace.epaisseur = 2

      // Vecteurs unitaires avec 'segment' pour une meilleure visibilité + Origine
      const vI = segment(0, 0, 1, 0, 'black', '->')
      vI.epaisseur = 0.3
      const vJ = segment(0, 0, 0, 1, 'black', '->')
      vJ.epaisseur = 0.3
      const o = latex2d('\\text{O}', -0.3, -0.6, { letterSize: 'scriptsize' })
      const textI =   latex2d('\\vec{\\imath}', 0.7, -0.8, { letterSize: 'normalsize' })
      const textJ = latex2d('\\vec{\\jmath}', -0.5, 0.25, { letterSize: 'normalsize' })

      // Type any[] pour éviter l'erreur TypeScript (ts2345) lors du push ultérieur
      const objets: any[] = [r, d_trace, o, vI, vJ, textI, textJ]

      // Ajout de l'escalier explicatif si c'est la figure de correction
      if (avecCorrection) {
        const ptCorner = pointAbstrait(d_den, ord)
        
        const sHoriz = segment(ptA, ptCorner, 'blue')
        sHoriz.epaisseur = 2
        sHoriz.pointilles = 5

        const sVert = segment(ptCorner, ptB, 'green')
        sVert.epaisseur = 2
        sVert.pointilles = 5

        const decY = n > 0 ? -0.4 : 0.4
        const lHoriz = latex2d(`+${d_den}`, d_den / 2, ord + decY, { color: 'blue', letterSize: 'scriptsize' })
        const lVertStr = n > 0 ? `+${n}` : `${n}`
        const lVert = latex2d(lVertStr, d_den + 0.4, ord + n / 2, { color: 'green', letterSize: 'scriptsize' })

        objets.push(sHoriz, sVert, lHoriz, lVert)
      }

      return mathalea2d(fenetreMathalea2d, ...objets)
    }

    this.correction = `Pour représenter la droite d'équation réduite ${equationTex} :<br>`
    this.correction += `$\\bullet$ L'ordonnée à l'origine est $p = ${p}$. La droite coupe l'axe des ordonnées au point de coordonnées $(0 ; ${p})$.<br>`
    this.correction += `$\\bullet$ Le coefficient directeur est $m = ${fracM.texFractionSimplifiee}$. En partant de l'ordonnée à l'origine, si on avance de $${den}$ unité(s) vers la droite, on se décale de $${Math.abs(num)}$ unité(s) vers le ${num > 0 ? 'haut' : 'bas'}.<br>`
    this.correction += `<br>${genererGraphique(num, den, p, true)}<br>`

    // Les réponses sont des graphiques générés dynamiquement
    this.reponses = [
      genererGraphique(num, den, p),
      genererGraphique(d1[0], d1[1], d1[2]),
      genererGraphique(d2[0], d2[1], d2[2]),
      genererGraphique(d3[0], d3[1], d3[2])
    ]
  }

  versionOriginale: () => void = () => {
    // Énoncé : y = 1/3 x + 1
    // d1 (image a) : y = x + 2 (passe par (0,2) et (1,3)) -> [1, 1, 2]
    // d2 (image b) : y = 3x + 1 (passe par (0,1) et (1,4)) -> [3, 1, 1]
    // d3 (image d) : y = 2x + 1 (passe par (0,1) et (1,3)) -> [2, 1, 1]
    this.appliquerLesValeurs(1, 3, 1, [1, 1, 2], [3, 1, 1], [2, 1, 1])
  }

  versionAleatoire: () => void = () => {
    if (this.canOfficielle) {
      this.versionOriginale()
      return
    }

    const casFractions = [
      { num: 1, den: 3 },
      { num: -1, den: 3 },
      { num: 3, den: 1 },
      { num: 1, den: 2 },
      { num: -1, den: 2 },
      { num: 2, den: 3 },
      { num: -2, den: 3 }
    ]

    let compteur = 0
    do {
      const coeff = choice(casFractions)
      const p = choice([1, 2])

      // Génération de pièges mathématiquement logiques
      const d1Num = coeff.den
      const d1Den = Math.abs(coeff.num) === 0 ? 1 : Math.abs(coeff.num)
      
      const dist1: [number, number, number] = [d1Num, d1Den, p] // Piège : inverse fraction
      const dist2: [number, number, number] = [coeff.num, coeff.den, -p] // Piège : erreur de signe sur p
      const dist3: [number, number, number] = [-coeff.num, coeff.den, p] // Piège : erreur de signe sur m

      // Cas particulier pour éviter que dist1 soit identique à la bonne réponse si num == den
      if (d1Num === coeff.num && d1Den === coeff.den) {
        dist1[0] = coeff.num + 1
      }

      this.appliquerLesValeurs(coeff.num, coeff.den, p, dist1, dist2, dist3)
      compteur++
    } while (compteur < 100 && !aLeBonNombreDePropsDifferentes(this, 4, true))
  }

  constructor() {
    super()
    this.versionAleatoire()
  }
}