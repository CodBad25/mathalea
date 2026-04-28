import SolutionsEquationProduit from '../can/3e/can3L05'
export const titre =
  'Calculer le produit des solutions d’une équation produit nul'
export const dateDePublication = '27/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3L05 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '0ed0f'

export const refs = {
  'fr-fr': ['1A-C13-1'],
  'fr-ch': ['1mQCM-6', '2mQCM-4'],
}
export default class Auto1AC15a extends SolutionsEquationProduit {
  constructor() {
    super()
    this.versionQcm = true
  }
}
