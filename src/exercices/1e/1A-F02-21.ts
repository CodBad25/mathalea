import AutoQ6FMns2026 from '../EAMPremiere/EAM-FMnonSpe-2026-Q6'

export const uuid = '00867'
export const refs = {
  'fr-fr': ['1A-F02-21'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = "Déterminer les coordonnées d'un point sur une courbe"
export const dateDePublication = '06/08/2026'

/**
 * @author Gilles Mora
 * Clone de EAM-FMnonSpe-2026-Q6 en version exclusivement aléatoire.
 */
export default class DeterminerPointSurCourbe extends AutoQ6FMns2026 {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.versionAleatoire()
  }
}
