import ProgrammeCalcul2 from '../can/2e/can2C16'
export const titre = 'Calculer avec un programme de calcul'
export const dateDePublication = '04/08/2025'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true
export const interactifType = 'mathLive'

/**
 * Clone de can2C16 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = 'dac3c'

export const refs = {
  'fr-fr': ['1A-C02-1'],
  'fr-ch': [],
}
export default class Auto1AC2b extends ProgrammeCalcul2 {
  constructor() {
    super()
    this.versionQcm = true
  }
}
