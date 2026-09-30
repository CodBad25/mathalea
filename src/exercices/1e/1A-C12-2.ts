import AutoQ4AGt2026 from '../EAMPremiere/EAM-AGTechno-2026-Q4'
import { genereReponsesCourtes } from '../ExerciceQcmACourt'
import { miseEnEvidence } from '../../lib/outils/embellissements'

export const dateDeModifImportante = '30/09/2026'

export const uuid = 'efc9a'
export const refs = {
  'fr-fr': ['1A-C12-2', '2A-C5-2'],
  'fr-ch': ['NR'],
}
export const interactifReady = true

export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Convertir des degrés Celsius en degrés Fahrenheit'
export const dateDePublication = '06/08/2026'

/**
 * @author Jean-Claude Lhote, clone de Stéphane Guyon
 * Clone de EAM-AGTechno-2026-Q4 en version exclusivement aléatoire.
 */
export default class ConvertirCelsiusEnFahrenheit extends AutoQ4AGt2026 {
  reponseCourte = () => this.reponses[0].slice(1).split('\\,')[0]
  correctionCourte = () => `En appliquant la formule $F=1,8C+32$, on obtient $F=${miseEnEvidence(this.reponseCourte())}$.`
  enonceCourt = () => this.enonce.replace(
    /,\s*(?:sa conversion|la température d'ébulition de l'eau) en degrés Fahrenheit est donc :<br>/,
    '.<br>Calculer la température correspondante en degrés Fahrenheit.',
  )
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.sup3 = false
    this.besoinFormulaire3CaseACocher = ['Mode QCM', false]
    const versionAleatoire = this.versionAleatoire
    this.versionAleatoire = () => {
      versionAleatoire()
      this.enonce = this.enonceCourt()
    }
    this.versionAleatoire()
  }

  nouvelleVersion() {
    if (this.sup3) super.nouvelleVersion()
    else genereReponsesCourtes(this)
  }
}
