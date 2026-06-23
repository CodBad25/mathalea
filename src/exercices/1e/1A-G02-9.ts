import { fixeBordures } from '../../lib/2d/fixeBordures'
import { pointAbstrait } from '../../lib/2d/PointAbstrait'
import { cylindre } from '../../lib/2d/projections3d'
import { segment } from '../../lib/2d/segmentsVecteurs'
import { texteSurSegment } from '../../lib/2d/texteSurSegment'
import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { mathalea2d } from '../../modules/mathalea2d'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer le volume d'un cylindre"
export const dateDePublication = '23/06/2026'

export const uuid = 'c7b58'

export const refs = {
  'fr-fr': ['1A-G02-9'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

type UniteDiametre = 'cm' | 'dm'

/**
 * Calculer le volume exact d'un cylindre à partir de son diamètre et de sa hauteur.
 * @author Stéphane Guyon
 */
export default class VolumeCylindreAvecFigureQcm extends ExerciceQcmA {
  private appliquerLesValeurs(
    diametre: number,
    uniteDiametre: UniteDiametre,
    hauteurEnCm: number,
  ) {
    const diametreEnCm = uniteDiametre === 'dm' ? 10 * diametre : diametre
    const rayonEnCm = diametreEnCm / 2
    const coefficientVolume = rayonEnCm ** 2 * hauteurEnCm
    const volumeAvecPiDecimal = coefficientVolume * 3.14
    const coefficientDiametrePrisPourRayon = diametreEnCm ** 2 * hauteurEnCm
    const coefficientAvecPerimetreBase = 2 * rayonEnCm * hauteurEnCm

    const centreBase = pointAbstrait(0, 0)
    const centreHaut = pointAbstrait(0, 3)
    const rayonGraphique = 1.7
    const cylindreTrace = cylindre({
      centre: centreBase,
      rx: rayonGraphique,
      hauteur: 3,
    })
    const extremiteGaucheDiametre = pointAbstrait(-rayonGraphique, -1.4)
    const extremiteDroiteDiametre = pointAbstrait(rayonGraphique, -1.4)
    const diametreTrace = segment(
      extremiteGaucheDiametre,
      extremiteDroiteDiametre,
    )
    diametreTrace.pointilles = 5
    diametreTrace.epaisseur = 1.5
    diametreTrace.styleExtremites = '<->'
    const hauteurTracee = segment(
      pointAbstrait(rayonGraphique + 0.45, centreBase.y),
      pointAbstrait(rayonGraphique + 0.45, centreHaut.y),
    )
    hauteurTracee.styleExtremites = '<->'
    hauteurTracee.epaisseur = 1.5

    const objets = [
      cylindreTrace,
      diametreTrace,
      hauteurTracee,
      texteSurSegment(
        `$${diametre}\\text{ ${uniteDiametre}}$`,
        extremiteGaucheDiametre,
        extremiteDroiteDiametre,
        'black',
        0.35,
      ),
      texteSurSegment(
        `$${hauteurEnCm}\\text{ cm}$`,
        hauteurTracee.extremite1,
        hauteurTracee.extremite2,
        'black',
        -0.55,
      ),
    ]

    const figure = mathalea2d(
      Object.assign(
        { pixelsParCm: 25, scale: 0.8, style: 'margin: auto' },
        fixeBordures(objets, {
          rxmin: -0.6,
          rxmax: 0.8,
          rymin: -0.55,
          rymax: 0.45,
        }),
      ),
      objets,
    )

    this.enonce = `Le cylindre ci-dessous n'est pas représenté à l'échelle.<br>
On a codé le diamètre de sa base et sa hauteur.${figure}
La valeur exacte de son volume en $\\text{cm}^3$ est : `

    this.reponses = [
      `$${coefficientVolume}\\pi\\text{ cm}^3$`,
      `$${texNombre(volumeAvecPiDecimal)}\\text{ cm}^3$`,
      `$${coefficientDiametrePrisPourRayon}\\pi\\text{ cm}^3$`,
      `$${coefficientAvecPerimetreBase}\\pi\\text{ cm}^3$`,
    ]

    const conversionDiametre =
      uniteDiametre === 'dm'
        ? `$${diametre}\\text{ dm}=${diametreEnCm}\\text{ cm}$, donc `
        : ''

    this.correction = `Le volume d'un cylindre de rayon de base $r$ et de hauteur $h$ est donné par la formule :<br>
$V=\\pi r^2h$.<br>
${conversionDiametre}le rayon de la base vaut $r=${diametreEnCm}\\div 2=${rayonEnCm}\\text{ cm}$.<br>
Ici, $h=${hauteurEnCm}\\text{ cm}$.<br>
Donc $V=\\pi\\times ${rayonEnCm}^2\\times ${hauteurEnCm}=${miseEnEvidence(`${coefficientVolume}\\pi\\text{ cm}^3`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(2, 'dm', 30)
  }

  versionAleatoire = () => {
    const uniteDiametre = choice<UniteDiametre>(['cm', 'dm'])
    const diametre =
      uniteDiametre === 'dm' ? 2 * randint(1, 3) : 2 * randint(4, 10)
    const hauteurEnCm = 10 * randint(2, 8)
    this.appliquerLesValeurs(diametre, uniteDiametre, hauteurEnCm)
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
