import ReduireDecimaux from '../can/4e/can4L09'

export const uuid = 'c4012'
export const refs = {
  'fr-fr': ['1A-C08-5'],
  'fr-ch': [''],
}
export const interactifReady = true
export const interactifType = 'qcm'
export const amcReady = 'true'
export const amcType = 'qcmMono'
export const titre = 'Réduire une expression littérale avec des décimaux'
export const dateDePublication = '05/09/2025'
// Ceci est un exemple de QCM avec version originale et version aléatoire
/**
 *
 * @author Gilles Mora
 *
 */
export default class AutoC08e extends ReduireDecimaux {
  constructor() {
    super()
    this.versionQcm = true
  }
}
