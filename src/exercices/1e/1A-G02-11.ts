import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { cone } from '../../lib/2d/projections3d'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { latex2d } from '../../lib/2d/textes'
import { texteSurSegment } from '../../lib/2d/texteSurSegment'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer le volume d'un cône (avec figure)"
export const dateDePublication = '23/06/2026'

export const uuid = 'f0d92'

export const refs = {
  'fr-fr': ['1A-G02-11', '2A-G2-11'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

type Unite = 'cm' | 'dm' | 'mm'

/**
 * Calculer le volume exact d'un cône à partir du diamètre de sa base et de sa hauteur.
 * @author Stéphane Guyon
 */
export default class VolumeConeAvecFigureQcm extends ExerciceQcmA {
  private valeurDansUnite(valeurEnCm: number, unite: Unite) {
    if (unite === 'dm') return valeurEnCm / 10
    if (unite === 'mm') return 10 * valeurEnCm
    return valeurEnCm
  }

  private mesureTex(valeurEnCm: number, unite: Unite) {
    return `${texNombre(this.valeurDansUnite(valeurEnCm, unite))}\\text{ ${unite}}`
  }

  private appliquerLesValeurs(
    diametreEnCm: number,
    uniteDiametre: Unite,
    hauteurEnCm: number,
    uniteHauteur: Unite,
  ) {
    const rayonEnCm = diametreEnCm / 2
    const produit = rayonEnCm ** 2 * hauteurEnCm
    const coefficientVolume = produit / 3
    const coefficientAvecRayonNonCarre = (2 * rayonEnCm * hauteurEnCm) / 3
    const coefficientAvecAireLaterale = 2 * rayonEnCm * hauteurEnCm

    const centreBase = pointAbstrait(0, 0)
    const sommet = pointAbstrait(0, 3.8)
    const rayonGraphique = 2.25
    const coneTrace = cone({
      centre: centreBase,
      rx: rayonGraphique,
      hauteur: sommet.y,
    })

    const hauteurTracee = segment(centreBase, sommet)
    hauteurTracee.pointilles = 5
    hauteurTracee.epaisseur = 1.5
    hauteurTracee.styleExtremites = '<->'

    const extremiteGaucheDiametre = pointAbstrait(-rayonGraphique, -1.35)
    const extremiteDroiteDiametre = pointAbstrait(rayonGraphique, -1.35)
    const diametreTrace = segment(
      extremiteGaucheDiametre,
      extremiteDroiteDiametre,
    )
    diametreTrace.pointilles = 5
    diametreTrace.styleExtremites = '<->'
    diametreTrace.epaisseur = 1.5

    const objets = [
      coneTrace,
      hauteurTracee,
      diametreTrace,
      texteSurSegment(
        `$${this.mesureTex(diametreEnCm, uniteDiametre)}$`,
        extremiteDroiteDiametre,
        extremiteGaucheDiametre,
        'black',
        0.35,
      ),
      latex2d(this.mesureTex(hauteurEnCm, uniteHauteur), 0.6, 1.55, {
        orientation: -90,
      }),
    ]

    const figure = mathalea2d(
      Object.assign(
        { pixelsParCm: 25, scale: 0.8, style: 'margin: auto' },
        fixeBordures(objets, {
          rxmin: -0.6,
          rxmax: 0.6,
          rymin: -0.55,
          rymax: 0.45,
        }),
      ),
      objets,
    )

    this.enonce = `Le cône ci-dessous n'est pas représenté à l'échelle.<br>
On a indiqué le diamètre de sa base et sa hauteur.<br>
 ${figure}
 La valeur exacte de son volume en $\\text{cm}^3$ est `

    this.reponses = [
      `$${texNombre(coefficientVolume)}\\pi\\text{ cm}^3$`,
      `$${texNombre(coefficientAvecRayonNonCarre)}\\pi\\text{ cm}^3$`,
      `$${texNombre(coefficientAvecAireLaterale)}\\pi\\text{ cm}^3$`,
      `$${texNombre(produit)}\\pi\\text{ cm}^3$`,
    ]

    const conversionDiametre =
      uniteDiametre === 'cm'
        ? ''
        : `$${this.mesureTex(diametreEnCm, uniteDiametre)}=${diametreEnCm}\\text{ cm}$.<br>`
    const conversionHauteur =
      uniteHauteur === 'cm'
        ? ''
        : `$${this.mesureTex(hauteurEnCm, uniteHauteur)}=${hauteurEnCm}\\text{ cm}$.<br>`

    this.correction = `${conversionDiametre}${conversionHauteur}Le rayon est la moitié du diamètre : $r=${diametreEnCm}\\div 2=${rayonEnCm}\\text{ cm}$.<br>
Le volume d'un cône de rayon de base $r$ et de hauteur $h$ est donné par la formule :<br>
$V=\\dfrac{\\pi r^2h}{3}$.<br>
Donc $V=\\dfrac{\\pi\\times ${rayonEnCm}^2\\times ${hauteurEnCm}}{3}=\\dfrac{${produit}\\pi}{3}=${miseEnEvidence(`${texNombre(coefficientVolume)}\\pi\\text{ cm}^3`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(12, 'cm', 30, 'dm')
  }

  versionAleatoire = () => {
    const couplesUnites = [
      ['cm', 'dm'],
      ['dm', 'cm'],
      ['cm', 'mm'],
      ['mm', 'cm'],
      ['dm', 'mm'],
      ['mm', 'dm'],
    ] as [Unite, Unite][]
    const [uniteDiametre, uniteHauteur] = choice(couplesUnites)
    const diametresPossibles =
      uniteDiametre === 'dm' ? [10, 20] : [6, 8, 10, 12, 14, 16, 18, 20]
    const hauteursPossibles =
      uniteHauteur === 'dm' ? [30, 60] : [6, 12, 18, 24, 30, 36]
    const diametreEnCm = choice(diametresPossibles)
    const hauteurEnCm = choice(hauteursPossibles)
    this.appliquerLesValeurs(
      diametreEnCm,
      uniteDiametre,
      hauteurEnCm,
      uniteHauteur,
    )
  }

  constructor() {
    super()
    this.options = { vertical: false, ordered: false }
    this.nbQuestions = 1
    this.besoinFormulaireCaseACocher = false
    this.besoinFormulaire4CaseACocher = false
    this.versionAleatoire()
  }
}
