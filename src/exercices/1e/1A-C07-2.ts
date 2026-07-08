import HeureDecimalesMinutes from '../can/6e/can6D09'

export const uuid = '42707'
export const refs = {
  'fr-fr': ['1A-C07-2', '2A-N7-2'],
  'fr-ch': ['10QCM-1'],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Transformer des heures décimales en minutes'
export const dateDePublication = '05/09/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoC7a extends HeureDecimalesMinutes {
  constructor() {
    super()
    this.versionQcm = true
  }
}
