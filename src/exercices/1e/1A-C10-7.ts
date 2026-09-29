import EquationPlusMoinsX2PlusAEgalB from '../can/2e/can2L2-04'
export const titre =
  'Déterminer le nombre de solutions d’une équation se ramenant à $x^2=a$'
export const dateDePublication = '22/07/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can2L01 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '3dd44'

export const refs = {
  'fr-fr': ['1A-C10-7', '2A-C3-3'],
  'fr-ch': ['1mQCM-28', '11QCM-33'],
}
export default class Auto1AC10 extends EquationPlusMoinsX2PlusAEgalB {
  constructor() {
    super()
    this.versionQcm = true
  }
}
