import ConversionEnTousSens from '../can/6e/can6M04'
export const titre = 'Convertir une unité de longueur, masse ou capacité'
export const dateDePublication = '25/08/2026'
export const amcReady = true
export const amcType = 'qcmMono'
export const interactifReady = true

/**
 * Clone de can6M04 pour les auto 1er
 * @author Gilles Mora
 */

export const uuid = '816f5'

export const refs = {
  'fr-fr': ['1A-C07-7', '2A-N7-7'],
  'fr-ch': [],
}
export default class Auto1AC077 extends ConversionEnTousSens {
  constructor() {
    super()
    this.versionQcm = true
  }
}
