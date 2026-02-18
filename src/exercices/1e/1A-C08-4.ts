import ReduireAvecFraction from '../can/3e/can3L06'

export const uuid = 'c1c68'
export const refs = {
  'fr-fr': ['1A-C08-4'],
  'fr-ch': [''],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = ''
export const dateDePublication = '18/02/2026'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoC8d extends ReduireAvecFraction {
  constructor() {
    super()
    this.versionQcm = true
  }
}
