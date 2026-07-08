import MinutesHeuresDecimale from '../can/6e/can6D08'

export const uuid = '5fb9e'
export const refs = {
  'fr-fr': ['1A-C07-1', '2A-N7-1'],
  'fr-ch': [],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Transformer des minutes en heures décimales'
export const dateDePublication = '04/09/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoC7 extends MinutesHeuresDecimale {
  constructor() {
    super()
    this.versionQcm = true
  }
}
