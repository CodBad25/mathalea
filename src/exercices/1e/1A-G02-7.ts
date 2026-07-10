import { choice } from '../../lib/outils/arrayOutils'
import { miseEnEvidence } from '../../lib/outils/embellissements'
import { texNombre } from '../../lib/outils/texNombre'
import { randint } from '../../modules/outils'
import ExerciceQcmA from '../ExerciceQcmA'

export const titre = "Calculer l'aire d'un terrain rectangulaire"
export const dateDePublication = '23/06/2026'

export const uuid = 'a2f91'

export const refs = {
  'fr-fr': ['1A-G02-7', '2A-G2-7'],
  'fr-ch': [],
}

export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = true
export const amcType = 'qcmMono'

/**
 * Calculer l'aire d'un terrain rectangulaire avec deux dimensions exprimées
 * dans des unités différentes.
 * @author Stéphane Guyon
 */
export default class AireTerrainRectangulaireQcm extends ExerciceQcmA {
  private appliquerLesValeurs(longueurEnM: number, largeurEnCm: number) {
    const largeurEnM = largeurEnCm / 100
    const aireEnM2 = longueurEnM * largeurEnM
    const aireSansConversion = longueurEnM * largeurEnCm
    const aireAvecErreurDeConversion = longueurEnM * (largeurEnCm / 10)
    const perimetreEnM = 2 * (longueurEnM + largeurEnM)

    this.enonce = `Un terrain rectangulaire mesure $${longueurEnM}\\text{ m}$ de long et $${largeurEnCm}\\text{ cm}$ de large.<br>
Son aire est égale à :`

    this.reponses = [
      `$${texNombre(aireEnM2)}\\text{ m}^2$`,
      `$${texNombre(aireSansConversion)}\\text{ m}^2$`,
      `$${texNombre(perimetreEnM)}\\text{ m}^2$`,
      `$${texNombre(aireAvecErreurDeConversion)}\\text{ m}^2$`,
    ]

    this.correction = `Pour calculer l'aire, il faut d'abord exprimer les deux dimensions dans la même unité :<br>
$${largeurEnCm}\\text{ cm}=${texNombre(largeurEnM)}\\text{ m}$.<br>
L'aire d'un rectangle est le produit de sa longueur par sa largeur :<br>
$\\mathcal{A}=${longueurEnM}\\times ${texNombre(largeurEnM)}=${miseEnEvidence(`${texNombre(aireEnM2)}\\text{ m}^2`)}$.`
  }

  versionOriginale = () => {
    this.appliquerLesValeurs(7, 300)
  }

  versionAleatoire = () => {
    let longueurEnM: number
    let largeurEnM: number
    do {
      longueurEnM = randint(3, 12)
      largeurEnM = choice([2, 3, 4, 5, 6, 8, 9])
    } while (longueurEnM * largeurEnM === 2 * (longueurEnM + largeurEnM))
    const largeurEnCm = 100 * largeurEnM
    this.appliquerLesValeurs(longueurEnM, largeurEnCm)
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
