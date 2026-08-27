import AutoQ7AGns2026 from '../EAMPremiere/EAM-AGnonSpe-2026-Q7'

export const uuid = '8e0cd'
export const refs = {
  'fr-fr': ['1A-C12-3', '2A-C5-3'],
  'fr-ch': [],
}
export const interactifReady = true

export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Effectuer une application numérique'
export const dateDePublication = '06/08/2026'

/**
 * @author Gilles Mora , clone de Stéphane Guyon
 * Clone de EAM-AGnonSpe-2026-Q7 en version exclusivement aléatoire.
 */
export default class CalculerUneResistance extends AutoQ7AGns2026 {
  constructor() {
    super()
    this.besoinFormulaireCaseACocher = false
    this.versionAleatoire()
  }
}
