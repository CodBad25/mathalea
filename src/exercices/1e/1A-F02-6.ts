import CalculProduitSommeImageParFonctionAffine from '../can/3e/can3F14'
export const titre =
  "Calculer un produit ou une somme d'images par une fonction affine"
export const dateDePublication = '23/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3F14 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'e251e'

export const refs = {
  'fr-fr': ['1A-F02-6'],
  'fr-ch': [],
}
export default class Auto1AF1d extends CalculProduitSommeImageParFonctionAffine {
  constructor() {
    super()
    this.versionQcm = true
  }
}
