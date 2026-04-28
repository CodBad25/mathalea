import CalculComplexeFraction from '../can/3e/can3C19'
export const titre = 'Effectuer un calcul complexe avec des fractions'
export const dateDePublication = '06/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can3C19 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '1252f'

export const refs = {
  'fr-fr': ['1A-C02-2'],
  'fr-ch': ['11QCM-6', '1mQCM-9'],
}
export default class Auto1AC2c extends CalculComplexeFraction {
  constructor() {
    super()
    this.versionQcm = true
  }
}
