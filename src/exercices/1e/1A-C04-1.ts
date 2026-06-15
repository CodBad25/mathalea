import FractionDecimaleEcritureDecimale2 from '../can/5e/can5N02'
export const titre = 'Passer de la fraction décimale à l’écriture décimale'
export const dateDePublication = '04/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C22 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '1ac8c'

export const refs = {
  'fr-fr': ['1A-C04-1'],
  'fr-ch': ['10QCM-3'],
}
export default class Auto1AC4 extends FractionDecimaleEcritureDecimale2 {
  constructor() {
    super()
     this.tip = `
  <p style="margin: 0 0 10px 0;">
    Il faut convertir une somme de fractions décimales en un nombre décimal.<br>
    Le plus simple consiste à écrire chaque fraction décimale en nombre décimal puis d'effectuer la somme.
  </p>
  
`
    this.versionQcm = true
  }
}
